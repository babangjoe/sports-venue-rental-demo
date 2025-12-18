import requests

BASE_URL = "http://localhost:4000"
TIMEOUT = 30

def test_get_bookings_with_filters():
    # Define filter parameters for the GET request
    params = {
        "fieldId": 1,
        "date": "2025-12-15",
        "status": "confirmed"
    }
    try:
        response = requests.get(
            f"{BASE_URL}/api/booking",
            params=params,
            timeout=TIMEOUT
        )
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        assert False, f"Request failed: {e}"

    # Validate response status code
    assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"

    bookings = response.json()
    assert isinstance(bookings, list), f"Expected response to be a list, got {type(bookings)}"

    # Validate that each booking matches the filter criteria if fields are present
    for booking in bookings:
        # Check fieldId match if field_id present
        if "field_id" in booking:
            assert booking["field_id"] == params["fieldId"], f"Booking field_id {booking['field_id']} does not match filter {params['fieldId']}"
        # Check booking_date match if booking_date present
        if "booking_date" in booking:
            assert booking["booking_date"] == params["date"], f"Booking date {booking['booking_date']} does not match filter {params['date']}"
        # Check status match if status present
        if "status" in booking:
            assert booking["status"] == params["status"], f"Booking status {booking['status']} does not match filter {params['status']}"

test_get_bookings_with_filters()