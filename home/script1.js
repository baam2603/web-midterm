(function () {
  "use strict";

  const split = document.getElementById("split");
  const panels = Array.from(document.querySelectorAll(".panel"));
  const toast = document.getElementById("toast");

  const canHover = window.matchMedia(
    "(hover: hover) and (pointer: fine)",
  ).matches;
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  let toastTimer = null;
  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
  }

  if (canHover) {
    panels.forEach((panel) => {
      panel.addEventListener("mouseenter", () => {
        split.classList.add("has-active");
        panels.forEach((p) => p.classList.toggle("is-active", p === panel));
      });
    });
    split.addEventListener("mouseleave", () => {
      split.classList.remove("has-active");
      panels.forEach((p) => p.classList.remove("is-active"));
    });
  }

  function selectDestination(panel) {
    const dest = panel.dataset.dest || "điểm đến này";
    showToast(`Đang chuyển đến trang đặt phòng ${dest}…`);
    location.href = panel.classList.contains("panel--vungtau")
      ? route("vungtau")
      : route("dalat");
  }

  panels.forEach((panel) => {
    panel.addEventListener("click", (e) => {
      if (!e.target.closest(".cta")) selectDestination(panel);
    });

    panel.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
        e.preventDefault();
        selectDestination(panel);
      }
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault();
        const idx = panels.indexOf(panel);
        const nextIdx =
          e.key === "ArrowRight"
            ? (idx + 1) % panels.length
            : (idx - 1 + panels.length) % panels.length;
        panels[nextIdx].focus();
      }
    });
  });
})();
