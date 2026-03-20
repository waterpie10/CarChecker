from datetime import date, timedelta
from typing import Optional

from app.models.vehicle import MotTest, MileageRecord, MileageAnomaly, AnomalyType

_READABLE_TYPES = {"READ", "OK"}
_UNREADABLE_TYPES = {"NO_ODOMETER", "UNREADABLE"}

PLATEAU_DAYS_THRESHOLD = 365
PLATEAU_MILES_THRESHOLD = 200
HIGH_ANNUAL_MILES = 30_000


def extract_mileage_records(mot_tests: list[MotTest]) -> list[MileageRecord]:
    records = []
    for test in mot_tests:
        if (
            test.odometer_value is not None
            and test.odometer_value > 0
            and (
                test.odometer_result_type is None
                or test.odometer_result_type.upper() not in _UNREADABLE_TYPES
            )
        ):
            # Convert km to miles if needed
            mileage = test.odometer_value
            if test.odometer_unit and test.odometer_unit.upper() in ("KM", "KMS", "KILOMETRES"):
                mileage = int(mileage * 0.621371)

            records.append(MileageRecord(
                date=test.completed_date,
                mileage=mileage,
                mot_result=test.test_result,
            ))

    # Sort ascending
    records.sort(key=lambda r: r.date)
    return records


def analyse_mileage(records: list[MileageRecord]) -> tuple[list[MileageAnomaly], Optional[int], Optional[int]]:
    """
    Returns (anomalies, estimated_current_mileage, average_annual_mileage).
    """
    anomalies: list[MileageAnomaly] = []

    if len(records) < 2:
        current = records[0].mileage if records else None
        return anomalies, current, None

    for i in range(1, len(records)):
        prev = records[i - 1]
        curr = records[i]
        days_diff = (curr.date - prev.date).days
        miles_diff = curr.mileage - prev.mileage

        # Mileage drop — likely clocking
        if miles_diff < 0:
            anomalies.append(MileageAnomaly(
                anomaly_type=AnomalyType.MILEAGE_DROP,
                date_from=prev.date,
                date_to=curr.date,
                mileage_from=prev.mileage,
                mileage_to=curr.mileage,
                explanation=(
                    f"Mileage dropped from {prev.mileage:,} to {curr.mileage:,} miles "
                    f"between {prev.date} and {curr.date}. This may indicate odometer tampering (clocking)."
                ),
            ))

        # Mileage plateau — very little movement over a long period
        elif days_diff >= PLATEAU_DAYS_THRESHOLD and miles_diff < PLATEAU_MILES_THRESHOLD:
            anomalies.append(MileageAnomaly(
                anomaly_type=AnomalyType.MILEAGE_PLATEAU,
                date_from=prev.date,
                date_to=curr.date,
                mileage_from=prev.mileage,
                mileage_to=curr.mileage,
                explanation=(
                    f"Only {miles_diff:,} miles recorded over {days_diff} days "
                    f"({prev.date} to {curr.date}). Suspiciously low increase for the period."
                ),
            ))

        # High annual mileage in a 12-month window
        if days_diff > 0:
            annual_rate = (miles_diff / days_diff) * 365
            if annual_rate > HIGH_ANNUAL_MILES and miles_diff > 0:
                anomalies.append(MileageAnomaly(
                    anomaly_type=AnomalyType.HIGH_ANNUAL_MILEAGE,
                    date_from=prev.date,
                    date_to=curr.date,
                    mileage_from=prev.mileage,
                    mileage_to=curr.mileage,
                    explanation=(
                        f"High mileage rate: approx {int(annual_rate):,} miles/year "
                        f"between {prev.date} and {curr.date}."
                    ),
                ))

    # Average annual mileage
    first = records[0]
    last = records[-1]
    total_days = (last.date - first.date).days
    total_miles = last.mileage - first.mileage

    avg_annual: Optional[int] = None
    if total_days > 0 and total_miles > 0:
        avg_annual = int((total_miles / total_days) * 365)

    # Estimate current mileage by projecting from last reading
    estimated: Optional[int] = None
    if total_days > 0 and total_miles > 0:
        daily_rate = total_miles / total_days
        days_since_last = (date.today() - last.date).days
        if days_since_last >= 0:
            estimated = int(last.mileage + daily_rate * days_since_last)
    else:
        estimated = last.mileage

    return anomalies, estimated, avg_annual
