from datetime import datetime, date, timedelta
from collections import Counter
from typing import Optional

from app.models.vehicle import (
    MotTest, MileageRecord, MileageAnomaly, SalvageRecord,
    RiskFlag, AnomalyType, DefectType, RiskLevel
)
from app.models.report import VehicleReport
from app.services.mileage import extract_mileage_records, analyse_mileage


def build_report(
    dvla_data: dict,
    mot_tests: list[MotTest],
    salvage_records: list[SalvageRecord],
    vin_data: dict,
    data_sources: list[str],
    warnings: list[str],
    registration: str,
) -> VehicleReport:

    # Merge DVLA + VIN data
    make = dvla_data.get("make") or vin_data.get("make") or "Unknown"
    model = vin_data.get("model")
    year = dvla_data.get("year") or vin_data.get("year") or 0
    colour = dvla_data.get("colour", "Unknown")
    fuel_type = dvla_data.get("fuel_type", "Unknown")
    engine_cc = dvla_data.get("engine_cc")
    transmission = vin_data.get("transmission")
    body_type = vin_data.get("body_type")

    # MOT analysis
    total_tests = len(mot_tests)
    passed = sum(1 for t in mot_tests if t.test_result == "PASSED")
    pass_rate = (passed / total_tests * 100) if total_tests > 0 else 0.0

    # Mileage analysis
    mileage_records = extract_mileage_records(mot_tests)
    mileage_anomalies, estimated_mileage, avg_annual = analyse_mileage(mileage_records)

    # Defects summary
    all_advisories: list[str] = []
    all_failures: list[str] = []
    dangerous_ever = False
    advisory_counter: Counter = Counter()

    for test in mot_tests:
        for defect in test.defects:
            if defect.type == DefectType.ADVISORY:
                all_advisories.append(defect.text)
                advisory_counter[defect.text] += 1
            elif defect.type in (DefectType.MAJOR, DefectType.MINOR):
                all_failures.append(defect.text)
            elif defect.type == DefectType.DANGEROUS:
                all_failures.append(f"[DANGEROUS] {defect.text}")
                dangerous_ever = True
            if defect.dangerous:
                dangerous_ever = True

    # Recurring advisories — flagged more than once
    recurring_advisories = [text for text, count in advisory_counter.items() if count > 1]

    # Salvage
    appears_in_salvage = len(salvage_records) > 0

    # Risk scoring
    risk_flags: list[RiskFlag] = []
    score = 100

    # Mileage drops
    drops = [a for a in mileage_anomalies if a.anomaly_type == AnomalyType.MILEAGE_DROP]
    if drops:
        impact = 30
        score -= impact
        risk_flags.append(RiskFlag(
            severity="RED",
            code="MILEAGE_DROP",
            title="Possible Odometer Tampering",
            description=f"Mileage decreased on {len(drops)} occasion(s). This is a strong indicator of clocking.",
            score_impact=-impact,
        ))

    # Mileage plateaus
    plateaus = [a for a in mileage_anomalies if a.anomaly_type == AnomalyType.MILEAGE_PLATEAU]
    if plateaus:
        impact = 15
        score -= impact
        risk_flags.append(RiskFlag(
            severity="AMBER",
            code="MILEAGE_PLATEAU",
            title="Suspicious Mileage Plateau",
            description=f"Unusually low mileage increase detected over extended periods on {len(plateaus)} occasion(s).",
            score_impact=-impact,
        ))

    # Salvage
    if appears_in_salvage:
        impact = 20
        score -= impact
        risk_flags.append(RiskFlag(
            severity="RED",
            code="SALVAGE_RECORD",
            title="Found in Salvage Auction",
            description=f"Vehicle appears in {len(salvage_records)} salvage auction record(s). May have been written off.",
            score_impact=-impact,
        ))

    # Export flag
    if dvla_data.get("marked_for_export"):
        impact = 10
        score -= impact
        risk_flags.append(RiskFlag(
            severity="AMBER",
            code="MARKED_FOR_EXPORT",
            title="Marked for Export",
            description="This vehicle is marked for export on the DVLA database.",
            score_impact=-impact,
        ))

    # Dangerous defects
    dangerous_defects = [
        d for t in mot_tests for d in t.defects
        if d.type == DefectType.DANGEROUS or d.dangerous
    ]
    if dangerous_defects:
        impact = min(5 * len(dangerous_defects), 20)
        score -= impact
        risk_flags.append(RiskFlag(
            severity="RED",
            code="DANGEROUS_DEFECTS",
            title="Dangerous Defects Recorded",
            description=f"{len(dangerous_defects)} dangerous defect(s) found in MOT history.",
            score_impact=-impact,
        ))

    # Recurring advisories
    if recurring_advisories:
        impact = min(3 * len(recurring_advisories), 15)
        score -= impact
        risk_flags.append(RiskFlag(
            severity="AMBER",
            code="RECURRING_ADVISORIES",
            title="Recurring MOT Advisories",
            description=f"{len(recurring_advisories)} advisory item(s) flagged across multiple MOT tests.",
            score_impact=-impact,
        ))

    # Low pass rate
    if total_tests > 0 and pass_rate < 60:
        impact = 5
        score -= impact
        risk_flags.append(RiskFlag(
            severity="AMBER",
            code="LOW_PASS_RATE",
            title="Poor MOT Pass Rate",
            description=f"MOT pass rate is {pass_rate:.0f}%, below the 60% threshold.",
            score_impact=-impact,
        ))

    # V5C recency checks
    v5c_date = dvla_data.get("date_of_last_v5c")
    if v5c_date:
        days_since_v5c = (date.today() - v5c_date).days
        if days_since_v5c <= 30:
            impact = 10
            score -= impact
            risk_flags.append(RiskFlag(
                severity="RED",
                code="VERY_RECENT_V5C",
                title="V5C Issued Very Recently",
                description=f"Logbook issued just {days_since_v5c} day(s) ago — possible fraud indicator.",
                score_impact=-impact,
            ))
        elif days_since_v5c <= 180:
            impact = 5
            score -= impact
            risk_flags.append(RiskFlag(
                severity="AMBER",
                code="RECENT_V5C",
                title="Recent Keeper Change",
                description=f"V5C issued {days_since_v5c} days ago, suggesting a recent keeper change.",
                score_impact=-impact,
            ))

    score = max(0, min(100, score))

    if score >= 85:
        risk_level = RiskLevel.LOW
    elif score >= 60:
        risk_level = RiskLevel.MODERATE
    else:
        risk_level = RiskLevel.HIGH

    return VehicleReport(
        registration=registration,
        vin=vin_data.get("vin") or dvla_data.get("vin"),
        make=make,
        model=model,
        year=year,
        colour=colour,
        fuel_type=fuel_type,
        engine_cc=engine_cc,
        transmission=transmission,
        body_type=body_type,
        tax_status=dvla_data.get("tax_status", "Unknown"),
        tax_due_date=dvla_data.get("tax_due_date"),
        mot_status=dvla_data.get("mot_status", "Unknown"),
        mot_expiry_date=dvla_data.get("mot_expiry_date"),
        date_of_last_v5c=v5c_date,
        marked_for_export=dvla_data.get("marked_for_export", False),
        mot_tests=mot_tests,
        total_mot_tests=total_tests,
        pass_rate=round(pass_rate, 1),
        mileage_records=mileage_records,
        mileage_anomalies=mileage_anomalies,
        estimated_current_mileage=estimated_mileage,
        average_annual_mileage=avg_annual,
        all_advisories=all_advisories,
        all_failures=all_failures,
        dangerous_defects_ever=dangerous_ever,
        recurring_advisories=recurring_advisories,
        salvage_records=salvage_records,
        appears_in_salvage_auction=appears_in_salvage,
        risk_flags=risk_flags,
        risk_score=score,
        risk_level=risk_level,
        report_generated_at=datetime.utcnow(),
        data_sources=data_sources,
        warnings=warnings,
    )
