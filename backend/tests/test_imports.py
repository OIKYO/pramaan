from app import imports
from app.imports import Existing, plan

COURSES = b"""name,course_type,duration_label,duration_months,is_paid,fee_inr,aliases,valid_until
2-Year Classroom Programme,classroom,2 years,24,yes,"\xe2\x82\xb948,000",2-year classroom; classroom programme,31/03/2027
All-India Test Series,Test series,6 months,6,no,,AITS,2027-03-31
"""


def test_courses_are_read_the_way_spreadsheets_write_them():
    result = plan("courses", COURSES, Existing())
    assert result.issues == []
    first, second = result.rows
    assert first.values["fee_inr"] == 48000  # rupee sign and comma
    assert first.values["valid_until"] == "2027-03-31"  # DD/MM/YYYY
    assert first.values["aliases"] == ["2-year classroom", "classroom programme"]
    assert second.values["course_type"] == "test_series" and second.values["is_paid"] is False
    assert {r.action for r in result.rows} == {"create"}


def test_existing_rows_are_updated_not_duplicated():
    result = plan("courses", COURSES, Existing(keys={"2-year classroom programme": "c1"}))
    assert [r.action for r in result.rows] == ["update", "create"]
    assert result.rows[0].existing_id == "c1"


def test_errors_name_the_line_and_column_and_say_how_to_fix_it():
    data = b"name,course_type,duration_label,duration_months,is_paid,fee_inr\nCrash,weekly,1 year,twelve,maybe,\n"
    issues = {(line, column): message for line, column, message in plan("courses", data, Existing()).issues}
    assert issues[(2, "course_type")].startswith("Write one of: classroom")
    assert issues[(2, "duration_months")] == "Write a whole number, like 48000."
    assert issues[(2, "is_paid")] == "Write yes or no."


def test_a_paid_course_needs_a_fee():
    data = b"name,course_type,duration_label,duration_months,is_paid\nCrash,crash,1 year,12,yes\n"
    assert plan("courses", data, Existing()).issues == [(2, "fee_inr", "Something paid needs its price.")]


def test_offerings_outside_education_need_only_a_name_and_a_price():
    data = "name,price,is_paid\nMasala dosa,120,yes\nFilter coffee,\"₹40\",yes\n".encode("utf-8")
    result = plan("courses", data, Existing())
    assert result.issues == []
    assert [r.values["fee_inr"] for r in result.rows] == [120, 40]  # "price" is read as fee_inr
    assert result.rows[0].values["course_type"] is None and result.rows[0].values["duration_months"] is None


def test_a_duration_in_months_gets_a_label_for_posters():
    data = b"name,is_paid,fee_inr,duration_months\nGym membership,yes,9000,12\n"
    assert plan("courses", data, Existing()).rows[0].values["duration_label"] == "1 year"


def test_missing_columns_are_reported_before_any_row():
    result = plan("toppers", b"rank\n73\n", Existing())
    assert result.rows == [] and "Missing column: full_name" in result.issues[0][2]


def test_exam_details_are_needed_only_while_the_exam_results_rulebook_is_on():
    data = b"full_name,rank\nRiya Sen,73\n"
    assert plan("toppers", data, Existing()).issues == []
    issues = plan("toppers", data, Existing(rankings=True)).issues
    assert {column for _, column, _ in issues} == {"exam", "exam_year", "result_date"}


def test_duplicate_keys_in_one_file_are_refused():
    data = b"label,value,exam,year\nQualified,42,JEE Main,2026\nqualified,40,JEE Main,2026\n"
    assert plan("results", data, Existing()).issues == [(3, "label", "Same label as line 2. Keep one.")]


def test_toppers_must_name_a_course_that_exists():
    data = b"full_name,exam,exam_year,rank,result_date,course\nRiya Sen,JEE Main,2026,73,2026-04-19,Unknown course\n"
    issues = plan("toppers", data, Existing(courses={"2-year classroom programme": "c1"})).issues
    assert issues[0][1] == "course" and "isn't in your offerings" in issues[0][2]


def test_members_need_a_branch_or_region_and_a_free_email():
    data = (b"full_name,email,role,branch,region\n"
            b"Tara Ghosh,tara@example.org,branch staff,Siliguri,\n"
            b"Vikram Bose,VIKRAM@example.org,Regional manager,,North\n"
            b"Taken Person,taken@example.org,head office,,\n")
    existing = Existing(branches={"siliguri": "b1"}, regions={"east": "r1"}, emails_elsewhere={"taken@example.org"})
    result = plan("members", data, existing)
    assert [r.values["email"] for r in result.rows] == ["tara@example.org"]
    assert {(line, column) for line, column, _ in result.issues} == {(3, "region"), (4, "email")}


def test_excel_files_with_a_byte_order_mark_and_odd_headers_still_read():
    data = "﻿Full Name,Exam,Exam-Year,Rank,Result Date\nRiya Sen,JEE Main,2026,73,19-04-2026\n".encode("utf-8")
    result = plan("toppers", data, Existing())
    assert result.issues == [] and result.rows[0].values["result_date"] == "2026-04-19"


def test_every_template_reads_back_with_its_own_example_row():
    existing = Existing(branches={"northfield siliguri": "b1"}, courses={"2-year classroom programme": "c1"})
    for dataset in imports.SPECS:
        result = plan(dataset, imports.template(dataset).encode(), existing)
        assert result.issues == [], (dataset, result.issues)
        assert len(result.rows) == 1
