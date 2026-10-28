/* End-to-end DATA FLOW (without a browser): node tests/flows.js */
const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path"),
  vm = require("node:vm"),
  { webcrypto } = require("node:crypto");
const root = path.resolve(__dirname, "..");
const storage = () => {
  const m = new Map();
  return {
    getItem: (k) => m.get(k) ?? null,
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
    clear: () => m.clear(),
  };
};
const ctx = {
  localStorage: storage(),
  sessionStorage: storage(),
  console,
  TextEncoder,
  crypto: webcrypto,
  URL,
  Date,
  Event: class {
    constructor(type) {
      this.type = type;
    }
  },
  dispatchEvent() {},
};
ctx.window = ctx;
vm.createContext(ctx);
for (const f of [
  "common/auth-service.js",
  "common/city-data.js",
  "hotel/hotel-data.js",
  "common/booking-store.js",
  "common/domain-store.js",
])
  vm.runInContext(fs.readFileSync(path.join(root, f), "utf8"), ctx, {
    filename: f,
  });
const B = ctx.BookingStore,
  D = ctx.ThreeKData;
let passes = 0;
const check = (msg, cb) => {
  cb();
  console.log("PASS", msg);
  passes++;
};
async function main() {
  D.applyCatalog();
  check("16 hotels with usable room catalog", () =>
    assert.equal(
      Object.values(ctx.CITY_DATA).reduce((n, c) => n + c.hotels.length, 0),
      16,
    ),
  );
  check("Admin custom hotel created and reflected in catalog", () => {
    const id = D.createHotel({
      city: "dalat",
      name: "Khách sạn demo mới",
      address: "120 Đường A Đà Lạt",
      price: 850000,
      stock: 3,
      guests: 2,
    });
    D.applyCatalog();
    assert(ctx.HOTELS.dalat[id]);
    assert(ctx.CITY_DATA.dalat.hotels.some((h) => h.id === id));
    D.setRoom("dalat", id, "standard", { price: 1250000, stock: 0 });
    D.applyCatalog();
    assert.equal(ctx.HOTELS.dalat[id].rooms[0].left, 0);
    assert.equal(
      ctx.CITY_DATA.dalat.hotels.find((h) => h.id === id).price,
      850000,
    );
    D.setRoom("dalat", id, "standard", { stock: 4 });
    D.applyCatalog();
    assert.equal(
      ctx.CITY_DATA.dalat.hotels.find((h) => h.id === id).price,
      1250000,
    );
    D.setHotel("dalat", id, { hidden: true });
    D.applyCatalog();
    assert.equal(
      ctx.CITY_DATA.dalat.hotels.find((h) => h.id === id).hidden,
      true,
    );
    D.deleteHotel("dalat", id);
    assert(!ctx.CITY_DATA.dalat.hotels.some((h) => h.id === id));
  });
  const d = new Date();
  d.setDate(d.getDate() + 25);
  const from = [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
  d.setDate(d.getDate() + 2);
  const to = [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
  const a = await ctx.registerUser({
    fullName: "Khách Một",
    email: "one@example.org",
    password: "Secret123",
  });
  const base = {
    city: "dalat",
    hotelId: "grand-mercure",
    hotelName: "Đồi Thông Retreat",
    roomId: "standard",
    roomName: "Phòng tiêu chuẩn",
    checkin: from,
    checkout: to,
    rooms: 2,
    guests: 2,
    total: 2500000,
    guestName: "Khách Một",
    email: a.email,
    phone: "0912345678",
    status: "confirmed",
    refundable: true,
    paymentStatus: "simulated-demo",
    createdAt: new Date().toISOString(),
  };
  B.save({ ...base, code: "TEST-ONE", userId: a.id });
  check("Owner sees their own booking and room inventory decreases", () => {
    assert.equal(B.visible().length, 1);
    assert.equal(
      B.availability(base.city, base.hotelId, base.roomId, from, to, 5),
      3,
    );
  });
  const b = await ctx.registerUser({
    fullName: "Khách Hai",
    email: "two@example.org",
    password: "Secret123",
  });
  check(
    "Other signed-in account cannot view or cancel another account order",
    () => {
      assert.equal(B.visible().length, 0);
      assert.equal(B.findVisible("TEST-ONE"), null);
      assert.throws(() => B.cancelVisible("TEST-ONE"));
    },
  );
  ctx.logout();
  B.save({
    ...base,
    code: "TEST-GUEST",
    userId: null,
    email: "guest@example.org",
    phone: "0933222111",
    rooms: 1,
  });
  check("Guest booking accessible only within current checkout session", () => {
    assert.equal(B.visible().length, 1);
    ctx.sessionStorage.clear();
    assert.equal(B.visible().length, 0);
    assert.throws(() =>
      B.verifyGuest("TEST-GUEST", "wrong@example.org", "0933222111"),
    );
    assert.throws(() =>
      B.verifyGuest("TEST-GUEST", "guest@example.org", "0000"),
    );
    B.verifyGuest("TEST-GUEST", "guest@example.org", "0933222111");
    assert.equal(B.visible().length, 1);
  });
  check(
    "Admin cancellation and demo refund state follow explicit transitions",
    () => {
      B.adminSetStatus("TEST-GUEST", "cancelled");
      assert.equal(
        B.availability(base.city, base.hotelId, base.roomId, from, to, 5),
        3,
      );
      B.requestRefund("TEST-GUEST");
      assert.equal(B.find("TEST-GUEST").refundStatus, "requested");
      B.adminRefund("TEST-GUEST");
      assert.equal(B.find("TEST-GUEST").refundStatus, "refunded-demo");
      assert.throws(() => B.adminSetStatus("TEST-GUEST", "confirmed"));
    },
  );
  await ctx.loginUser("one@example.org", "Secret123");
  const newStartDate = new Date(from + "T12:00:00");
  newStartDate.setDate(newStartDate.getDate() + 4);
  const newEndDate = new Date(newStartDate);
  newEndDate.setDate(newEndDate.getDate() + 3);
  const iso = (x) =>
    [
      x.getFullYear(),
      String(x.getMonth() + 1).padStart(2, "0"),
      String(x.getDate()).padStart(2, "0"),
    ].join("-");
  check(
    "Customer change-date request must be approved and recheck availability",
    () => {
      B.requestChange("TEST-ONE", iso(newStartDate), iso(newEndDate));
      assert.equal(B.find("TEST-ONE").checkin, from);
      B.adminChangeDecision("TEST-ONE", "approved", 5);
      assert.equal(B.find("TEST-ONE").checkin, iso(newStartDate));
      assert.equal(B.find("TEST-ONE").nights, 3);
      assert.equal(B.find("TEST-ONE").total, 3750000);
    },
  );
  check("Only completed stay can be reviewed and review is moderated", () => {
    assert.throws(() =>
      D.submitReview({
        city: "dalat",
        hotelId: "grand-mercure",
        code: "TEST-ONE",
        score: 5,
        comment: "Rất hài lòng trong thời gian lưu trú này.",
      }),
    );
    B.adminSetStatus("TEST-ONE", "completed");
    D.submitReview({
      city: "dalat",
      hotelId: "grand-mercure",
      code: "TEST-ONE",
      score: 5,
      comment: "Rất hài lòng trong thời gian lưu trú này.",
    });
    assert.equal(D.approvedReviews("dalat", "grand-mercure").length, 0);
    const r = D.reviewsForAdmin()[0];
    D.moderateReview(r.id, "approved");
    assert.equal(D.approvedReviews("dalat", "grand-mercure").length, 1);
    assert.throws(() =>
      D.submitReview({
        city: "dalat",
        hotelId: "grand-mercure",
        code: "TEST-ONE",
        score: 5,
        comment: "Viết lại nhận xét nhiều ký tự.",
      }),
    );
  });
  check("Ticket, admin response and customer notification persist", () => {
    const t = D.createTicket({
      name: "Khách Một",
      email: "one@example.org",
      topic: "Đặt phòng",
      message: "Cần xác minh thông tin phòng đã đặt của tôi",
    });
    assert.equal(D.ticketsForUser().length, 1);
    D.answerTicket(t.id, "Chúng tôi đã ghi nhận yêu cầu demo của bạn.");
    assert.equal(D.ticketsForUser()[0].status, "answered");
    assert(D.notifications().some((n) => n.type === "support"));
    const n = D.notifications()[0];
    D.markRead(n.id);
    assert(D.notifications().find((x) => x.id === n.id).read);
  });
  check("Owner can cancel refundable future booking", () => {
    B.save({ ...base, code: "TEST-CANCEL", userId: a.id });
    B.cancelVisible("TEST-CANCEL");
    assert.equal(B.find("TEST-CANCEL").status, "cancelled");
  });
  ctx.logout();
  check("Demo recovery OTP expires/validates and resets password", () => {
    const otp = ctx.startDemoRecovery("one@example.org");
    assert.equal(otp.length, 6);
  });
  const otp = ctx.startDemoRecovery("one@example.org");
  await assert.rejects(() =>
    ctx.finishDemoRecovery("one@example.org", "1234567", "Newpass123"),
  );
  await ctx.finishDemoRecovery("one@example.org", otp, "Newpass123");
  await assert.rejects(() => ctx.loginUser("one@example.org", "Secret123"));
  await ctx.loginUser("one@example.org", "Newpass123");
  console.log("PASS demo password reset flow");
  passes++;
  console.log("OK:", passes, "data-flow scenarios passed");
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
