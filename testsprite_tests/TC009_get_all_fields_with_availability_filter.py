import requests

BASE_URL = "http://localhost:4000"
TIMEOUT = 30

def test_get_all_fields_with_availability_filter():
    # Step 1: Create a sport to associate with fields
    sport_payload = {
        "sport_name": "Test Sport TC009",
        "sport_type": "Indoor"
    }
    sport_id = None
    field_id_available = None
    field_id_unavailable = None
    try:
        sport_resp = requests.post(
            f"{BASE_URL}/api/sports",
            json=sport_payload,
            timeout=TIMEOUT
        )
        assert sport_resp.status_code == 201, f"Failed to create sport, status: {sport_resp.status_code}, response: {sport_resp.text}"
        sport_data = sport_resp.json()
        # Assuming the created sport ID is returned in the response JSON as 'id' or similar
        if isinstance(sport_data, dict) and "id" in sport_data:
            sport_id = sport_data["id"]
        elif isinstance(sport_data, dict) and "sport_id" in sport_data:
            sport_id = sport_data["sport_id"]
        else:
            # fallback: try keys typical to APIs
            keys = list(sport_data.keys())
            if keys:
                sport_id = sport_data[keys[0]].get("id") or sport_data[keys[0]].get("sport_id")
        assert sport_id is not None, "Sport ID not found in creation response"

        # Step 2: Create one available field for the sport
        field_payload_available = {
            "field_name": "Available Field TC009",
            "field_code": "TC009-A",
            "sport_id": sport_id,
            "price_per_hour": 100.0,
            "description": "Available field for TC009 test",
            "url_image": "http://example.com/image-available.jpg",
            "is_available": True
        }
        field_resp = requests.post(
            f"{BASE_URL}/api/fields",
            json=field_payload_available,
            timeout=TIMEOUT
        )
        assert field_resp.status_code == 201, f"Failed to create available field, status: {field_resp.status_code}, response: {field_resp.text}"
        field_data = field_resp.json()
        if isinstance(field_data, dict) and "id" in field_data:
            field_id_available = field_data["id"]
        elif isinstance(field_data, dict) and "field_id" in field_data:
            field_id_available = field_data["field_id"]
        else:
            keys = list(field_data.keys())
            if keys:
                field_id_available = field_data[keys[0]].get("id") or field_data[keys[0]].get("field_id")
        assert field_id_available is not None, "Available Field ID not found in response"

        # Step 3: Create one unavailable field for the sport
        field_payload_unavailable = {
            "field_name": "Unavailable Field TC009",
            "field_code": "TC009-U",
            "sport_id": sport_id,
            "price_per_hour": 90.0,
            "description": "Unavailable field for TC009 test",
            "url_image": "http://example.com/image-unavailable.jpg",
            "is_available": False
        }
        field_resp_unavailable = requests.post(
            f"{BASE_URL}/api/fields",
            json=field_payload_unavailable,
            timeout=TIMEOUT
        )
        assert field_resp_unavailable.status_code == 201, f"Failed to create unavailable field, status: {field_resp_unavailable.status_code}, response: {field_resp_unavailable.text}"
        field_data_unavailable = field_resp_unavailable.json()
        if isinstance(field_data_unavailable, dict) and "id" in field_data_unavailable:
            field_id_unavailable = field_data_unavailable["id"]
        elif isinstance(field_data_unavailable, dict) and "field_id" in field_data_unavailable:
            field_id_unavailable = field_data_unavailable["field_id"]
        else:
            keys = list(field_data_unavailable.keys())
            if keys:
                field_id_unavailable = field_data_unavailable[keys[0]].get("id") or field_data_unavailable[keys[0]].get("field_id")
        assert field_id_unavailable is not None, "Unavailable Field ID not found in response"

        # Step 4: Call GET /api/fields with isAvailable=True and sportId filter
        params = {
            "isAvailable": True,
            "sportId": sport_id
        }
        get_resp = requests.get(
            f"{BASE_URL}/api/fields",
            params=params,
            timeout=TIMEOUT
        )
        assert get_resp.status_code == 200, f"GET /api/fields returned status {get_resp.status_code}"
        fields_list = get_resp.json()
        assert isinstance(fields_list, list), "Response is not a list"

        # Step 5: Validate that only available fields for the sport are included
        # Normalize matching for ids with 'id' or 'field_id'
        def get_field_id(field):
            return field.get('id') or field.get('field_id')

        def get_is_available(field):
            # Accept 'is_available' or 'isAvailable'
            val = field.get('is_available')
            if val is None:
                val = field.get('isAvailable')
            return val

        def get_sport_id(field):
            val = field.get('sport_id')
            if val is None:
                val = field.get('sportId')
            return val

        # Assert available field is found
        assert any(get_field_id(f) == field_id_available for f in fields_list), "Available field not found in filtered list"

        # Assert all returned fields match filter criteria
        assert all(
            get_is_available(f) is True and
            get_sport_id(f) == sport_id
            for f in fields_list
        ), "Returned fields do not match filter criteria"

        # Assert unavailable field is not included
        assert all(get_field_id(f) != field_id_unavailable for f in fields_list), "Unavailable field found in filtered list"
        
    finally:
        # Cleanup: delete created fields
        if field_id_available is not None:
            requests.delete(f"{BASE_URL}/api/fields/{field_id_available}", timeout=TIMEOUT)
        if field_id_unavailable is not None:
            requests.delete(f"{BASE_URL}/api/fields/{field_id_unavailable}", timeout=TIMEOUT)
        # Cleanup: delete created sport
        if sport_id is not None:
            requests.delete(f"{BASE_URL}/api/sports/{sport_id}", timeout=TIMEOUT)

test_get_all_fields_with_availability_filter()
