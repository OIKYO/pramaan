from datetime import date, datetime, timedelta

from app.models import PosterReading, Topper
from pipeline.match import match_people

RESPOND_DAYS = 30
MAX_VALID_DAYS = 730


def expires_at(now: datetime) -> datetime:
    return now + timedelta(days=RESPOND_DAYS)


def request_status(row: dict, now: datetime) -> str:
    if row["status"] != "pending":
        return row["status"]
    expires = row["expires_at"]
    if isinstance(expires, str):
        expires = datetime.fromisoformat(expires.replace("Z", "+00:00"))
    return "expired" if expires <= now else "pending"


def valid_until_problem(valid_until: date, today: date) -> str | None:
    if valid_until <= today:
        return "Choose an end date after today."
    if valid_until > today + timedelta(days=MAX_VALID_DAYS):
        return "Ask for consent for up to 2 years at a time."
    return None


def relation_problem(topper: Topper, relation: str) -> str | None:
    if topper.is_minor and relation != "guardian":
        return f"{topper.full_name} is under 18, so a parent or guardian must approve."
    return None


def find_on_poster(reading: PosterReading | None, topper: Topper) -> tuple[list[int] | None, list[str]]:
    if reading is None:
        return None, []
    for match in match_people(reading, [topper]):
        if match.topper_id == topper.id and match.status == "match":
            person = reading.people[match.person_index]
            lines = [person.name, person.rank_text, person.course_text, person.duration_text, person.paid_text]
            return person.box_2d, [line for line in lines if line]
    return None, []


def register_lines(topper: Topper, course_name: str | None) -> list[str]:
    lines = [topper.full_name]
    if topper.rank and topper.exam:
        lines.append(f"AIR {topper.rank} in {topper.exam} {topper.exam_year or ''}".strip())
    if course_name:
        lines.append(course_name)
    return lines


def approved_topper(topper: Topper, channels: list[str], valid_until: date, relation: str, today: date) -> Topper:
    return topper.model_copy(update={
        "consent_source": "link", "has_consent": True, "consent_date": today, "consent_channels": list(channels),
        "consent_valid_until": valid_until, "guardian_signed": relation == "guardian", "consent_withdrawn_at": None,
    })


def signer_words(name: str, relation: str) -> str:
    return f"{name} (parent or guardian)" if relation == "guardian" else name
