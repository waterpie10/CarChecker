import httpx
import time
import logging
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from datetime import date
from typing import Optional

from app.config import get_settings
from app.models.vehicle import MotTest, Defect, DefectType

logger = logging.getLogger(__name__)

DVSA_BASE_URL = "https://history.mot.api.gov.uk/v1/trade/vehicles/registration"

# Simple in-process token cache: (access_token, expires_at_epoch)
_token_cache: tuple[str, float] = ("", 0.0)


class DVSAError(Exception):
    pass


async def _get_access_token() -> str:
    """Fetch an OAuth2 Bearer token via client credentials, caching until expiry."""
    global _token_cache
    token, expires_at = _token_cache

    if token and time.time() < expires_at - 60:
        return token

    settings = get_settings()
    if not settings.dvsa_client_id or not settings.dvsa_client_secret:
        raise DVSAError("DVSA OAuth2 credentials not configured")

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(
            settings.dvsa_token_url,
            data={
                "grant_type": "client_credentials",
                "client_id": settings.dvsa_client_id,
                "client_secret": settings.dvsa_client_secret,
                "scope": settings.dvsa_scope,
            },
        )
        if response.status_code != 200:
            raise DVSAError(f"Failed to obtain DVSA access token: {response.status_code} {response.text}")

        data = response.json()
        token = data["access_token"]
        expires_in = int(data.get("expires_in", 3600))
        _token_cache = (token, time.time() + expires_in)
        logger.info("Obtained fresh DVSA access token")
        return token


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=10),
    retry=retry_if_exception_type(httpx.HTTPStatusError),
    reraise=True,
)
def _extract_vehicle(raw: dict) -> dict:
    """Pull vehicle-level fields out of a DVSA response object."""
    return {
        "make":   raw.get("make"),
        "model":  raw.get("model"),
        "colour": raw.get("primaryColour"),
        "fuel_type": raw.get("fuelType"),
        "engine_cc": int(raw["engineSize"]) if raw.get("engineSize") else None,
    }


async def fetch_mot_history(registration: str) -> tuple[dict, list[dict]]:
    settings = get_settings()

    if not settings.dvsa_client_id:
        raise DVSAError("DVSA credentials not configured")

    token = await _get_access_token()

    async with httpx.AsyncClient(timeout=20.0) as client:
        try:
            response = await client.get(
                f"{DVSA_BASE_URL}/{registration}",
                headers={
                    "Authorization": f"Bearer {token}",
                    "x-api-key": settings.dvsa_api_key,
                    "Accept": "application/json",
                },
            )

            if response.status_code == 404:
                return {}, []

            if response.status_code == 401:
                # Token may have just expired — clear cache and let retry handle it
                global _token_cache
                _token_cache = ("", 0.0)
                raise DVSAError("DVSA token rejected (401) — will retry")

            if response.status_code == 429:
                raise DVSAError("DVSA rate limit exceeded")

            response.raise_for_status()
            data = response.json()

            if isinstance(data, list):
                if not data:
                    return {}, []
                vehicle = data[0]
                return _extract_vehicle(vehicle), vehicle.get("motTests", [])
            elif isinstance(data, dict):
                vehicles = data.get("vehicles", [data])
                if not vehicles:
                    return {}, []
                vehicle = vehicles[0]
                return _extract_vehicle(vehicle), vehicle.get("motTests", [])

            return {}, []

        except httpx.TimeoutException:
            raise DVSAError("DVSA API timed out")
        except httpx.ConnectError as e:
            raise DVSAError(f"Cannot reach DVSA API — DNS/connection failure: {e}") from e
        except httpx.HTTPStatusError as e:
            if e.response.status_code in (404, 204):
                return {}, []
            raise DVSAError(f"DVSA API error: {e.response.status_code}") from e


def parse_mot_tests(raw_tests: list[dict]) -> list[MotTest]:
    tests = []
    for t in raw_tests:
        defects = []
        for d in t.get("defects", []) or []:
            try:
                dtype = DefectType(d.get("type", "ADVISORY"))
            except ValueError:
                dtype = DefectType.ADVISORY
            defects.append(Defect(
                text=d.get("text", ""),
                type=dtype,
                dangerous=d.get("dangerous", False),
            ))

        odometer_raw = t.get("odometerValue")
        odometer_val: Optional[int] = None
        if odometer_raw is not None:
            try:
                odometer_val = int(odometer_raw)
            except (ValueError, TypeError):
                pass

        completed_raw = t.get("completedDate", "")
        try:
            completed = date.fromisoformat(completed_raw[:10])
        except (ValueError, TypeError):
            continue

        expiry_raw = t.get("expiryDate")
        expiry: Optional[date] = None
        if expiry_raw:
            try:
                expiry = date.fromisoformat(expiry_raw[:10])
            except (ValueError, TypeError):
                pass

        tests.append(MotTest(
            completed_date=completed,
            test_result=t.get("testResult", "UNKNOWN"),
            expiry_date=expiry,
            odometer_value=odometer_val,
            odometer_unit=t.get("odometerUnit", "mi"),
            odometer_result_type=t.get("odometerResultType"),
            mot_test_number=t.get("motTestNumber"),
            defects=defects,
        ))

    tests.sort(key=lambda x: x.completed_date)
    return tests
