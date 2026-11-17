"""Regression checks against the disposable local test server."""
import json
import urllib.request
import urllib.error

BASE = 'http://127.0.0.1:8001'

def request(path, body, headers=None):
    req = urllib.request.Request(BASE + path, data=body, headers=headers or {}, method='POST')
    try:
        response = urllib.request.urlopen(req)
    except urllib.error.HTTPError as error:
        response = error
    return response.status, response.headers, json.load(response)

payload = json.dumps({'email': "' OR 1=1 --", 'password': 'wrong'}).encode()
for path in ['/api/auth/login.php', '/api/auth/register.php', '/api/auth/recovery.php', '/api/account/logout.php']:
    for origin in ['https://evil.invalid', 'null', 'https://127.0.0.1:8001', 'http://127.0.0.1', 'http://127.0.0.1:8001@evil.invalid']:
        status, _, _ = request(path, payload, {'Content-Type': 'application/json', 'Origin': origin})
        assert status == 403, (path, origin, status)
    status, _, _ = request(path, payload, {'Content-Type': 'application/json', 'Sec-Fetch-Site': 'same-site'})
    assert status == 403, (path, status)
    status, _, _ = request(path, b'email=test&password=test', {'Content-Type': 'application/x-www-form-urlencoded'})
    assert status == 415, (path, status)
print('PASS cross-origin, opaque origins, scheme/port changes, sibling sites and HTML forms rejected')

status, headers, result = request('/api/auth/login.php', payload, {'Content-Type': 'application/json', 'Origin': BASE, 'Sec-Fetch-Site': 'same-origin'})
assert status == 401, (status, result)
assert headers['X-Content-Type-Options'] == 'nosniff'
assert "default-src 'none'" in headers['Content-Security-Policy']
assert headers.get('Access-Control-Allow-Origin') is None
print('PASS SQL login payload cannot authenticate; API responses have restrictive CSP and nosniff')
for body in [b'null', b'[]', b'{"email":[],"password":{}}', b'invalid']:
    status, _, _ = request('/api/auth/login.php', body, {'Content-Type': 'application/json'})
    assert status == 400, (body, status)
print('PASS malformed login input returns controlled errors')
