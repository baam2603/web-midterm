/* Run with: node tests/smoke.js (no packages required). */
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const assert = require("node:assert/strict");
const { webcrypto } = require("node:crypto");
const root = path.resolve(__dirname, "..");
function storage() {
  let map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
    clear: () => map.clear(),
  };
}
function ctx() {
  const context = {
    localStorage: storage(),
    sessionStorage: storage(),
    console,
    TextEncoder,
    crypto: webcrypto,
    URL,
    URLSearchParams,
    Date,
    Event: class Event {
      constructor(type) {
        this.type = type;
      }
    },
    dispatchEvent() {},
  };
  context.window = context;
  vm.createContext(context);
  return context;
}
function load(context, file) {
  vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context, {
    filename: file,
  });
}
async function main() {
  const data = ctx();
  load(data, "common/city-data.js");
  load(data, "hotel/hotel-data.js");
  let count = 0;
  for (const [city, info] of Object.entries(data.CITY_DATA)) {
    for (const record of info.hotels) {
      count++;
      const d = vm.runInContext("HOTELS", data)[city][record.id];
      assert.ok(d, `missing ${city}/${record.id}`);
      assert.equal(d.name, record.name);
      assert.equal(d.priceFrom, record.price);
      assert.ok(d.rooms.length >= 2);
      assert.ok(d.rooms.some((r) => r.price === record.price));
      for (const file of [...d.images, ...d.rooms.map((r) => r.image)])
        assert.ok(
          fs.existsSync(path.join(root, "hotel", file)),
          `image not found ${file}`,
        );
    }
  }
  assert.equal(count, 16);
  console.log("PASS 16/16 hotel pages & local photos");
  const store = ctx();
  load(store, "common/booking-store.js");
  const B = store.BookingStore;
  assert.equal(
    B.availability(
      "dalat",
      "grand-mercure",
      "standard",
      "2026-11-20",
      "2026-11-22",
      3,
    ),
    3,
  );
  B.save({
    code: "TEST001",
    city: "dalat",
    hotelId: "grand-mercure",
    roomId: "standard",
    checkin: "2026-11-20",
    checkout: "2026-11-22",
    rooms: 2,
    status: "confirmed",
    refundable: true,
  });
  assert.equal(
    B.availability(
      "dalat",
      "grand-mercure",
      "standard",
      "2026-11-21",
      "2026-11-23",
      3,
    ),
    1,
  );
  assert.equal(
    B.availability(
      "dalat",
      "grand-mercure",
      "standard",
      "2026-11-22",
      "2026-11-24",
      3,
    ),
    3,
  );
  B.save({
    code: "TEST001",
    city: "dalat",
    hotelId: "grand-mercure",
    roomId: "standard",
    checkin: "2026-11-20",
    checkout: "2026-11-22",
    rooms: 2,
    status: "confirmed",
  });
  assert.equal(B.all().length, 1);
  B.cancel("TEST001");
  assert.equal(B.find("TEST001").status, "cancelled");
  assert.equal(
    B.availability(
      "dalat",
      "grand-mercure",
      "standard",
      "2026-11-21",
      "2026-11-23",
      3,
    ),
    3,
  );
  console.log("PASS booking persistence, overlap, idempotency & cancellation");
  const auth = ctx();
  load(auth, "common/auth-service.js");
  const u = await auth.registerUser({
    email: "test@test.com",
    password: "Pass12345",
    fullName: "Nguyễn Văn A",
  });
  assert.equal(u.email, "test@test.com");
  assert.equal(auth.getCurrentUser().name, "Nguyễn Văn A");
  assert.ok(
    !auth.localStorage.getItem("threek_demo_users_v1").includes("Pass12345"),
  );
  auth.logout();
  assert.equal(auth.getCurrentUser(), null);
  await assert.rejects(() => auth.loginUser("test@test.com", "wrong"));
  await auth.loginUser("test@test.com", "Pass12345");
  auth.updateProfile({
    fullName: "Nguyễn Văn B",
    displayName: "Văn B",
    phone: "0912345678",
  });
  assert.equal(auth.getCurrentUser().displayName, "Văn B");
  await auth.changePassword("Pass12345", "Newpass123");
  auth.logout();
  await assert.rejects(() => auth.loginUser("test@test.com", "Pass12345"));
  await auth.loginUser("test@test.com", "Newpass123");
  auth.deleteCurrentAccount();
  assert.equal(auth.getCurrentUser(), null);
  console.log(
    "PASS demo register / login / logout / edit profile / password / delete",
  );
  console.log(
    "OK: source-level MVP smoke suite completed. UI browser rendering requires a local browser.",
  );
}
main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
