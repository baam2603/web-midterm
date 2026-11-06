from pathlib import Path
SDK=(Path(__file__).parent/'fixtures/google-maps-sdk.js').read_text()
def route_with_google(url):
 def route(r):
  if r.request.url.startswith('https://maps.googleapis.com/maps/api/js?'):r.fulfill(status=200,content_type='application/javascript',body=SDK)
  elif r.request.url.startswith(url):r.continue_()
  else:r.abort()
 return route
