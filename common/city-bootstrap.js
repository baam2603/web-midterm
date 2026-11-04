/* 3K Booking: khởi tạo trang thành phố từ UI demo + PHP/MySQL. */
(function () {
  "use strict";

  const tag = document.currentScript;
  const cityKey = tag?.dataset?.city;
  if (!tag?.src || !["dalat", "vungtau"].includes(cityKey)) {
    console.error(
      "[3K Booking] Thiếu hoặc sai data-city trên city-bootstrap.js",
    );
    return;
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.onload = resolve;
      script.onerror = () => reject(new Error("Không tải được " + src));
      document.head.appendChild(script);
    });
  }

  async function ensureCityData() {
    if (window.CITY_DATA?.[cityKey] && window.AMENITIES) return;

    // Cứu trường hợp trang HTML chưa nạp city-data.js đúng thứ tự.
    const path = new URL("city-data.js", tag.src).href;
    console.warn("[3K Booking] Đang tải lại dữ liệu UI từ:", path);
    await loadScript(path);

    if (!window.CITY_DATA?.[cityKey] || !window.AMENITIES) {
      throw new Error(
        "city-data.js đã tải nhưng không khai báo CITY_DATA/AMENITIES. " +
          "Hãy thay common/city-data.js bằng bản đã khôi phục.",
      );
    }

    // Nếu dữ liệu được khôi phục sau khi domain-store khởi chạy,
    // cập nhật lại những điều chỉnh catalog ở localStorage (demo).
    if (typeof window.ThreeKData?.applyCatalog === "function") {
      window.ThreeKData.applyCatalog();
    }
  }

  async function start() {
    try {
      await ensureCityData();
    } catch (error) {
      console.error("[3K Booking] Không thể tải dữ liệu thành phố:", error);
      return;
    }

    if (typeof window.initCityPage !== "function") {
      console.error("[3K Booking] Chưa tải city-page.js");
      return;
    }

    if (typeof window.HotelAPI?.loadCity === "function") {
      try {
        const hotels = await window.HotelAPI.loadCity(cityKey);
        console.info("[3K Booking] Đã lấy từ MySQL:", cityKey, hotels.length);
      } catch (error) {
        // Không hiển thị dữ liệu demo khi MySQL gặp sự cố.
        console.error("[3K Booking] Lỗi API danh sách:", error);
        window.CITY_DATA[cityKey].hotels = [];
        const note = document.createElement("p");
        note.className = "tk-api-error";
        note.style.cssText =
          "padding:12px;background:#fff3ee;color:#8b3021;border-radius:8px;margin-bottom:12px";
        note.textContent =
          "Không thể tải khách sạn từ hệ thống. Vui lòng thử tải lại trang.";
        document.querySelector(".results")?.prepend(note);
      }
    } else {
      console.error("[3K Booking] Thiếu common/hotels-api.js");
      window.CITY_DATA[cityKey].hotels = [];
      const note = document.createElement("p");
      note.className = "tk-api-error";
      note.textContent =
        "Không tải được danh sách khách sạn. Thiếu kết nối API.";
      document.querySelector(".results")?.prepend(note);
    }

    const ready = window.initCityPage(cityKey);
    if (!ready) console.error("[3K Booking] Khởi tạo trang thất bại:", cityKey);
  }

  start();
})();
