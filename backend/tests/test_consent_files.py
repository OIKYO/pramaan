from fastapi.testclient import TestClient

from app.main import app


def test_an_expired_or_altered_consent_file_link_says_so():
    response = TestClient(app).get("/toppers/consent-files/not-a-real-ticket", follow_redirects=False)
    assert response.status_code == 410
    assert "This link has expired" in response.text
