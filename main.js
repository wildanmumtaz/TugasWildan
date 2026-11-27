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
    { label: "Dashboard",     icon: "bi-speedometer2",         desc: "Ringkasan kondisi organisasi" },
    { label: "Anggota",       icon: "bi-people-fill",          desc: "Data dan struktur pengurus" },
    { label: "Program Kerja", icon: "bi-clipboard2-check",     desc: "Rencana dan target kerja" },
    { label: "Kegiatan",      icon: "bi-calendar-event",       desc: "Jadwal dan acara organisasi" },
    { label: "Keuangan",      icon: "bi-cash-stack",           desc: "Pemasukan dan pengeluaran kas" },
    { label: "Administrasi",  icon: "bi-folder2-open",         desc: "Surat, arsip, dan dokumen" },
    { label: "Monitoring",    icon: "bi-graph-up-arrow",       desc: "Pantau progres kegiatan" },
    { label: "Laporan",       icon: "bi-file-earmark-bar-graph", desc: "Laporan pertanggungjawaban" }
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
  var pages        = document.querySelectorAll(".page");
  var navLinks     = document.querySelectorAll("[data-nav]");
  var headerLogin  = document.getElementById("headerLogin");
  var headerLogout = document.getElementById("headerLogout");
  var menuGrid     = document.getElementById("menuGrid");
  var userNameEl   = document.getElementById("userName");
  var toastEl      = document.getElementById("toast");
  var main         = document.getElementById("main");

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
    return (ROUTES[path] || /^\/m\/[a-z-]+$/.test(path)) ? path : "/";
  }

  function render() {
    var path = currentRoute();
    var user = loadSession();

    // Halaman menu hanya untuk pengguna yang sudah masuk
    if ((path === "/menu" || path.indexOf("/m/") === 0) && !user) {
      location.hash = "#/login";
      return;
    }
    // Pengguna yang sudah masuk tidak perlu melihat form lagi
    if (path === "/login" && user) {
      location.hash = "#/menu";
      return;
    }

    var isMod = path.indexOf("/m/") === 0;
    var key = isMod ? "module" : ROUTES[path];

    pages.forEach(function (page) {
      var active = page.dataset.page === key;
      page.hidden = !active;
    });

    navLinks.forEach(function (link) {
      var isActive = link.dataset.nav === (isMod ? "menu" : key);
      link.classList.toggle("is-active", isActive);
      if (isActive) { link.setAttribute("aria-current", "page"); }
      else { link.removeAttribute("aria-current"); }
    });

    // Tombol header menyesuaikan status masuk
    headerLogin.hidden  = !!user;
    headerLogout.hidden = !user;

    if (key === "menu" && user) {
      userNameEl.textContent = firstName(user.nama);
    }

    document.title = "SIMOM · UIN Ar-Raniry Banda Aceh";
    if (isMod) { renderModule(path.slice(3)); }

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
          '<button type="button" class="menu-card" data-label="' + item.label + '" data-slug="' + slugOf(item.label) + '">' +
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
    location.hash = "#/m/" + card.dataset.slug;
  });

  /* ---------- Form login ---------- */
  var form = document.getElementById("loginForm");
  var fields = {
    nama:     document.getElementById("nama"),
    gmail:    document.getElementById("gmail"),
    password: document.getElementById("password")
  };
  var errorEls = {
    nama:     document.getElementById("namaErr"),
    gmail:    document.getElementById("gmailErr"),
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

  /* ---------- Halaman modul (8 kartu menu) ---------- */
  function slugOf(l) { return l.toLowerCase().replace(/\s+/g, "-"); }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function rp(n) { return "Rp " + Number(n || 0).toLocaleString("id-ID"); }
  function tgl(v) {
    var d = new Date(v + "T00:00:00");
    return isNaN(d) ? esc(v) : d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  }
  function rows(keys, list) {
    return list.map(function (r) { var o = {}; keys.forEach(function (k, i) { o[k] = r[i]; }); return o; });
  }

  // Data contoh (ganti dengan data asli organisasi, atau hubungkan ke backend)
  function seedDB() {
    return {
      anggota: rows(["nama", "jabatan", "divisi", "status"], [
        ["Aulia Rahma", "Ketua Umum", "Kepengurusan", "Aktif"],
        ["Muhammad Rizki", "Sekretaris", "Administrasi", "Aktif"],
        ["Nurul Hidayati", "Bendahara", "Keuangan", "Aktif"],
        ["Fahmi Alfarisi", "Kepala Divisi", "Kegiatan", "Aktif"],
        ["Siti Maulida", "Anggota", "Humas", "Aktif"],
        ["Teuku Ilham", "Anggota", "Kegiatan", "Nonaktif"]]),
      proker: rows(["nama", "divisi", "target", "status", "progres"], [
        ["Pelatihan Kepemimpinan", "Kegiatan", "Desember 2026", "Berjalan", 60],
        ["Bakti Sosial Kampus", "Humas", "Januari 2027", "Berjalan", 30],
        ["Digitalisasi Arsip", "Administrasi", "November 2026", "Selesai", 100],
        ["Seminar Kewirausahaan", "Kegiatan", "Februari 2027", "Direncanakan", 0]]),
      kegiatan: rows(["nama", "tanggal", "tempat"], [
        ["Musyawarah Anggota", "2026-11-14", "Aula Fakultas"],
        ["Rapat Kerja Pengurus", "2026-12-05", "Aula Fakultas"],
        ["Pelatihan Kepemimpinan", "2026-12-19", "Student Center"],
        ["Bakti Sosial Kampus", "2027-01-16", "Lingkungan Kampus"],
        ["Seminar Kewirausahaan", "2027-02-13", "Auditorium"]]),
      keuangan: rows(["ket", "tanggal", "jenis", "jumlah"], [
        ["Iuran anggota semester ganjil", "2026-09-10", "Masuk", 1500000],
        ["Dana kegiatan dari fakultas", "2026-10-02", "Masuk", 5000000],
        ["Konsumsi rapat kerja", "2026-10-20", "Keluar", 650000],
        ["Cetak spanduk pelatihan", "2026-11-08", "Keluar", 450000]]),
      administrasi: rows(["judul", "nomor", "jenis", "tanggal"], [
        ["Undangan Rapat Kerja", "001/SIMOM/XI/2026", "Surat Keluar", "2026-11-02"],
        ["Izin Penggunaan Aula", "112/FAK/X/2026", "Surat Masuk", "2026-10-25"],
        ["Proposal Pelatihan Kepemimpinan", "-", "Arsip", "2026-11-10"]])
    };
  }

  var DB = (function () {
    var d = null;
    try { d = JSON.parse(localStorage.getItem("simom_db")); } catch (e) { /* abaikan */ }
    return d && d.anggota ? d : seedDB();
  })();
  function persist() { try { localStorage.setItem("simom_db", JSON.stringify(DB)); } catch (e) { /* abaikan */ } }

  // Kolom tabel (cols) dan isian form (f: [nama, label, tipe, opsi])
  var CFG = {
    anggota: {
      cols: [["nama", "Nama"], ["jabatan", "Jabatan"], ["divisi", "Divisi"], ["status", "Status"]],
      f: [["nama", "Nama", "text"], ["jabatan", "Jabatan", "text"], ["divisi", "Divisi", "text"], ["status", "Status", "select", ["Aktif", "Nonaktif"]]]
    },
    proker: {
      cols: [["nama", "Program"], ["divisi", "Divisi"], ["target", "Target"], ["status", "Status"]],
      f: [["nama", "Nama program", "text"], ["divisi", "Divisi", "text"], ["target", "Target waktu", "text"], ["status", "Status", "select", ["Direncanakan", "Berjalan", "Selesai"]]]
    },
    kegiatan: {
      cols: [["nama", "Kegiatan"], ["tanggal", "Tanggal"], ["tempat", "Tempat"]],
      f: [["nama", "Nama kegiatan", "text"], ["tanggal", "Tanggal", "date"], ["tempat", "Tempat", "text"]]
    },
    keuangan: {
      cols: [["ket", "Keterangan"], ["tanggal", "Tanggal"], ["jenis", "Jenis"], ["jumlah", "Jumlah"]],
      f: [["ket", "Keterangan", "text"], ["tanggal", "Tanggal", "date"], ["jenis", "Jenis", "select", ["Masuk", "Keluar"]], ["jumlah", "Jumlah (Rp)", "number"]]
    },
    administrasi: {
      cols: [["judul", "Judul"], ["nomor", "Nomor"], ["jenis", "Jenis"], ["tanggal", "Tanggal"]],
      f: [["judul", "Judul dokumen", "text"], ["nomor", "Nomor surat", "text"], ["jenis", "Jenis", "select", ["Surat Masuk", "Surat Keluar", "Arsip"]], ["tanggal", "Tanggal", "date"]]
    }
  };
  var KEY = { "program-kerja": "proker" };
  var cur = {};
  var modRoot = document.getElementById("moduleRoot");

  function cell(c, v) {
    if (c === "jumlah") return rp(v);
    if (c === "tanggal") return tgl(v);
    if (c === "status" || c === "jenis") return '<span class="badge b-' + slugOf(String(v)) + '">' + esc(v) + "</span>";
    return esc(v);
  }
  function today() { return new Date().toISOString().slice(0, 10); }
  function sum(jenis) {
    return DB.keuangan.filter(function (r) { return r.jenis === jenis; })
      .reduce(function (t, r) { return t + Number(r.jumlah || 0); }, 0);
  }
  function stat(icon, val, label) {
    return '<div class="stat"><i class="bi ' + icon + '" aria-hidden="true"></i><strong>' + val + "</strong><span>" + label + "</span></div>";
  }
  function bar(p) { return '<div class="bar"><i style="width:' + p + '%"></i></div>'; }

  /* -- Tabel CRUD: Anggota, Program Kerja, Kegiatan, Keuangan, Administrasi -- */
  function crud(key) {
    var c = CFG[key], html = "";
    if (key === "keuangan") {
      html += '<div class="stats">' + stat("bi-arrow-down-circle", rp(sum("Masuk")), "Pemasukan") +
        stat("bi-arrow-up-circle", rp(sum("Keluar")), "Pengeluaran") +
        stat("bi-wallet2", rp(sum("Masuk") - sum("Keluar")), "Saldo kas") + "</div>";
    }
    var fields = c.f.map(function (x) {
      var id = "f_" + x[0];
      var inp = x[2] === "select"
        ? '<select id="' + id + '" name="' + x[0] + '">' + x[3].map(function (o) { return "<option>" + o + "</option>"; }).join("") + "</select>"
        : '<input id="' + id + '" name="' + x[0] + '" type="' + x[2] + '" required' + (x[2] === "number" ? ' min="0"' : "") + ">";
      return '<div class="lt-field"><label for="' + id + '">' + x[1] + "</label>" + inp + "</div>";
    }).join("");
    html += '<div class="toolbar"><label class="search"><i class="bi bi-search" aria-hidden="true"></i>' +
      '<input type="search" id="mq" placeholder="Cari data" aria-label="Cari data"></label>' +
      '<button type="button" class="btn btn-primary btn-sm" data-act="toggle"><i class="bi bi-plus-lg" aria-hidden="true"></i> Tambah</button></div>' +
      '<form class="add-form" id="addForm" hidden>' + fields +
      '<div class="af-actions"><button type="submit" class="btn btn-accent btn-sm">Simpan</button>' +
      '<button type="button" class="btn btn-outline btn-sm" data-act="toggle">Batal</button></div></form>' +
      '<div class="table-wrap"><table class="tbl"><thead><tr>' +
      c.cols.map(function (x) { return "<th>" + x[1] + "</th>"; }).join("") +
      '<th><span class="sr-only">Aksi</span></th></tr></thead><tbody id="tb"></tbody></table></div>';
    return html;
  }

  function drawRows() {
    var c = CFG[cur.key], list = DB[cur.key], n = 0, html = "";
    list.forEach(function (r, i) {
      var hay = c.cols.map(function (x) { return r[x[0]]; }).join(" ").toLowerCase();
      if (hay.indexOf(cur.q) < 0) return;
      n++;
      html += "<tr>" + c.cols.map(function (x) {
        return '<td data-label="' + x[1] + '">' + cell(x[0], r[x[0]]) + "</td>";
      }).join("") + '<td class="td-act"><button type="button" class="icon-btn" data-act="del" data-i="' + i +
        '" aria-label="Hapus data"><i class="bi bi-trash3" aria-hidden="true"></i></button></td></tr>';
    });
    document.getElementById("tb").innerHTML = n ? html :
      '<tr><td colspan="' + (c.cols.length + 1) + '" class="empty">' +
      (list.length ? "Tidak ada data yang cocok dengan pencarian." : "Belum ada data. Klik Tambah untuk mulai.") + "</td></tr>";
  }

  /* -- Dashboard -- */
  function dash() {
    var aktif = DB.anggota.filter(function (a) { return a.status === "Aktif"; }).length;
    var next = DB.kegiatan.filter(function (k) { return k.tanggal >= today(); })
      .sort(function (a, b) { return a.tanggal < b.tanggal ? -1 : 1; });
    return '<div class="stats stats-4">' +
      stat("bi-people-fill", aktif, "Anggota aktif") +
      stat("bi-clipboard2-check", DB.proker.length, "Program kerja") +
      stat("bi-calendar-event", next.length, "Kegiatan mendatang") +
      stat("bi-wallet2", rp(sum("Masuk") - sum("Keluar")), "Saldo kas") + "</div>" +
      '<div class="panels"><section class="panel"><h2>Kegiatan terdekat</h2><ul class="plist">' +
      (next.slice(0, 4).map(function (k) {
        return "<li><span>" + esc(k.nama) + "<small>" + esc(k.tempat) + "</small></span><time>" + tgl(k.tanggal) + "</time></li>";
      }).join("") || '<li class="empty">Belum ada kegiatan mendatang.</li>') +
      '</ul></section><section class="panel"><h2>Progres program kerja</h2><ul class="plist">' +
      DB.proker.map(function (p) {
        return "<li class=\"col\"><span>" + esc(p.nama) + "<small>" + p.progres + "%</small></span>" + bar(p.progres) + "</li>";
      }).join("") + "</ul></section></div>";
  }

  /* -- Monitoring -- */
  function avg() {
    return DB.proker.length ? Math.round(DB.proker.reduce(function (t, p) { return t + p.progres; }, 0) / DB.proker.length) : 0;
  }
  function monitor() {
    return '<section class="panel avg-panel"><h2>Rata-rata progres seluruh program</h2><p class="avg"><strong id="monAvg">' + avg() +
      "%</strong></p>" + bar(avg()).replace('class="bar"', 'class="bar" id="monBar"') + "</section>" +
      '<ul class="mon-list">' + DB.proker.map(function (p, i) {
        return '<li class="mon-item panel"><div class="mon-top"><h2>' + esc(p.nama) + "</h2>" + cell("status", p.status) + "</div>" +
          "<p class=\"mon-meta\">" + esc(p.divisi) + " · Target " + esc(p.target) + "</p>" + bar(p.progres) +
          '<label class="mon-range"><span>Progres: <b class="mon-pct">' + p.progres + '%</b></span>' +
          '<input type="range" min="0" max="100" step="5" value="' + p.progres + '" data-prog="' + i +
          '" aria-label="Progres ' + esc(p.nama) + '"></label></li>';
      }).join("") + "</ul>";
  }

  /* -- Laporan -- */
  function report() {
    var aktif = DB.anggota.filter(function (a) { return a.status === "Aktif"; }).length;
    var done = DB.proker.filter(function (p) { return p.status === "Selesai"; }).length;
    var up = DB.kegiatan.filter(function (k) { return k.tanggal >= today(); }).length;
    var R = [
      ["anggota", "bi-people-fill", "Laporan keanggotaan", DB.anggota.length + " anggota terdata, " + aktif + " aktif."],
      ["proker", "bi-clipboard2-check", "Laporan program kerja", DB.proker.length + " program, " + done + " selesai."],
      ["kegiatan", "bi-calendar-event", "Laporan kegiatan", DB.kegiatan.length + " kegiatan, " + up + " akan datang."],
      ["keuangan", "bi-cash-stack", "Laporan keuangan", "Masuk " + rp(sum("Masuk")) + ", keluar " + rp(sum("Keluar")) + ", saldo " + rp(sum("Masuk") - sum("Keluar")) + "."],
      ["administrasi", "bi-folder2-open", "Laporan administrasi", DB.administrasi.length + " surat dan arsip tercatat."]
    ];
    return '<div class="toolbar"><p class="muted">Ringkasan per tanggal ' + tgl(today()) + '.</p>' +
      '<button type="button" class="btn btn-primary btn-sm" data-act="print"><i class="bi bi-printer" aria-hidden="true"></i> Cetak</button></div>' +
      '<ul class="rep-grid">' + R.map(function (r) {
        return '<li class="panel rep"><span class="mc-icon"><i class="bi ' + r[1] + '" aria-hidden="true"></i></span><h2>' + r[2] +
          "</h2><p>" + r[3] + '</p><button type="button" class="btn btn-outline btn-sm" data-act="csv" data-k="' + r[0] +
          '"><i class="bi bi-download" aria-hidden="true"></i> Unduh CSV</button></li>';
      }).join("") + "</ul>";
  }

  function csv(k) {
    var c = CFG[k];
    var out = [c.cols.map(function (x) { return x[1]; })].concat(DB[k].map(function (r) {
      return c.cols.map(function (x) { return r[x[0]]; });
    }));
    var s = out.map(function (r) {
      return r.map(function (v) { return '"' + String(v).replace(/"/g, '""') + '"'; }).join(",");
    }).join("\r\n");
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["\ufeff" + s], { type: "text/csv;charset=utf-8" }));
    a.download = "simom-" + k + ".csv";
    document.body.appendChild(a); a.click(); a.remove();
    toast("File CSV diunduh.");
  }

  function renderModule(slug) {
    var item = MENU_ITEMS.filter(function (m) { return slugOf(m.label) === slug; })[0];
    if (!item) { location.hash = "#/menu"; return; }
    var key = KEY[slug] || slug;
    cur = { slug: slug, key: key, q: "" };
    var body = slug === "dashboard" ? dash() : slug === "monitoring" ? monitor() : slug === "laporan" ? report() : crud(key);
    modRoot.innerHTML =
      '<div class="mod-head"><a class="back" href="#/menu"><i class="bi bi-arrow-left" aria-hidden="true"></i> Menu utama</a>' +
      '<div class="mod-title"><span class="mc-icon"><i class="bi ' + item.icon + '" aria-hidden="true"></i></span>' +
      "<div><h1>" + item.label + "</h1><p>" + item.desc + "</p></div></div></div>" +
      '<div class="mod-body">' + body + "</div>";
    if (document.getElementById("tb")) drawRows();
    document.title = item.label + " · SIMOM";
  }

  modRoot.addEventListener("click", function (e) {
    var b = e.target.closest("[data-act]");
    if (!b) return;
    var a = b.dataset.act;
    if (a === "toggle") {
      var f = document.getElementById("addForm");
      f.hidden = !f.hidden;
      if (!f.hidden) f.elements[0].focus();
    } else if (a === "del") {
      if (window.confirm("Hapus data ini?")) {
        DB[cur.key].splice(+b.dataset.i, 1);
        persist(); renderModule(cur.slug); toast("Data dihapus.");
      }
    } else if (a === "csv") { csv(b.dataset.k); }
    else if (a === "print") { window.print(); }
  });

  modRoot.addEventListener("submit", function (e) {
    e.preventDefault();
    var f = e.target, o = {};
    CFG[cur.key].f.forEach(function (x) {
      var v = f.elements[x[0]].value.trim();
      o[x[0]] = x[2] === "number" ? Number(v) : v;
    });
    if (cur.key === "proker") o.progres = o.status === "Selesai" ? 100 : 0;
    DB[cur.key].push(o);
    persist(); renderModule(cur.slug); toast("Data ditambahkan.");
  });

  modRoot.addEventListener("input", function (e) {
    var t = e.target;
    if (t.id === "mq") { cur.q = t.value.toLowerCase(); drawRows(); return; }
    if (t.dataset.prog === undefined) return;
    var p = DB.proker[+t.dataset.prog], li = t.closest(".mon-item");
    p.progres = +t.value;
    p.status = p.progres >= 100 ? "Selesai" : p.progres > 0 ? "Berjalan" : "Direncanakan";
    persist();
    li.querySelector(".mon-pct").textContent = p.progres + "%";
    li.querySelector(".bar i").style.width = p.progres + "%";
    var bd = li.querySelector(".badge");
    bd.textContent = p.status; bd.className = "badge b-" + slugOf(p.status);
    document.getElementById("monAvg").textContent = avg() + "%";
    document.querySelector("#monBar i").style.width = avg() + "%";
  });

  /* ---------- Mulai ---------- */
  renderMenu();
  render();
})();
