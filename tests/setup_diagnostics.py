"""A partial SQL import must return actionable JSON, never an unhandled profile 500."""
import subprocess,json,secrets
DB='web-midterm-admin-db';WEB='web-midterm-admin-web';name='auth_legacy_'+secrets.token_hex(6)
def sql(q):subprocess.run(['docker','exec','-i',DB,'mariadb','-uroot'],input=q.encode(),check=True,stdout=subprocess.DEVNULL)
def php(code):
 subprocess.run(['docker','exec','-i',WEB,'sh','-c','cat > /tmp/'+name+'.php'],input='<?php\n'+code,text=True,check=True)
 result=subprocess.run(['docker','exec','-e','DB_NAME='+name,WEB,'php','/tmp/'+name+'.php'],capture_output=True,text=True)
 try:return json.loads(result.stdout)
 except Exception:raise AssertionError('Expected structured JSON for setup failure: '+result.stderr[:250])
sql(f'CREATE DATABASE {name} CHARACTER SET utf8mb4;')
try:
 sql(f"CREATE TABLE {name}.users LIKE threek_booking.users;ALTER TABLE {name}.users DROP COLUMN session_version;INSERT INTO {name}.users(email,password_hash,full_name,role) VALUES('legacy-test@example.invalid','test-not-used-for-login','Legacy Test','customer');")
 profile=php('$_SERVER["REQUEST_METHOD"]="GET"; require "/app/api/config/database.php";session_start();$_SESSION["user"]=["id"=>1];$_SESSION["version"]=1;require "/app/api/account/profile.php";')
 assert profile['status']=='error' and profile['code']=='database_upgrade_required',profile
 assert 'customer_migration.sql' in profile['message'];print('PASS missing session_version returns actionable JSON instead of a profile crash')
 status=php('$_SERVER["REQUEST_METHOD"]="GET";require "/app/api/setup-status.php";')['data']
 assert status['databaseConnected'] and not status['ready'] and 'users.session_version' in status['missing'];print('PASS setup check identifies incomplete SQL migration without reading user data')
finally:
 sql(f'DROP DATABASE {name};')
 subprocess.run(['docker','exec',WEB,'rm','-f','/tmp/'+name+'.php'],check=True)
