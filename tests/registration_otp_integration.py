"""Registration security against the disposable DB. Does not send external email."""
import http.cookiejar
import json
import secrets
import subprocess
import urllib.error
import urllib.request
from registration_helpers import test_sql as sql, read_registration_otp

URL = 'http://127.0.0.1:8001'
run = secrets.token_hex(6)
emails = []


def client():
    return urllib.request.build_opener(urllib.request.ProxyHandler({}), urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))


def call(c, endpoint, body=None, status=200, origin=None):
    headers = {'Content-Type': 'application/json'}
    if origin:
        headers['Origin'] = origin
    request = urllib.request.Request(URL + endpoint, data=None if body is None else json.dumps(body).encode(), headers=headers)
    try:
        response = c.open(request, timeout=20)
    except urllib.error.HTTPError as error:
        response = error
    with response:
        data = json.load(response)
        assert response.status == status, (endpoint, response.status, data)
        return data


def payload():
    email = f'otp-{run}-{len(emails)}@example.invalid'
    emails.append(email)
    return {'fullName': 'OTP Test', 'email': email, 'password': 'SecretFixture123', 'phone': '0900000000'}


try:
    sql('DELETE FROM registration_rate_limits')
    a, b = client(), client()
    p = payload()
    call(a, '/api/auth/register.php', p, 403, 'https://evil.invalid')
    pending = call(a, '/api/auth/register.php', p, 202)['data']
    assert pending['verificationRequired'] is True and 'user' not in pending and 'otp' not in pending
    challenge = pending['challenge']['id']
    otp = read_registration_otp(p['email'])
    assert len(otp) == 6 and otp.isdigit()
    assert sql(f"SELECT COUNT(*) FROM users WHERE email='{p['email']}'") == '0'
    assert sql(f"SET time_zone='+07:00';SELECT TIMESTAMPDIFF(SECOND,last_sent_at,expires_at) FROM registration_challenges WHERE email='{p['email']}'") == '300'
    assert sql(f"SELECT otp_hash FROM registration_challenges WHERE email='{p['email']}'") != otp
    call(a, '/api/account/profile.php', status=401)
    call(a, '/api/auth/login.php', {'email': p['email'], 'password': p['password']}, 401)
    print('PASS pending registration has no account/session; six-digit OTP is hashed and expires in five minutes')
    call(b, '/api/auth/register-verify.php', {'challengeId': challenge, 'otp': otp}, 403)
    assert call(a, '/api/auth/register-status.php')['data']['challenge']['id'] == challenge
    call(a, '/api/auth/register-resend.php', {'challengeId': challenge}, 429)
    call(a, '/api/auth/register-verify.php', {'challengeId': challenge, 'otp': 123456}, 422)
    wrong = '000000' if otp != '000000' else '111111'
    call(a, '/api/auth/register-verify.php', {'challengeId': challenge, 'otp': wrong}, 422)
    print('PASS session binding, reload status, resend cooldown and invalid-code rejection')
    oldMail = sql(f"SELECT mail_id FROM registration_challenges WHERE email='{p['email']}'")
    sql(f"SET time_zone='+07:00';UPDATE registration_challenges SET last_sent_at=DATE_SUB(NOW(),INTERVAL 61 SECOND) WHERE email='{p['email']}'")
    call(a, '/api/auth/register-resend.php', {'challengeId': challenge})
    assert sql(f'SELECT COUNT(*) FROM mail_outbox WHERE id={oldMail}') == '0'
    newOtp = read_registration_otp(p['email'])
    assert newOtp != otp
    call(a, '/api/auth/register-verify.php', {'challengeId': challenge, 'otp': otp}, 422)
    result = call(a, '/api/auth/register-verify.php', {'challengeId': challenge, 'otp': newOtp}, 201)
    assert result['data']['user']['role'] == 'customer'
    assert call(a, '/api/account/profile.php')['data']['user']['email'] == p['email']
    assert sql(f"SELECT COUNT(*) FROM registration_challenges WHERE email='{p['email']}' AND password_hash IS NULL AND otp_hash IS NULL AND full_name IS NULL") == '1'
    call(a, '/api/auth/register-verify.php', {'challengeId': challenge, 'otp': newOtp}, 403)
    call(a, '/api/auth/register.php', p, 409)
    print('PASS resend replaces queued code; correct OTP creates one account, scrubs pending data and cannot be replayed')

    p = payload(); c = client()
    challenge = call(c, '/api/auth/register.php', p, 202)['data']['challenge']['id']; otp = read_registration_otp(p['email'])
    sql(f"SET time_zone='+07:00';UPDATE registration_challenges SET expires_at=DATE_SUB(NOW(),INTERVAL 1 SECOND) WHERE email='{p['email']}'")
    call(c, '/api/auth/register-verify.php', {'challengeId': challenge, 'otp': otp}, 410)
    assert sql(f"SELECT COUNT(*) FROM users WHERE email='{p['email']}'") == '0'
    print('PASS expired OTP cannot create an account')

    p = payload(); c = client()
    challenge = call(c, '/api/auth/register.php', p, 202)['data']['challenge']['id']; otp = read_registration_otp(p['email'])
    wrong = '000000' if otp != '000000' else '111111'
    for i in range(5):
        call(c, '/api/auth/register-verify.php', {'challengeId': challenge, 'otp': wrong}, 429 if i == 4 else 422)
    call(c, '/api/auth/register-verify.php', {'challengeId': challenge, 'otp': otp}, 429)
    call(c, '/api/auth/register-resend.php', {'challengeId': challenge}, 429)
    call(client(), '/api/auth/register.php', p, 429)
    print('PASS five wrong attempts lock verification/resend/new-session restart for the email window')

    p = payload(); c = client()
    challenge = call(c, '/api/auth/register.php', p, 202)['data']['challenge']['id']
    for _ in range(2):
        sql(f"SET time_zone='+07:00';UPDATE registration_challenges SET last_sent_at=DATE_SUB(NOW(),INTERVAL 61 SECOND) WHERE email='{p['email']}'")
        call(c, '/api/auth/register-resend.php', {'challengeId': challenge})
    sql(f"SET time_zone='+07:00';UPDATE registration_challenges SET last_sent_at=DATE_SUB(NOW(),INTERVAL 61 SECOND) WHERE email='{p['email']}'")
    call(c, '/api/auth/register-resend.php', {'challengeId': challenge}, 429)
    print('PASS at most three OTP emails per email address in fifteen minutes')
    p = payload(); c = client()
    challenge = call(c, '/api/auth/register.php', p, 202)['data']['challenge']['id']
    sql(f"SET time_zone='+07:00';UPDATE registration_challenges SET window_started_at=DATE_SUB(NOW(),INTERVAL 14 MINUTE),last_sent_at=DATE_SUB(NOW(),INTERVAL 61 SECOND) WHERE email='{p['email']}'")
    call(c, '/api/auth/register-resend.php', {'challengeId': challenge})
    lateOtp = read_registration_otp(p['email'])
    sql(f"SET time_zone='+07:00';UPDATE registration_challenges SET window_started_at=DATE_SUB(NOW(),INTERVAL 16 MINUTE) WHERE email='{p['email']}'")
    call(c, '/api/auth/register-verify.php', {'challengeId': challenge, 'otp': lateOtp}, 201)
    print('PASS a fresh OTP remains valid when its original rate window ends')
    sql('UPDATE registration_rate_limits SET send_count=10')
    p = payload(); call(client(), '/api/auth/register.php', p, 429)
    assert sql(f"SELECT COUNT(*) FROM registration_challenges WHERE email='{p['email']}'") == '0'
    print('PASS IP rate limit prevents bulk sending without persisting a new registration')
    sql(f"SET time_zone='+07:00';INSERT INTO mail_outbox(recipient,subject,html_body,expires_at) VALUES('{p['email']}','Expired OTP fixture','never-deliver-this-code',DATE_SUB(NOW(),INTERVAL 1 SECOND))")
    fixtureId=sql(f"SELECT id FROM mail_outbox WHERE recipient='{p['email']}' ORDER BY id DESC LIMIT 1")
    worker=subprocess.run(['docker','exec','-e','MAIL_TRANSPORT=smtp','-e','SMTP_HOST=localhost','-e','SMTP_PORT=1','-e','SMTP_USERNAME=fixture@example.invalid','-e','SMTP_PASSWORD=fake-not-a-real-password','web-midterm-admin-web','php','/app/scripts/mail-worker.php'],capture_output=True,text=True,check=True)
    assert 'never-deliver-this-code' not in worker.stdout+worker.stderr
    assert sql(f"SELECT CONCAT(status,':',attempts,':',LENGTH(html_body)) FROM mail_outbox WHERE id={fixtureId}")=='failed:5:0'
    print('PASS mail worker discards expired OTP content instead of sending it')
finally:
    for address in emails:
        sql(f"DELETE FROM mail_outbox WHERE recipient='{address}';DELETE FROM registration_challenges WHERE email='{address}';DELETE FROM users WHERE email='{address}'")
    sql('DELETE FROM registration_rate_limits')
