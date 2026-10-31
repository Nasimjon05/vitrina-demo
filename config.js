// Shop settings. For a new client, change this file and products.js — not the app code.
window.SHOP = {
  name: 'Nafis Libos',
  logo: 'nafis',
  // Orders open a chat with this Telegram username, the message already filled in.
  telegram: 'nsmjn_xnjnv',
  phone: '+998 90 123 45 67',
  address: 'Toshkent, Chilonzor tumani, 9-kvartal',
  hours: '10:00 – 20:00',
  delivery: 'Toshkent bo‘ylab 1 kunda, viloyatlarga 2–3 kunda. Narxi sotuvchi bilan kelishiladi.',
  // Demo only: shows a "Sotuvchi sifatida kirish" button. Set false for a real client.
  demoSeller: true,
  maxProducts: 100,

  banners: [
    { photo: '1483985988355-763728e1935b', tag: 'Kuzgi kolleksiya', title: 'Yangi mavsum —<br>yangi libos', go: '#/cat/new' },
    { photo: '1475180098004-ca77a66827be', tag: 'Chegirma', title: '30% gacha<br>arzonroq', go: '#/cat/sale' },
    { photo: '1490481651871-ab68de25d43d', tag: 'Har kuni', title: 'Oddiy, lekin<br>nafis', go: '#/cat/tees' }
  ],

  categories: [
    { id: 'dresses', name: 'Ko‘ylaklar' },
    { id: 'outer', name: 'Ustki kiyim' },
    { id: 'tees', name: 'Futbolka va svitshot' },
    { id: 'pants', name: 'Shimlar' },
    { id: 'suits', name: 'Kostyumlar' },
    { id: 'bags', name: 'Sumkalar' }
  ],

  // Colors the seller can pick in the panel.
  colors: {
    'Qora': '#1d1d1f', 'Oq': '#f7f7f5', 'Kulrang': '#9a9ca1', 'Qizil': '#c0262d', 'Bordo': '#6e1a2c',
    'Ko‘k': '#2f4b7c', 'Havorang': '#9fc3de', 'Yashil': '#4f6b4a', 'Xaki': '#a8996f', 'Jigarrang': '#7a4a2e',
    'Bej': '#d9c8ad', 'Sariq': '#e7b928', 'Pushti': '#e6a3b4'
  }
};
