#!/bin/sh
# Disposable test runtime. Requires Docker; never points at the development database.
set -eu
repo_dir=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
if ! docker image inspect web-midterm-php >/dev/null 2>&1; then
 docker build -t web-midterm-php -f "$repo_dir/scripts/php.Dockerfile" "$repo_dir"
fi
if ! docker container inspect web-midterm-admin-db >/dev/null 2>&1; then
 docker run -d --name web-midterm-admin-db -p 127.0.0.1:8001:8000 \
  -e MARIADB_ALLOW_EMPTY_ROOT_PASSWORD=1 -e MARIADB_DATABASE=threek_booking \
  mariadb:10.11 --port=3308 --bind-address=127.0.0.1
else
 docker start web-midterm-admin-db >/dev/null
fi
attempt=0
until docker exec web-midterm-admin-db mariadb-admin -h127.0.0.1 --port=3308 -uroot ping --silent >/dev/null 2>&1; do
 attempt=$((attempt+1)); [ "$attempt" -lt 60 ] || exit 1
 sleep 1
done
if [ "$(docker exec web-midterm-admin-db mariadb -uroot -N -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='threek_booking' AND table_name='hotels'")" = 0 ]; then
 docker exec -i web-midterm-admin-db mariadb -uroot threek_booking < "$repo_dir/database/schema.sql"
 docker exec -i web-midterm-admin-db mariadb -uroot threek_booking < "$repo_dir/database/seed.sql"
fi
docker exec -i web-midterm-admin-db mariadb -uroot threek_booking < "$repo_dir/database/admin_migration.sql"
docker exec -i web-midterm-admin-db mariadb -uroot threek_booking < "$repo_dir/database/customer_migration.sql"
docker exec -i web-midterm-admin-db mariadb -uroot threek_booking < "$repo_dir/database/registration_otp_migration.sql"
docker exec -i web-midterm-admin-db mariadb -uroot threek_booking < "$repo_dir/database/account_closure_migration.sql"
docker exec -i web-midterm-admin-db mariadb -uroot threek_booking < "$repo_dir/database/google_maps_migration.sql"
# Recreate only the dedicated test web container so proxy/CA and fixture settings stay current.
if docker container inspect web-midterm-admin-web >/dev/null 2>&1; then docker rm -f web-midterm-admin-web >/dev/null; fi
mkdir -p "$repo_dir/uploads"
docker run -d --name web-midterm-admin-web --network container:web-midterm-admin-db \
 -v "$repo_dir:/app:ro" -v "$repo_dir/uploads:/app/uploads" \
 -e APP_ENV=test -e GOOGLE_PLACES_API_KEY=test-only-places-key \
 -e GOOGLE_MAPS_BROWSER_KEY=test-only-browser-key -e GOOGLE_PLACES_TEST_ENDPOINT=http://127.0.0.1:8004/v1 \
 -e ONLINE_PAYMENTS_ENABLED=true -e VNPAY_TMN_CODE=TESTONLY \
 -e VNPAY_HASH_SECRET=integration-test-key-not-for-production \
 -e APP_BASE_URL=https://example.invalid -e RESEND_API_KEY=test-only-not-a-real-key \
 -e MAIL_FROM=test@example.invalid web-midterm-php php -d display_errors=Off \
 -d upload_max_filesize=5M -d post_max_size=6M -S 0.0.0.0:8000 -t /app
# Separate fixture process survives the subdirectory suite stopping/restarting the test web.
if docker container inspect web-midterm-admin-google-fixture >/dev/null 2>&1; then docker rm -f web-midterm-admin-google-fixture >/dev/null; fi
docker run -d --name web-midterm-admin-google-fixture --network container:web-midterm-admin-db \
 -v "$repo_dir:/app:ro" web-midterm-php php -S 127.0.0.1:8004 /app/tests/fixtures/google-places-router.php
attempt=0
until curl -fsS http://127.0.0.1:8001/api/db-check.php | python3 -c 'import json,sys; assert json.load(sys.stdin)["status"]=="success"'; do
 attempt=$((attempt+1)); [ "$attempt" -lt 30 ] || exit 1
 sleep 1
done
