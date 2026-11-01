// Vitrina demo: catalog + "Buyurtma berish" opens the seller's Telegram chat with the order filled in.
// No server: the seller's edits are saved only on this device (localStorage).
(() => {
  const S = window.SHOP;
  const tg = window.Telegram && Telegram.WebApp && Telegram.WebApp.initData !== undefined ? Telegram.WebApp : null;
  const inTG = !!(tg && tg.platform && tg.platform !== 'unknown');
  const app = document.getElementById('app');
  const KEY = 'nafis:v1', SELLER = 'nafis:seller';

  // ---------- data ----------
  const copy = v => JSON.parse(JSON.stringify(v));
  const store = {
    load() {
      let d = null;
      try { d = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
      products = d && Array.isArray(d.products) ? d.products : copy(window.PRODUCTS);
      combos = d && Array.isArray(d.combos) ? d.combos : copy(window.COMBOS || []);
      // Banner titles are plain text; a line break in the text becomes a line break on the banner.
      banners = d && Array.isArray(d.banners) ? d.banners : S.banners.map(b => ({ ...b, title: b.title.replace(/<br>/g, '\n') }));
    },
    save() { try { localStorage.setItem(KEY, JSON.stringify({ products, combos, banners })); return true; } catch (e) { toast('Saqlab bo‘lmadi: xotira to‘lgan'); return false; } },
    reset() { try { localStorage.removeItem(KEY); } catch (e) {} store.load(); }
  };
  let products, combos, banners;
  store.load();
  const visible = () => products.filter(p => !p.hidden);
  const byId = id => products.find(p => p.id === id);
  // A combo shows only its products that are still on sale; with fewer than 2 left it is hidden.
  const comboItems = c => c.items.map(byId).filter(p => p && !p.hidden);
  const comboSum = c => comboItems(c).reduce((s, p) => s + p.price, 0);
  const visibleCombos = () => combos.filter(c => !c.hidden && comboItems(c).length >= 2);
  const comboById = id => combos.find(c => c.id === id);
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
    edit: '<path d="M4 20h4L19 9l-4-4L4 16zM14 6l4 4"/>',
    up: '<path d="M18 15l-6-6-6 6"/>',
    down: '<path d="M6 9l6 6 6-6"/>'
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
  // Combo picture: the seller's own photo, or a collage of up to three product photos.
  const comboPic = (c, w) => c.photo
    ? `<img src="${img(c.photo, w)}" alt="${esc(c.name)}" loading="lazy">`
    : `<div class="collage n${Math.min(3, comboItems(c).length)}">${comboItems(c).slice(0, 3).map(p => `<img src="${img(p.photo, Math.round(w / 2))}" alt="" loading="lazy">`).join('')}</div>`;
  function comboCard(c) {
    const sum = comboSum(c), n = comboItems(c).length;
    return `<a class="card combo" href="#/c/${esc(c.id)}">
      <div class="ph">${comboPic(c, 700)}<span class="tag combo-tag">${n} ta mahsulot</span></div>
      <div class="nm">${esc(c.name)}</div>
      <div class="price num sale"><b>${money(c.price)}</b>${sum > c.price ? `<s>${money(sum)}</s>` : ''}</div>
      ${sum > c.price ? `<span class="save num">${money(sum - c.price)} tejaysiz</span>` : ''}
    </a>`;
  }
  const bannerTitle = t => esc(t).replace(/\n/g, '<br>');
  // Where a banner can lead: fixed lists, categories, products and combos.
  const bannerTargets = () => [
    ['#/cat/combos', 'Kombolar'], ['#/cat/new', 'Yangi kelganlar'], ['#/cat/sale', 'Chegirmalar'], ['#/cat/all', 'Barcha mahsulotlar'],
    ...S.categories.map(c => [`#/cat/${c.id}`, `Bo‘lim: ${c.name}`]),
    ...combos.map(c => [`#/c/${c.id}`, `Kombo: ${c.name}`]),
    ...products.map(p => [`#/p/${p.id}`, `Mahsulot: ${p.name}`])
  ];
  const header = () => `<header class="top">
      <a class="logo" href="#/">${esc(S.logo)}<i>.</i></a><span class="grow"></span>
      ${seller ? `<a class="btn sm" href="#/seller">${icon('store')} Panel</a>` : ''}
      <a class="icon-btn" href="#/info" aria-label="Do‘kon haqida">${icon('info')}</a>
    </header>`;
  const chips = active => `<nav class="chips">
      <a class="chip ${active === 'all' ? 'on' : ''}" href="#/cat/all">Barchasi</a>
      ${visibleCombos().length ? `<a class="chip ${active === 'combos' ? 'on' : ''}" href="#/cat/combos">Kombolar</a>` : ''}
      ${S.categories.map(c => `<a class="chip ${active === c.id ? 'on' : ''}" href="#/cat/${c.id}">${esc(c.name)}</a>`).join('')}
    </nav>`;

  function home() {
    const list = visible(), fresh = list.filter(p => p.isNew), sale = list.filter(isSale), cs = visibleCombos();
    const bs = banners.filter(b => !b.hidden);
    return `${header()}
      <label class="search">${icon('search')}<input id="q" type="search" placeholder="Ko‘ylak, kurtka, sumka…" enterkeyhint="search"></label>
      ${bs.length ? `<div class="banners">${bs.map(b => `<a class="banner" href="${esc(b.go)}"><img src="${img(b.photo, 900)}" alt=""><div>${b.tag ? `<small>${esc(b.tag)}</small>` : ''}<h2>${bannerTitle(b.title)}</h2></div></a>`).join('')}</div>` : ''}
      ${chips('')}
      ${cs.length ? `<section class="sec"><div class="sec-head"><h2>Kombolar</h2><a href="#/cat/combos">Barchasi</a></div><div class="hscroll wide">${cs.map(comboCard).join('')}</div></section>` : ''}
      ${fresh.length ? `<section class="sec"><div class="sec-head"><h2>Yangi kelganlar</h2><a href="#/cat/new">Barchasi</a></div><div class="hscroll">${fresh.map(card).join('')}</div></section>` : ''}
      ${sale.length ? `<section class="sec"><div class="sec-head"><h2>Chegirmalar</h2><a href="#/cat/sale">Barchasi</a></div><div class="hscroll">${sale.map(card).join('')}</div></section>` : ''}
      <section class="sec"><div class="sec-head"><h2>Barcha mahsulotlar</h2></div><div class="grid">${list.map(card).join('')}</div></section>`;
  }

  function category(id) {
    if (id === 'combos') {
      const cs = visibleCombos();
      return `${header()}${chips(id)}
        <section class="sec"><div class="sec-head"><h2>Kombolar</h2><span class="num" style="color:var(--muted);font-size:14px">${cs.length} ta</span></div>
        ${cs.length ? `<div class="grid one">${cs.map(comboCard).join('')}</div>` : '<p class="empty">Hozircha kombo yo‘q.</p>'}</section>`;
    }
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

  // Combo page: every product in the set gets its own size and color choice.
  const cpick = {};
  function combo(id) {
    const c = comboById(id), items = c ? comboItems(c) : [];
    if (!c || items.length < 2 || (c.hidden && !seller)) return `${header()}<p class="empty">Kombo topilmadi.</p>`;
    items.forEach(p => { cpick[p.id] = { size: p.sizes && p.sizes.length === 1 ? p.sizes[0] : '', color: p.colors && p.colors.length === 1 ? p.colors[0] : '' }; });
    const sum = comboSum(c);
    return `<div class="pp-ph combo-ph">${comboPic(c, 1000)}${inTG ? '' : `<a class="icon-btn back" href="#/" aria-label="Orqaga">${icon('back')}</a>`}</div>
      <div class="pp">
        <div style="display:grid;gap:8px">
          <span style="color:var(--muted);font-size:13px">Kombo · ${items.length} ta mahsulot</span>
          <h1>${esc(c.name)}</h1>
          <div class="price num sale"><b>${money(c.price)}</b>${sum > c.price ? `<s>${money(sum)}</s>` : ''}</div>
          ${sum > c.price ? `<span class="save num">Alohida olgandan ${money(sum - c.price)} arzon</span>` : ''}
        </div>
        ${c.desc ? `<p class="desc">${esc(c.desc)}</p>` : ''}
        <div class="citems">${items.map(p => `
          <div class="citem">
            <a class="citem-top" href="#/p/${esc(p.id)}"><img src="${img(p.photo, 200)}" alt=""><span><b>${esc(p.name)}</b><small class="num">alohida ${money(p.price)}</small></span></a>
            ${p.sizes && p.sizes.length ? `<div class="opt"><h3>O‘lcham <span data-cl-size="${esc(p.id)}">${esc(cpick[p.id].size)}</span></h3><div class="opts">${p.sizes.map(s => `<button class="size ${cpick[p.id].size === s ? 'on' : ''}" data-cid="${esc(p.id)}" data-csize="${esc(s)}">${esc(s)}</button>`).join('')}</div></div>` : ''}
            ${p.colors && p.colors.length ? `<div class="opt"><h3>Rang <span data-cl-color="${esc(p.id)}">${esc(cpick[p.id].color)}</span></h3><div class="opts">${p.colors.map(col => `<button class="swatch ${cpick[p.id].color === col ? 'on' : ''}" data-cid="${esc(p.id)}" data-ccolor="${esc(col)}" style="background:${S.colors[col] || '#ccc'}" aria-label="${esc(col)}" title="${esc(col)}"></button>`).join('')}</div></div>` : ''}
          </div>`).join('')}
        </div>
        <div class="note">${icon('truck')}<span>${esc(S.delivery)}</span></div>
      </div>
      <div class="bar"><div><button class="btn primary" data-act="orderCombo" data-id="${esc(c.id)}">${icon('send')} Komboni buyurtma qilish</button></div></div>`;
  }

  function orderCombo(c) {
    const items = comboItems(c);
    for (const p of items) {
      const k = cpick[p.id];
      if ((p.sizes && p.sizes.length && !k.size) || (p.colors && p.colors.length && !k.color)) {
        toast(`“${p.name}” uchun ${p.sizes && p.sizes.length && !k.size ? 'o‘lcham' : 'rang'}ni tanlang`); haptic('medium');
        const el = app.querySelector(`[data-cid="${CSS.escape(p.id)}"]`); if (el) el.closest('.citem').scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
    }
    const lines = ['Assalomu alaykum! Komboni buyurtma qilmoqchiman:', '', `🎁 ${c.name}`];
    items.forEach((p, i) => {
      const k = cpick[p.id], opts = [k.size && `o‘lcham ${k.size}`, k.color && `rang ${k.color}`].filter(Boolean).join(', ');
      lines.push(`${i + 1}. ${p.name}${opts ? ` (${opts})` : ''}`);
    });
    lines.push('', `💰 Kombo narxi: ${money(c.price)}`, '', `${S.name} vitrinasidan`);
    haptic('medium');
    openLink(`https://t.me/${S.telegram}?text=${encodeURIComponent(lines.join('\n'))}`);
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
  const tabs = on => `<nav class="chips seller-tabs">
      <a class="chip ${on === 'p' ? 'on' : ''}" href="#/seller">Mahsulotlar</a>
      <a class="chip ${on === 'c' ? 'on' : ''}" href="#/seller/combos">Kombolar</a>
      <a class="chip ${on === 'b' ? 'on' : ''}" href="#/seller/banners">Bannerlar</a>
    </nav>`;
  const toggle = (kind, id, off, label) => `<label class="switch" title="Ko‘rinishi"><input type="checkbox" data-act="toggle" data-kind="${kind}" data-id="${esc(id)}" ${off ? '' : 'checked'} aria-label="${esc(label)} ko‘rinsin"><i></i></label>`;

  function sellerCombos() {
    return `${header()}${tabs('c')}
      <div class="seller-head"><h1>Kombolar</h1><span style="color:var(--muted);font-size:14px">Bir nechta mahsulotni bitta narxda sotish uchun to‘plamlar</span></div>
      <div class="plist">${combos.length ? combos.map(c => `
        <div class="pitem ${c.hidden ? 'off' : ''}">
          <div class="pthumb">${comboPic(c, 160)}</div>
          <a class="t" href="#/seller/combo/${esc(c.id)}"><b>${esc(c.name)}</b><small class="num">${money(c.price)} · ${comboItems(c).length} ta mahsulot</small></a>
          ${toggle('combo', c.id, c.hidden, c.name)}
        </div>`).join('') : '<p class="empty">Hali kombo yo‘q. Birinchisini qo‘shing.</p>'}
      </div>
      <div class="bar"><div><a class="btn primary" href="#/seller/combo/new">${icon('plus')} Kombo yaratish</a></div></div>`;
  }

  function sellerComboEdit(id) {
    const isNew = id === 'new';
    const c = isNew ? { id: '', name: '', items: [], price: '', desc: '', photo: '' } : comboById(id);
    if (!c) return `${header()}<p class="empty">Kombo topilmadi.</p>`;
    draft = { id: c.id, photo: c.photo, items: [...c.items] };
    return `${header()}
      <div class="seller-head"><h1>${isNew ? 'Yangi kombo' : 'Komboni tahrirlash'}</h1></div>
      <form class="form" id="cform" novalidate>
        <label class="field"><span>Nomi</span><input id="c-name" value="${esc(c.name)}" maxlength="60" placeholder="Masalan: Kuzgi obraz"></label>
        <div class="field"><span>Mahsulotlar (kamida 2 ta) · <b id="c-count">${draft.items.length}</b> ta tanlandi</span>
          <div class="pick-list">${products.map(p => `
            <button type="button" class="pick ${draft.items.includes(p.id) ? 'on' : ''}" data-ci="${esc(p.id)}">
              <img src="${img(p.photo, 120)}" alt=""><span><b>${esc(p.name)}</b><small class="num">${money(p.price)}${p.hidden ? ' · yashirilgan' : ''}</small></span><i class="tick"></i>
            </button>`).join('')}</div>
        </div>
        <div class="sumline num">Alohida narxlar yig‘indisi: <b id="c-sum">${money(draft.items.map(byId).filter(Boolean).reduce((s, p) => s + p.price, 0))}</b></div>
        <label class="field"><span>Kombo narxi, so‘m</span><input id="c-price" inputmode="numeric" value="${esc(c.price)}" placeholder="yig‘indidan kam bo‘lsin"></label>
        <label class="field"><span>Tavsif (ixtiyoriy)</span><textarea id="c-desc" maxlength="300" placeholder="Nima uchun bu to‘plam qulay">${esc(c.desc)}</textarea></label>
        <div class="field"><span>Rasm (ixtiyoriy: bo‘sh qolsa, mahsulot rasmlaridan kollaj bo‘ladi)</span>
          <div class="photo-pick"><img id="phPrev" ${c.photo ? `src="${img(c.photo, 200)}"` : ''} alt="">
            <label for="phFile">Rasm yuklash</label><input id="phFile" type="file" accept="image/*"></div>
          ${c.photo ? '<button type="button" class="link-btn" data-act="clearPhoto">Rasmni olib tashlash</button>' : ''}</div>
        ${isNew ? '' : `<button type="button" class="danger" data-act="delCombo" data-id="${esc(c.id)}">Komboni o‘chirish</button>`}
      </form>
      <div class="bar"><div><a class="btn" href="#/seller/combos">Bekor qilish</a><button class="btn primary" data-act="saveCombo">Saqlash</button></div></div>`;
  }

  function saveCombo() {
    const name = document.getElementById('c-name').value.trim();
    const price = parseInt(document.getElementById('c-price').value.replace(/\D/g, ''), 10) || 0;
    const sum = draft.items.map(byId).filter(Boolean).reduce((s, p) => s + p.price, 0);
    if (!name) { toast('Kombo nomini yozing'); return; }
    if (draft.items.length < 2) { toast('Kamida 2 ta mahsulot tanlang'); return; }
    if (!price) { toast('Kombo narxini kiriting'); return; }
    if (price >= sum) { toast(`Kombo narxi ${money(sum)} dan kam bo‘lsin`); return; }
    const data = { name, items: draft.items, price, desc: document.getElementById('c-desc').value.trim(), photo: draft.photo || '' };
    if (draft.id) Object.assign(comboById(draft.id), data);
    else combos.unshift({ id: 'c' + Date.now().toString(36), ...data });
    if (store.save()) { toast('Kombo saqlandi ✓'); haptic('light'); location.hash = '#/seller/combos'; }
  }

  function sellerBanners() {
    return `${header()}${tabs('b')}
      <div class="seller-head"><h1>Bannerlar</h1><span style="color:var(--muted);font-size:14px">Bosh sahifadagi karusel. Tartibni strelkalar bilan o‘zgartiring.</span></div>
      <div class="plist">${banners.length ? banners.map((b, i) => `
        <div class="pitem banner-item ${b.hidden ? 'off' : ''}">
          <img src="${img(b.photo, 240)}" alt="">
          <a class="t" href="#/seller/banner/${i}"><b>${esc(b.title.replace(/\n/g, ' '))}</b><small>${esc((bannerTargets().find(t => t[0] === b.go) || [, 'Havola yo‘q'])[1])}</small></a>
          <div class="order-btns">
            <button class="icon-btn sm" data-act="moveB" data-i="${i}" data-d="-1" ${i ? '' : 'disabled'} aria-label="Yuqoriga">${icon('up')}</button>
            <button class="icon-btn sm" data-act="moveB" data-i="${i}" data-d="1" ${i < banners.length - 1 ? '' : 'disabled'} aria-label="Pastga">${icon('down')}</button>
          </div>
          ${toggle('banner', i, b.hidden, b.title)}
        </div>`).join('') : '<p class="empty">Banner yo‘q: bosh sahifada karusel ko‘rinmaydi.</p>'}
      </div>
      <div class="bar"><div><a class="btn primary" href="#/seller/banner/new">${icon('plus')} Banner qo‘shish</a></div></div>`;
  }

  function sellerBannerEdit(i) {
    const isNew = i === 'new', b = isNew ? { photo: '', tag: '', title: '', go: '#/cat/all' } : banners[+i];
    if (!b) return `${header()}<p class="empty">Banner topilmadi.</p>`;
    draft = { i: isNew ? -1 : +i, photo: b.photo };
    return `${header()}
      <div class="seller-head"><h1>${isNew ? 'Yangi banner' : 'Bannerni tahrirlash'}</h1></div>
      <form class="form" id="bform" novalidate>
        <div class="field"><span>Rasm (eniga cho‘zinchoq rasm yaxshi chiqadi)</span>
          <div class="photo-pick wide"><img id="phPrev" ${b.photo ? `src="${img(b.photo, 400)}"` : ''} alt="">
            <label for="phFile">Rasm yuklash</label><input id="phFile" type="file" accept="image/*"></div></div>
        <label class="field"><span>Kichik yozuv (ixtiyoriy)</span><input id="b-tag" value="${esc(b.tag)}" maxlength="30" placeholder="Masalan: Chegirma"></label>
        <label class="field"><span>Sarlavha (yangi qatorga o‘tish uchun Enter)</span><textarea id="b-title" maxlength="60" rows="2" placeholder="30% gacha arzonroq">${esc(b.title)}</textarea></label>
        <label class="field"><span>Bosilganda ochiladi</span><select id="b-go">${bannerTargets().map(([v, t]) => `<option value="${esc(v)}" ${v === b.go ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></label>
        ${isNew ? '' : `<button type="button" class="danger" data-act="delBanner" data-i="${esc(i)}">Bannerni o‘chirish</button>`}
      </form>
      <div class="bar"><div><a class="btn" href="#/seller/banners">Bekor qilish</a><button class="btn primary" data-act="saveBanner">Saqlash</button></div></div>`;
  }

  function saveBanner() {
    const title = document.getElementById('b-title').value.trim();
    if (!draft.photo) { toast('Banner rasmini yuklang'); return; }
    if (!title) { toast('Sarlavhani yozing'); return; }
    const data = { photo: draft.photo, tag: document.getElementById('b-tag').value.trim(), title, go: document.getElementById('b-go').value };
    if (draft.i >= 0) Object.assign(banners[draft.i], data); else banners.push(data);
    if (store.save()) { toast('Banner saqlandi ✓'); haptic('light'); location.hash = '#/seller/banners'; }
  }

  function sellerHome() {
    const n = products.length, max = S.maxProducts;
    return `${header()}${tabs('p')}
      <div class="seller-head">
        <h1>Mahsulotlar</h1>
        <span class="num" style="color:var(--muted);font-size:14px">${n} / ${max} ta mahsulot · ${visible().length} tasi ko‘rinadi</span>
        <div class="meter"><i style="width:${Math.min(100, n / max * 100)}%"></i></div>
      </div>
      <div class="plist">${products.map(p => `
        <div class="pitem ${p.hidden ? 'off' : ''}">
          <img src="${img(p.photo, 160)}" alt="">
          <a class="t" href="#/seller/edit/${esc(p.id)}"><b>${esc(p.name)}</b><small class="num">${money(p.price)} · ${esc(catName(p.cat))}</small></a>
          ${toggle('product', p.id, p.hidden, p.name)}
        </div>`).join('')}
        <button class="danger" data-act="reset">Namunani tiklash (mahsulot, kombo, banner)</button>
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
    else if (a === 'c') html = combo(b);
    else if (a === 'seller' && seller) html = b === 'edit' ? sellerEdit(c) : b === 'combos' ? sellerCombos() : b === 'combo' ? sellerComboEdit(c)
      : b === 'banners' ? sellerBanners() : b === 'banner' ? sellerBannerEdit(c) : sellerHome();
    else { html = home(); root = true; }
    app.innerHTML = html;
    window.scrollTo(0, 0);
    if (inTG) root ? tg.BackButton.hide() : tg.BackButton.show();
  }

  // ---------- events ----------
  app.addEventListener('click', e => {
    const el = e.target.closest('[data-act],[data-size],[data-color],[data-pc],[data-csize],[data-ccolor],[data-ci]');
    if (!el) return;
    if (el.dataset.csize !== undefined || el.dataset.ccolor !== undefined) {
      const id = el.dataset.cid, kind = el.dataset.csize !== undefined ? 'size' : 'color';
      cpick[id][kind] = el.dataset['c' + kind]; haptic();
      app.querySelectorAll(`[data-cid="${CSS.escape(id)}"][data-c${kind}]`).forEach(b => b.classList.toggle('on', b === el));
      app.querySelector(`[data-cl-${kind}="${CSS.escape(id)}"]`).textContent = cpick[id][kind]; return;
    }
    if (el.dataset.ci !== undefined) {
      const id = el.dataset.ci, i = draft.items.indexOf(id);
      i < 0 ? draft.items.push(id) : draft.items.splice(i, 1);
      el.classList.toggle('on', i < 0);
      document.getElementById('c-count').textContent = draft.items.length;
      document.getElementById('c-sum').textContent = money(draft.items.map(byId).filter(Boolean).reduce((s, p) => s + p.price, 0));
      return;
    }
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
    else if (act === 'orderCombo') orderCombo(comboById(el.dataset.id));
    else if (act === 'saveCombo') saveCombo();
    else if (act === 'saveBanner') saveBanner();
    else if (act === 'clearPhoto') { draft.photo = ''; document.getElementById('phPrev').removeAttribute('src'); el.remove(); }
    else if (act === 'moveB') {
      const i = +el.dataset.i, j = i + +el.dataset.d;
      [banners[i], banners[j]] = [banners[j], banners[i]]; store.save(); route();
    }
    else if (act === 'delCombo' || act === 'delBanner') {
      if (el.dataset.confirm !== '1') { el.dataset.confirm = '1'; el.textContent = 'Rostdan o‘chirilsinmi? Yana bir marta bosing'; return; }
      if (act === 'delCombo') combos = combos.filter(c => c.id !== el.dataset.id); else banners.splice(+el.dataset.i, 1);
      store.save(); toast('O‘chirildi'); location.hash = act === 'delCombo' ? '#/seller/combos' : '#/seller/banners';
    }
    else if (act === 'link') { e.preventDefault(); openLink(el.href); }
    else if (act === 'sellerOn' || act === 'sellerOff') {
      seller = act === 'sellerOn';
      try { seller ? sessionStorage.setItem(SELLER, '1') : sessionStorage.removeItem(SELLER); } catch (er) {}
      location.hash = seller ? '#/seller' : '#/'; if (!seller) route();
    }
    else if (act === 'toggle') {
      const kind = el.dataset.kind;
      const p = kind === 'combo' ? comboById(el.dataset.id) : kind === 'banner' ? banners[+el.dataset.id] : byId(el.dataset.id);
      p.hidden = !el.checked;
      el.closest('.pitem').classList.toggle('off', p.hidden);
      const what = kind === 'combo' ? 'Kombo' : kind === 'banner' ? 'Banner' : 'Mahsulot';
      store.save(); toast(p.hidden ? `${what} yashirildi` : `${what} vitrinada ko‘rinadi`);
      if (kind !== 'product') return;
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
