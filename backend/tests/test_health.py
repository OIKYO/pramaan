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
