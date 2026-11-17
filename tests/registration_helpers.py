"""Fixtures for the isolated Docker DB: exercise real OTP APIs; never use on hosting."""
import http.cookiejar
import json
import re
import subprocess
import urllib.request

DB = 'web-midterm-admin-db'


def test_sql(query):
    return subprocess.check_output(['docker', 'exec', '-i', DB, 'mariadb', '-uroot', '-N', 'threek_booking'], input=query.encode()).decode().strip()


def read_registration_otp(email):
    quoted = email.replace("'", "''")
    html = test_sql(f"SELECT html_body FROM mail_outbox WHERE recipient='{quoted}' AND subject='Mã xác minh đăng ký THREEK.COM' ORDER BY id DESC LIMIT 1")
    match = re.search(r'<strong>([0-9]{6})</strong>', html)
    assert match, 'no OTP in isolated test mail queue'
    return match.group(1)


def register_test_user(payload, url='http://127.0.0.1:8001', client=None):
    # Suites creating many unrelated fixtures must not consume one another's IP budget.
    # Dedicated registration tests exercise the rate limits without this helper.
    test_sql('DELETE FROM registration_rate_limits')
    if client is None:
        client = urllib.request.build_opener(urllib.request.ProxyHandler({}), urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
    def post(endpoint, body, status):
        req = urllib.request.Request(url + endpoint, data=json.dumps(body).encode(), headers={'Content-Type': 'application/json'})
        with client.open(req) as response:
            data = json.load(response)
            assert response.status == status, (endpoint, response.status, data)
            return data, response.headers
    pending, _ = post('/api/auth/register.php', payload, 202)
    otp = read_registration_otp(payload['email'])
    result = post('/api/auth/register-verify.php', {'challengeId': pending['data']['challenge']['id'], 'otp': otp}, 201)
    quoted = payload['email'].replace("'", "''")
    test_sql(f"DELETE FROM registration_challenges WHERE email='{quoted}';DELETE FROM registration_rate_limits")
    return result
