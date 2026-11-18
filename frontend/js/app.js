const $ = (id) => document.getElementById(id);
const API = "/api";
let scanner = null;
let currentCode = "";
let selectedImage = null;
let toastTimer;

function toast(message) {
  const el = $("toast"); el.textContent = message; el.classList.add("show");
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove("show"), 3000);
}
function setScanMessage(msg) { $("scanMessage").textContent = msg; }
function saveHistory(label, type="Tekshiruv") {
  const items = JSON.parse(localStorage.getItem("qrpai_history") || "[]");
  items.unshift({ label, type, date: new Date().toLocaleString("uz-UZ") });
  localStorage.setItem("qrpai_history", JSON.stringify(items.slice(0, 12)));
  renderHistory();
}
function renderHistory() {
  const items = JSON.parse(localStorage.getItem("qrpai_history") || "[]");
  $("historyList").innerHTML = items.length ? items.map(x =>
    `<div class="history-item"><span>${escapeHtml(x.label)} <small>· ${escapeHtml(x.type)}</small></span><small>${escapeHtml(x.date)}</small></div>`
  ).join("") : '<div class="muted">Hozircha tekshiruvlar yo‘q.</div>';
}
function escapeHtml(s) { return String(s ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c])); }

async function lookupProduct(code) {
  code = String(code || "").trim();
  if (!code) return toast("Avval kod kiriting.");
  currentCode = code;
  $("productResult").classList.remove("hidden");
  $("productDetails").classList.add("hidden");
  $("productResult").innerHTML = '<div class="empty-icon">◌</div><b>Mahsulot qidirilmoqda...</b><span>Ochiq mahsulot bazasi tekshirilmoqda.</span>';
  try {
    const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json`);
    if (!response.ok) throw new Error("Baza bilan aloqa yo‘q.");
    const data = await response.json();
    if (data.status !== 1 || !data.product) {
      $("productResult").innerHTML = `<div class="empty-icon">⌕</div><b>Mahsulot topilmadi</b><span>${escapeHtml(code)} kodi bo‘yicha ochiq bazada ma’lumot yo‘q. Bu mahsulot mavjud emas degani emas.</span>`;
      saveHistory(code, "Topilmadi"); return;
    }
    const p = data.product;
    const details = [
      ["Brend", p.brands || "Ma’lumot yo‘q"],
      ["Kategoriya", p.categories || "Ma’lumot yo‘q"],
      ["Ishlab chiqaruvchi", p.manufacturing_places || p.origins || "Ma’lumot yo‘q"],
      ["Tarkib", p.ingredients_text || "Ma’lumot yo‘q"],
      ["Miqdor", p.quantity || "Ma’lumot yo‘q"],
      ["Barcode", code]
    ];
    $("productDetails").innerHTML = `
      <div class="product-top">${p.image_url ? `<img src="${escapeHtml(p.image_url)}" alt="Mahsulot rasmi" onerror="this.style.display='none'">` : ""}
      <div><h3>${escapeHtml(p.product_name || p.product_name_en || "Nomi kiritilmagan")}</h3><p>${escapeHtml(p.brands || "Brend noma’lum")}</p></div></div>
      ${details.map(([k,v]) => `<div class="data-row"><span>${escapeHtml(k)}</span><span>${escapeHtml(String(v).slice(0,450))}</span></div>`).join("")}
      <p class="hint">Manba: Open Food Facts. Ma’lumotlar foydalanuvchilar tomonidan kiritiladi va har doim ham to‘liq yoki tekshirilgan bo‘lmasligi mumkin.</p>`;
    $("productResult").classList.add("hidden"); $("productDetails").classList.remove("hidden");
    saveHistory(p.product_name || code, "Mahsulot");
  } catch (e) {
    $("productResult").innerHTML = `<div class="empty-icon">!</div><b>Qidiruv bajarilmadi</b><span>${escapeHtml(e.message)} Internet aloqasini tekshiring.</span>`;
    toast("Mahsulot bazasiga ulanib bo‘lmadi.");
  }
}

async function startScanner() {
  if (!window.Html5Qrcode) return toast("Skaner kutubxonasi yuklanmadi. Internetni tekshiring.");
  try {
    scanner = new Html5Qrcode("reader");
    $("reader").innerHTML = "";
    const cameras = await Html5Qrcode.getCameras();
    if (!cameras.length) throw new Error("Kamera topilmadi.");
    const cameraId = cameras[cameras.length - 1].id;
    await scanner.start(cameraId, { fps: 10, qrbox: { width: 230, height: 180 } },
      async (decodedText) => {
        currentCode = decodedText; $("barcodeInput").value = decodedText;
        await stopScanner(); setScanMessage("Kod o‘qildi: " + decodedText); lookupProduct(decodedText);
      }, () => {});
    $("startScan").disabled = true; $("stopScan").disabled = false;
    setScanMessage("Kamera faol. Kodni ramka ichiga joylashtiring.");
  } catch (e) {
    setScanMessage(e.message || "Kamera ishga tushmadi. HTTPS/localhost va kamera ruxsatini tekshiring.");
    toast("Kamerani ishga tushirib bo‘lmadi.");
    $("reader").innerHTML = '<div class="reader-placeholder"><div class="scan-symbol">⌗</div><b>Kamera ochilmadi</b><span>Saytni localhost orqali oching va brauzerda kamera ruxsatini bering.</span></div>';
  }
}
async function stopScanner() {
  if (scanner) {
    try { if (scanner.isScanning) await scanner.stop(); await scanner.clear(); } catch (_) {}
    scanner = null;
  }
  $("startScan").disabled = false; $("stopScan").disabled = true;
  $("reader").innerHTML = '<div class="reader-placeholder"><div class="scan-symbol">⌗</div><b>Kamera skaneri</b><span>Kamerani ishga tushirib, kodni ramka ichiga joylashtiring</span></div>';
}

function extractDates(text) {
  const patterns = [
    {label:"EXP / Expiry / Use by", re:/(?:EXP(?:IRY)?|USE\s*BY|ГОДЕН\s*ДО|СРОК\s*ГОДНОСТИ|YAROQLILIK\s*MUDDATI)\s*[:\-]?\s*(\d{1,2}[./-]\d{1,2}[./-]\d{2,4}|\d{4}[./-]\d{1,2}[./-]\d{1,2})/ig, kind:"expiry"},
    {label:"MFG / ishlab chiqarilgan", re:/(?:MFG|MFD|MANUFACTURED|ИЗГОТОВЛЕНО|ДАТА\s*ИЗГОТОВЛЕНИЯ|ISHLAB\s*CHIQARILGAN)\s*[:\-]?\s*(\d{1,2}[./-]\d{1,2}[./-]\d{2,4}|\d{4}[./-]\d{1,2}[./-]\d{1,2})/ig, kind:"made"},
    {label:"Best Before", re:/(?:BEST\s*BEFORE|BBE|BB|ЛУЧШЕ\s*УПОТРЕБИТЬ\s*ДО)\s*[:\-]?\s*(\d{1,2}[./-]\d{1,2}[./-]\d{2,4}|\d{4}[./-]\d{1,2}[./-]\d{1,2})/ig, kind:"best"}
  ];
  const found = [];
  for (const p of patterns) for (const m of text.matchAll(p.re)) found.push({label:p.label, raw:m[1], kind:p.kind, parsed:parseDate(m[1])});
  const generic = /(?<!\d)(\d{1,2}[./-]\d{1,2}[./-]\d{2,4}|\d{4}[./-]\d{1,2}[./-]\d{1,2})(?!\d)/g;
  for (const m of text.matchAll(generic)) if (!found.some(x => x.raw === m[1])) found.push({label:"Belgilanmagan sana",raw:m[1],kind:"unknown",parsed:parseDate(m[1])});
  return found;
}
function parseDate(raw) {
  const parts = raw.split(/[./-]/).map(Number); let y,m,d;
  if (parts[0] > 31) [y,m,d] = parts; else { [d,m,y] = parts; }
  if (y < 100) y += y >= 50 ? 1900 : 2000;
  if (!y || !m || !d || m > 12 || d > 31) return null;
  const dt = new Date(y,m-1,d);
  if (dt.getFullYear() !== y || dt.getMonth() !== m-1 || dt.getDate() !== d) return null;
  return dt;
}
function showDates() {
  const results = extractDates($("ocrText").value);
  if (!results.length) { $("dateResult").innerHTML = '<span class="muted">Tanish sana topilmadi. Sana yonidagi MFG, EXP yoki Best Before yozuvini ham kiriting.</span>'; return; }
  $("dateResult").innerHTML = results.map(x => {
    let state = "Sana formati tekshirilsin";
    if (x.parsed) {
      const today = new Date(); today.setHours(0,0,0,0);
      state = x.kind === "expiry" || x.kind === "best" ? (x.parsed < today ? "Sana o‘tgan bo‘lishi mumkin" : "Sana hali kelmagan") : "Ishlab chiqarilgan sana";
    }
    return `<div class="date-item"><span>${escapeHtml(x.label)} · ${escapeHtml(x.raw)}</span><strong>${state}</strong></div>`;
  }).join("") + '<p class="hint">Bu avtomatik taxmin. Sana formatini qadoqning o‘zidan tekshiring; tizim yaroqlilik muddatini o‘zi hisoblab topa olmaydi.</p>';
}
async function runOCR() {
  if (!selectedImage) return;
  if (!window.Tesseract) return toast("OCR kutubxonasi yuklanmadi.");
  $("runOcr").disabled = true; $("ocrProgress").classList.remove("hidden");
  $("ocrStatus").textContent = "OCR modeli yuklanmoqda. Birinchi ishga tushishda vaqt olishi mumkin.";
  try {
    const lang = $("ocrLang").value;
    const result = await Tesseract.recognize(selectedImage, lang, {
      logger: m => { if (m.status) $("ocrStatus").textContent = m.status; if (m.progress) $("progressBar").style.width = `${Math.round(m.progress*100)}%`; }
    });
    $("ocrText").value = (result.data.text || "").trim();
    $("ocrStatus").textContent = "Matn tanildi. Natijani qadoq bilan solishtirib tekshiring.";
    showDates(); saveHistory("Qadoq OCR tahlili", "OCR");
  } catch (e) {
    $("ocrStatus").textContent = "OCR bajarilmadi: " + e.message;
    toast("OCR bajarilmadi. Til paketi yoki internetni tekshiring.");
  } finally { $("runOcr").disabled = false; }
}
async function translateText() {
  const text = $("ocrText").value.trim();
  if (!text) return toast("Tarjima qilish uchun matn kiriting.");
  $("translateBtn").disabled = true; $("translatedText").value = "Tarjima qilinmoqda...";
  try {
    const res = await fetch(`${API}/translate`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({text,source:"auto",target:"uz"}) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Tarjima bajarilmadi.");
    $("translatedText").value = data.translatedText;
  } catch (e) {
    $("translatedText").value = "";
    toast(e.message + " Serverdagi .env sozlamasini tekshiring.");
  } finally { $("translateBtn").disabled = false; }
}

$("startScan").addEventListener("click", startScanner);
$("stopScan").addEventListener("click", stopScanner);
$("lookupBtn").addEventListener("click", () => lookupProduct($("barcodeInput").value));
$("barcodeInput").addEventListener("keydown", e => { if (e.key === "Enter") lookupProduct(e.target.value); });
$("chooseImage").addEventListener("click", () => $("imageInput").click());
$("imageDrop").addEventListener("click", e => { if (e.target.id !== "chooseImage") $("imageInput").click(); });
$("imageInput").addEventListener("change", e => {
  const file = e.target.files[0]; if (!file) return;
  if (!file.type.startsWith("image/")) return toast("Faqat rasm faylini tanlang.");
  if (file.size > 12*1024*1024) return toast("Rasm 12 MB dan kichik bo‘lishi kerak.");
  selectedImage = file; $("imagePreview").src = URL.createObjectURL(file);
  $("imagePreview").classList.remove("hidden"); $("imageDrop").classList.add("hidden");
  $("runOcr").disabled = false; $("ocrStatus").textContent = "Rasm tayyor. OCR tilini tanlang.";
});
$("runOcr").addEventListener("click", runOCR);
$("findDates").addEventListener("click", showDates);
$("ocrText").addEventListener("input", () => { /* original text remains editable */ });
$("translateBtn").addEventListener("click", translateText);
$("saveCondition").addEventListener("click", () => {
  const selected = [...document.querySelectorAll(".checks input:checked")].map(x => x.value);
  if (!selected.length) return toast("Kamida bitta kuzatuvni belgilang.");
  $("conditionMessage").textContent = "Kuzatuv saqlandi: " + selected.join(", ");
  saveHistory(selected.join(", "), "Qadoq kuzatuvi");
});
$("clearHistory").addEventListener("click", () => { localStorage.removeItem("qrpai_history"); renderHistory(); toast("Tarix tozalandi."); });
renderHistory();
