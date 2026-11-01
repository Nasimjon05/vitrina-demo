# Nafis Libos — Vitrina namunasi

Hisoft "Vitrina" paketining namunasi: kiyim do'koni katalogi. Server yo'q, oddiy statik sayt.

- Mijoz katalogni ko'radi, o'lcham va rangni tanlaydi. "Buyurtma berish" sotuvchining Telegram chatini tayyor xabar bilan ochadi.
- Sotuvchi paneli: Do'kon haqida → "Sotuvchi sifatida kirish". Mahsulot qo'shish, tahrirlash, yashirish; kombolar (bir nechta mahsulot bitta narxda, har biriga o'lcham va rang tanlanadi); bosh sahifa bannerlari (rasm, matn, havola, tartib). O'zgarishlar faqat shu qurilmada saqlanadi.
- Yangi mijoz uchun faqat `config.js` va `products.js` o'zgartiriladi.
- Fayl o'zgarsa, `index.html` dagi `?v=N` raqamlarini oshiring (Telegram fayllarni keshlaydi).

Mahalliy ishga tushirish: `python -m http.server 5174` (shu papkada).
