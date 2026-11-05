"""Local SMTP/STARTTLS integration. Docker + openssl; fake account, no Gmail requests."""
import email
import email.policy
import json
from pathlib import Path
import subprocess
import tempfile
import time
import uuid

ROOT = Path(__file__).resolve().parents[1]


def exercise(certdir, trusted=True, reject_auth=False, offer_tls=True):
    name = 'threek-smtp-fixture-' + uuid.uuid4().hex[:12]
    mounts = ['-v', f'{ROOT}:/app:ro', '-v', f'{certdir}:/mail-certs:ro']
    try:
        subprocess.run(['docker', 'run', '-d', '--name', name, *mounts,
                        '-e', 'OFFER_TLS=' + ('1' if offer_tls else '0'),
                        '-e', 'REJECT_AUTH=' + ('1' if reject_auth else '0'),
                        'web-midterm-php', 'php', '/app/tests/mail_smtp_fixture.php'],
                       check=True, stdout=subprocess.DEVNULL)
        for _ in range(50):
            logs = subprocess.check_output(['docker', 'logs', name], text=True)
            if 'ready' in logs:
                break
            time.sleep(.1)
        else:
            raise AssertionError('fixture did not start')
        args = ['docker', 'run', '--rm', '--network', 'container:' + name, *mounts]
        settings = {'MAIL_TRANSPORT': 'smtp', 'SMTP_HOST': 'localhost', 'SMTP_PORT': '2525',
                    'SMTP_ENCRYPTION': 'tls', 'SMTP_USERNAME': 'sender@example.invalid',
                    'SMTP_PASSWORD': 'fake-password-never-use', 'MAIL_FROM': 'sender@example.invalid'}
        for key, value in settings.items():
            args += ['-e', key + '=' + value]
        args += ['web-midterm-php', 'php']
        if trusted:
            args += ['-d', 'openssl.cafile=/mail-certs/cert.pem']
        args += ['/app/tests/mail_transport_send.php']
        result = subprocess.run(args, capture_output=True, text=True, timeout=50)
        subprocess.run(['docker', 'wait', name], check=True, stdout=subprocess.DEVNULL, timeout=35)
        logs = subprocess.check_output(['docker', 'logs', name], text=True)
        captured = json.loads(logs.strip().splitlines()[-1])
        assert 'error' not in captured, captured.get('error')
        for secret in ['fake-password-never-use', 'test-token', 'recipient@example.invalid']:
            assert secret not in result.stdout + result.stderr, 'sensitive output leaked'
        if trusted and not reject_auth and offer_tls:
            assert result.returncode == 0, result.stderr
            assert captured['tls'] and captured['auth']
            message = email.message_from_string(captured['body'], policy=email.policy.default)
            assert str(message['Subject']) == 'Khôi phục mật khẩu THREEK.COM'
            assert message['To'] == 'recipient@example.invalid'
            assert message['Message-ID'] == '<threek-mail-42@example.invalid>'
            assert 'test-token' in message.get_content()
            print('PASS verified STARTTLS, authentication, recipient, Unicode and HTML reset link', flush=True)
        else:
            assert result.returncode != 0 and 'SMTP' in result.stderr
            assert not captured['body'], 'failed transport delivered DATA'
            if not trusted or not offer_tls:
                assert not captured['auth'], 'credentials exposed without verified TLS'
            print('PASS rejection: ' + ('missing STARTTLS' if not offer_tls else 'untrusted certificate' if not trusted else 'authentication failure'), flush=True)
    finally:
        subprocess.run(['docker', 'rm', '-f', name], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


with tempfile.TemporaryDirectory(prefix='threek-smtp-') as temp:
    certdir = Path(temp)
    subprocess.run(['openssl', 'req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-days', '1',
                    '-keyout', str(certdir / 'key.pem'), '-out', str(certdir / 'cert.pem'),
                    '-subj', '/CN=localhost', '-addext', 'subjectAltName=DNS:localhost'],
                   check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    exercise(certdir)
    exercise(certdir, trusted=False)
    exercise(certdir, reject_auth=True)
    exercise(certdir, offer_tls=False)
