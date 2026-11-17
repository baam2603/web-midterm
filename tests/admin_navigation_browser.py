"""Admin/customer navigation against the disposable Docker runtime only."""
import secrets
from playwright.sync_api import sync_playwright
from registration_helpers import register_test_user, test_sql as sql

URL = 'http://127.0.0.1:8001'
run = secrets.token_hex(6)
password = 'NavigationTest123!'
users = []
try:
    for role in ['admin', 'customer']:
        email = f'navigation-{run}-{role}@example.invalid'
        register_test_user({'fullName': 'Navigation Test', 'email': email, 'password': password})
        uid = int(sql(f"SELECT id FROM users WHERE email='{email}'"))
        users.append((uid, email, role))
        if role == 'admin':
            sql(f"UPDATE users SET role='admin' WHERE id={uid}")
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path='/usr/bin/chromium', headless=True, args=['--no-sandbox'])
        for width in [390, 1280]:
            context = browser.new_context(viewport={'width': width, 'height': 850}, reduced_motion='reduce')
            context.route('**/*', lambda r: r.continue_() if r.request.url.startswith(URL) else r.abort())
            page = context.new_page()
            page.set_default_timeout(15000)
            page.goto(URL + '/auth/login.html', wait_until='domcontentloaded')
            page.locator('#email').fill(users[0][1])
            page.locator('#password').fill(password)
            page.locator('[type=submit]').click()
            page.wait_for_url('**/admin/index.html')
            page.get_by_role('link', name='← Website khách hàng').click()
            page.wait_for_url('**/index1.html')
            page.locator('#avatarBtn').click()
            page.get_by_role('menuitem', name='Trang quản trị').click()
            page.wait_for_url('**/admin/index.html')
            assert context.request.get(URL + '/api/admin/me.php').status == 200
            # Cookies work even when the optional UI cache is empty.
            page.evaluate('localStorage.clear()')
            page.goto(URL + '/destinations/dalat.html', wait_until='domcontentloaded')
            page.locator('#avatarBtn').click()
            page.get_by_role('menuitem', name='Trang quản trị').click()
            page.wait_for_url('**/admin/index.html')
            print(f'PASS admin → customer → admin; empty cache and nested page; viewport {width}')
            context.close()
        # A forged cached role must not display the shortcut or grant API access.
        context = browser.new_context(reduced_motion='reduce')
        context.route('**/*', lambda r: r.continue_() if r.request.url.startswith(URL) else r.abort())
        assert context.request.post(URL + '/api/auth/login.php', data={'email': users[1][1], 'password': password}).ok
        page = context.new_page()
        page.goto(URL + '/index1.html', wait_until='domcontentloaded')
        page.wait_for_function("getCurrentUser()?.role === 'customer'")
        assert page.locator('#admin-dashboard-link').is_hidden()
        page.evaluate("setSession({...getCurrentUser(), role: 'admin'})")
        page.wait_for_function("getCurrentUser()?.role === 'admin'")
        assert context.request.get(URL + '/api/admin/me.php').status == 403
        page.wait_for_timeout(300)
        assert page.locator('#admin-dashboard-link').is_hidden()
        page.evaluate('logout()')
        assert page.locator('#admin-dashboard-link').is_hidden()
        assert page.locator('#profile-actions').is_hidden()
        print('PASS customer/forged cache/logout do not expose admin navigation')
        context.close()
        browser.close()
finally:
    if users:
        sql('DELETE FROM users WHERE id IN (' + ','.join(str(u[0]) for u in users) + ')')
