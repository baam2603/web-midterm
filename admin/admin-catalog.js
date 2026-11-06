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
            editor.innerHTML = `<p><button type="button" class="tk-outline" data-editor-back>← Về danh sách khách sạn</button></p><h2>Chỉnh sửa ${esc(h.name)}</h2><form class="tk-form" id="admin-hotel-edit-form"><input type="hidden" name="id" value="${Number(h.id)}"><label>Tên khách sạn<input name="name" minlength="3" maxlength="150" required value="${esc(h.name)}"></label><label>Loại hình<select name="type">${["hotel", "resort", "homestay", "villa"].map((v) => `<option ${v === h.type ? "selected" : ""}>${v}</option>`).join("")}</select></label><label>Số sao<input name="stars" type="number" min="1" max="5" required value="${Number(h.stars)}"></label><label>Giá tham khảo/đêm<input name="price_per_night" type="number" min="100000" max="100000000" step="1" required value="${Number(h.price_per_night)}"></label><label>Mô tả<textarea name="description" maxlength="3000">${esc(h.description)}</textarea></label><p>Địa chỉ: ${esc(h.address)}. Mã khách sạn và liên kết đơn được giữ nguyên.</p><fieldset><legend>Cập nhật vị trí bằng Google Maps (không bắt buộc)</legend><input type="search" data-location-query placeholder="Tên khách sạn hoặc địa chỉ"><button type="button" class="tk-outline" data-location-search>Tìm trên Google Maps</button><input type="hidden" name="new_place_id"><div data-location-results role="status"></div><p data-location-selected></p><small>Chọn đúng khách sạn để thay địa chỉ và tọa độ cũ khi bấm Lưu.</small></fieldset><p role="status"></p><div class="tk-actions"><button type="submit" class="tk-primary">Lưu khách sạn</button><button type="button" data-cancel class="tk-outline">Hủy</button></div></form>`;
            const searchButton = editor.querySelector("[data-location-search]");
            let searchSerial = 0;
            searchButton.onclick = async () => {
              const serial = ++searchSerial,
                results = editor.querySelector("[data-location-results]");
              const query = editor
                .querySelector("[data-location-query]")
                .value.trim();
              if (query.length < 3) {
                results.textContent = "Nhập ít nhất 3 ký tự.";
                return;
              }
              searchButton.disabled = true;
              results.textContent = "Đang tìm...";
              editor.querySelector("[name=new_place_id]").value = "";
              try {
                const url = new URL(
                  "../api/admin/places-search.php",
                  location.href,
                );
                url.search = new URLSearchParams({
                  q: query,
                  city: h.city,
                  mode: "auto",
                });
                const r = await fetch(url, {
                    credentials: "same-origin",
                    cache: "no-store",
                  }),
                  j = await r.json();
                if (!r.ok) throw Error(j.message);
                if (serial !== searchSerial || !results.isConnected) return;
                results.replaceChildren();
                for (const p of j.data.places) {
                  const option = document.createElement("button");
                  option.type = "button";
                  option.className = "tk-outline";
                  option.textContent = p.name + " — " + p.address;
                  option.disabled = !p.canSelect;
                  option.onclick = () => {
                    editor.querySelector("[name=new_place_id]").value =
                      p.placeId;
                    editor.querySelector(
                      "[data-location-selected]",
                    ).textContent =
                      "Sẽ cập nhật vị trí: " + p.name + " — " + p.address;
                  };
                  results.append(option);
                }
                ThreeKMaps.credits(
                  results,
                  j.data.places.flatMap((p) => p.attributions || []),
                );
                if (!j.data.places.length)
                  results.textContent = "Không tìm thấy cơ sở lưu trú phù hợp.";
              } catch (e) {
                if (results.isConnected) results.textContent = e.message;
              } finally {
                if (searchButton.isConnected) searchButton.disabled = false;
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
