import requests

BASE_URL = "http://localhost:4000"
TIMEOUT = 30

def test_create_booking_with_missing_required_fields():
    url = f"{BASE_URL}/api/booking"
    headers = {
        "Content-Type": "application/json"
    }
    # Missing required fields: field_id, field_name, booking_date, time_slots, total_price
    # Provide an empty payload or partial payload missing required fields
    payload = {
        # purposely leaving out required fields
        "customer_name": "John Doe",
        "customer_phone": "08123456789",
        "customer_email": "john.doe@example.com"
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    # The API should return 400 for missing required fields
    assert response.status_code == 400, f"Expected status code 400 but got {response.status_code}"
    # Optionally assert on response content indicating missing fields
    try:
        resp_json = response.json()
        assert ("missing" in str(resp_json).lower()) or ("required" in str(resp_json).lower()), \
            "Response does not indicate missing required fields"
    except ValueError:
        # Response is not valid JSON, that's acceptable as long as status code is 400
        pass

test_create_booking_with_missing_required_fields()