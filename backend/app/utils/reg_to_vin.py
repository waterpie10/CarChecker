import re


# UK registration plate formats
_PATTERNS = [
    # Current format 2001+: AB12 CDE
    re.compile(r"^[A-Z]{2}\d{2}[A-Z]{3}$"),
    # Prefix format 1983-2001: A123 BCD
    re.compile(r"^[A-Z]\d{1,3}[A-Z]{3}$"),
    # Suffix format 1963-1983: ABC 123A
    re.compile(r"^[A-Z]{3}\d{1,3}[A-Z]$"),
    # Dateless/cherished short forms
    re.compile(r"^[A-Z]{1,3}\d{1,4}$"),
    re.compile(r"^\d{1,4}[A-Z]{1,3}$"),
]

_VIN_PATTERN = re.compile(r"^[A-HJ-NPR-Z0-9]{17}$")


def normalise_registration(reg: str) -> str:
    """Strip spaces, convert to uppercase."""
    return reg.replace(" ", "").upper()


def is_valid_uk_registration(reg: str) -> bool:
    normalised = normalise_registration(reg)
    return any(p.match(normalised) for p in _PATTERNS)


def is_valid_vin(vin: str) -> bool:
    return bool(_VIN_PATTERN.match(vin.upper()))
