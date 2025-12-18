import requests

BASE_URL = "http://localhost:4000"
SPORTS_ENDPOINT = f"{BASE_URL}/api/sports"
TIMEOUT = 30

def test_create_new_sport_with_valid_data():
    sport_data = {
        "sport_name": "Test Sport Name",
        "sport_type": "Indoor",
        "description": "Automated test sport creation",
        "is_available": True
    }
    headers = {
        "Content-Type": "application/json"
    }

    created_sport_id = None
    try:
        # Create new sport
        response = requests.post(SPORTS_ENDPOINT, json=sport_data, headers=headers, timeout=TIMEOUT)
        assert response.status_code == 201, f"Expected 201 Created, got {response.status_code}"
        resp_json = response.json()
        # Expect response to contain at least the created resource identifier or the sent data echo
        # (No explicit schema provided for response body, so we verify the required fields)
        assert "sport_name" in resp_json or "id" in resp_json, "Response missing expected fields"
        if "id" in resp_json:
            created_sport_id = resp_json["id"]
    finally:
        # Cleanup: delete the created sport if ID is available
        if created_sport_id is not None:
            delete_url = f"{SPORTS_ENDPOINT}/{created_sport_id}"
            try:
                del_resp = requests.delete(delete_url, timeout=TIMEOUT)
                # Accept 200 or 204 for successful deletion
                assert del_resp.status_code in (200, 204), f"Failed to delete sport in cleanup, status: {del_resp.status_code}"
            except Exception:
                pass

test_create_new_sport_with_valid_data()