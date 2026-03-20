from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime

from app.models.vehicle import (
    MotTest, MileageRecord, MileageAnomaly,
    SalvageRecord, RiskFlag, RiskLevel
)


class VehicleReport(BaseModel):
    # Identity
    registration: str
    vin: Optional[str] = None
    make: str
    model: Optional[str] = None
    year: int
    colour: str
    fuel_type: str
    engine_cc: Optional[int] = None
    transmission: Optional[str] = None
    body_type: Optional[str] = None

    # Status
    tax_status: str
    tax_due_date: Optional[date] = None
    mot_status: str
    mot_expiry_date: Optional[date] = None

    # Keeper info
    date_of_last_v5c: Optional[date] = None
    marked_for_export: bool = False

    # MOT history
    mot_tests: list[MotTest] = []
    total_mot_tests: int = 0
    pass_rate: float = 0.0

    # Mileage analysis
    mileage_records: list[MileageRecord] = []
    mileage_anomalies: list[MileageAnomaly] = []
    estimated_current_mileage: Optional[int] = None
    average_annual_mileage: Optional[int] = None

    # Defects summary
    all_advisories: list[str] = []
    all_failures: list[str] = []
    dangerous_defects_ever: bool = False
    recurring_advisories: list[str] = []

    # Salvage
    salvage_records: list[SalvageRecord] = []
    appears_in_salvage_auction: bool = False

    # Risk
    risk_flags: list[RiskFlag] = []
    risk_score: int = 100
    risk_level: RiskLevel = RiskLevel.LOW

    # Meta
    report_generated_at: datetime
    data_sources: list[str] = []
    warnings: list[str] = []


class CheckRequest(BaseModel):
    registration: Optional[str] = None
    vin: Optional[str] = None

    model_config = {"str_strip_whitespace": True, "str_to_upper": True}
