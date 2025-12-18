import requests

BASE_URL = "http://localhost:4000"
LOGIN_ENDPOINT = "/api/auth/login"
TIMEOUT = 30

def test_user_login_with_invalid_credentials():
    url = BASE_URL + LOGIN_ENDPOINT
    headers = {"Content-Type": "application/json"}
    payload = {
        "username": "invalid_user",
        "password": "wrong_password"
    }
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"
    assert response.status_code == 401, f"Expected status code 401, got {response.status_code}"
    # Optionally check response content for error message if any
    try:
        data = response.json()
    except ValueError:
        data = None
    # The API spec doesn't provide exact error JSON, so no further checks here

test_user_login_with_invalid_credentials()