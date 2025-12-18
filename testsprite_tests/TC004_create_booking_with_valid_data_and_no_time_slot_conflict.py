import requests
from datetime import datetime, timedelta
import random
import string

BASE_URL = "http://localhost:4000"
TIMEOUT = 30

def random_string(length=8):
    return ''.join(random.choices(string.ascii_letters + string.digits, k=length))

def test_create_booking_with_valid_data_no_conflict():
    headers = {
        "Content-Type": "application/json"
    }

    # Step 1: Create a new sport (required to create a field)
    sport_payload = {
        "sport_name": f"Sport_{random_string()}",
        "sport_type": "Outdoor"
    }
    sport_resp = requests.post(f"{BASE_URL}/api/sports", json=sport_payload, headers=headers, timeout=TIMEOUT)
    assert sport_resp.status_code == 201, f"Failed to create sport: {sport_resp.text}"

    sport_data = sport_resp.json()
    sport_id = sport_data.get("id")
    assert sport_id is not None, "Sport ID not returned on sport creation"

    # Step 2: Create a new field under this sport
    field_payload = {
        "field_name": f"Field_{random_string()}",
        "field_code": f"FC_{random_string(5)}",
        "sport_id": sport_id,
        "price_per_hour": 100.0,
        "description": "Test field for booking",
        "url_image": "http://example.com/image.jpg",
        "is_available": True
    }
    field_resp = requests.post(f"{BASE_URL}/api/fields", json=field_payload, headers=headers, timeout=TIMEOUT)
    assert field_resp.status_code == 201, f"Failed to create field: {field_resp.text}"

    field_data = field_resp.json()
    field_id = field_data.get("id")
    field_name = field_data.get("field_name")
    assert field_id is not None and field_name is not None, "Field ID or name not returned on field creation"

    # Prepare booking data:
    booking_date = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")  # tomorrow
    time_slots = ["09:00-10:00", "10:00-11:00"]  # assume these slots exist and are not booked
    total_price = len(time_slots) * 100.0  # price per hour * number of slots

    booking_payload = {
        "field_id": field_id,
        "field_name": field_name,
        "booking_date": booking_date,
        "time_slots": time_slots,
        "total_price": total_price,
        "customer_name": "Test Customer",
        "customer_phone": "081234567890",
        "customer_email": "test.customer@example.com"
    }

    booking_id = None
    try:
        booking_resp = requests.post(f"{BASE_URL}/api/booking", json=booking_payload, headers=headers, timeout=TIMEOUT)
        assert booking_resp.status_code == 201, f"Expected 201, got {booking_resp.status_code}, Response: {booking_resp.text}"
        booking_resp_json = booking_resp.json()
        booking_id = booking_resp_json.get("id")
        assert booking_id is not None, "Booking ID not returned after creation"
        assert booking_resp_json.get("field_id") == field_id
        assert booking_resp_json.get("booking_date") == booking_date
        assert booking_resp_json.get("time_slots") == time_slots
    finally:
        # Clean up: delete booking if created
        if booking_id is not None:
            try:
                requests.delete(f"{BASE_URL}/api/booking/{booking_id}", timeout=TIMEOUT)
            except Exception:
                pass

        # Clean up: delete the field created
        if field_id is not None:
            try:
                requests.delete(f"{BASE_URL}/api/fields/{field_id}", timeout=TIMEOUT)
            except Exception:
                pass

        # Clean up: delete the sport created
        if sport_id is not None:
            try:
                requests.delete(f"{BASE_URL}/api/sports/{sport_id}", timeout=TIMEOUT)
            except Exception:
                pass

test_create_booking_with_valid_data_no_conflict()