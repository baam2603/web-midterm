(() => {
  "use strict";
  const esc = (x) =>
    String(x ?? "").replace(
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
  const fold = (x) =>
    String(x)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .toLowerCase();
  async function post(path, body) {
    const t = await fetch("../api/admin/csrf.php", {
      credentials: "same-origin",
      cache: "no-store",
    });
    const token = await t.json();
    if (!t.ok || !token.data?.csrfToken)
      throw Error(token.message || "Phiên đăng nhập không hợp lệ.");
    const r = await fetch(path, {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": token.data.csrfToken,
      },
      body: JSON.stringify(body),
    });
    const j = await r.json();
    if (!r.ok || j.status !== "success")
      throw Error(j.message || "Không thể lưu dữ liệu.");
    return j.data;
  }
  const queries = new Map();
  function mount(root, tab, hotels, onSaved) {
    if (!["hotels", "rooms"].includes(tab)) return;
    const tables = [...root.querySelectorAll(".tk-tablewrap")];
    tables.forEach((w) => {
      const label = document.createElement("label");
      label.className = "tk-form";
      label.textContent =
        tab === "hotels"
          ? "Tìm khách sạn theo tên, thành phố, địa chỉ"
          : "Tìm loại phòng theo tên khách sạn, tên phòng hoặc mã";
      const input = document.createElement("input");
      input.type = "search";
      input.placeholder = "Nhập từ khóa để lọc danh sách...";
      input.maxLength = 100;
      label.append(input);
      w.before(label);
      input.value = queries.get(tab) || "";
      input.oninput = () => {
        queries.set(tab, input.value);
        const q = fold(input.value.trim());
        w.querySelectorAll("tbody tr").forEach(
          (r) => (r.hidden = !fold(r.textContent).includes(q)),
        );
      };
      input.oninput();
    });
    if (tab === "hotels") {
      const editor = document.createElement("section");
      editor.className = "tk-surface";
      editor.hidden = true;
      editor.id = "admin-hotel-editor";
      root.prepend(editor);
      root.querySelectorAll("[data-hotel-edit-db]").forEach(
        (button) =>
          (button.onclick = () => {
            const h = hotels.find(
              (x) => Number(x.id) === Number(button.dataset.hotelEditDb),
            );
            if (!h) return;
            editor.hidden = false;
            editor.innerHTML = `<p><button type="button" class="tk-outline" data-editor-back>← Về danh sách khách sạn</button></p><h2>Chỉnh sửa ${esc(h.name)}</h2><form class="tk-form" id="admin-hotel-edit-form"><input type="hidden" name="id" value="${Number(h.id)}"><label>Tên khách sạn<input name="name" minlength="3" maxlength="150" required value="${esc(h.name)}"></label><label>Loại hình<select name="type">${["hotel", "resort", "homestay", "villa"].map((v) => `<option ${v === h.type ? "selected" : ""}>${v}</option>`).join("")}</select></label><label>Số sao<input name="stars" type="number" min="1" max="5" required value="${Number(h.stars)}"></label><label>Giá tham khảo/đêm<input name="price_per_night" type="number" min="100000" max="100000000" step="1" required value="${Number(h.price_per_night)}"></label><label>Mô tả<textarea name="description" maxlength="3000">${esc(h.description)}</textarea></label><p>Địa chỉ: ${esc(h.address)}. Mã khách sạn và liên kết đơn được giữ nguyên.</p><fieldset><legend>Vị trí khách sạn</legend><label>Cập nhật vị trí<select name="location_mode" data-edit-location><option value="keep">Giữ vị trí hiện tại</option><option value="manual">Chọn/nhập lại vị trí thủ công</option></select></label><div data-edit-location-fields hidden><p>Vị trí do quản trị viên xác nhận; không gán mã khách sạn OSM.</p><label>Địa chỉ<input name="address" maxlength="255" value="${esc(h.address)}"></label><label>Vĩ độ<input type="number" name="latitude" step="any" value="${esc(h.latitude ?? "")}"></label><label>Kinh độ<input type="number" name="longitude" step="any" value="${esc(h.longitude ?? "")}"></label><div data-edit-map style="height:260px"></div><label class="tk-location-confirm"><input type="checkbox" name="location_confirmed"><span>Tôi đã kiểm tra đúng địa chỉ và vị trí khách sạn</span></label></div></fieldset><p role="status"></p><div class="tk-actions"><button type="submit" class="tk-primary">Lưu khách sạn</button><button type="button" data-cancel class="tk-outline">Hủy</button></div></form>`;
            const locationForm = editor.querySelector("form");
            let editMap = null,
              editPin = null;
            locationForm.querySelector("[data-edit-location]").onchange =
              async (event) => {
                const manual = event.target.value === "manual",
                  fields = locationForm.querySelector(
                    "[data-edit-location-fields]",
                  );
                fields.hidden = !manual;
                for (const key of [
                  "address",
                  "latitude",
                  "longitude",
                  "location_confirmed",
                ])
                  locationForm.elements[key].required = manual;
                locationForm.elements.location_confirmed.checked = false;
                if (!manual) return;
                try {
                  const L = await ThreeKOSM.load();
                  if (!fields.isConnected) return;
                  const fallback =
                    h.city === "vungtau"
                      ? [10.346, 107.0843]
                      : [11.9404, 108.4583];
                  const lat = Number(locationForm.elements.latitude.value),
                    lng = Number(locationForm.elements.longitude.value);
                  const initial =
                    locationForm.elements.latitude.value !== "" &&
                    locationForm.elements.longitude.value !== "" &&
                    Number.isFinite(lat) &&
                    Number.isFinite(lng)
                      ? [lat, lng]
                      : fallback;
                  if (!editMap) {
                    editMap = ThreeKOSM.map(
                      fields.querySelector("[data-edit-map]"),
                      initial,
                      15,
                      L,
                    );
                    editPin = L.marker(initial, { draggable: true }).addTo(
                      editMap,
                    );
                    const setPoint = (p) => {
                      locationForm.elements.latitude.value = p.lat.toFixed(7);
                      locationForm.elements.longitude.value = p.lng.toFixed(7);
                      locationForm.elements.location_confirmed.checked = false;
                      editPin.setLatLng(p);
                    };
                    editMap.on("click", (e) => setPoint(e.latlng));
                    editPin.on("dragend", () => setPoint(editPin.getLatLng()));
                    locationForm.addEventListener("input", (e) => {
                      if (
                        ["address", "name", "latitude", "longitude"].includes(
                          e.target.name,
                        )
                      )
                        locationForm.elements.location_confirmed.checked = false;
                      if (!["latitude", "longitude"].includes(e.target.name))
                        return;
                      const a = locationForm.elements.latitude.value,
                        b = locationForm.elements.longitude.value,
                        x = Number(a),
                        y = Number(b);
                      if (
                        a !== "" &&
                        b !== "" &&
                        Number.isFinite(x) &&
                        Number.isFinite(y) &&
                        Math.abs(x) <= 90 &&
                        Math.abs(y) <= 180
                      ) {
                        editPin.setLatLng([x, y]);
                        editMap.setView([x, y], 16);
                      }
                      locationForm.elements.location_confirmed.checked = false;
                    });
                  }
                  setTimeout(() => editMap?.invalidateSize(), 30);
                } catch (e) {
                  locationForm.querySelector("[role=status]").textContent =
                    e.message;
                }
              };
            const closeEditor = () => {
              const form = editor.querySelector("form");
              if (
                form.dataset.original !==
                  JSON.stringify([...new FormData(form)]) &&
                !confirm("Bạn có thay đổi chưa lưu. Rời phần chỉnh sửa?")
              )
                return;
              editor.hidden = true;
              button.focus();
              button.scrollIntoView({ block: "center" });
            };
            const form = editor.querySelector("form");
            form.dataset.original = JSON.stringify([...new FormData(form)]);
            editor.querySelector("[data-cancel]").onclick = closeEditor;
            editor.querySelector("[data-editor-back]").onclick = closeEditor;
            editor.querySelector("form").onsubmit = async (e) => {
              e.preventDefault();
              const f = e.target,
                button = f.querySelector("[type=submit]");
              if (!f.reportValidity()) return;
              button.disabled = true;
              try {
                const v = Object.fromEntries(new FormData(f));
                v.location_confirmed = f.elements.location_confirmed.checked;
                for (const k of ["id", "stars", "price_per_night"])
                  v[k] = Number(v[k]);
                await post("../api/admin/hotels-update.php", v);
                await onSaved();
              } catch (e) {
                f.querySelector("[role=status]").textContent = e.message;
              } finally {
                if (button.isConnected) button.disabled = false;
              }
            };
            editor.scrollIntoView({ block: "start" });
            editor.querySelector("[name=name]").focus();
          }),
      );
    }
    root
      .querySelectorAll("#tk-upload-hotel-image,#tk-upload-room-image")
      .forEach((form) => {
        const gallery = document.createElement("div");
        gallery.className = "tk-media-gallery";
        form.after(gallery);
        let serial = 0;
        const load = async () => {
          const current = ++serial;
          const id = Number(form.elements.item_id.value),
            kind = form.elements.kind.value;
          if (!id) {
            gallery.replaceChildren();
            return;
          }
          gallery.textContent = "Đang tải ảnh...";
          try {
            const url = new URL("../api/admin/media.php", location.href);
            url.search = new URLSearchParams({ kind, id });
            const r = await fetch(url, {
              credentials: "same-origin",
              cache: "no-store",
            });
            const j = await r.json();
            if (current !== serial || !gallery.isConnected) return;
            if (!r.ok || j.status !== "success")
              throw Error(j.message || "Không tải được ảnh.");
            gallery.innerHTML =
              j.data
                .map((image) => {
                  const p = String(image.image_path);
                  const safe =
                    /^(sources|uploads)\/[A-Za-z0-9_./-]+$/.test(p) &&
                    !p.includes("..");
                  return `<article class="tk-surface">${safe ? `<img src="../${esc(p)}" alt="Ảnh ${esc(kind === "hotel" ? "khách sạn" : "phòng")}" loading="lazy" style="width:140px;height:100px;object-fit:cover">` : ""}<p>${Number(image.is_cover) ? "Ảnh bìa" : ""}</p><button type="button" class="tk-outline" data-media-id="${Number(image.id)}" data-media-action="cover">Đặt ảnh bìa</button> <button type="button" class="tk-danger" data-media-id="${Number(image.id)}" data-media-action="delete">Xóa ảnh</button></article>`;
                })
                .join("") || "<p>Chưa có ảnh.</p>";
            gallery.querySelectorAll("[data-media-id]").forEach(
              (b) =>
                (b.onclick = async () => {
                  if (
                    b.dataset.mediaAction === "delete" &&
                    !confirm("Xóa ảnh này?")
                  )
                    return;
                  b.disabled = true;
                  try {
                    await post("../api/admin/media.php", {
                      kind,
                      item_id: id,
                      id: Number(b.dataset.mediaId),
                      action: b.dataset.mediaAction,
                    });
                    await load();
                  } catch (e) {
                    const p = document.createElement("p");
                    p.textContent = e.message;
                    gallery.prepend(p);
                  } finally {
                    if (b.isConnected) b.disabled = false;
                  }
                }),
            );
          } catch (e) {
            if (current === serial) gallery.textContent = e.message;
          }
        };
        form.elements.item_id.addEventListener("change", load);
        form.addEventListener("admin:media-upload", load);
        load();
      });
  }
  window.AdminCatalog = { mount };
})();
