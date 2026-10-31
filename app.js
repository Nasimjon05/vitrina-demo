// Vitrina demo: catalog + "Buyurtma berish" opens the seller's Telegram chat with the order filled in.
// No server: the seller's edits are saved only on this device (localStorage).
(() => {
  const S = window.SHOP;
  const tg = window.Telegram && Telegram.WebApp && Telegram.WebApp.initData !== undefined ? Telegram.WebApp : null;
  const inTG = !!(tg && tg.platform && tg.platform !== 'unknown');
  const app = document.getElementById('app');
  const KEY = 'nafis:v1', SELLER = 'nafis:seller';

  // ---------- data ----------
  const store = {
    load() {
      try { const d = JSON.parse(localStorage.getItem(KEY)); if (d && Array.isArray(d.products)) return d.products; } catch (e) {}
      return JSON.parse(JSON.stringify(window.PRODUCTS));
    },
    save() { try { localStorage.setItem(KEY, JSON.stringify({ products })); return true; } catch (e) { toast('Saqlab bo‘lmadi: xotira to‘lgan'); return false; } },
    reset() { try { localStorage.removeItem(KEY); } catch (e) {} products = store.load(); }
  };
  let products = store.load();
  const visible = () => products.filter(p => !p.hidden);
  const byId = id => products.find(p => p.id === id);
  const catName = id => (S.categories.find(c => c.id === id) || {}).name || '';
  let seller = false;
  try { seller = sessionStorage.getItem(SELLER) === '1'; } catch (e) {}

  // ---------- helpers ----------
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = n => Number(n || 0).toLocaleString('ru-RU').replace(/,/g, ' ') + ' so‘m';
  const img = (src, w) => !src ? '' : /^(https?:|data:)/.test(src) ? src : `https://images.unsplash.com/photo-${src}?auto=format&fit=crop&w=${w}&q=75`;
  const isSale = p => p.oldPrice && p.oldPrice > p.price;
  const ICON = {
    search: '<path d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3"/>',
    back: '<path d="M15 18l-6-6 6-6"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/>',
    send: '<path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>',
    truck: '<path d="M1 4h14v12H1zM15 9h4l3 3v4h-7"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>',
    pin: '<path d="M12 22s7-6.5 7-12a7 7 0 0 0-14 0c0 5.5 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>',
    tg: '<path d="M21.5 4.5L2.8 11.7c-.9.4-.9 1.6.1 1.9l4.6 1.4 1.8 5.6c.2.7 1.1.9 1.6.4l2.6-2.5 4.8 3.5c.6.4 1.4.1 1.6-.6l3.3-15.6c.2-.8-.6-1.5-1.4-1.2zM9.5 14.6l8.3-7.3"/>',
    store: '<path d="M3 9l1.5-5h15L21 9M3 9h18v11H3zM9 20v-6h6v6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16zM14 6l4 4"/>'
  };
  const icon = n => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[n]}</svg>`;
  let toastT;
  function toast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2400);
  }
  const haptic = t => { try { tg && tg.HapticFeedback && tg.HapticFeedback.impactOccurred(t || 'light'); } catch (e) {} };
  function openLink(url) {
    if (inTG && /^https:\/\/t\.me\//.test(url)) tg.openTelegramLink(url);
    else if (inTG) tg.openLink(url);
    else window.open(url, '_blank', 'noopener');
  }

  // ---------- views ----------
  function card(p) {
    const tag = isSale(p) ? `<span class="tag sale">−${Math.round((1 - p.price / p.oldPrice) * 100)}%</span>` : p.isNew ? '<span class="tag">Yangi</span>' : '';
    return `<a class="card" href="#/p/${esc(p.id)}">
      <div class="ph"><img src="${img(p.photo, 500)}" alt="${esc(p.name)}" loading="lazy">${tag}</div>
      <div class="nm">${esc(p.name)}</div>
      <div class="price num ${isSale(p) ? 'sale' : ''}"><b>${money(p.price)}</b>${isSale(p) ? `<s>${money(p.oldPrice)}</s>` : ''}</div>
      ${p.colors && p.colors.length > 1 ? `<div class="dots">${p.colors.map(c => `<i style="background:${S.colors[c] || '#ccc'}" title="${esc(c)}"></i>`).join('')}</div>` : ''}
    </a>`;
  }
  const header = () => `<header class="top">
      <a class="logo" href="#/">${esc(S.logo)}<i>.</i></a><span class="grow"></span>
      ${seller ? `<a class="btn sm" href="#/seller">${icon('store')} Panel</a>` : ''}
      <a class="icon-btn" href="#/info" aria-label="Do‘kon haqida">${icon('info')}</a>
    </header>`;
  const chips = active => `<nav class="chips">
      <a class="chip ${active === 'all' ? 'on' : ''}" href="#/cat/all">Barchasi</a>
      ${S.categories.map(c => `<a class="chip ${active === c.id ? 'on' : ''}" href="#/cat/${c.id}">${esc(c.name)}</a>`).join('')}
    </nav>`;

  function home() {
    const list = visible(), fresh = list.filter(p => p.isNew), sale = list.filter(isSale);
    return `${header()}
      <label class="search">${icon('search')}<input id="q" type="search" placeholder="Ko‘ylak, kurtka, sumka…" enterkeyhint="search"></label>
      <div class="banners">${S.banners.map(b => `<a class="banner" href="${b.go}"><img src="${img(b.photo, 900)}" alt=""><div><small>${esc(b.tag)}</small><h2>${b.title}</h2></div></a>`).join('')}</div>
      ${chips('')}
      ${fresh.length ? `<section class="sec"><div class="sec-head"><h2>Yangi kelganlar</h2><a href="#/cat/new">Barchasi</a></div><div class="hscroll">${fresh.map(card).join('')}</div></section>` : ''}
      ${sale.length ? `<section class="sec"><div class="sec-head"><h2>Chegirmalar</h2><a href="#/cat/sale">Barchasi</a></div><div class="hscroll">${sale.map(card).join('')}</div></section>` : ''}
      <section class="sec"><div class="sec-head"><h2>Barcha mahsulotlar</h2></div><div class="grid">${list.map(card).join('')}</div></section>`;
  }

  function category(id) {
    const list = visible();
    const items = id === 'all' ? list : id === 'new' ? list.filter(p => p.isNew) : id === 'sale' ? list.filter(isSale) : list.filter(p => p.cat === id);
    const title = id === 'all' ? 'Barchasi' : id === 'new' ? 'Yangi kelganlar' : id === 'sale' ? 'Chegirmalar' : catName(id);
    return `${header()}${chips(id)}
      <section class="sec"><div class="sec-head"><h2>${esc(title)}</h2><span class="num" style="color:var(--muted);font-size:14px">${items.length} ta</span></div>
      ${items.length ? `<div class="grid">${items.map(card).join('')}</div>` : '<p class="empty">Bu bo‘limda hozircha mahsulot yo‘q.</p>'}</section>`;
  }

  function search(q) {
    const s = q.trim().toLowerCase();
    const items = visible().filter(p => (p.name + ' ' + catName(p.cat) + ' ' + (p.desc || '')).toLowerCase().includes(s));
    return `${header()}
      <label class="search">${icon('search')}<input id="q" type="search" value="${esc(q)}" placeholder="Ko‘ylak, kurtka, sumka…" enterkeyhint="search"></label>
      <section class="sec" style="padding-top:4px"><div class="sec-head"><h2>“${esc(q)}”</h2><span class="num" style="color:var(--muted);font-size:14px">${items.length} ta</span></div>
      ${items.length ? `<div class="grid">${items.map(card).join('')}</div>` : '<p class="empty">Hech narsa topilmadi. Boshqa so‘z bilan qidirib ko‘ring.</p>'}</section>`;
  }

  const pick = { size: '', color: '' };
  function product(id) {
    const p = byId(id);
    if (!p || (p.hidden && !seller)) return `${header()}<p class="empty">Mahsulot topilmadi.</p>`;
    pick.size = p.sizes && p.sizes.length === 1 ? p.sizes[0] : '';
    pick.color = p.colors && p.colors.length === 1 ? p.colors[0] : '';
    return `<div class="pp-ph"><img src="${img(p.photo, 1000)}" alt="${esc(p.name)}">${inTG ? '' : `<a class="icon-btn back" href="#/" aria-label="Orqaga">${icon('back')}</a>`}</div>
      <div class="pp">
        <div style="display:grid;gap:8px">
          <span style="color:var(--muted);font-size:13px">${esc(catName(p.cat))}</span>
          <h1>${esc(p.name)}</h1>
          <div class="price num ${isSale(p) ? 'sale' : ''}"><b>${money(p.price)}</b>${isSale(p) ? `<s>${money(p.oldPrice)}</s>` : ''}</div>
        </div>
        ${p.sizes && p.sizes.length ? `<div class="opt"><h3>O‘lcham <span id="sizeL">${esc(pick.size)}</span></h3><div class="opts">${p.sizes.map(s => `<button class="size ${pick.size === s ? 'on' : ''}" data-size="${esc(s)}">${esc(s)}</button>`).join('')}</div></div>` : ''}
        ${p.colors && p.colors.length ? `<div class="opt"><h3>Rang <span id="colorL">${esc(pick.color)}</span></h3><div class="opts">${p.colors.map(c => `<button class="swatch ${pick.color === c ? 'on' : ''}" data-color="${esc(c)}" style="background:${S.colors[c] || '#ccc'}" aria-label="${esc(c)}" title="${esc(c)}"></button>`).join('')}</div></div>` : ''}
        ${p.desc ? `<p class="desc">${esc(p.desc)}</p>` : ''}
        <div class="note">${icon('truck')}<span>${esc(S.delivery)}</span></div>
        <div class="note">${icon('tg')}<span>“Buyurtma berish” bosilganda sotuvchi bilan chat ochiladi. Mahsulot, o‘lcham va rang xabarga avtomatik yoziladi, siz faqat yuborasiz.</span></div>
      </div>
      <div class="bar"><div><button class="btn primary" data-act="order" data-id="${esc(p.id)}">${icon('send')} Buyurtma berish</button></div></div>`;
  }

  function order(p) {
    if (p.sizes && p.sizes.length && !pick.size) { toast('Avval o‘lchamni tanlang'); haptic('medium'); return; }
    if (p.colors && p.colors.length && !pick.color) { toast('Avval rangni tanlang'); haptic('medium'); return; }
    const lines = ['Assalomu alaykum! Buyurtma bermoqchiman:', '', `🛍 ${p.name}`];
    if (pick.size) lines.push(`📏 O‘lcham: ${pick.size}`);
    if (pick.color) lines.push(`🎨 Rang: ${pick.color}`);
    lines.push(`💰 Narxi: ${money(p.price)}`, '', `${S.name} vitrinasidan`);
    haptic('medium');
    openLink(`https://t.me/${S.telegram}?text=${encodeURIComponent(lines.join('\n'))}`);
  }

  function info() {
    return `${header()}
      <div class="info">
        <h1 style="font-size:28px">${esc(S.name)}</h1>
        <div class="box">
          <a class="row" href="https://t.me/${esc(S.telegram)}" data-act="link">${icon('tg')}<span><small>Telegram</small>@${esc(S.telegram)}</span></a>
          <div class="row">${icon('phone')}<span><small>Telefon</small><span class="num">${esc(S.phone)}</span></span></div>
          <div class="row">${icon('pin')}<span><small>Manzil</small>${esc(S.address)}</span></div>
          <div class="row">${icon('clock')}<span><small>Ish vaqti</small><span class="num">${esc(S.hours)}</span></span></div>
          <div class="row">${icon('truck')}<span><small>Yetkazib berish</small>${esc(S.delivery)}</span></div>
        </div>
        ${S.demoSeller ? (seller
          ? `<a class="btn" href="#/seller">${icon('store')} Sotuvchi paneli</a><button class="btn" data-act="sellerOff">Xaridor ko‘rinishiga qaytish</button>`
          : `<button class="btn" data-act="sellerOn">${icon('store')} Sotuvchi sifatida kirish</button><p class="demo-hint">Namuna uchun: sotuvchi mahsulotlarni qanday boshqarishini ko‘ring.</p>`) : ''}
      </div>`;
  }

  // ---------- seller panel ----------
  function sellerHome() {
    const n = products.length, max = S.maxProducts;
    return `${header()}
      <div class="seller-head">
        <h1>Mahsulotlar</h1>
        <span class="num" style="color:var(--muted);font-size:14px">${n} / ${max} ta mahsulot · ${visible().length} tasi ko‘rinadi</span>
        <div class="meter"><i style="width:${Math.min(100, n / max * 100)}%"></i></div>
      </div>
      <div class="plist">${products.map(p => `
        <div class="pitem ${p.hidden ? 'off' : ''}">
          <img src="${img(p.photo, 160)}" alt="">
          <a class="t" href="#/seller/edit/${esc(p.id)}"><b>${esc(p.name)}</b><small class="num">${money(p.price)} · ${esc(catName(p.cat))}</small></a>
          <label class="switch" title="Ko‘rinishi"><input type="checkbox" data-act="toggle" data-id="${esc(p.id)}" ${p.hidden ? '' : 'checked'} aria-label="${esc(p.name)} ko‘rinsin"><i></i></label>
        </div>`).join('')}
        <button class="danger" data-act="reset">Namunaviy mahsulotlarni tiklash</button>
      </div>
      <div class="bar"><div><a class="btn primary" href="#/seller/edit/new">${icon('plus')} Mahsulot qo‘shish</a></div></div>`;
  }

  let draft = null;
  function sellerEdit(id) {
    const isNew = id === 'new';
    if (isNew && products.length >= S.maxProducts) return `${header()}<p class="empty">Vitrina paketida ${S.maxProducts} tagacha mahsulot qo‘shish mumkin.</p>`;
    const p = isNew ? { id: '', name: '', cat: S.categories[0].id, price: '', oldPrice: '', sizes: [], colors: [], desc: '', photo: '', isNew: true } : byId(id);
    if (!p) return `${header()}<p class="empty">Mahsulot topilmadi.</p>`;
    draft = { id: p.id, photo: p.photo, colors: [...(p.colors || [])] };
    return `${header()}
      <div class="seller-head"><h1>${isNew ? 'Yangi mahsulot' : 'Tahrirlash'}</h1></div>
      <form class="form" id="pform" novalidate>
        <div class="photo-pick"><img id="phPrev" ${p.photo ? `src="${img(p.photo, 200)}"` : ''} alt="">
          <label for="phFile">Rasm yuklash<br><small>telefon galereyasidan</small></label><input id="phFile" type="file" accept="image/*"></div>
        <label class="field"><span>Nomi</span><input id="f-name" value="${esc(p.name)}" required maxlength="80" placeholder="Masalan: Qora charm kurtka"></label>
        <label class="field"><span>Bo‘lim</span><select id="f-cat">${S.categories.map(c => `<option value="${c.id}" ${c.id === p.cat ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select></label>
        <div class="two">
          <label class="field"><span>Narxi, so‘m</span><input id="f-price" inputmode="numeric" value="${esc(p.price)}" placeholder="350000"></label>
          <label class="field"><span>Eski narxi (chegirma)</span><input id="f-old" inputmode="numeric" value="${esc(p.oldPrice || '')}" placeholder="ixtiyoriy"></label>
        </div>
        <label class="field"><span>O‘lchamlar (vergul bilan)</span><input id="f-sizes" value="${esc((p.sizes || []).join(', '))}" placeholder="S, M, L, XL"></label>
        <div class="field"><span>Ranglar</span><div class="opts pick-colors">${Object.entries(S.colors).map(([c, hex]) => `<button type="button" class="swatch ${draft.colors.includes(c) ? 'on' : ''}" data-pc="${esc(c)}" style="background:${hex}" aria-label="${esc(c)}" title="${esc(c)}"></button>`).join('')}</div></div>
        <label class="field"><span>Tavsif</span><textarea id="f-desc" maxlength="400" placeholder="Matosi, bichimi, nimaga mos">${esc(p.desc)}</textarea></label>
        <label class="field" style="grid-template-columns:auto 1fr;align-items:center;gap:12px"><span class="switch"><input id="f-new" type="checkbox" ${p.isNew ? 'checked' : ''}><i></i></span><span style="font-weight:500;color:var(--ink)">“Yangi kelganlar”da ko‘rsatish</span></label>
        ${isNew ? '' : `<button type="button" class="danger" data-act="del" data-id="${esc(p.id)}">Mahsulotni o‘chirish</button>`}
      </form>
      <div class="bar"><div><a class="btn" href="#/seller">Bekor qilish</a><button class="btn primary" data-act="saveP">Saqlash</button></div></div>`;
  }

  function saveProduct() {
    const v = id => document.getElementById(id).value.trim();
    const num = s => parseInt(String(s).replace(/\D/g, ''), 10) || 0;
    const name = v('f-name'), price = num(v('f-price')), old = num(v('f-old'));
    if (!name) { toast('Mahsulot nomini yozing'); return; }
    if (!price) { toast('Narxini kiriting'); return; }
    if (!draft.photo) { toast('Rasm yuklang'); return; }
    const data = {
      name, cat: v('f-cat'), price, oldPrice: old > price ? old : undefined,
      sizes: v('f-sizes').split(',').map(s => s.trim()).filter(Boolean),
      colors: draft.colors, desc: v('f-desc'), photo: draft.photo, isNew: document.getElementById('f-new').checked
    };
    if (draft.id) Object.assign(byId(draft.id), data);
    else products.unshift({ id: 'p' + Date.now().toString(36), ...data });
    if (store.save()) { toast('Saqlandi ✓'); haptic('light'); location.hash = '#/seller'; }
  }

  function readPhoto(file) {
    const r = new FileReader();
    r.onload = () => {
      const im = new Image();
      im.onload = () => {
        const k = Math.min(1, 900 / Math.max(im.width, im.height));
        const c = document.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
        c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
        draft.photo = c.toDataURL('image/jpeg', 0.8);
        document.getElementById('phPrev').src = draft.photo;
      };
      im.src = r.result;
    };
    r.readAsDataURL(file);
  }

  // ---------- router ----------
  function route() {
    const h = location.hash.startsWith('#/') ? location.hash.slice(2) : ''; // ignores Telegram's #tgWebAppData=…
    const [a, b, c] = h.split('/').map(decodeURIComponent);
    let html, root = !a;
    if (!a) html = home();
    else if (a === 'cat') html = category(b || 'all');
    else if (a === 'q') html = search(b || '');
    else if (a === 'p') html = product(b);
    else if (a === 'info') html = info();
    else if (a === 'seller' && seller) html = b === 'edit' ? sellerEdit(c) : sellerHome();
    else { html = home(); root = true; }
    app.innerHTML = html;
    window.scrollTo(0, 0);
    if (inTG) root ? tg.BackButton.hide() : tg.BackButton.show();
  }

  // ---------- events ----------
  app.addEventListener('click', e => {
    const el = e.target.closest('[data-act],[data-size],[data-color],[data-pc]');
    if (!el) return;
    if (el.dataset.size !== undefined) {
      pick.size = el.dataset.size; haptic();
      app.querySelectorAll('[data-size]').forEach(b => b.classList.toggle('on', b === el));
      document.getElementById('sizeL').textContent = pick.size; return;
    }
    if (el.dataset.color !== undefined) {
      pick.color = el.dataset.color; haptic();
      app.querySelectorAll('[data-color]').forEach(b => b.classList.toggle('on', b === el));
      document.getElementById('colorL').textContent = pick.color; return;
    }
    if (el.dataset.pc !== undefined) {
      const c = el.dataset.pc, i = draft.colors.indexOf(c);
      i < 0 ? draft.colors.push(c) : draft.colors.splice(i, 1);
      el.classList.toggle('on', i < 0); return;
    }
    const act = el.dataset.act;
    if (act === 'order') order(byId(el.dataset.id));
    else if (act === 'link') { e.preventDefault(); openLink(el.href); }
    else if (act === 'sellerOn' || act === 'sellerOff') {
      seller = act === 'sellerOn';
      try { seller ? sessionStorage.setItem(SELLER, '1') : sessionStorage.removeItem(SELLER); } catch (er) {}
      location.hash = seller ? '#/seller' : '#/'; if (!seller) route();
    }
    else if (act === 'toggle') {
      const p = byId(el.dataset.id); p.hidden = !el.checked;
      el.closest('.pitem').classList.toggle('off', p.hidden);
      store.save(); toast(p.hidden ? 'Mahsulot yashirildi' : 'Mahsulot vitrinada ko‘rinadi');
      const meta = app.querySelector('.seller-head span'); if (meta) meta.textContent = `${products.length} / ${S.maxProducts} ta mahsulot · ${visible().length} tasi ko‘rinadi`;
    }
    else if (act === 'saveP') saveProduct();
    else if (act === 'del') {
      if (el.dataset.confirm !== '1') { el.dataset.confirm = '1'; el.textContent = 'Rostdan o‘chirilsinmi? Yana bir marta bosing'; return; }
      products = products.filter(p => p.id !== el.dataset.id); store.save(); toast('O‘chirildi'); location.hash = '#/seller';
    }
    else if (act === 'reset') {
      if (el.dataset.confirm !== '1') { el.dataset.confirm = '1'; el.textContent = 'Barcha o‘zgarishlar o‘chadi. Yana bir marta bosing'; return; }
      store.reset(); toast('Namuna tiklandi'); route();
    }
  });
  app.addEventListener('change', e => { if (e.target.id === 'phFile' && e.target.files[0]) readPhoto(e.target.files[0]); });
  app.addEventListener('keydown', e => {
    if (e.target.id === 'q' && e.key === 'Enter') { const q = e.target.value.trim(); location.hash = q ? '#/q/' + encodeURIComponent(q) : '#/'; e.target.blur(); }
  });
  window.addEventListener('hashchange', route);

  if (inTG) {
    tg.ready(); tg.expand();
    try { tg.setHeaderColor('#F2F1EE'); tg.setBackgroundColor('#F2F1EE'); } catch (e) {}
    tg.BackButton.onClick(() => history.length > 1 ? history.back() : (location.hash = '#/'));
  }
  route();
})();
