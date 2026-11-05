"""Run real PHP from /3kbooking_midterm/, matching a local XAMPP subdirectory.
Only the dedicated test web container is stopped temporarily and restored in finally.
"""
import os,subprocess,secrets,time,urllib.request
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];WEB='web-midterm-admin-web';name='web-midterm-subdir-'+secrets.token_hex(6)
base='http://127.0.0.1:8001/3kbooking_midterm'
def docker(*args):return subprocess.run(['docker',*args],check=True,stdout=subprocess.DEVNULL)
# Refuse to interfere if the expected dedicated test server is not running.
state=subprocess.check_output(['docker','inspect','--format','{{.State.Running}}',WEB],text=True).strip()
if state!='true':raise RuntimeError('Start the dedicated test environment first')
try:
 docker('stop',WEB)
 docker('run','-d','--name',name,'--network','container:web-midterm-admin-db','-v',str(ROOT)+':/app/3kbooking_midterm:ro','-v',str(ROOT/'uploads')+':/app/3kbooking_midterm/uploads','-e','ONLINE_PAYMENTS_ENABLED=false','-e','RESEND_API_KEY=test-only-not-a-real-key','-e','MAIL_FROM=test@example.invalid','web-midterm-php','php','-d','display_errors=Off','-S','0.0.0.0:8000','-t','/app')
 ready=False;http=urllib.request.build_opener(urllib.request.ProxyHandler({}))
 for _ in range(50):
  try:
   with http.open(base+'/api/setup-status.php',timeout=2) as response:
    import json;assert json.load(response)['data']['ready'];ready=True;break
  except Exception:time.sleep(.1)
 if not ready:raise RuntimeError('Subdirectory test server did not become ready')
 subprocess.run(['python3',str(ROOT/'tests/session_integration.py')],env={**os.environ,'SESSION_TEST_URL':base,'SESSION_TEST_WEB':name,'SESSION_TEST_ROOT':'/app/3kbooking_midterm'},cwd=ROOT,check=True)
 subprocess.run(['python3',str(ROOT/'tests/customer_browser.py')],env={**os.environ,'CUSTOMER_TEST_URL':base,'CUSTOMER_TEST_OFFLINE':'1'},cwd=ROOT,check=True)
 print('PASS real project-subdirectory deployment and offline booking workflow')
finally:
 subprocess.run(['docker','rm','-f',name],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
 docker('start',WEB)
