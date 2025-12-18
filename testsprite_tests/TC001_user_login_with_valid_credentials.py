import requests

BASE_URL = "http://localhost:4000"
LOGIN_ENDPOINT = "/api/auth/login"
TIMEOUT = 30

def test_user_login_with_valid_credentials():
    url = BASE_URL + LOGIN_ENDPOINT
    headers = {
        "Content-Type": "application/json"
    }
    # Replace with valid credentials as needed
    payload = {
        "username": "validUser",
        "password": "validPassword123"
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Request to {url} failed with exception: {e}"

    # Expect HTTP 200 OK
    assert response.status_code == 200, f"Expected status 200 but got {response.status_code}"

    # Validate response content type is JSON (assuming it returns user info JSON)
    content_type = response.headers.get("Content-Type", "")
    assert "application/json" in content_type, f"Expected 'application/json' in Content-Type but got '{content_type}'"

    # Validate response JSON has expected fields (light verification)
    try:
        json_data = response.json()
    except ValueError:
        assert False, "Response body is not valid JSON"

    # Basic check for user info presence (not fully specified, so checking for username or id or token)
    assert isinstance(json_data, dict), "Response JSON is not an object"
    # The API doc doesn't specify response schema except description, so just check json is non-empty
    assert json_data, "Response JSON is empty"

    # Check that 'set-cookie' header exists with httpOnly and JWT presence indication
    set_cookie = response.headers.get("Set-Cookie", "")
    assert set_cookie, "Set-Cookie header is missing in response"
    assert "HttpOnly" in set_cookie, "Set-Cookie header missing HttpOnly flag"
    assert "jwt" in set_cookie.lower() or "token" in set_cookie.lower(), "Set-Cookie header does not appear to include JWT token"

test_user_login_with_valid_credentials()