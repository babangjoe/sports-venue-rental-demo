import requests
import datetime

BASE_URL = "http://localhost:4000"
TIMEOUT = 30
HEADERS = {"Content-Type": "application/json"}


def test_create_booking_with_time_slot_conflict():
    # Step 1: Prepare unique sport
    sport_payload = {
        "sport_name": "Tennis Test Sport Conflict",
        "sport_type": "racket",
        "description": "Sport for conflict booking test",
        "is_available": True
    }
    sport_resp = requests.post(f"{BASE_URL}/api/sports", json=sport_payload, headers=HEADERS, timeout=TIMEOUT)
    assert sport_resp.status_code == 201, f"Failed to create sport, got {sport_resp.status_code}"
    sport_id = sport_resp.json().get("id")
    assert sport_id is not None, "Sport creation response missing 'id'"

    # Step 2: Prepare unique field under the sport
    field_payload = {
        "field_name": "Tennis Court Conflict Test",
        "field_code": "TCCT123",
        "sport_id": sport_id,
        "price_per_hour": 150,
        "description": "Field for conflict booking test",
        "url_image": "",
        "is_available": True
    }
    field_resp = requests.post(f"{BASE_URL}/api/fields", json=field_payload, headers=HEADERS, timeout=TIMEOUT)
    assert field_resp.status_code == 201, f"Failed to create field, got {field_resp.status_code}"
    field_id = field_resp.json().get("id")
    field_name = field_payload["field_name"]
    assert field_id is not None, "Field creation response missing 'id'"

    booking_date = datetime.date.today().isoformat()
    booking_payload_1 = {
        "field_id": field_id,
        "field_name": field_name,
        "booking_date": booking_date,
        "time_slots": ["10:00-11:00"],
        "total_price": 150,
        "customer_name": "First Customer",
        "customer_phone": "1234567890",
        "customer_email": "firstcustomer@example.com"
    }
    booking_payload_conflict = {
        "field_id": field_id,
        "field_name": field_name,
        "booking_date": booking_date,
        "time_slots": ["10:00-11:00"],  # same time slot to cause conflict
        "total_price": 150,
        "customer_name": "Second Customer",
        "customer_phone": "0987654321",
        "customer_email": "secondcustomer@example.com"
    }

    try:
        # Step 3: Create initial booking (should succeed)
        create_resp_1 = requests.post(f"{BASE_URL}/api/booking", json=booking_payload_1, headers=HEADERS, timeout=TIMEOUT)
        assert create_resp_1.status_code == 201, f"Failed to create initial booking, got {create_resp_1.status_code}"
        booking_id_1 = create_resp_1.json().get("id")
        assert booking_id_1 is not None, "Initial booking creation missing 'id'"

        # Step 4: Attempt to create conflicting booking (should fail with 409)
        create_resp_2 = requests.post(f"{BASE_URL}/api/booking", json=booking_payload_conflict, headers=HEADERS, timeout=TIMEOUT)
        assert create_resp_2.status_code == 409, f"Time slot conflict test failed, expected 409 got {create_resp_2.status_code}"
    finally:
        # Cleanup bookings and resources if deletion endpoints available
        # No deletion endpoints defined in PRD, so skipping cleanup for bookings

        # Delete created field
        if field_id is not None:
            requests.delete(f"{BASE_URL}/api/fields/{field_id}", timeout=TIMEOUT)
        # Delete created sport
        if sport_id is not None:
            requests.delete(f"{BASE_URL}/api/sports/{sport_id}", timeout=TIMEOUT)


test_create_booking_with_time_slot_conflict()