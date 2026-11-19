(async () => {
  "use strict";
  const $ = s => document.querySelector(s);
  let C = window.INVITATION_CONFIG;
  if (C.source === "json") {
    try { const r = await fetch("data/invitation.json"); if (r.ok) C = await r.json(); }
    catch (err) { console.warn("invitation.json gagal dimuat, memakai config.js"); }
  }
  const g = C.groom, b = C.bride, e = C.event, names = g.nick + " & " + b.nick;
  const dateText = new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date(e.date));
  const toast = m => { const t = $("#toast"); t.textContent = m; t.classList.add("show"); setTimeout(() => t.classList.remove("show"), 2200); };

  /* Isi konten */
  document.title = "The Wedding of " + names;
  const guest = new URLSearchParams(location.search).get("to");
  if (guest) $("#guest").textContent = guest.slice(0, 60);
  ["#cvNames", "#heroNames", "#fNames"].forEach(s => $(s).textContent = names);
  $("#navLogo").textContent = g.nick[0] + " & " + b.nick[0];
  $("#heroDate").textContent = dateText;
  $("#quote").textContent = C.quote;
  $("#home").style.setProperty("--hero", "url('" + C.heroImage + "')");
  [["#pGroom", g], ["#pBride", b]].forEach(([s, p]) => {
    const el = $(s), img = document.createElement("img");
    img.src = p.photo; img.alt = p.name; img.loading = "lazy";
    const h = document.createElement("h3"); h.textContent = p.name;
    const sm = document.createElement("small"); sm.textContent = p.parents;
    el.append(img, h, sm);
  });
  $("#akad").textContent = dateText + " • " + e.akadTime;
  $("#resepsi").textContent = dateText + " • " + e.resepsiTime;
  $("#venue").textContent = e.venue;
  $("#address").textContent = e.address;
  $("#mapBtn").href = e.mapsLink;
  $("#map").src = "https://www.google.com/maps?q=" + encodeURIComponent(e.mapsQuery || e.address) + "&output=embed";
  const ymd = d => new Date(d).toISOString().replace(/[-:]|\.\d{3}/g, "");
  $("#calBtn").href = "https://calendar.google.com/calendar/render?action=TEMPLATE&text=" + encodeURIComponent("Pernikahan " + names) +
    "&dates=" + ymd(e.date) + "/" + ymd(new Date(e.date).getTime() + 6 * 36e5) + "&location=" + encodeURIComponent(e.venue + ", " + e.address);
  $("#fText").textContent = C.closing;

  /* Galeri + lightbox */
  const grid = $("#grid"); let cur = 0;
  C.gallery.forEach((src, i) => {
    const im = document.createElement("img");
    im.src = src; im.alt = "Foto galeri " + (i + 1); im.loading = "lazy"; im.className = "reveal";
    im.addEventListener("click", () => show(i)); grid.appendChild(im);
  });
  const lb = $("#lb"), lbImg = $("#lbImg");
  function show(i) { cur = (i + C.gallery.length) % C.gallery.length; lbImg.src = C.gallery[cur]; lb.hidden = false; }
  const close = () => { lb.hidden = true; };
  $("#lbX").onclick = close; $("#lbP").onclick = () => show(cur - 1); $("#lbN").onclick = () => show(cur + 1);
  lb.addEventListener("click", ev => { if (ev.target === lb) close(); });
  document.addEventListener("keydown", ev => {
    if (lb.hidden) return;
    if (ev.key === "Escape") close();
    if (ev.key === "ArrowLeft") show(cur - 1);
    if (ev.key === "ArrowRight") show(cur + 1);
  });

  /* Susunan acara */
  C.rundown.forEach(r => {
    const li = document.createElement("li"); li.className = "reveal";
    const t = document.createElement("span"), n = document.createElement("b"), d = document.createElement("p");
    t.textContent = r.time; n.textContent = " " + r.title; d.textContent = r.desc;
    li.append(t, n, d); $("#tl").appendChild(li);
  });

  /* Countdown */
  const target = new Date(e.date).getTime();
  const tick = () => {
    const d = target - Date.now();
    if (d <= 0) { $("#cd").innerHTML = '<p class="done">Hari Bahagia Telah Tiba 💙</p>'; clearInterval(timer); return; }
    const v = { Hari: d / 864e5, Jam: d / 36e5 % 24, Menit: d / 6e4 % 60, Detik: d / 1e3 % 60 };
    $("#cd").innerHTML = Object.entries(v).map(([k, x]) =>
      '<div class="glass cd"><b>' + String(Math.floor(x)).padStart(2, "0") + "</b><span>" + k + "</span></div>").join("");
  };
  const timer = setInterval(tick, 1000); tick();

  /* Salin alamat */
  $("#copyBtn").onclick = async () => {
    const txt = e.venue + ", " + e.address;
    try { await navigator.clipboard.writeText(txt); }
    catch (err) { const a = document.createElement("textarea"); a.value = txt; document.body.appendChild(a); a.select(); document.execCommand("copy"); a.remove(); }
    toast("Alamat berhasil disalin");
  };

  /* RSVP WhatsApp */
  $("#rsvpForm").addEventListener("submit", ev => {
    ev.preventDefault();
    const msg = "Assalamu'alaikum, saya konfirmasi kehadiran pada pernikahan " + names + ".\n\nNama: " + $("#rName").value.trim() +
      "\nStatus: " + $("#rStatus").value + "\nJumlah tamu: " + $("#rCount").value + "\nPesan: " + ($("#rMsg").value.trim() || "-");
    window.open("https://wa.me/" + C.whatsapp + "?text=" + encodeURIComponent(msg), "_blank", "noopener");
  });

  /* Buku tamu (LocalStorage) */
  const KEY = "undangan_guestbook_v1";
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (err) { return []; } };
  const render = () => {
    const box = $("#wishList"); box.textContent = ""; const list = load();
    if (!list.length) { box.innerHTML = '<p class="note">Belum ada ucapan. Jadilah yang pertama!</p>'; return; }
    list.forEach(w => {
      const d = document.createElement("div"); d.className = "wish";
      const n = document.createElement("b"), s = document.createElement("small"), p = document.createElement("p");
      n.textContent = w.name; s.textContent = new Date(w.time).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }); p.textContent = w.msg;
      d.append(n, s, p); box.appendChild(d);
    });
  };
  $("#wishForm").addEventListener("submit", ev => {
    ev.preventDefault();
    const list = load(); list.unshift({ name: $("#wName").value.trim(), msg: $("#wMsg").value.trim(), time: Date.now() });
    try { localStorage.setItem(KEY, JSON.stringify(list.slice(0, 100))); } catch (err) { toast("Penyimpanan penuh/dinonaktifkan"); return; }
    ev.target.reset(); render(); toast("Ucapan terkirim, terima kasih 💙");
  });
  render();

  /* Musik */
  const audio = new Audio(C.music); audio.loop = true; audio.volume = .6;
  const mb = $("#musicBtn");
  const sync = () => { mb.classList.toggle("on", !audio.paused); mb.textContent = audio.paused ? "♪" : "❚❚"; };
  mb.onclick = () => { audio.paused ? audio.play().catch(() => toast("Musik tidak dapat diputar")) : audio.pause(); };
  audio.addEventListener("play", sync); audio.addEventListener("pause", sync);

  /* Buka undangan */
  $("#openBtn").onclick = () => {
    $("#cover").classList.add("hide"); document.body.classList.remove("locked");
    $("#nav").classList.add("show"); mb.classList.add("show");
    audio.play().catch(() => {}); window.scrollTo(0, 0);
  };

  /* Navigasi */
  $("#burger").onclick = () => $("#menu").classList.toggle("open");
  document.querySelectorAll("#menu a").forEach(a => a.addEventListener("click", () => $("#menu").classList.remove("open")));

  /* Scroll reveal */
  const io = new IntersectionObserver(en => en.forEach(x => { if (x.isIntersecting) { x.target.classList.add("in"); io.unobserve(x.target); } }), { threshold: .12 });
  document.querySelectorAll(".reveal").forEach(el => io.observe(el));
})();
