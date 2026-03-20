import asyncio
import logging
from fastapi import APIRouter, HTTPException, Request
from cachetools import TTLCache

from app.models.report import CheckRequest, VehicleReport
from app.utils.reg_to_vin import normalise_registration, is_valid_uk_registration, is_valid_vin
from app.utils.rate_limiter import limiter
from app.config import get_settings
from app.services import dvla as dvla_service
from app.services import dvsa as dvsa_service
from app.services import vin_decoder
from app.services import salvage as salvage_service
from app.services.report_builder import build_report

logger = logging.getLogger(__name__)
router = APIRouter()

# In-memory TTL cache (registration -> VehicleReport dict)
_cache: TTLCache = TTLCache(maxsize=500, ttl=get_settings().cache_ttl_seconds)


@router.post("/api/check", response_model=VehicleReport)
@limiter.limit("10/hour")
async def check_vehicle(request: Request, body: CheckRequest):
    settings = get_settings()

    # Validate input
    if not body.registration and not body.vin:
        raise HTTPException(status_code=400, detail="Provide either 'registration' or 'vin'")

    if body.vin and not is_valid_vin(body.vin):
        raise HTTPException(status_code=400, detail="Invalid VIN format")

    if body.registration:
        registration = normalise_registration(body.registration)
        if not is_valid_uk_registration(registration):
            raise HTTPException(status_code=400, detail=f"Invalid UK registration plate: {registration}")
    else:
        registration = ""

    cache_key = body.vin or registration
    if cache_key in _cache:
        logger.info(f"Cache hit for {cache_key}")
        return _cache[cache_key]

    data_sources: list[str] = []
    warnings: list[str] = []

    # --- DVLA lookup (registration required) ---
    dvla_data: dict = {}
    if registration:
        try:
            raw = await dvla_service.fetch_vehicle_details(registration)
            dvla_data = dvla_service.parse_dvla_response(raw)
            data_sources.append("DVLA Vehicle Enquiry API")
        except dvla_service.VehicleNotFoundError:
            raise HTTPException(status_code=404, detail=f"Vehicle '{registration}' not found in DVLA database")
        except dvla_service.DVLAError as e:
            warnings.append(f"DVLA lookup unavailable: {e}")
            if not body.vin:
                raise HTTPException(status_code=503, detail=str(e))

    # --- MOT History (registration required, skipped if DVSA_API_KEY not set) ---
    mot_tests = []
    if registration:
        if not settings.dvsa_api_key:
            warnings.append("MOT history disabled — add DVSA_API_KEY to .env to enable.")
        else:
            try:
                raw_tests = await dvsa_service.fetch_mot_history(registration)
                mot_tests = dvsa_service.parse_mot_tests(raw_tests)
                if mot_tests:
                    data_sources.append("DVSA MOT History API")
                else:
                    warnings.append("No MOT history found — vehicle may be new or exempt.")
            except dvsa_service.DVSAError as e:
                warnings.append(f"MOT history unavailable: {e}")

    # --- VIN decode (if we have a VIN) ---
    vin = body.vin or dvla_data.get("vin", "")
    vin_data: dict = {"vin": vin}
    if vin:
        nhtsa = await vin_decoder.decode_vin(vin)
        if nhtsa:
            vin_data.update(nhtsa)
            data_sources.append("NHTSA VIN Decode API")
        else:
            fallback = vin_decoder.try_vininfo_decode(vin)
            vin_data.update(fallback)

    # --- Salvage checks (run concurrently) ---
    salvage_records = []
    async def _empty():
        return []

    copart_task = salvage_service.search_copart(registration) if registration else _empty()
    iaa_task = salvage_service.search_iaa(vin) if vin else _empty()

    copart_results, iaa_results = await asyncio.gather(copart_task, iaa_task, return_exceptions=True)

    if isinstance(copart_results, list) and copart_results:
        salvage_records.extend(copart_results)
        data_sources.append("Copart UK")
    if isinstance(iaa_results, list) and iaa_results:
        salvage_records.extend(iaa_results)
        data_sources.append("IAA")

    # Fallback for bare minimum data
    if not dvla_data and not vin_data:
        raise HTTPException(status_code=503, detail="Unable to retrieve vehicle data from any source")

    # --- Build report ---
    report = build_report(
        dvla_data=dvla_data,
        mot_tests=mot_tests,
        salvage_records=salvage_records,
        vin_data=vin_data,
        data_sources=list(set(data_sources)),
        warnings=warnings,
        registration=registration or vin,
    )

    _cache[cache_key] = report
    return report
