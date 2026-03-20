import httpx
import logging
from typing import Optional

logger = logging.getLogger(__name__)

NHTSA_BASE_URL = "https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvalues"


async def decode_vin(vin: str) -> dict:
    """Decode a VIN using the free NHTSA API."""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{NHTSA_BASE_URL}/{vin}",
                params={"format": "json"},
            )
            response.raise_for_status()
            data = response.json()
            results = data.get("Results", [])
            if not results:
                return {}
            return _parse_nhtsa_result(results[0])
    except Exception as e:
        logger.warning(f"NHTSA VIN decode failed for {vin}: {e}")
        return {}


def _parse_nhtsa_result(result: dict) -> dict:
    def get(key: str) -> Optional[str]:
        val = result.get(key, "")
        return val if val and val != "0" else None

    return {
        "make": get("Make"),
        "model": get("Model"),
        "year": _safe_int(get("ModelYear")),
        "body_type": get("BodyClass"),
        "drive_type": get("DriveType"),
        "transmission": get("TransmissionStyle"),
        "engine_cylinders": _safe_int(get("EngineCylinders")),
        "displacement_l": get("DisplacementL"),
        "plant_country": get("PlantCountry"),
        "vehicle_type": get("VehicleType"),
        "manufacturer": get("Manufacturer"),
    }


def _safe_int(val: Optional[str]) -> Optional[int]:
    if val is None:
        return None
    try:
        return int(float(val))
    except (ValueError, TypeError):
        return None


def try_vininfo_decode(vin: str) -> dict:
    """Fallback: use python-vininfo for basic WMI decode."""
    try:
        from vininfo import Vin
        v = Vin(vin)
        return {
            "make": getattr(v, "brand", None),
            "country": getattr(v, "country", None),
            "region": getattr(v, "region", None),
        }
    except Exception as e:
        logger.debug(f"vininfo fallback failed: {e}")
        return {}
