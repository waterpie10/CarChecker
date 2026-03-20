import httpx
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from datetime import date
from typing import Optional
import logging

from app.config import get_settings
from app.models.vehicle import MotTest, Defect, DefectType

logger = logging.getLogger(__name__)

DVSA_BASE_URL = "https://history.mot-data.dvla.gov.uk/v1/trade/vehicles/registration"


class DVSAError(Exception):
    pass


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=10),
    retry=retry_if_exception_type(httpx.HTTPStatusError),
    reraise=True,
)
async def fetch_mot_history(registration: str) -> list[dict]:
    settings = get_settings()

    if not settings.dvsa_api_key:
        raise DVSAError("DVSA API key not configured")

    async with httpx.AsyncClient(timeout=20.0) as client:
        try:
            response = await client.get(
                f"{DVSA_BASE_URL}/{registration}",
                headers={
                    "x-api-key": settings.dvsa_api_key,
                    "Accept": "application/json",
                },
            )

            if response.status_code == 404:
                return []

            if response.status_code == 429:
                raise DVSAError("DVSA rate limit exceeded")

            response.raise_for_status()
            data = response.json()

            # DVSA returns a list or a dict with a vehicles key
            if isinstance(data, list):
                if not data:
                    return []
                vehicle = data[0]
                return vehicle.get("motTests", [])
            elif isinstance(data, dict):
                vehicles = data.get("vehicles", [data])
                if not vehicles:
                    return []
                return vehicles[0].get("motTests", [])

            return []

        except httpx.TimeoutException:
            raise DVSAError("DVSA API timed out")
        except httpx.HTTPStatusError as e:
            if e.response.status_code in (404, 204):
                return []
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

    # Sort ascending by date
    tests.sort(key=lambda x: x.completed_date)
    return tests
