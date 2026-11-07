"""Bring an organisation's existing records in from CSV: branches, courses, results figures, toppers
and team members. Upload once to preview (nothing is saved), fix any errors, then confirm.
A file is written only when every row is valid. The checking lives in app/imports.py."""

from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

from app import imports
from app.auth import require
from app.db import audit, get_db
from app.models import (
    Dataset, DatasetSpecOut, ImportColumn, ImportIssue, ImportPreview, ImportRow, Profile,
)
from app.team import add_profile, create_login, temporary_password

router = APIRouter(prefix="/imports", tags=["imports"])
HeadOffice = Annotated[Profile, Depends(require("head_office"))]
TABLE = {"branches": "branches", "courses": "courses", "results": "result_stats", "toppers": "toppers", "members": "profiles"}


@router.get("", response_model=list[DatasetSpecOut])
def datasets(user: HeadOffice) -> list[DatasetSpecOut]:
    """What can be imported, each with its columns and a template."""
    return [
        DatasetSpecOut(dataset=name, title=spec.title, description=spec.description, key=spec.key,
                       columns=[ImportColumn(name=c.name, required=c.required, help=c.help, example=c.example)
                                for c in spec.columns],
                       template=imports.template(name))
        for name, spec in imports.SPECS.items()
    ]


def _names(table: str, org_id: str, column: str = "name") -> dict[str, str]:
    rows = get_db().table(table).select(f"id, {column}").eq("org_id", org_id).execute().data
    return {str(r[column]).lower(): r["id"] for r in rows if r[column]}


def _existing(dataset: str, org_id: str) -> imports.Existing:
    key = imports.SPECS[dataset].key
    existing = imports.Existing(
        keys=_names(TABLE[dataset], org_id, key),
        regions=_names("regions", org_id), branches=_names("branches", org_id), courses=_names("courses", org_id),
    )
    if dataset == "members":
        others = get_db().table("profiles").select("email").neq("org_id", org_id).execute().data
        existing.emails_elsewhere = {r["email"].lower() for r in others if r["email"]}
    return existing


def _write(dataset: str, plan: imports.Plan, existing: imports.Existing, org_id: str) -> tuple[int, int, list[dict]]:
    """Save every planned row. Returns (created, updated, temporary passwords for new members)."""
    db = get_db()
    created = updated = 0
    credentials: list[dict[str, str]] = []
    for row in plan.rows:
        v = dict(row.values)
        if dataset == "branches":
            region = v.pop("region")
            region_id = existing.regions.get(region.lower())
            if not region_id:
                region_id = db.table("regions").insert({"org_id": org_id, "name": region}).execute().data[0]["id"]
                existing.regions[region.lower()] = region_id
            v["region_id"] = region_id
        elif dataset == "courses":
            v["aliases"] = v["aliases"] or []
            v["source"] = v["source"] or ""
            if not v["is_paid"]:
                v["fee_inr"] = v["fee_inr"] or 0
        elif dataset == "results":
            v["source"] = v["source"] or ""
        elif dataset == "toppers":
            course = v.pop("course")
            v["course_id"] = existing.courses.get(course.lower()) if course else None
            v["name_variants"] = v["name_variants"] or []
            v["consent_channels"] = v["consent_channels"] or []
            v["is_minor"] = bool(v["is_minor"])
            v["guardian_signed"] = bool(v["guardian_signed"])
        elif dataset == "members":
            branch_id = existing.branches.get((v["branch"] or "").lower())
            region_id = existing.regions.get((v["region"] or "").lower())
            if row.existing_id:
                db.table("profiles").update({"full_name": v["full_name"], "role": v["role"],
                                             "branch_id": branch_id if v["role"] == "branch_staff" else None,
                                             "region_id": region_id if v["role"] == "regional_manager" else None,
                                             }).eq("id", row.existing_id).execute()
                updated += 1
            else:
                password = temporary_password()
                user_id = create_login(db, v["email"], password, v["full_name"])
                add_profile(db, user_id, org_id, v["full_name"], v["email"], v["role"], branch_id, region_id,
                            needs_password_change=True)
                credentials.append({"email": v["email"], "full_name": v["full_name"], "temporary_password": password})
                created += 1
            continue

        if row.existing_id:
            db.table(TABLE[dataset]).update(v).eq("id", row.existing_id).execute()
            updated += 1
        else:
            db.table(TABLE[dataset]).insert({**v, "org_id": org_id}).execute()
            created += 1
    return created, updated, credentials


@router.post("/{dataset}", response_model=ImportPreview)
def run_import(dataset: Dataset, user: HeadOffice, file: Annotated[UploadFile, File()],
               commit: Annotated[bool, Form()] = False) -> ImportPreview:
    """Check a CSV and show what would change. With commit=true, save it (only if every row is valid)."""
    data = file.file.read(imports.MAX_BYTES + 1)
    existing = _existing(dataset, user.org_id)
    plan = imports.plan(dataset, data, existing)
    preview = ImportPreview(
        dataset=dataset, columns=plan.columns,
        rows=[ImportRow(row=r.line, key=r.key, action=r.action, values=r.raw) for r in plan.rows],
        issues=[ImportIssue(row=line, column=column, message=message) for line, column, message in plan.issues],
    )
    if not commit:
        return preview
    if plan.issues:
        raise HTTPException(422, f"Fix the {len(plan.issues)} problem{'s' if len(plan.issues) > 1 else ''} in the file first. "
                                 "Nothing was saved.")
    created, updated, credentials = _write(dataset, plan, existing, user.org_id)
    audit(user.org_id, user.id, "data_imported", "import", dataset,
          {"file": file.filename, "created": created, "updated": updated})
    return preview.model_copy(update={"committed": True, "created": created, "updated": updated, "credentials": credentials})
