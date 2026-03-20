import httpx
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from datetime import date
from typing import Optional
import logging

from app.config import get_settings

logger = logging.getLogger(__name__)

DVLA_BASE_URL = "https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles"


class DVLAError(Exception):
    pass


class VehicleNotFoundError(DVLAError):
    pass


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=10),
    retry=retry_if_exception_type(httpx.HTTPStatusError),
    reraise=True,
)
async def fetch_vehicle_details(registration: str) -> dict:
    settings = get_settings()

    if not settings.dvla_api_key:
        raise DVLAError("DVLA API key not configured")

    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            response = await client.post(
                DVLA_BASE_URL,
                json={"registrationNumber": registration},
                headers={
                    "x-api-key": settings.dvla_api_key,
                    "Content-Type": "application/json",
                },
            )

            if response.status_code == 404:
                raise VehicleNotFoundError(f"Vehicle not found: {registration}")

            if response.status_code == 429:
                raise DVLAError("DVLA rate limit exceeded")

            response.raise_for_status()
            return response.json()

        except httpx.TimeoutException:
            raise DVLAError("DVLA API timed out")
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                raise VehicleNotFoundError(f"Vehicle not found: {registration}")
            raise DVLAError(f"DVLA API error: {e.response.status_code}") from e


def parse_dvla_response(data: dict) -> dict:
    """Normalise raw DVLA response into our internal format."""
    def parse_date(val: Optional[str]) -> Optional[date]:
        if not val:
            return None
        try:
            return date.fromisoformat(val)
        except (ValueError, TypeError):
            return None

    return {
        "registration": data.get("registrationNumber", ""),
        "make": data.get("make", "Unknown"),
        "colour": data.get("colour", "Unknown"),
        "fuel_type": data.get("fuelType", "Unknown"),
        "year": data.get("yearOfManufacture"),
        "engine_cc": data.get("engineCapacity"),
        "tax_status": _normalise_tax_status(data.get("taxStatus", "")),
        "tax_due_date": parse_date(data.get("taxDueDate")),
        "mot_status": _normalise_mot_status(data.get("motStatus", "")),
        "mot_expiry_date": parse_date(data.get("motExpiryDate")),
        "date_of_last_v5c": parse_date(data.get("dateOfLastV5CIssued")),
        "marked_for_export": data.get("markedForExport", False),
        "co2_emissions": data.get("co2Emissions"),
        "type_approval": data.get("typeApproval"),
        "wheel_plan": data.get("wheelplan"),
        "euro_status": data.get("euroStatus"),
    }


def _normalise_tax_status(status: str) -> str:
    mapping = {
        "Taxed": "Taxed",
        "Untaxed": "Untaxed",
        "SORN": "SORN",
    }
    return mapping.get(status, status or "Unknown")


def _normalise_mot_status(status: str) -> str:
    mapping = {
        "Valid": "Valid",
        "Not valid": "Expired",
        "No results returned": "No results",
    }
    return mapping.get(status, status or "Unknown")
