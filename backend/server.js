require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const path = require("path");

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(morgan("tiny"));
app.use("/api", rateLimit({ windowMs: 60_000, limit: 90 }));
app.use(express.static(path.join(__dirname, "../frontend")));

app.get("/api/health", (_req, res) => res.json({ ok: true, service: "QR PRODUCT AI PRO" }));

app.post("/api/translate", async (req, res) => {
  const { text, source = "auto", target = "uz" } = req.body || {};
  if (!text || typeof text !== "string" || text.length > 5000) {
    return res.status(400).json({ error: "Matn 1–5000 belgi bo‘lishi kerak." });
  }
  const endpoint = process.env.TRANSLATE_URL;
  if (!endpoint) {
    return res.status(503).json({ error: "Tarjima xizmati sozlanmagan. .env faylida TRANSLATE_URL kiriting." });
  }
  try {
    const payload = { q: text, source, target, format: "text" };
    if (process.env.TRANSLATE_API_KEY) payload.api_key = process.env.TRANSLATE_API_KEY;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error(`Translation provider returned ${response.status}`);
    const data = await response.json();
    if (!data.translatedText) throw new Error("Tarjima javobi topilmadi.");
    res.json({ translatedText: data.translatedText });
  } catch (err) {
    res.status(502).json({ error: "Tarjima xizmatiga ulanib bo‘lmadi.", detail: err.message });
  }
});

app.use((req, res) => {
  if (req.path.startsWith("/api/")) return res.status(404).json({ error: "API endpoint topilmadi." });
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

app.listen(PORT, () => console.log(`QR PRODUCT AI PRO: http://localhost:${PORT}`));
