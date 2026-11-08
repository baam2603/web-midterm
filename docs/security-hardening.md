# Security hardening

Based on main cf1759c. Run `npm run test:prepare` and `npm run test:security`
against the disposable Docker database. Never run fixture tests against production.

- Customer writes, account writes and login share one request guard. It compares
  scheme, host and effective port, rejects opaque/foreign Origins and cross-site
  or sibling-site Fetch Metadata, and requires application/json. Requests without
  browser headers remain usable by API clients; HTML forms cannot send JSON and
  cross-origin JavaScript cannot send it without a successful CORS preflight.
  Do not enable credentialed CORS for these endpoints. Login no longer accepts forms.
- Admin writes keep session-bound random CSRF tokens, including multipart uploads.
  Session cookies retain HttpOnly, SameSite=Lax, and Secure on HTTPS.
- API responses send nosniff and a restrictive CSP. This CSP covers PHP API
  responses, not static HTML documents. Deploy HTTPS and configure the web server
  to prevent execution of uploaded files. TLS termination must set HTTPS correctly;
  do not blindly trust client-controlled forwarded headers.
- HTML renderers escape hotel IDs, photo classes, icon text and room areas, and
  convert capacity to numbers. Existing review/name/contact output escaping remains.
  User text is stored as text and encoded at output, rather than deleting markup.
- PDO native prepared statements remain enabled. Review and admin pagination now
  bind LIMIT/OFFSET values, and admin page input is bounded. Dynamic SQL identifiers
  are selected by server-side section/kind mappings, never by raw user identifiers.
- VNPay IPN remains a signed provider GET callback, verified by its existing HMAC
  and transaction checks; browser CSRF rules do not replace provider authentication.

Regression coverage includes login SQL payloads, malformed credentials, origin
scheme/port/userinfo attacks, HTML forms, sibling sites, DOM attribute/text injection,
URL payloads, and an actual stored review XSS test in Chromium. This is regression
coverage, not a guarantee against all future vulnerabilities.
