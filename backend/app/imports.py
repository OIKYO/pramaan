import csv
import io
import re
from dataclasses import dataclass, field
from datetime import date, datetime

MAX_BYTES = 2 * 1024 * 1024
MAX_ROWS = 2000
EMAIL = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


@dataclass(frozen=True)
class Column:
    name: str
    kind: str  # text, int, number, bool, date, list, course_type, channels, role, email
    required: bool = False
    help: str = ""
    example: str = ""


@dataclass(frozen=True)
class Spec:
    title: str
    key: str  # the column that identifies a row; matching rows are updated
    columns: tuple[Column, ...]
    description: str


SPECS: dict[str, Spec] = {
    "branches": Spec("Branches", "name", (
        Column("name", "text", True, "Branch name, unique in your organisation", "Northfield Siliguri"),
        Column("region", "text", True, "Region it belongs to; new regions are created", "East"),
        Column("city", "text", True, "", "Siliguri"),
        Column("phone", "text", True, "The number printed on this branch's posters", "+91 10000 22102"),
        Column("address", "text", True, "", "2nd floor, 14 Hill Cart Road, Siliguri 734001"),
    ), "Branches and the regions they sit in. Posters are checked against each branch's phone and address."),
    "courses": Spec("Offerings and prices", "name", (
        Column("name", "text", True, "The approved name", "2-Year Classroom Programme"),
        Column("is_paid", "bool", True, "yes or no", "yes"),
        Column("fee_inr", "int", False, "Price in rupees; required when it is paid. A column called price works too", "48000"),
        Column("duration_label", "text", False, "Duration as written on posters, if it has one", "2 years"),
        Column("duration_months", "int", False, "The same duration in months", "24"),
        Column("course_type", "course_type", False, "Courses only: classroom, crash, test series or online", "classroom"),
        Column("aliases", "list", False, "Other names on posters, separated by ;", "2-year classroom; classroom programme"),
        Column("valid_until", "date", False, "YYYY-MM-DD; after this the fact is out of date", "2027-03-31"),
        Column("source", "text", False, "Where the fee is approved", "Fee circular 2026-27"),
    ), "Approved courses, durations and fees. Posters must name and price courses exactly as listed."),
    "results": Spec("Approved figures", "label", (
        Column("label", "text", True, "What the figure counts", "Classroom students who qualified JEE Main 2026"),
        Column("value", "number", True, "", "42"),
        Column("exam", "text", False, "The exam it comes from, for results figures", "JEE Main"),
        Column("year", "int", False, "The year it counts", "2026"),
        Column("source", "text", False, "Where it can be verified", "Results circular 2026"),
        Column("valid_until", "date", False, "YYYY-MM-DD", "2027-03-31"),
    ), "The only success figures posters may claim."),
    "toppers": Spec("People and consent", "full_name", (
        Column("full_name", "text", True, "", "Riya Sen"),
        Column("exam", "text", False, "Exam results only: the exam", "JEE Main"),
        Column("exam_year", "int", False, "Exam results only: the year", "2026"),
        Column("rank", "int", False, "Exam results only: All India Rank, as a number", "73"),
        Column("result_date", "date", False, "Exam results only: YYYY-MM-DD", "2026-04-19"),
        Column("course", "text", False, "A name from your offerings, if it applies", "2-Year Classroom Programme"),
        Column("name_variants", "list", False, "Other spellings, separated by ;", "Ria Sen; Riya S."),
        Column("is_minor", "bool", False, "yes if under 18", "no"),
        Column("guardian_signed", "bool", False, "yes if a parent or guardian signed the consent", "no"),
        Column("consent_date", "date", False, "YYYY-MM-DD; consent files are uploaded separately", "2026-05-02"),
        Column("consent_channels", "channels", False, "print; instagram; whatsapp", "print; instagram; whatsapp"),
        Column("consent_valid_until", "date", False, "YYYY-MM-DD", "2027-05-01"),
    ), "Students posters may show, with their verified rank and consent. Upload signed consent PDFs on each topper."),
    "members": Spec("Team members", "email", (
        Column("full_name", "text", True, "", "Tara Ghosh"),
        Column("email", "email", True, "Their work email; they sign in with it", "tara@example.org"),
        Column("role", "role", True, "branch staff, regional manager or head office", "branch staff"),
        Column("branch", "text", False, "Branch name, for branch staff", "Northfield Siliguri"),
        Column("region", "text", False, "Region name, for regional managers", ""),
    ), "People who use Pramaan. New members get a temporary password, shown once, and choose their own when they sign in."),
}


def _int(raw: str) -> int:
    text = re.sub(r"[₹,\s]|rs\.?|inr", "", raw, flags=re.I)
    if not re.fullmatch(r"-?\d+", text):
        raise ValueError("Write a whole number, like 48000.")
    return int(text)


def _number(raw: str) -> float:
    try:
        return float(re.sub(r"[,\s%]", "", raw))
    except ValueError:
        raise ValueError("Write a number, like 42.") from None


def _bool(raw: str) -> bool:
    low = raw.strip().lower()
    if low in {"yes", "y", "true", "1", "paid"}:
        return True
    if low in {"no", "n", "false", "0", "free"}:
        return False
    raise ValueError("Write yes or no.")


def _date(raw: str) -> str:
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y", "%d.%m.%Y"):
        try:
            return datetime.strptime(raw.strip(), fmt).date().isoformat()
        except ValueError:
            continue
    raise ValueError("Write the date as YYYY-MM-DD, like 2026-04-19.")


def _list(raw: str) -> list[str]:
    return [item.strip() for item in re.split(r"[;|]", raw) if item.strip()]


COURSE_TYPES = {"classroom": "classroom", "crash": "crash", "crash course": "crash", "test series": "test_series",
                "test_series": "test_series", "online": "online"}
CHANNELS = {"print": "print", "instagram": "instagram", "whatsapp": "whatsapp", "whats app": "whatsapp"}
ROLES = {"branch staff": "branch_staff", "branch_staff": "branch_staff", "staff": "branch_staff",
         "regional manager": "regional_manager", "regional_manager": "regional_manager", "regional": "regional_manager",
         "head office": "head_office", "head_office": "head_office", "hq": "head_office"}


def _choice(raw: str, options: dict[str, str], hint: str) -> str:
    value = options.get(raw.strip().lower().replace("-", " ").replace("  ", " "))
    if value is None:
        raise ValueError(f"Write one of: {hint}.")
    return value


def read_cell(kind: str, raw: str):
    if kind == "int":
        return _int(raw)
    if kind == "number":
        return _number(raw)
    if kind == "bool":
        return _bool(raw)
    if kind == "date":
        return _date(raw)
    if kind == "list":
        return _list(raw)
    if kind == "course_type":
        return _choice(raw, COURSE_TYPES, "classroom, crash, test series, online")
    if kind == "channels":
        return [_choice(c, CHANNELS, "print, instagram, whatsapp") for c in _list(raw)]
    if kind == "role":
        return _choice(raw, ROLES, "branch staff, regional manager, head office")
    if kind == "email":
        if not EMAIL.match(raw.strip()):
            raise ValueError("That isn't an email address.")
        return raw.strip().lower()
    return raw.strip()


@dataclass
class Existing:
    keys: dict[str, str] = field(default_factory=dict)  # this dataset: key -> id
    regions: dict[str, str] = field(default_factory=dict)
    branches: dict[str, str] = field(default_factory=dict)
    courses: dict[str, str] = field(default_factory=dict)
    emails_elsewhere: set[str] = field(default_factory=set)  # members import: emails taken by another org
    rankings: bool = False  # the exam results rulebook is on, so people need their exam, rank and result date


ALIASES = {"price": "fee_inr", "price_inr": "fee_inr", "fee": "fee_inr", "type": "course_type"}


@dataclass
class PlannedRow:
    line: int
    key: str
    action: str  # create or update
    raw: dict[str, str]
    values: dict
    existing_id: str | None = None


@dataclass
class Plan:
    columns: list[str]
    rows: list[PlannedRow] = field(default_factory=list)
    issues: list[tuple[int, str | None, str]] = field(default_factory=list)  # (line, column, message)


def _header(name: str) -> str:
    return re.sub(r"[\s\-]+", "_", name.strip().lower()).strip("_")


def _decode(data: bytes) -> str:
    try:
        return data.decode("utf-8-sig")
    except UnicodeDecodeError:
        return data.decode("cp1252")  # older Excel "CSV" files


def plan(dataset: str, data: bytes, existing: Existing) -> Plan:
    spec = SPECS[dataset]
    names = [c.name for c in spec.columns]
    result = Plan(columns=names)
    if len(data) > MAX_BYTES:
        result.issues.append((0, None, "The file is larger than 2 MB. Split it into smaller files."))
        return result
    reader = csv.DictReader(io.StringIO(_decode(data)))
    headers = {}
    for h in reader.fieldnames or []:
        name = _header(h)
        headers.setdefault(ALIASES.get(name, name) if ALIASES.get(name) in names else name, h)
    missing = [c.name for c in spec.columns if c.required and c.name not in headers]
    if missing:
        result.issues.append((1, None, f"Missing column{'s' if len(missing) > 1 else ''}: {', '.join(missing)}. "
                                       "Download the template to see the columns."))
        return result

    seen: dict[str, int] = {}
    for index, raw_row in enumerate(reader, start=2):
        if index - 1 > MAX_ROWS:
            result.issues.append((index, None, f"Only {MAX_ROWS} rows can be imported at once. Split the file."))
            break
        raw = {name: (raw_row.get(headers[name]) or "").strip() if name in headers else "" for name in names}
        if not any(raw.values()):
            continue
        values, ok = {}, True
        for column in spec.columns:
            cell = raw[column.name]
            if not cell:
                if column.required:
                    result.issues.append((index, column.name, "This is required."))
                    ok = False
                values[column.name] = None
                continue
            try:
                values[column.name] = read_cell(column.kind, cell)
            except ValueError as error:
                result.issues.append((index, column.name, str(error)))
                ok = False
        key = (raw[spec.key] or "").lower()
        if key and key in seen:
            result.issues.append((index, spec.key, f"Same {spec.key.replace('_', ' ')} as line {seen[key]}. Keep one."))
            ok = False
        seen.setdefault(key, index)
        if ok:
            for column, message in _row_rules(dataset, values, existing):
                result.issues.append((index, column, message))
                ok = False
        if ok:
            existing_id = existing.keys.get(key)
            result.rows.append(PlannedRow(index, raw[spec.key], "update" if existing_id else "create", raw, values, existing_id))
    if not result.rows and not result.issues:
        result.issues.append((2, None, "The file has no rows under the header."))
    return result


def _row_rules(dataset: str, v: dict, existing: Existing) -> list[tuple[str | None, str]]:
    problems = []
    if dataset == "courses":
        if v["is_paid"] and v["fee_inr"] is None:
            problems.append(("fee_inr", "Something paid needs its price."))
        if v["fee_inr"] is not None and v["fee_inr"] < 0:
            problems.append(("fee_inr", "The price can't be negative."))
        if v["duration_months"] is not None and v["duration_months"] <= 0:
            problems.append(("duration_months", "Write the duration in months, more than 0."))
        if v["duration_label"] and v["duration_months"] is None:
            problems.append(("duration_months", "Give the duration in months too, so posters can be checked."))
        if v["duration_months"] and not v["duration_label"]:
            months = v["duration_months"]
            v["duration_label"] = f"{months // 12} year{'s' if months > 12 else ''}" if months % 12 == 0 else f"{months} months"
    if dataset == "toppers":
        if v["rank"] is not None and v["rank"] <= 0:
            problems.append(("rank", "Ranks start at 1."))
        if existing.rankings:
            for column in ("exam", "exam_year", "rank", "result_date"):
                if v[column] is None:
                    problems.append((column, "Needed while the exam results rulebook is on."))
        if v["course"] and v["course"].lower() not in existing.courses:
            problems.append(("course", f"“{v['course']}” isn't in your offerings. Import or add it first."))
    if dataset == "results" and v["year"] is not None and not 1900 < v["year"] <= date.today().year + 1:
        problems.append(("year", "Write a four-digit year, like 2026."))
    if dataset == "members":
        if v["email"] in existing.emails_elsewhere:
            problems.append(("email", "This email already has a Pramaan account in another organisation."))
        if v["role"] == "branch_staff" and (not v["branch"] or v["branch"].lower() not in existing.branches):
            problems.append(("branch", "Branch staff need a branch that exists in Branches."))
        if v["role"] == "regional_manager" and (not v["region"] or v["region"].lower() not in existing.regions):
            problems.append(("region", "Regional managers need a region that exists in Branches."))
    return problems


def template(dataset: str) -> str:
    spec = SPECS[dataset]
    out = io.StringIO()
    writer = csv.writer(out, lineterminator="\n")
    writer.writerow([c.name for c in spec.columns])
    writer.writerow([c.example for c in spec.columns])
    return out.getvalue()
