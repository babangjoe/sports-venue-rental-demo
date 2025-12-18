import requests

BASE_URL = "http://localhost:4000"
FIELDS_ENDPOINT = f"{BASE_URL}/api/fields"
TIMEOUT = 30

def test_create_new_field_with_valid_data():
    # Sample valid field data
    field_data = {
        "field_name": "Test Field Alpha",
        "field_code": "TFALPHA001",
        "sport_id": 1,
        "price_per_hour": 150000,
        "description": "A test field created for automated testing.",
        "url_image": "http://example.com/image.png",
        "is_available": True
    }
    field_id = None

    try:
        # POST request to create a new field
        response = requests.post(
            FIELDS_ENDPOINT,
            json=field_data,
            timeout=TIMEOUT
        )
        # Assert HTTP 201 Created
        assert response.status_code == 201, f"Expected status code 201, got {response.status_code}"

        # Validate response contains the created field data and an ID
        resp_json = response.json()
        assert isinstance(resp_json, dict), "Response is not a JSON object"
        assert "field_name" in resp_json and resp_json["field_name"] == field_data["field_name"]
        assert "field_code" in resp_json and resp_json["field_code"] == field_data["field_code"]
        assert "sport_id" in resp_json and resp_json["sport_id"] == field_data["sport_id"]
        assert "price_per_hour" in resp_json and resp_json["price_per_hour"] == field_data["price_per_hour"]
        assert "id" in resp_json, "Response JSON does not contain 'id'"
        field_id = resp_json["id"]

    finally:
        # Cleanup: delete the created field if creation was successful
        if field_id is not None:
            try:
                del_response = requests.delete(
                    f"{FIELDS_ENDPOINT}/{field_id}",
                    timeout=TIMEOUT
                )
                # Optional: check delete status, but not assert here to avoid masking original test result
            except Exception:
                pass

test_create_new_field_with_valid_data()