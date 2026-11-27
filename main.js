/* =========================================================
   SIMOM · main.js
   - Router sederhana berbasis hash (#/, #/login, #/menu)
   - Validasi form login (saat blur, error hilang saat mengetik)
   - Render menu utama dari data
   ========================================================= */

(function () {
  "use strict";

  /* ---------- Data menu ---------- */
  var MENU_ITEMS = [
    { label: "Dashboard", icon: "bi-speedometer2", desc: "Ringkasan kondisi organisasi" },
    { label: "Anggota", icon: "bi-people-fill", desc: "Data dan struktur pengurus" },
    { label: "Program Kerja", icon: "bi-clipboard2-check", desc: "Rencana dan target kerja" },
    { label: "Kegiatan", icon: "bi-calendar-event", desc: "Jadwal dan acara organisasi" },
    { label: "Keuangan", icon: "bi-cash-stack", desc: "Pemasukan dan pengeluaran kas" },
    { label: "Administrasi", icon: "bi-folder2-open", desc: "Surat, arsip, dan dokumen" },
    { label: "Monitoring", icon: "bi-graph-up-arrow", desc: "Pantau progres kegiatan" },
    { label: "Laporan", icon: "bi-file-earmark-bar-graph", desc: "Laporan pertanggungjawaban" }
  ];

  /* ---------- Sesi (aman jika storage diblokir) ---------- */
  var memorySession = null;

  function saveSession(user) {
    memorySession = user;
    try { sessionStorage.setItem("simom_user", JSON.stringify(user)); } catch (e) { /* abaikan */ }
  }
  function loadSession() {
    if (memorySession) return memorySession;
    try {
      var raw = sessionStorage.getItem("simom_user");
      if (raw) { memorySession = JSON.parse(raw); }
    } catch (e) { /* abaikan */ }
    return memorySession;
  }
  function clearSession() {
    memorySession = null;
    try { sessionStorage.removeItem("simom_user"); } catch (e) { /* abaikan */ }
  }

  /* ---------- Elemen ---------- */
  var pages = document.querySelectorAll(".page");
  var navLinks = document.querySelectorAll("[data-nav]");
  var headerLogin = document.getElementById("headerLogin");
  var headerLogout = document.getElementById("headerLogout");
  var menuGrid = document.getElementById("menuGrid");
  var userNameEl = document.getElementById("userName");
  var toastEl = document.getElementById("toast");
  var main = document.getElementById("main");

  document.getElementById("year").textContent = new Date().getFullYear();

  /* ---------- Toast ---------- */
  var toastTimer;
  function toast(message) {
    toastEl.textContent = message;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("show"); }, 2600);
  }

  /* ---------- Router ---------- */
  var ROUTES = { "/": "home", "/login": "login", "/menu": "menu" };

  function currentRoute() {
    var path = (location.hash || "#/").slice(1) || "/";
    return ROUTES[path] ? path : "/";
  }

  function render() {
    var path = currentRoute();
    var user = loadSession();

    // Halaman menu hanya untuk pengguna yang sudah masuk
    if (path === "/menu" && !user) {
      location.hash = "#/login";
      return;
    }
    // Pengguna yang sudah masuk tidak perlu melihat form lagi
    if (path === "/login" && user) {
      location.hash = "#/menu";
      return;
    }

    var key = ROUTES[path];

    pages.forEach(function (page) {
      var active = page.dataset.page === key;
      page.hidden = !active;
    });

    navLinks.forEach(function (link) {
      var isActive = link.dataset.nav === key;
      link.classList.toggle("is-active", isActive);
      if (isActive) { link.setAttribute("aria-current", "page"); }
      else { link.removeAttribute("aria-current"); }
    });

    // Tombol header menyesuaikan status masuk
    headerLogin.hidden = !!user;
    headerLogout.hidden = !user;

    if (key === "menu" && user) {
      userNameEl.textContent = firstName(user.nama);
    }

    window.scrollTo(0, 0);
    main.focus({ preventScroll: true });
  }

  function firstName(full) {
    return String(full || "").trim().split(/\s+/)[0] || "Mahasiswa";
  }

  window.addEventListener("hashchange", render);

  /* ---------- Menu utama ---------- */
  function renderMenu() {
    var html = MENU_ITEMS.map(function (item) {
      return (
        '<li>' +
        '<button type="button" class="menu-card" data-label="' + item.label + '">' +
        '<span class="mc-top">' +
        '<span class="mc-icon"><i class="bi ' + item.icon + '" aria-hidden="true"></i></span>' +
        '<span class="mc-go"><i class="bi bi-arrow-right" aria-hidden="true"></i></span>' +
        '</span>' +
        '<span>' +
        '<span class="mc-label">' + item.label + '</span>' +
        '<span class="mc-desc" style="display:block">' + item.desc + '</span>' +
        '</span>' +
        '</button>' +
        '</li>'
      );
    }).join("");

    // Sel kosong di baris terakhir diisi ornamen cincin oranye
    html +=
      '<li class="menu-deco" aria-hidden="true">' +
      '<svg viewBox="0 0 200 200" focusable="false">' +
      '<defs><linearGradient id="gDeco" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="#ff5b14" stop-opacity="0"/>' +
      '<stop offset=".45" stop-color="#ff5b14"/>' +
      '<stop offset="1" stop-color="#ff9a3c" stop-opacity="0"/>' +
      '</linearGradient></defs>' +
      '<ellipse cx="100" cy="100" rx="88" ry="34" transform="rotate(-24 100 100)" fill="none" stroke="url(#gDeco)" stroke-width="9" stroke-linecap="round"/>' +
      '<circle cx="100" cy="100" r="46" fill="#141210"/>' +
      '</svg>' +
      '</li>';

    menuGrid.innerHTML = html;
  }

  menuGrid.addEventListener("click", function (e) {
    var card = e.target.closest(".menu-card");
    if (!card) return;
    toast("Modul " + card.dataset.label + " akan segera tersedia.");
  });

  /* ---------- Form login ---------- */
  var form = document.getElementById("loginForm");
  var fields = {
    nama: document.getElementById("nama"),
    gmail: document.getElementById("gmail"),
    password: document.getElementById("password")
  };
  var errorEls = {
    nama: document.getElementById("namaErr"),
    gmail: document.getElementById("gmailErr"),
    password: document.getElementById("passwordErr")
  };

  var validators = {
    nama: function (v) {
      if (!v.trim()) return "Nama wajib diisi.";
      if (v.trim().length < 3) return "Nama minimal 3 karakter.";
      return "";
    },
    gmail: function (v) {
      if (!v.trim()) return "Gmail wajib diisi.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())) return "Format Gmail belum benar. Contoh: nama@gmail.com";
      return "";
    },
    password: function (v) {
      if (!v) return "Password wajib diisi.";
      if (v.length < 6) return "Password minimal 6 karakter.";
      return "";
    }
  };

  function setError(name, message) {
    var input = fields[name];
    var wrapper = input.closest(".field");
    errorEls[name].textContent = message;
    wrapper.classList.toggle("has-error", !!message);
    if (message) { input.setAttribute("aria-invalid", "true"); }
    else { input.removeAttribute("aria-invalid"); }
  }

  function validateField(name) {
    var message = validators[name](fields[name].value);
    setError(name, message);
    return !message;
  }

  Object.keys(fields).forEach(function (name) {
    // Validasi saat keluar dari kolom, error hilang segera saat mulai mengetik
    fields[name].addEventListener("blur", function () {
      if (fields[name].value !== "" || errorEls[name].textContent) validateField(name);
    });
    fields[name].addEventListener("input", function () {
      if (errorEls[name].textContent && !validators[name](fields[name].value)) {
        setError(name, "");
      }
    });
  });

  // Tampilkan / sembunyikan password
  var toggleBtn = document.getElementById("togglePass");
  toggleBtn.addEventListener("click", function () {
    var show = fields.password.type === "password";
    fields.password.type = show ? "text" : "password";
    toggleBtn.setAttribute("aria-pressed", String(show));
    toggleBtn.setAttribute("aria-label", show ? "Sembunyikan password" : "Tampilkan password");
    toggleBtn.firstElementChild.className = show ? "bi bi-eye-slash" : "bi bi-eye";
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    var firstInvalid = null;
    Object.keys(fields).forEach(function (name) {
      if (!validateField(name) && !firstInvalid) firstInvalid = fields[name];
    });

    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }

    saveSession({
      nama: fields.nama.value.trim(),
      gmail: fields.gmail.value.trim()
    });
    form.reset();
    toast("Berhasil masuk. Selamat datang, " + firstName(loadSession().nama) + ".");
    location.hash = "#/menu";
  });

  /* ---------- Keluar ---------- */
  headerLogout.addEventListener("click", function () {
    clearSession();
    toast("Kamu sudah keluar.");
    if (currentRoute() === "/") { render(); }
    else { location.hash = "#/"; }
  });

  /* ---------- Mulai ---------- */
  renderMenu();
  render();
})();