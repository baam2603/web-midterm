"""Exercise DOM renderers with attacker-controlled stored and URL values."""
from playwright.sync_api import sync_playwright
BASE = 'http://127.0.0.1:8001'
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/chromium', headless=True, args=['--no-sandbox'])
    page = browser.new_page()
    page.route('**/*', lambda route: route.continue_() if route.request.url.startswith(BASE) else route.abort())
    page.goto(BASE + '/destinations/dalat.html', wait_until='domcontentloaded')
    page.locator('.hotel-card').first.wait_for()
    payload = '\"><img src=x onerror="window.domXss=1">'
    def poison(route):
        response = route.fetch()
        data = response.json()
        hotel = data['data'][0]
        hotel['slug'] = payload
        hotel['name'] = payload
        data['data'] = [hotel]
        route.fulfill(response=response, json=data)
    page.route('**/api/hotels/index.php?*', poison)
    page.reload(wait_until='networkidle')
    page.locator('.hotel-card').first.wait_for()
    page.wait_for_timeout(200)
    assert page.evaluate('window.domXss') is None
    assert page.locator('.hotel-card h3').first.inner_text() == payload
    assert page.locator('.hotel-card img[onerror]').count() == 0
    assert page.locator('.hotel-card').first.get_attribute('data-id') == payload
    page.goto(BASE + '/hotel/hotel.html?city=dalat&id=%3Cimg%20src=x%20onerror=window.domXss=1%3E', wait_until='networkidle')
    assert page.evaluate('window.domXss') is None
    assert page.locator('#hotel-root img').count() == 0
    browser.close()
print('PASS stored card attribute/text payloads and reflected hotel URL payload stay inert')
