from fastapi.testclient import TestClient

from app.main import app


def test_health_needs_no_login():
    response = TestClient(app).get("/health")
    assert response.status_code == 200
    assert response.json()["ok"] is True


def test_allowed_origins_forgive_common_slips():
    from app.config import parse_origins

    value = ' https://pramaanapp.vercel.app/ , pramaanapp.vercel.app,"http://localhost:5173",, '
    assert parse_origins(value) == (
        "https://pramaanapp.vercel.app",
        "https://pramaanapp.vercel.app",
        "http://localhost:5173",
    )


def test_health_can_check_the_database(monkeypatch):
    class Query:
        def __getattr__(self, name):
            return lambda *args, **kwargs: self

    class Db:
        def table(self, name):
            return Query()

    monkeypatch.setattr("app.main.get_db", lambda: Db())
    response = TestClient(app).get("/health?db=true")
    assert response.status_code == 200 and response.json()["database"] == "ok"


def test_health_reports_an_unreachable_database(monkeypatch):
    def broken():
        raise RuntimeError("no database")

    monkeypatch.setattr("app.main.get_db", broken)
    response = TestClient(app).get("/health?db=true")
    assert response.status_code == 503 and response.json() == {"ok": False, "reader_mode": "fixture", "database": "unreachable"}
