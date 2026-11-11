/* ===================== script.js (index.html + admin.html dono ke liye) ===================== */

/* ---------- 1. CONFIG: apni details yahin badlein ---------- */
const CONFIG = {
  ADMIN_PASSWORD: "etawah@2026",          // ⚠️ ise zaroor badlein
  FIREBASE: { projectId: "mahasangh-etawah", apiKey: "AIzaSyBJ2hhV7EQBpMRIfxSDTn0o60EC1puK2UQ" }, // khaali = sirf LocalStorage; bharne par Firestore (sabko dikhega)
  adhyaksh: {
    name: "श्री ____________",
    title: "जिला अध्यक्ष",
    photo: "images/adhyaksh.jpg",
    msg: "प्रिय साथियों, महासंघ की इस वेबसाइट पर आपका स्वागत है। आपकी हर समस्या हमारी जिम्मेदारी है — एकजुट होकर हम अपने अधिकारों के लिए आगे बढ़ेंगे।"
  },
  team: [
    { name: "श्री ____________", role: "जिला महामंत्री",   photo: "images/team1.jpg" },
    { name: "श्री ____________", role: "जिला कोषाध्यक्ष",  photo: "images/team2.jpg" },
    { name: "श्री ____________", role: "जिला उपाध्यक्ष",   photo: "images/team3.jpg" },
    { name: "श्री ____________", role: "जिला मंत्री",      photo: "images/team4.jpg" },
    { name: "श्री ____________", role: "संगठन मंत्री",     photo: "images/team5.jpg" },
    { name: "श्री ____________", role: "प्रचार मंत्री",    photo: "images/team6.jpg" }
  ],
  demands: [
    { i: "💰", t: "पुरानी पेंशन बहाली",       d: "सभी राज्य कर्मचारियों के लिए पुरानी पेंशन योजना लागू हो।" },
    { i: "📈", t: "महंगाई भत्ता (DA)",        d: "DA की किश्तें समय पर और बकाया सहित मिलें।" },
    { i: "🏆", t: "समय पर पदोन्नति",          d: "लंबित पदोन्नतियाँ शीघ्र की जाएँ।" },
    { i: "🏥", t: "कैशलेस चिकित्सा",          d: "कर्मचारियों व परिवार के लिए कैशलेस इलाज की सुविधा।" },
    { i: "📋", t: "संविदा कर्मियों का नियमितीकरण", d: "संविदा/आउटसोर्स कर्मियों को सम्मानजनक सेवा-शर्तें।" },
    { i: "⚖️", t: "वेतन विसंगति निवारण",      d: "वेतनमान की विसंगतियाँ दूर की जाएँ।" }
  ],
  downloads: [  // PDF ko 'downloads/' folder me rakhein
    { t: "शासनादेश (GO) – उदाहरण", url: "downloads/sample-go.pdf" },
    { t: "सदस्यता फॉर्म",           url: "downloads/membership-form.pdf" }
  ],
  contact: {
    address: "जिला कार्यालय, उत्तर प्रदेश राज्य कर्मचारी महासंघ, इटावा (उ.प्र.) – 206001",
    phones: ["8273278648"],
    email: "dheeruetw@gmail.com",
    social: { WhatsApp: "https://wa.me/918273278648" }   // Facebook/YouTube ho to: Facebook: "https://...", YouTube: "https://..." jodein
  },
  defaultNews: [{ text: "जिला कार्यकारिणी की आगामी बैठक की सूचना यहाँ दिखेगी — एडमिन पैनल से बदलें।" }],
  defaultGallery: [
    { url: "images/g1.jpg", caption: "जिला बैठक" },
    { url: "images/g2.jpg", caption: "सम्मान समारोह" },
    { url: "images/g3.jpg", caption: "ज्ञापन सौंपते हुए" }
  ]
};

/* ---------- 2. Helpers ---------- */
const $ = s => document.querySelector(s);
// XSS se bachne ke liye har user-text ko escape karein
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
// Photo na mile to ye placeholder dikhega
const PH = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#e2e8f0"/><circle cx="50" cy="38" r="16" fill="#94a3b8"/><path d="M18 90c4-22 20-30 32-30s28 8 32 30z" fill="#94a3b8"/></svg>');
document.addEventListener('error', e => { const t = e.target; if (t.tagName === 'IMG' && !t.dataset.f) { t.dataset.f = 1; t.src = PH; } }, true);
const imgTag = (src, cls, alt) => `<img src="${esc(src || PH)}" alt="${esc(alt)}" class="${cls}" loading="lazy">`;
function toast(m) {
  const t = document.createElement('div');
  t.textContent = m;
  t.className = 'fixed bottom-5 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg z-50 text-sm max-w-[90%]';
  document.body.append(t); setTimeout(() => t.remove(), m.length > 40 ? 9000 : 3500);
}

// Firebase ka asli error dikhane ke liye
const fail = e => { console.error(e); toast('❌ ' + String((e && e.message) || e).slice(0, 180)); };
const fbOk = async r => { if (!r.ok) { const j = await r.json().catch(() => ({})); throw new Error((j.error && j.error.message) || 'HTTP ' + r.status); } };

/* ---------- 3. Data layer: Firebase Firestore (REST) ya LocalStorage ---------- */
const FB = CONFIG.FIREBASE, useFB = !!(FB.projectId && FB.apiKey);
const FB_URL = `https://firestore.googleapis.com/v1/projects/${FB.projectId}/databases/(default)/documents`;
const toF = o => ({ fields: Object.fromEntries(Object.entries(o).map(([k, v]) => [k, { stringValue: String(v) }])) });
const fromF = d => ({ id: d.name.split('/').pop(), ...Object.fromEntries(Object.entries(d.fields || {}).map(([k, v]) => [k, v.stringValue])) });
const ls = k => JSON.parse(localStorage.getItem(k) || '[]');

const DB = {
  async list(col) {                       // col: 'news' | 'gallery' | 'grievances'
    let rows;
    try {
      if (useFB) { const j = await (await fetch(`${FB_URL}/${col}?key=${FB.apiKey}&pageSize=300`)).json(); rows = (j.documents || []).map(fromF); }
      else rows = ls(col);
    } catch (e) { console.error(e); rows = []; }
    return rows.sort(col === 'team' ? (a, b) => (a.ord || 0) - (b.ord || 0) : (a, b) => (b.ts || 0) - (a.ts || 0));  // team: ord se, baaki: naya pehle
  },
  async add(col, obj) {
    obj = { ...obj, ts: Date.now() };
    if (useFB) {
      const r = await fetch(`${FB_URL}/${col}?key=${FB.apiKey}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(toF(obj)) });
      await fbOk(r);
    } else { const a = ls(col); a.push({ id: 'i' + obj.ts, ...obj }); localStorage.setItem(col, JSON.stringify(a)); }
  },
  async get(col, id) {                    // ek document padhna (jaise settings/site)
    try {
      if (useFB) { const j = await (await fetch(`${FB_URL}/${col}/${id}?key=${FB.apiKey}`)).json(); return j.fields ? fromF(j) : {}; }
      return ls(col).find(x => x.id === id) || {};
    } catch (e) { return {}; }
  },
  async set(col, id, obj) {               // banao ya sirf diye gaye fields badlo (merge)
    if (useFB) {
      const m = Object.keys(obj).map(k => 'updateMask.fieldPaths=' + k).join('&');
      const r = await fetch(`${FB_URL}/${col}/${id}?key=${FB.apiKey}&${m}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(toF(obj)) });
      await fbOk(r);
    } else {
      const a = ls(col), i = a.findIndex(x => x.id === id);
      if (i < 0) a.push({ id, ...obj }); else a[i] = { ...a[i], ...obj };
      localStorage.setItem(col, JSON.stringify(a));
    }
  },
  async del(col, id) {
    if (useFB) await fbOk(await fetch(`${FB_URL}/${col}/${id}?key=${FB.apiKey}`, { method: 'DELETE' }));
    else localStorage.setItem(col, JSON.stringify(ls(col).filter(x => x.id !== id)));
  }
};
const fmtDate = ts => new Date(+ts).toLocaleDateString('hi-IN');
/* Photo ko chhota (resize) karke text me badalna — Firestore me seedha save hoti hai, Storage ki zaroorat nahi */
function readImg(file, max, type) {
  return new Promise((res, rej) => {
    const im = new Image(), fr = new FileReader();
    fr.onload = () => { im.onload = () => {
      const k = Math.min(1, max / Math.max(im.width, im.height)), c = document.createElement('canvas');
      c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
      const x = c.getContext('2d');
      if (type === 'image/jpeg') { x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); }
      x.drawImage(im, 0, 0, c.width, c.height);
      res(c.toDataURL(type, 0.82));
    }; im.onerror = rej; im.src = fr.result; };
    fr.onerror = rej; fr.readAsDataURL(file);
  });
}
// Logo + Adhyaksh ki jaankari: admin panel ki saved value, warna CONFIG ka default
async function getSite() {
  const s = { ...CONFIG.adhyaksh };
  Object.entries(await DB.get('settings', 'site')).forEach(([k, v]) => { if (v) s[k] = v; });
  return s;
}
const A = { team: [], pend: {}, editId: null };   // admin state: pend = nayi chuni gayi photos

/* ---------- 4. PUBLIC WEBSITE (index.html) ---------- */
async function loadNews() {
  const n = await DB.list('news');
  $('#ticker').innerHTML = (n.length ? n : CONFIG.defaultNews).map(x => `<span class="mx-8">📢 ${esc(x.text)}</span>`).join('');
}
async function loadGallery() {
  const g = await DB.list('gallery');
  $('#galleryGrid').innerHTML = (g.length ? g.slice(0, 24) : CONFIG.defaultGallery).map(x =>
    `<figure class="relative overflow-hidden rounded-xl cursor-zoom-in">${imgTag(x.url, 'w-full h-36 sm:h-52 object-cover', x.caption)}
     <figcaption class="absolute bottom-0 inset-x-0 bg-black/55 text-white text-xs p-1.5">${esc(x.caption)}</figcaption></figure>`).join('');
}
async function loadSite() {
  const s = await getSite();
  $('#hPhoto').src = s.photo || PH; $('#hName').textContent = s.name;
  $('#hTitle').textContent = s.title + ' – उ.प्र. राज्य कर्मचारी महासंघ, इटावा'; $('#hMsg').textContent = s.msg;
  if (s.logo) $('#logo').src = s.logo;
}
async function loadTeam() {   // admin panel ki list; khaali ho to CONFIG.team
  const t = await DB.list('team');
  $('#teamGrid').innerHTML = (t.length ? t : CONFIG.team).map(m => `<div class="card p-3 text-center">
    ${imgTag(m.photo, 'w-24 h-24 sm:w-28 sm:h-28 mx-auto rounded-full object-cover', m.name)}
    <h3 class="mt-2 font-bold text-sm sm:text-base">${esc(m.name)}</h3><p class="text-xs sm:text-sm text-orange-600 font-semibold">${esc(m.role)}</p></div>`).join('');
}
function initHome() {
  const c = CONFIG.contact;

  $('#demandGrid').innerHTML = CONFIG.demands.map(d => `<div class="card p-4 border-l-4 border-orange-500">
    <div class="text-2xl">${d.i}</div><h3 class="font-bold text-blue-900 mt-1">${esc(d.t)}</h3><p class="text-sm text-slate-600 mt-1">${esc(d.d)}</p></div>`).join('');

  $('#dlList').innerHTML = CONFIG.downloads.map(d => `<a href="${esc(d.url)}" target="_blank" rel="noopener" class="card flex items-center gap-3 p-4">
    <span class="text-2xl">📄</span><span class="flex-1 font-semibold">${esc(d.t)}</span><span class="text-blue-700 text-sm font-bold">⬇ डाउनलोड</span></a>`).join('');

  $('#contactBox').innerHTML = `<p>📍 ${esc(c.address)}</p>` +
    c.phones.map(p => `<p>📞 <a class="text-blue-700 font-semibold" href="tel:${esc(p)}">${esc(p)}</a></p>`).join('') +
    `<p>✉️ <a class="text-blue-700 font-semibold" href="mailto:${esc(c.email)}">${esc(c.email)}</a></p>`;
  $('#social').innerHTML = Object.entries(c.social).map(([k, v]) => `<a class="btn-ghost text-sm" href="${esc(v)}" target="_blank" rel="noopener">${esc(k)}</a>`).join('');
  $('#yr').textContent = new Date().getFullYear();

  loadSite(); loadTeam(); loadNews(); loadGallery();

  // Mobile menu
  $('#menuBtn').onclick = () => $('#nav').classList.toggle('hidden');
  $('#nav').onclick = e => { if (e.target.tagName === 'A') $('#nav').classList.add('hidden'); };

  // Lightbox
  $('#galleryGrid').onclick = e => { if (e.target.tagName === 'IMG') { $('#lbImg').src = e.target.src; $('#lb').classList.remove('hidden'); $('#lb').classList.add('flex'); } };
  $('#lb').onclick = () => { $('#lb').classList.add('hidden'); $('#lb').classList.remove('flex'); };

  // Grievance form
  $('#gform').onsubmit = async e => {
    e.preventDefault();
    const f = e.target, d = Object.fromEntries(new FormData(f));
    if (!/^[6-9]\d{9}$/.test(d.mobile)) return toast('❌ सही 10 अंकों का मोबाइल नंबर डालें');
    $('#gBtn').disabled = true;
    try { await DB.add('grievances', d); f.reset(); toast('✅ आपकी समस्या दर्ज हो गई'); }
    catch (err) { fail(err); }
    $('#gBtn').disabled = false;
  };
}

/* ---------- 5. ADMIN PANEL (admin.html) ---------- */
async function loadAdmin() {
  const [n, g, r, t] = await Promise.all(['news', 'gallery', 'grievances', 'team'].map(c => DB.list(c))); A.team = t;
  const row = (col, x, html) => `<div class="flex gap-2 items-start border-b py-2">${html}<button data-del="${col}|${esc(x.id)}" class="text-red-600 px-2" aria-label="हटाएँ">🗑</button></div>`;
  const empty = '<p class="text-sm text-slate-500">अभी कुछ नहीं है।</p>';
  $('#newsList').innerHTML = n.map(x => row('news', x, `<p class="flex-1 text-sm">${esc(x.text)}</p>`)).join('') || empty;
  $('#galList').innerHTML = g.map(x => row('gallery', x, `${imgTag(x.url, 'w-14 h-14 rounded object-cover', x.caption)}<p class="flex-1 text-sm">${esc(x.caption)}</p>`)).join('') || empty;
  $('#gList').innerHTML = r.map(x => row('grievances', x, `<div class="flex-1 text-sm"><b>${esc(x.name)}</b> • ${esc(x.dept)} • ID: ${esc(x.empId)}<br>
    📞 <a class="text-blue-700" href="tel:${esc(x.mobile)}">${esc(x.mobile)}</a> • ${fmtDate(x.ts)}
    <p class="mt-1 bg-slate-50 p-2 rounded">${esc(x.issue)}</p></div>`)).join('') || empty;
  $('#teamList').innerHTML = t.map(x => row('team', x, `${imgTag(x.photo, 'w-14 h-14 rounded-full object-cover', x.name)}
    <div class="flex-1 text-sm"><b>${esc(x.name)}</b><br><span class="text-orange-600">${esc(x.role)}</span></div>
    <button data-edit="${esc(x.id)}" class="px-2" aria-label="बदलें">✏️</button>`)).join('')
    || '<button id="seed" class="btn-ghost text-sm text-blue-800">⬇ डिफ़ॉल्ट पदाधिकारी लोड करें (फिर नाम/फोटो बदलें)</button>';
  $('#gCount').textContent = r.length;
}
function initAdmin() {
  // ⚠️ Ye password client-side hai: sirf basic roka-tok, bank-grade security nahi.
  const ok = () => sessionStorage.getItem('adm') === '1';
  const show = () => { $('#login').classList.toggle('hidden', ok()); $('#panel').classList.toggle('hidden', !ok()); if (ok()) { loadAdmin(); fillSite(); } };
  $('#loginForm').onsubmit = e => { e.preventDefault(); if ($('#pw').value === CONFIG.ADMIN_PASSWORD) { sessionStorage.setItem('adm', '1'); show(); } else toast('❌ गलत पासवर्ड'); };
  $('#logout').onclick = () => { sessionStorage.removeItem('adm'); show(); };
  $('#warn').classList.toggle('hidden', useFB);

  const bind = (id, col) => $(id).onsubmit = async e => {
    e.preventDefault(); const f = e.target;
    try { await DB.add(col, Object.fromEntries(new FormData(f))); f.reset(); toast('✅ जुड़ गया'); loadAdmin(); }
    catch (err) { fail(err); }
  };
  bind('#newsForm', 'news');
  // Gallery: ek ya kai photo chunkar upload (resize hokar Firestore me save)
  $('#galForm').onsubmit = async e => {
    e.preventDefault();
    const f = e.target, files = [...$('#gFile').files], cap = f.elements.caption.value, btn = f.querySelector('button');
    btn.disabled = true;
    try {
      for (const [i, file] of files.entries()) {
        btn.textContent = `अपलोड हो रही है ${i + 1}/${files.length}…`;
        await DB.add('gallery', { url: await readImg(file, 800, 'image/jpeg'), caption: cap });
      }
      f.reset(); toast(`✅ ${files.length} फोटो जुड़ गईं`); loadAdmin();
    } catch (err) { fail(err); }
    btn.disabled = false; btn.textContent = 'फोटो जोड़ें';
  };

  // Delete (event delegation)
  document.addEventListener('click', async e => {
    const b = e.target.closest('[data-del]');
    if (!b || !ok() || !confirm('क्या आप इसे हटाना चाहते हैं?')) return;
    const [col, id] = b.dataset.del.split('|'); await DB.del(col, id); loadAdmin();
  });

  // Grievances CSV (Excel me Hindi sahi dikhe isliye BOM)
  $('#csv').onclick = async () => {
    const r = await DB.list('grievances'), h = ['name', 'dept', 'empId', 'mobile', 'issue', 'ts'];
    const rows = [h, ...r.map(x => h.map(k => k === 'ts' ? new Date(+x.ts).toLocaleString('hi-IN') : (x[k] || '')))];
    const csv = '\ufeff' + rows.map(a => a.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = 'grievances.csv'; a.click();
  };
  // --- Logo + Adhyaksh ---
  const pick = (fileId, prevId, key, max, type) => $(fileId).onchange = async e => {
    const f = e.target.files[0]; if (!f) return;
    try { A.pend[key] = await readImg(f, max, type); $(prevId).src = A.pend[key]; } catch { toast('❌ फोटो पढ़ी नहीं जा सकी'); }
  };
  pick('#logoFile', '#logoPrev', 'logo', 300, 'image/png');
  pick('#photoFile', '#photoPrev', 'photo', 500, 'image/jpeg');
  pick('#tFile', '#tPrev', 'tphoto', 400, 'image/jpeg');
  $('#siteForm').onsubmit = async e => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    if (A.pend.logo) d.logo = A.pend.logo;
    if (A.pend.photo) d.photo = A.pend.photo;
    try { await DB.set('settings', 'site', d); A.pend.logo = A.pend.photo = null; toast('✅ सेव हो गया'); } catch (err) { fail(err); }
  };

  // --- Padadhikari: jodna / badalna ---
  const teamReset = () => {
    A.editId = null; A.pend.tphoto = null; $('#teamForm').reset(); $('#tPrev').src = PH;
    $('#tBtn').textContent = 'पदाधिकारी जोड़ें'; $('#tCancel').classList.add('hidden');
  };
  $('#teamForm').onsubmit = async e => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    if (A.pend.tphoto) d.photo = A.pend.tphoto;
    try {
      if (A.editId) await DB.set('team', A.editId, d);
      else await DB.add('team', { ...d, photo: d.photo || '', ord: Date.now() });
      teamReset(); toast('✅ सेव हो गया'); loadAdmin();
    } catch (err) { fail(err); }
  };
  $('#tCancel').onclick = teamReset;
  document.addEventListener('click', async e => {
    if (!ok()) return;
    const b = e.target.closest('[data-edit]');
    if (b) {   // ✏️ dabane par form me purani details bharna
      const m = A.team.find(x => x.id === b.dataset.edit), f = $('#teamForm').elements;
      A.editId = m.id; A.pend.tphoto = null; $('#tFile').value = '';
      f.name.value = m.name; f.role.value = m.role; $('#tPrev').src = m.photo || PH;
      $('#tBtn').textContent = 'अपडेट करें'; $('#tCancel').classList.remove('hidden');
      $('#teamForm').scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    if (e.target.id === 'seed') {   // default list ko database me daalna
      e.target.disabled = true;
      for (const [i, m] of CONFIG.team.entries()) await DB.add('team', { ...m, ord: i + 1 });
      loadAdmin();
    }
  });
  show();
}
async function fillSite() {
  const s = await getSite(), f = $('#siteForm').elements;
  f.name.value = s.name; f.title.value = s.title; f.msg.value = s.msg;
  $('#photoPrev').src = s.photo || PH; $('#logoPrev').src = s.logo || 'images/logo.png'; $('#tPrev').src = PH;
}

/* ---------- 6. Start ---------- */
document.addEventListener('DOMContentLoaded', () => document.body.dataset.page === 'admin' ? initAdmin() : initHome());
