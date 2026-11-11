from app import tickets

SECRET = "server-secret"


def test_a_ticket_carries_its_payload_until_it_expires():
    ticket = tickets.make(SECRET, {"t": "topper-1"}, 600, now=1000)
    assert tickets.read(SECRET, ticket, now=1500)["t"] == "topper-1"
    assert tickets.read(SECRET, ticket, now=1601) is None


def test_an_altered_ticket_or_another_secret_is_refused():
    ticket = tickets.make(SECRET, {"t": "topper-1"}, 600, now=1000)
    body, signature = ticket.split(".")
    forged = tickets.make(SECRET, {"t": "topper-2"}, 600, now=1000).split(".")[0]
    assert tickets.read(SECRET, f"{forged}.{signature}", now=1100) is None
    assert tickets.read("other-secret", ticket, now=1100) is None
    assert tickets.read(SECRET, "not-a-ticket", now=1100) is None
    assert tickets.read(SECRET, f"{body}.", now=1100) is None
