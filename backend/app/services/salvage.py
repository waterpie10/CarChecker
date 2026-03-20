import httpx
import logging
from typing import Optional
from bs4 import BeautifulSoup

from app.models.vehicle import SalvageRecord

logger = logging.getLogger(__name__)

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "application/json, text/html, */*",
}


async def search_copart(registration: str) -> list[SalvageRecord]:
    """Search Copart UK for a registration plate."""
    url = "https://www.copart.co.uk/public/lots/search-results"
    payload = {
        "query": {
            "bool": {
                "must": [
                    {"term": {"licPlate": registration.upper()}}
                ]
            }
        },
        "size": 10,
        "from": 0,
    }

    try:
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            response = await client.post(
                url,
                json=payload,
                headers={**HEADERS, "Content-Type": "application/json"},
            )
            if response.status_code != 200:
                logger.debug(f"Copart returned {response.status_code}")
                return []

            data = response.json()
            hits = (
                data.get("data", {})
                    .get("results", {})
                    .get("content", [])
            )
            records = []
            for hit in hits:
                records.append(SalvageRecord(
                    source="Copart UK",
                    lot_number=str(hit.get("lotNumberStr", "")),
                    sale_date=hit.get("saleDate", {}).get("str") if isinstance(hit.get("saleDate"), dict) else str(hit.get("saleDate", "")),
                    damage_description=hit.get("damageDescription", ""),
                    loss_type=hit.get("lossType", ""),
                    url=f"https://www.copart.co.uk/lot/{hit.get('lotNumberStr', '')}",
                ))
            return records

    except Exception as e:
        logger.warning(f"Copart search failed for {registration}: {e}")
        return []


async def search_iaa(vin: str) -> list[SalvageRecord]:
    """Search IAA (Insurance Auto Auctions) for a VIN."""
    if not vin:
        return []

    url = f"https://www.iaai.com/Search?SearchText={vin}"
    try:
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            response = await client.get(url, headers=HEADERS)
            if response.status_code != 200:
                return []

            soup = BeautifulSoup(response.text, "lxml")
            records = []

            # IAA results appear in vehicle cards
            cards = soup.select(".vehicle-card, [data-vin]")
            for card in cards:
                card_vin = card.get("data-vin", "")
                if vin.upper() not in card_vin.upper():
                    continue

                damage_el = card.select_one(".damage-description, .primary-damage")
                loss_el = card.select_one(".loss-type")
                lot_el = card.select_one(".lot-number, [data-lot]")

                records.append(SalvageRecord(
                    source="IAA",
                    lot_number=lot_el.get_text(strip=True) if lot_el else None,
                    damage_description=damage_el.get_text(strip=True) if damage_el else None,
                    loss_type=loss_el.get_text(strip=True) if loss_el else None,
                    url=url,
                ))

            return records

    except Exception as e:
        logger.warning(f"IAA search failed for VIN {vin}: {e}")
        return []
