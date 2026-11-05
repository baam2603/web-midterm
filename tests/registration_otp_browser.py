"""Real desktop/mobile OTP popup; queue access is only to the isolated fixture DB."""
import secrets
from pathlib import Path
from playwright.sync_api import sync_playwright
from registration_helpers import test_sql as sql, read_registration_otp

URL = 'http://127.0.0.1:8001'
run = secrets.token_hex(6)
emails = []
try:
    sql('DELETE FROM registration_rate_limits')
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path='/usr/bin/chromium', headless=True, args=['--no-sandbox'])
        for width in [1280, 360]:
            address = f'otp-ui-{run}-{width}@example.invalid';emails.append(address)
            context = browser.new_context(viewport={'width': width, 'height': 800}, reduced_motion='reduce')
            context.route('**/*', lambda r: r.continue_() if r.request.url.startswith(URL) else r.abort())
            page = context.new_page();page.set_default_timeout(15000);errors=[]
            page.on('pageerror', lambda e: errors.append(str(e)))
            page.goto(URL + '/auth/register.html?next=/info/policies.html?from=otp', wait_until='domcontentloaded')
            for selector, value in [('#text_ho','OTP'),('#text_ten','Browser'),('#email',address),('#text','0900000000'),('#password','FixturePassword123'),('#confirm_password','FixturePassword123')]:
                page.locator(selector).fill(value)
            for selector,value in [('#day-select','1'),('#month-select','1'),('#year-select','2000'),('#gender-select','male')]:
                page.locator(selector).select_option(value)
            page.locator('form.needs-validation [type=submit]').click()
            dialog=page.locator('#registration-otp-dialog');dialog.wait_for(state='visible')
            assert page.locator('#registration-otp-email').inner_text() == address
            assert page.locator('#registration-otp-resend').is_disabled()
            assert sql(f"SELECT COUNT(*) FROM users WHERE email='{address}'") == '0'
            assert context.request.get(URL+'/api/account/profile.php').status == 401
            box=dialog.bounding_box();assert box['x']>=0 and box['x']+box['width']<=width+1
            assert page.locator('#registration-otp-code').evaluate('(el)=>el===document.activeElement')
            code = read_registration_otp(address)
            assert code not in dialog.inner_text(), 'OTP exposed in popup'
            page.reload(wait_until='domcontentloaded');dialog.wait_for(state='visible')
            assert page.locator('#registration-otp-email').inner_text() == address
            wrong='000000' if code!='000000' else '111111'
            page.locator('#registration-otp-code').fill(wrong);page.locator('#registration-otp-verify').click()
            page.locator('#registration-otp-feedback').filter(has_text='không đúng').wait_for()
            assert sql(f"SELECT COUNT(*) FROM users WHERE email='{address}'") == '0'
            if width==360:
                page.screenshot(path='/tmp/web-midterm-registration-otp-mobile.png', full_page=True)
            page.locator('#registration-otp-code').fill(code);page.locator('#registration-otp-verify').click()
            page.wait_for_url(URL + '/info/policies.html?from=otp')
            profile=context.request.get(URL+'/api/account/profile.php')
            assert profile.status==200,(profile.status,profile.json())
            assert profile.json()['data']['user']['email']==address
            assert not errors,errors
            context.close()
            print(f'PASS {width}px: modal, focus, cooldown, resume, wrong code, verified account and return URL')
        browser.close()
finally:
    for address in emails:
        sql(f"DELETE FROM mail_outbox WHERE recipient='{address}';DELETE FROM registration_challenges WHERE email='{address}';DELETE FROM users WHERE email='{address}'")
    sql('DELETE FROM registration_rate_limits')
