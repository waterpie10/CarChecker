from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
from enum import Enum


class AnomalyType(str, Enum):
    MILEAGE_DROP = "MILEAGE_DROP"
    MILEAGE_PLATEAU = "MILEAGE_PLATEAU"
    HIGH_ANNUAL_MILEAGE = "HIGH_ANNUAL_MILEAGE"


class RiskLevel(str, Enum):
    LOW = "LOW"
    MODERATE = "MODERATE"
    HIGH = "HIGH"


class DefectType(str, Enum):
    ADVISORY = "ADVISORY"
    MINOR = "MINOR"
    MAJOR = "MAJOR"
    DANGEROUS = "DANGEROUS"


class Defect(BaseModel):
    text: str
    type: DefectType
    dangerous: bool = False


class MotTest(BaseModel):
    completed_date: date
    test_result: str  # PASSED / FAILED
    expiry_date: Optional[date] = None
    odometer_value: Optional[int] = None
    odometer_unit: Optional[str] = None
    odometer_result_type: Optional[str] = None
    mot_test_number: Optional[str] = None
    defects: list[Defect] = []


class MileageRecord(BaseModel):
    date: date
    mileage: int
    mot_result: str


class MileageAnomaly(BaseModel):
    anomaly_type: AnomalyType
    date_from: date
    date_to: Optional[date]
    mileage_from: Optional[int]
    mileage_to: Optional[int]
    explanation: str


class SalvageRecord(BaseModel):
    source: str
    lot_number: Optional[str] = None
    sale_date: Optional[str] = None
    damage_description: Optional[str] = None
    loss_type: Optional[str] = None
    url: Optional[str] = None


class RiskFlag(BaseModel):
    severity: str  # RED / AMBER / GREEN
    code: str
    title: str
    description: str
    score_impact: int
