import requests

BASE_URL = "http://localhost:4000"
LOGIN_ENDPOINT = f"{BASE_URL}/api/auth/login"
TIMEOUT = 30
HEADERS = {"Content-Type": "application/json"}


def test_user_login_with_missing_credentials():
    # Test cases with missing username or password fields
    test_payloads = [
        {},  # Missing both username and password
        {"username": "someuser"},  # Missing password
        {"password": "somepass"},  # Missing username
        {"username": ""},          # Empty username
        {"password": ""},          # Empty password
        {"username": "", "password": "somepass"},  # Empty username with password
        {"username": "someuser", "password": ""},  # Username with empty password
    ]

    for payload in test_payloads:
        try:
            response = requests.post(LOGIN_ENDPOINT, json=payload, headers=HEADERS, timeout=TIMEOUT)
        except requests.RequestException as e:
            assert False, f"Request failed: {e}"

        # The API should respond with status code 400 for missing credentials
        assert response.status_code == 400, f"Expected 400 status for payload {payload}, got {response.status_code}"


test_user_login_with_missing_credentials()