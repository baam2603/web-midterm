<?php

declare(strict_types=1);

// Compare complete origins; never trust forwarded headers supplied by a client.
function securityOrigin(string $url): ?string
{
    $p = parse_url($url);
    if (
        !is_array($p) || !isset($p['scheme'], $p['host']) ||
        !in_array(strtolower($p['scheme']), ['http', 'https'], true) ||
        isset($p['user']) || isset($p['pass']) || isset($p['query']) || isset($p['fragment']) ||
        (isset($p['path']) && $p['path'] !== '' && $p['path'] !== '/')
    ) return null;
    $scheme = strtolower($p['scheme']);
    $port = $p['port'] ?? ($scheme === 'https' ? 443 : 80);
    return $scheme . '://' . strtolower($p['host']) . ':' . $port;
}

function securityWriteFailure(): ?array
{
    // Reject browser requests from sibling subdomains too (SameSite alone does not).
    $site = strtolower($_SERVER['HTTP_SEC_FETCH_SITE'] ?? '');
    if ($site !== '' && !in_array($site, ['same-origin', 'none'], true))
        return [403, 'Nguồn yêu cầu không hợp lệ.'];
    $scheme = !empty($_SERVER['HTTPS']) &&
        strtolower($_SERVER['HTTPS']) !== 'off'
        ? 'https'
        : 'http';

    $requestHost = $_SERVER['HTTP_HOST'] ?? '';

    $expected = securityOrigin(
        $scheme . '://' . $requestHost
    );

    // Support the configured public HTTPS origin behind a proxy.
    $publicBase = getenv('APP_BASE_URL');

    if (is_string($publicBase) && $publicBase !== '') {
        $publicOrigin = securityOrigin($publicBase);

        $publicHost = parse_url($publicBase, PHP_URL_HOST);
        $incomingHost = parse_url(
            'http://' . $requestHost,
            PHP_URL_HOST
        );

        if (
            $publicOrigin !== null &&
            is_string($publicHost) &&
            is_string($incomingHost) &&
            strcasecmp($publicHost, $incomingHost) === 0
        ) {
            $expected = $publicOrigin;
        }
    }
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if ($origin !== '' && ($expected === null || securityOrigin($origin) !== $expected))
        return [403, 'Nguồn yêu cầu không hợp lệ.'];
    // JSON cannot be submitted by an HTML form. Cross-origin fetch requires a
    // preflight; these APIs intentionally never enable credentialed CORS.
    $type = strtolower(trim(explode(';', $_SERVER['CONTENT_TYPE'] ?? '')[0]));
    if ($type !== 'application/json') return [415, 'Yêu cầu application/json.'];
    return null;
}

header('X-Content-Type-Options: nosniff');
header("Content-Security-Policy: default-src 'none'; frame-ancestors 'none'; base-uri 'none'");
header('Referrer-Policy: strict-origin-when-cross-origin');
