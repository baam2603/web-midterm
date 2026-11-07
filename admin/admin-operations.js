/* Server-backed operations. No administrative state is stored in localStorage. */
(() => {
  "use strict";
  const sections = [
    "bookings",
    "payments",
    "calendar",
    "reviews",
    "support",
    "audit",
  ];
  const labels = {
    paid: "Đã thanh toán",
    failed: "Thất bại",
    review: "Cần đối soát",
    refund_requested: "Chờ hoàn tiền",
    refunded: "Đã hoàn tiền",
    pending: "Chờ xác nhận",
    confirmed: "Đã xác nhận",
    checked_in: "Đang lưu trú",
    completed: "Hoàn tất",
    cancelled: "Đã hủy",
    open: "Chờ phản hồi",
    answered: "Đã phản hồi",
    closed: "Đã đóng",
  };
  const names = {
    bookings: "Quản lý đặt phòng",
    payments: "Đối soát thanh toán VNPay",
    calendar: "Tồn phòng theo ngày",
    reviews: "Quản lý bình luận và đánh giá",
    support: "Yêu cầu hỗ trợ",
    audit: "Nhật ký quản trị",
  };
  const esc = (value) =>
    String(value ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  const money = (n) => Number(n).toLocaleString("vi-VN") + "₫";
  let sequence = 0,
    controller = null;
  const state = {};
  const table = (heads, rows) =>
    `<div class="tk-surface tk-tablewrap"><table class="tk-table"><thead><tr>${heads.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows || `<tr><td colspan="${heads.length}">Chưa có dữ liệu phù hợp.</td></tr>`}</tbody></table></div>`;
  async function request(section, params = {}, body, signal) {
    const url = new URL(
      section === "payments"
        ? "../api/admin/payments.php"
        : "../api/admin/operations.php",
      location.href,
    );
    url.search = new URLSearchParams({ section, ...params });
    const options = { credentials: "same-origin", cache: "no-store", signal };
    if (body) {
      const token = await fetch(
        new URL("../api/admin/csrf.php", location.href),
        { credentials: "same-origin", cache: "no-store", signal },
      );
      const json = await token.json();
      if (!token.ok || !json.data?.csrfToken)
        throw Error(json.message || "Không lấy được phiên bảo vệ.");
      Object.assign(options, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": json.data.csrfToken,
        },
        body: JSON.stringify(body),
      });
    }
    const response = await fetch(url, options);
    const json = await response.json().catch(() => null);
    if (!response.ok || json?.status !== "success")
      throw Error(
        json?.message ||
          `Lỗi máy chủ (${response.status}). Hãy kiểm tra kết nối và migration SQL.`,
      );
    return json.data;
  }
  function actions(b) {
    const next = {
      pending: ["confirmed", "cancelled"],
      confirmed: ["checked_in", "cancelled"],
      checked_in: ["completed"],
    };
    return (next[b.status] || [])
      .map(
        (status) =>
          `<button type="button" class="${status === "cancelled" ? "tk-danger" : "tk-outline"}" data-op-id="${Number(b.id)}" data-op-status="${status}">${labels[status]}</button>`,
      )
      .join(" ");
  }
  function rows(section, items) {
    if (section === "payments")
      return table(
        [
          "Đơn / khách",
          "Số tiền",
          "Trạng thái",
          "Giao dịch VNPay",
          "Đối soát / hoàn tiền",
        ],
        items
          .map(
            (p) =>
              `<tr><td>${esc(p.code)}<br>${esc(p.guestName)}</td><td>${money(p.amount)}</td><td>${esc(labels[p.status] || p.status)}</td><td>${esc(p.provider_transaction || "—")}</td><td>${["review", "refund_requested"].includes(p.status) ? `<form data-op-refund="${Number(p.id)}" class="tk-form"><p>Chỉ ghi nhận sau khi đã hoàn tiền thật trên cổng merchant VNPay. Thao tác này không chuyển tiền.</p><input name="reference" minlength="5" maxlength="120" placeholder="Mã giao dịch hoàn tiền" required><button type="submit" class="tk-outline">Ghi nhận đã hoàn tiền</button></form>` : esc(p.refund_reference || "—")}</td></tr>`,
          )
          .join(""),
      );
    if (section === "bookings")
      return table(
        [
          "Mã đơn / khách",
          "Khách sạn / phòng",
          "Ngày lưu trú",
          "Số lượng",
          "Tổng tiền",
          "Trạng thái / thao tác",
        ],
        items
          .map(
            (b) =>
              `<tr><td><strong>${esc(b.code)}</strong><br>${esc(b.guestName)}<br>${esc(b.email)}<br>${esc(b.phone)}</td><td>${esc(b.hotelName)}<br>${esc(b.roomName)}</td><td>${esc(b.checkin)} → ${esc(b.checkout)}</td><td>${Number(b.rooms)} phòng / ${Number(b.guests)} khách</td><td>${money(b.total)}</td><td>${esc(labels[b.status] || b.status)}<p>${esc({ paid: "Đã thanh toán", unpaid: "Chưa thanh toán", failed: "Thanh toán lỗi", expired: "Hết hạn thanh toán", refund_requested: "Chờ hoàn tiền", refunded: "Đã hoàn tiền", paid_requires_review: "Cần đối soát" }[b.payment_status] || "")}</p><div class="tk-actions">${actions(b)}</div><button class="tk-outline" data-op-detail="${Number(b.id)}">Chi tiết</button></td></tr>`,
          )
          .join(""),
      );
    if (section === "calendar")
      return table(
        [
          "Khách sạn",
          "Loại phòng",
          "Tổng phòng",
          "Số phòng bị chiếm cao nhất",
          "Còn có thể đặt",
          "Trạng thái",
        ],
        items
          .map(
            (r) =>
              `<tr><td>${esc(r.hotelName)}</td><td>${esc(r.name)}</td><td>${Number(r.total_rooms)}</td><td>${Number(r.occupied)}</td><td>${Number(r.available)}</td><td>${Number(r.is_active) && Number(r.hotel_active) ? "Đang bán" : "Ngừng bán"}</td></tr>`,
          )
          .join(""),
      );
    if (section === "reviews")
      return table(
        ["Người đánh giá", "Khách sạn", "Đánh giá", "Thao tác"],
        items.map((r) => `<tr><td>${esc(r.author)}<br><small>${esc(r.created_at)}</small></td><td>${esc(r.hotelName)}</td><td>${Number(r.score)}/5<p>${r.comment}</p>${r.status === "rejected" ? "<small>Đã ẩn trước đây</small>" : ""}</td><td><button class="tk-outline" type="button" data-op-review-delete="${Number(r.id)}">Xóa đánh giá</button></td></tr>`).join(""),
      );
    if (section === "support")
      return (
        items
          .map(
            (t) =>
              `<article class="tk-surface"><h3>#${Number(t.id)} · ${esc(t.topic)}</h3><p>${esc(t.name)} · ${esc(t.email)} · ${esc(labels[t.status])}</p><p>${esc(t.message)}</p>${t.booking_code ? `<p>Mã đơn: ${esc(t.booking_code)}</p>` : ""}<form class="tk-form" data-op-reply="${Number(t.id)}"><label>Phản hồi<textarea name="reply" minlength="5" maxlength="3000" required>${esc(t.reply)}</textarea></label><label>Trạng thái<select name="status"><option value="answered">Đã phản hồi</option><option value="closed" ${t.status === "closed" ? "selected" : ""}>Đóng yêu cầu</option></select></label><button type="submit" class="tk-primary">Lưu phản hồi</button></form></article>`,
          )
          .join("") || "<p>Chưa có yêu cầu phù hợp.</p>"
      );
    return table(
      ["Thời gian", "Người thao tác", "Hành động", "Đối tượng", "Nội dung"],
      items
        .map(
          (a) =>
            `<tr><td>${esc(a.created_at)}</td><td>${esc(a.actor)}</td><td>${esc(a.action)}</td><td>${esc(a.entity_type)} #${esc(a.entity_id)}</td><td><code>${esc(a.details_json)}</code></td></tr>`,
        )
        .join(""),
    );
  }
  async function mount(root, section, onChanged) {
    if (!sections.includes(section)) return;
    controller?.abort();
    controller = new AbortController();
    const signal = controller.signal;
    const ticket = ++sequence;
    const s = (state[section] ??= { page: 1, q: "", status: "" });
    const current = () =>
      ticket === sequence &&
      root.isConnected &&
      root.dataset.operation === section;
    root.dataset.operation = section;
    const statuses = {
      payments: [
        "pending",
        "paid",
        "failed",
        "review",
        "refund_requested",
        "refunded",
      ],
      bookings: [
        "pending",
        "confirmed",
        "checked_in",
        "completed",
        "cancelled",
      ],
      reviews: [],
      support: ["open", "answered", "closed"],
      audit: [],
    };
    const today = new Date().toLocaleDateString("en-CA", {
      timeZone: "Asia/Ho_Chi_Minh",
    });
    s.from ??= today;
    s.to ??= new Date(Date.parse(today + "T00:00:00Z") + 86400000)
      .toISOString()
      .slice(0, 10);
    root.innerHTML = `<section class="tk-surface"><h2>${names[section]}</h2><form id="admin-op-filter" class="tk-form">${section === "calendar" ? `<div class="tk-flexcols"><label>Nhận phòng<input type="date" name="from" value="${esc(s.from)}" required></label><label>Trả phòng<input type="date" name="to" value="${esc(s.to)}" required></label></div>` : `<label>Tìm kiếm<input name="q" type="search" maxlength="100" value="${esc(s.q)}" placeholder="Mã đơn, tên khách hoặc nội dung..."></label>${statuses[section].length ? `<label>Trạng thái<select name="status"><option value="">Tất cả</option>${statuses[section].map((x) => `<option value="${x}" ${s.status === x ? "selected" : ""}>${labels[x]}</option>`).join("")}</select></label>` : ""}`}<button class="tk-outline" type="submit">${section === "calendar" ? "Xem tồn phòng" : "Tìm / Làm mới"}</button></form><p id="admin-op-message" role="status">Đang tải dữ liệu...</p></section><div id="admin-op-detail"></div><div id="admin-op-results"></div><div id="admin-op-pages" class="tk-actions"></div>`;
    const message = root.querySelector("#admin-op-message");
    root.querySelector("#admin-op-filter").onsubmit = (e) => {
      e.preventDefault();
      Object.assign(s, Object.fromEntries(new FormData(e.target)), { page: 1 });
      mount(root, section, onChanged);
    };
    try {
      const data = await request(
        section,
        section === "calendar"
          ? { from: s.from, to: s.to }
          : { page: s.page, q: s.q, status: s.status },
        null,
        signal,
      );
      if (!current()) return;
      root.querySelector("#admin-op-results").innerHTML = rows(
        section,
        data.items,
      );
      message.textContent =
        section === "calendar"
          ? "Số phòng còn trống áp dụng cho toàn bộ khoảng lưu trú đã chọn."
          : `${data.total} kết quả · Trang ${data.page}/${Math.max(1, Math.ceil(data.total / data.pageSize))}`;
      if (section !== "calendar")
        root.querySelector("#admin-op-pages").innerHTML =
          `<button class="tk-outline" data-op-page="${s.page - 1}" ${s.page <= 1 ? "disabled" : ""}>← Trước</button><button class="tk-outline" data-op-page="${s.page + 1}" ${s.page * data.pageSize >= data.total ? "disabled" : ""}>Sau →</button>`;
      root.querySelectorAll("[data-op-page]").forEach(
        (b) =>
          (b.onclick = () => {
            s.page = Number(b.dataset.opPage);
            mount(root, section, onChanged);
          }),
      );
      root.querySelectorAll("[data-op-detail]").forEach(
        (b) =>
          (b.onclick = () => {
            const item = data.items.find(
              (x) => Number(x.id) === Number(b.dataset.opDetail),
            );
            root.querySelector("#admin-op-detail").innerHTML =
              `<article class="tk-surface"><h3>Chi tiết ${esc(item.code)}</h3><p>${esc(item.guestName)} · ${esc(item.email)} · ${esc(item.phone)}</p><p>${esc(item.hotelName)} / ${esc(item.roomName)}</p><p>${esc(item.checkin)} → ${esc(item.checkout)} · ${Number(item.rooms)} phòng · ${Number(item.guests)} khách</p><p>Tạo lúc ${esc(item.created_at)} · Hoàn tất: ${esc(item.completed_at || "—")}</p><p>Yêu cầu đặc biệt: ${esc(item.guest_note || "Không có")}</p><p>Tổng tiền đã chốt: ${money(item.total)}</p></article>`;
          }),
      );
      const save = async (button, body) => {
        button.disabled = true;
        try {
          await request(section, {}, body, signal);
          if (!current()) return;
          await onChanged?.();
          if (current()) await mount(root, section, onChanged);
        } catch (e) {
          if (e.name !== "AbortError" && current()) {
            message.textContent = e.message;
            message.setAttribute("role", "alert");
          }
        } finally {
          if (button.isConnected) button.disabled = false;
        }
      };
      root.querySelectorAll("[data-op-review-delete]").forEach((button) => {
        button.onclick = () => {
          if (confirm("Xóa đánh giá này? Không thể khôi phục sau khi xóa.")) {
            save(button, { id: Number(button.dataset.opReviewDelete), action: "delete" });
          }
        };
      });
      root.querySelectorAll("[data-op-id]").forEach(
        (b) =>
          (b.onclick = () => {
            if (confirm(`Xác nhận thao tác: ${labels[b.dataset.opStatus]}?`))
              save(b, {
                id: Number(b.dataset.opId),
                status: b.dataset.opStatus,
              });
          }),
      );
      root.querySelectorAll("[data-op-refund]").forEach(
        (f) =>
          (f.onsubmit = (e) => {
            e.preventDefault();
            if (
              f.reportValidity() &&
              confirm(
                "Bạn đã hoàn tiền thật trên cổng merchant và có mã tham chiếu?",
              )
            )
              save(f.querySelector("button"), {
                id: Number(f.dataset.opRefund),
                reference: f.elements.reference.value,
              });
          }),
      );
      root.querySelectorAll("[data-op-reply]").forEach(
        (f) =>
          (f.onsubmit = (e) => {
            e.preventDefault();
            if (f.reportValidity())
              save(f.querySelector("button"), {
                id: Number(f.dataset.opReply),
                ...Object.fromEntries(new FormData(f)),
              });
          }),
      );
    } catch (e) {
      if (e.name !== "AbortError" && current()) {
        message.textContent = e.message;
        message.setAttribute("role", "alert");
      }
    }
  }
  window.AdminOperations = {
    mount,
    has: (section) => sections.includes(section),
    cancel() {
      sequence++;
      controller?.abort();
    },
  };
})();
