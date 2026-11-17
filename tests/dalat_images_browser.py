"""Read-only checks after importing demo_hotels_ready.sql and dalat_images.sql.
Uses the disposable local runtime on port 8001; no provider requests.
"""
import json
import urllib.request
from playwright.sync_api import sync_playwright

URL = 'http://127.0.0.1:8001'
with urllib.request.urlopen(URL + '/api/hotels/index.php?city=dalat') as r:
    hotels = json.load(r)['data']
hotels = [h for h in hotels if str(h.get('cover_image', '')).startswith('hotel_images/')]
assert len(hotels) == 10, len(hotels)
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/chromium', headless=True, args=['--no-sandbox'])
    context = browser.new_context(reduced_motion='reduce')
    context.route('**/*', lambda r: r.continue_() if r.request.url.startswith(URL) else r.abort())
    page = context.new_page()
    page.set_default_timeout(15000)
    page.goto(URL + '/destinations/dalat.html', wait_until='domcontentloaded')
    page.wait_for_function("document.querySelectorAll('.hotel-card img').length === 10")
    for image in page.locator('.hotel-card img').all():
        image.scroll_into_view_if_needed()
        image.evaluate("i => i.loading = 'eager'")
        page.wait_for_function("i => i.complete && i.naturalWidth > 0", arg=image.element_handle())
    print('PASS all 10 Dalat list covers load')
    for hotel in hotels:
        with urllib.request.urlopen(URL + '/api/hotels/detail.php?slug=' + hotel['slug']) as r:
            data = json.load(r)['data']
        images = [i for i in data['hotel']['images'] if i['image_path'].startswith('hotel_images/')]
        assert len(images) == 5, hotel['slug']
        assert sum(i['is_cover'] for i in images) == 1, hotel['slug']
        assert len(data['rooms']) == 3
        assert all(any(i.startswith('hotel_images/') for i in r['images']) for r in data['rooms']), hotel['slug']
        page.goto(URL + '/hotel/hotel.html?city=dalat&id=' + hotel['slug'], wait_until='domcontentloaded')
        page.wait_for_function("document.querySelectorAll('#gallery img').length === 5")
        for image in page.locator('#gallery img, .room img').all():
            image.evaluate("i => i.loading = 'eager'")
            page.wait_for_function("i => i.complete && i.naturalWidth > 0", arg=image.element_handle())
        assert page.locator('.room img').count() == 3
        # Opening the lightbox must also load a real full image.
        page.locator('#gallery [data-index="0"]').click()
        page.wait_for_function("Array.from(document.images).filter(i => i.src.includes('hotel_images/')).every(i => i.complete && i.naturalWidth > 0)")
        print('PASS gallery/3 room photos/lightbox:', hotel['slug'])
    # Small screens retain a loaded gallery and room images.
    page.set_viewport_size({'width': 390, 'height': 844})
    page.goto(URL + '/hotel/hotel.html?city=dalat&id=cicilia-rouge-dalat', wait_until='domcontentloaded')
    page.wait_for_function("document.querySelectorAll('.room img').length === 3")
    for image in page.locator('.room img').all():
        image.evaluate("i => i.loading = 'eager'")
        page.wait_for_function("i => i.complete && i.naturalWidth > 0", arg=image.element_handle())
    print('PASS mobile room photos, including filenames with spaces')
    browser.close()
