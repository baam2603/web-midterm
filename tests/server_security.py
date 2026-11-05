"""Test Apache .htaccess using dummy files only; no PHP source or real credentials mounted."""
import os,shutil,subprocess,tempfile,time,urllib.request,urllib.error
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
http=urllib.request.build_opener(urllib.request.ProxyHandler({}));name='threek-security-apache-'+str(os.getpid())
def get(path):
 try:r=http.open('http://127.0.0.1:8002'+path,timeout=5)
 except urllib.error.HTTPError as e:r=e
 with r:return r.status,r.headers,r.read()
with tempfile.TemporaryDirectory(prefix='threek-apache-',dir='/tmp') as temp:
 fixture=Path(temp);fixture.chmod(0o755)
 for directory in ['', 'database','tests','scripts','docs','api/config','api/shared','uploads']:
  path=fixture/directory;path.mkdir(parents=True,exist_ok=True)
  config=ROOT/directory/'.htaccess'
  if config.exists():shutil.copyfile(config,path/'.htaccess')
  (path/'sample.txt').write_text('dummy fixture')
 (fixture/'.apache-test.conf').write_text('''LoadModule rewrite_module modules/mod_rewrite.so
<Directory "/usr/local/apache2/htdocs">
AllowOverride All
Require all granted
</Directory>
''')
 (fixture/'index.html').write_text('<!doctype html><title>Security fixture</title>')
 (fixture/'.env').write_text('DUMMY_ONLY=1');(fixture/'dump.sql').write_text('-- dummy only')
 (fixture/'uploads'/'blocked.PHP').write_text('dummy only')
 (fixture/'uploads'/'image.png').write_bytes(b'dummy-image')
 for path in fixture.rglob('*'):
  path.chmod(0o755 if path.is_dir() else 0o644)
 try:
  subprocess.run(['docker','run','-d','--name',name,'-p','127.0.0.1:8002:80','-v',str(fixture)+':/usr/local/apache2/htdocs:ro','httpd:2.4','httpd-foreground','-c','Include /usr/local/apache2/htdocs/.apache-test.conf'],check=True,stdout=subprocess.DEVNULL)
  for _ in range(50):
   try:
    status,headers,_=get('/')
    if status==200:break
    raise AssertionError(('Apache fixture',status))
   except (urllib.error.URLError,ConnectionError):time.sleep(.1)
  else:raise AssertionError('Apache not ready')
  assert headers['X-Frame-Options']=='DENY' and headers['X-Content-Type-Options']=='nosniff'
  csp=headers['Content-Security-Policy'];assert "frame-ancestors 'none'" in csp and "object-src 'none'" in csp
  for path in ['/.env','/dump.sql','/database/sample.txt','/tests/sample.txt','/scripts/sample.txt','/docs/sample.txt','/api/config/sample.txt','/api/shared/sample.txt','/uploads/blocked.PHP']:
   assert get(path)[0]==403,path
  assert get('/uploads/image.png')[0]==200
  assert "sandbox" in get('/uploads/image.png')[1]['Content-Security-Policy']
  print('PASS real Apache: headers/CSP, private files denied, upload execution denied, images served')
 except Exception:
  subprocess.run(['docker','logs',name],check=False)
  raise
 finally:
  subprocess.run(['docker','rm','-f',name],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
