# QR PRODUCT AI PRO — TUZATILGAN BUILD

## Muhim: nega sizda oddiy oq sahifa chiqdi?
Siz sahifani VS Code Live Server orqali `127.0.0.1:5501/frontend/index.html` manzilida ochgansiz.
Oldingi HTML ichida CSS va JavaScript manzillari `/css/...` va `/js/...` deb yozilgan edi. Live Server bu fayllarni noto‘g‘ri joydan qidirgan, shuning uchun dizayn yuklanmagan.

Ushbu ZIPda CSS va JavaScript manzillari `./css/...` va `./js/...` qilib tuzatildi.

## To‘g‘ri ishga tushirish (tavsiya etiladi)
1. ZIPni yangi papkaga to‘liq Extract qiling.
2. Shu papkani VS Code'da oching (`package.json` ko‘rinib tursin).
3. Terminalni oching va quyidagilarni bajaring:

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

4. Brauzerda `http://localhost:3000` manzilini oching.

**Node server bilan ishlating.** Live Server faqat HTML/CSS ko‘rinishini tekshirish uchun ishlashi mumkin; mahsulot qidiruvi va tarjima kabi `/api` funksiyalari Node serverni talab qiladi.

## Agar `npm` topilmadi desa
Node.js LTS o‘rnating, VS Code'ni yopib qayta oching va buyruqlarni qayta bajaring.

## Funksiyalar
- Kamera orqali QR/barcode skanerlash (localhost/HTTPS va kamera ruxsati kerak).
- Open Food Facts bazasidan barcode bo‘yicha mahsulot qidirish.
- Tesseract.js yordamida qadoq OCR: ingliz, rus, xitoy (soddalashtirilgan), nemis, fransuz, ispan va turk tillari.
- MFG, EXP, Best Before kabi yorliqlardan sanani taxminiy ajratish.
- Tarjima endpointi sozlansa, original matnni saqlab o‘zbekchaga tarjima qilish.
- Qadoqdagi ko‘rinadigan holatlarni foydalanuvchi belgilab saqlashi.
- Tekshiruvlar tarixi brauzerda saqlanadi.

## Tarjima sozlash
`.env` faylida `TRANSLATE_URL` ga ishonchli LibreTranslate-mos `/translate` endpointini kiriting. Zarur bo‘lsa `TRANSLATE_API_KEY` ham kiriting, so‘ng serverni qayta ishga tushiring. Bu qiymatlar bo‘lmasa, tarjima tugmasi xizmat sozlanmaganini bildiradi.

## Cheklovlar
- OCR va sanani aniqlash xato qilishi mumkin; asl qadoq bilan tekshiring.
- Sana yozuvining o‘zi yaroqlilik muddatini hisoblash uchun yetarli bo‘lmasligi mumkin.
- Barcode/QR mahsulot haqiqiyligini isbotlamaydi.
- Rasm ichki oziq-ovqat sifatini yoki xavfsizligini aniqlamaydi.
- Mahsulot bazasida hamma mahsulot bo‘lmasligi mumkin.
- Uzbek OCR til paketi Tesseract.js standart paketlarida mavjud bo‘lmasligi mumkin; shu sababli rus/ingliz yoki boshqa mavjud tilni tanlang.
