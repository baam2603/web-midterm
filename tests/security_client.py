"""CSRF setup for test HTTP clients; never bypasses server protection."""
import http.cookiejar,json,urllib.request
def protected_headers(client, base, headers=None):
 if not any(isinstance(h,urllib.request.HTTPCookieProcessor) for h in client.handlers):
  client.add_handler(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
 with client.open(base+'/api/auth/csrf.php',timeout=15) as response:
  token=json.load(response)['data']['csrfToken']
 return {'Content-Type':'application/json','X-CSRF-Token':token,**(headers or {})}
