import { StoreState } from '../types/store';

async function toDataUrlIfLocal(src: string): Promise<string> {
  if (!src || src.startsWith('data:')) return src;
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const scale = Math.min(1200 / img.naturalWidth, 1200 / img.naturalHeight, 1);
        canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.84));
        } else {
          resolve(src);
        }
      } catch {
        resolve(src);
      }
    };
    img.onerror = () => resolve(src);
    img.src = src;
  });
}

export async function preparePortableState(state: StoreState): Promise<StoreState> {
  const clone: StoreState = JSON.parse(JSON.stringify(state));

  if (clone.settings.brandIconUrl) {
    clone.settings.brandIconUrl = await toDataUrlIfLocal(clone.settings.brandIconUrl);
  }

  for (const slide of clone.heroSlides) {
    slide.img = await toDataUrlIfLocal(slide.img);
  }

  for (const cat of clone.categories) {
    cat.img = await toDataUrlIfLocal(cat.img);
  }

  for (const prod of clone.products) {
    prod.images = await Promise.all((prod.images || []).map(toDataUrlIfLocal));
    if (prod.coverImage) {
      prod.coverImage = await toDataUrlIfLocal(prod.coverImage);
    }
  }

  return clone;
}

export function buildSingleFileHtml(portableState: StoreState): string {
  const serializedState = JSON.stringify(portableState).replace(/<\/script/gi, '<\\/script');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${portableState.settings.brandName || 'CozyCaryy'} — Local Single-File Storefront</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;600&family=Manrope:wght@400;500;600;700&family=Playfair+Display:wght@600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
:root {
  --primary: ${portableState.settings.primary || '#234736'};
  --accent: ${portableState.settings.accent || '#c87a48'};
  --bg: #faf9f6;
  --surface: #ffffff;
  --ink: #18181b;
  --muted: #52525b;
  --border: #e7e5e4;
  --font-body: ${portableState.settings.font || "'Plus Jakarta Sans', sans-serif"};
  --font-head: ${portableState.settings.headFont || "'Playfair Display', serif"};
  --ease: cubic-bezier(0.16, 1, 0.3, 1);
}
* { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }
body { background: var(--bg); color: var(--ink); font-family: var(--font-body); -webkit-font-smoothing: antialiased; overflow-x: hidden; }
a { color: inherit; text-decoration: none; }
button { font-family: inherit; cursor: pointer; border: none; background: none; }
img { max-width: 100%; display: block; object-fit: cover; }
.wrap { width: min(1280px, 92%); margin: 0 auto; }
.tabular { font-variant-numeric: tabular-nums; font-family: 'JetBrains Mono', monospace; }

@keyframes marqueeScroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
@keyframes fadeUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
@keyframes dropIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
@keyframes kenBurns { from { transform: scale(1); } to { transform: scale(1.06); } }

/* Top Announcement */
.top-bar { background: var(--primary); color: #fff; font-size: 12px; height: 32px; display: flex; align-items: center; overflow: hidden; }
.top-track { display: flex; width: max-content; animation: marqueeScroll 32s linear infinite; white-space: nowrap; }
.top-track span { padding: 0 40px; }

/* Header & Hover Subcategory Navbar */
.site-header { position: sticky; top: 0; z-index: 100; background: rgba(255,255,255,0.95); backdrop-filter: blur(10px); border-bottom: 1px solid var(--border); transition: box-shadow 0.2s; }
.site-header.scrolled { box-shadow: 0 8px 24px rgba(0,0,0,0.06); }
.header-row { display: flex; align-items: center; justify-content: space-between; gap: 24px; min-height: 70px; }
.brand { display: flex; align-items: center; gap: 10px; shrink: 0; cursor: pointer; }
.brand-icon { width: 38px; height: 38px; border-radius: 10px; background: var(--primary); color: #fff; display: grid; place-items: center; font-family: var(--font-head); font-weight: 700; font-size: 19px; overflow: hidden; }
.brand-icon img { width: 100%; height: 100%; }
.brand-name { font-family: var(--font-head); font-size: 22px; font-weight: 700; white-space: nowrap; }

.nav-links { display: flex; align-items: center; gap: 24px; }
.nav-item { position: relative; padding: 10px 0; }
.nav-link { font-size: 14px; font-weight: 500; color: var(--muted); white-space: nowrap; position: relative; transition: color 0.2s; display: inline-flex; align-items: center; gap: 4px; }
.nav-link::after { content: ""; position: absolute; left: 0; bottom: -4px; width: 100%; height: 2px; background: var(--accent); transform: scaleX(0); transform-origin: left; transition: transform 0.2s var(--ease); }
.nav-link:hover, .nav-link.active { color: var(--ink); }
.nav-link:hover::after, .nav-link.active::after { transform: scaleX(1); }
.sub-dropdown { position: absolute; left: 0; top: 100%; width: 210px; padding-top: 6px; display: none; z-index: 120; animation: dropIn 0.18s var(--ease); }
.nav-item:hover .sub-dropdown { display: block; }
.sub-dropdown-card { background: #fff; border: 1px solid var(--border); border-radius: 12px; box-shadow: 0 16px 32px rgba(0,0,0,0.08); padding: 8px 0; }
.sub-dropdown-card button { width: 100%; text-align: left; padding: 9px 16px; font-size: 13px; color: var(--muted); transition: all 0.15s; display: block; }
.sub-dropdown-card button:hover { background: #f5f5f4; color: var(--ink); padding-left: 20px; }

.header-actions { display: flex; align-items: center; gap: 10px; }
.search-input { height: 38px; width: 210px; padding: 0 14px; border-radius: 8px; border: 1px solid var(--border); background: #f5f5f4; font-size: 13px; outline: none; transition: all 0.2s; }
.search-input:focus { background: #fff; border-color: var(--ink); }
.hdr-btn { height: 38px; padding: 0 12px; border-radius: 8px; font-size: 13px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; color: var(--ink); transition: background 0.15s; white-space: nowrap; }
.hdr-btn:hover { background: #f5f5f4; }
.hdr-btn.primary { background: var(--primary); color: #fff; }
.hdr-btn.primary:hover { opacity: 0.94; }
.count-pill { background: rgba(255,255,255,0.22); padding: 2px 6px; border-radius: 5px; font-size: 11px; }
.wish-pill { background: var(--accent); color: #fff; padding: 1px 6px; border-radius: 5px; font-size: 11px; }

/* Hero Slider (3 Slides Animated) */
.hero { position: relative; height: 540px; overflow: hidden; background: #1c1917; }
.hero-track { display: flex; height: 100%; transition: transform 0.7s var(--ease); }
.hero-slide { min-width: 100%; height: 100%; position: relative; overflow: hidden; }
.hero-slide img { width: 100%; height: 100%; }
.hero-slide.active img { animation: kenBurns 7s ease-out forwards; }
.hero-scrim { position: absolute; inset: 0; background: linear-gradient(90deg, rgba(12,10,9,0.82) 0%, rgba(12,10,9,0.45) 55%, transparent 100%); }
.hero-inner { position: absolute; inset: 0; display: flex; align-items: center; }
.hero-copy { max-width: 560px; color: #fff; animation: fadeUp 0.55s var(--ease); }
.hero-kicker { font-size: 12px; text-transform: uppercase; letter-spacing: 0.14em; color: #e7e5e4; margin-bottom: 12px; font-weight: 600; }
.hero-copy h1 { font-family: var(--font-head); font-size: clamp(32px, 4.5vw, 56px); line-height: 1.08; margin-bottom: 16px; }
.hero-copy p { font-size: 15px; line-height: 1.6; color: #e7e5e4; margin-bottom: 24px; }
.hero-cta { display: inline-flex; align-items: center; gap: 8px; padding: 14px 28px; border-radius: 8px; background: var(--accent); color: #fff; font-weight: 600; font-size: 14px; transition: transform 0.2s; }
.hero-cta:hover { transform: translateY(-2px); }
.hero-arrow { position: absolute; top: 50%; transform: translateY(-50%); width: 42px; height: 42px; border-radius: 50%; background: rgba(255,255,255,0.18); color: #fff; font-size: 18px; display: grid; place-items: center; backdrop-filter: blur(6px); }
.hero-arrow.prev { left: 20px; }
.hero-arrow.next { right: 20px; }
.hero-dots { position: absolute; bottom: 22px; left: 50%; transform: translateX(-50%); display: flex; gap: 8px; }
.hero-dot { width: 18px; height: 5px; border-radius: 99px; background: rgba(255,255,255,0.45); transition: all 0.3s; }
.hero-dot.active { width: 38px; background: #fff; }

/* Category Strip & Catalog */
.section { padding: 56px 0; }
.sec-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; margin-bottom: 28px; flex-wrap: wrap; }
.sec-head h2 { font-family: var(--font-head); font-size: 32px; }
.sec-head p { color: var(--muted); font-size: 14px; }
.cat-strip { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 16px; margin-bottom: 44px; }
.cat-card { background: #fff; border: 1px solid var(--border); border-radius: 14px; padding: 14px; display: flex; align-items: center; gap: 12px; text-align: left; transition: all 0.2s; }
.cat-card:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(0,0,0,0.05); }
.cat-card img { width: 52px; height: 52px; border-radius: 10px; shrink: 0; }
.cat-card strong { display: block; font-size: 14px; }
.cat-card span { font-size: 12px; color: var(--muted); }

.filters { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 22px; }
.seg-group { display: flex; gap: 6px; flex-wrap: wrap; background: #f5f5f4; padding: 4px; border-radius: 10px; }
.seg-btn { padding: 8px 14px; border-radius: 7px; font-size: 13px; font-weight: 600; color: var(--muted); }
.seg-btn.active { background: #fff; color: var(--ink); box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
.sort-sel { padding: 9px 14px; border-radius: 8px; border: 1px solid var(--border); background: #fff; font-size: 13px; font-weight: 500; }

.grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
.card { background: #fff; border: 1px solid var(--border); border-radius: 16px; overflow: hidden; display: flex; flex-direction: column; transition: transform 0.25s var(--ease), box-shadow 0.25s var(--ease); }
.card:hover { transform: translateY(-4px); box-shadow: 0 18px 34px rgba(0,0,0,0.07); }
.card-img { position: relative; aspect-ratio: 4/3; background: #f5f5f4; overflow: hidden; cursor: pointer; }
.card-img img { width: 100%; height: 100%; transition: transform 0.5s var(--ease); }
.card:hover .card-img img { transform: scale(1.05); }
.card-tag { position: absolute; top: 12px; left: 12px; background: rgba(24,24,27,0.86); color: #fff; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 600; }
.wish-btn { position: absolute; top: 12px; right: 12px; width: 34px; height: 34px; border-radius: 50%; background: rgba(255,255,255,0.92); display: grid; place-items: center; font-size: 16px; color: var(--muted); transition: transform 0.15s; }
.wish-btn.active { color: #dc2626; }
.card-body { padding: 18px; display: flex; flex-direction: column; flex: 1; }
.card-meta { font-size: 12px; color: var(--muted); margin-bottom: 6px; }
.card-title { font-size: 16px; font-weight: 600; margin-bottom: 10px; cursor: pointer; }
.card-price { display: flex; align-items: baseline; gap: 8px; margin-top: auto; margin-bottom: 14px; }
.card-price strong { font-size: 18px; }
.card-price del { font-size: 13px; color: #a1a1aa; }
.card-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.btn-outline { padding: 10px; border-radius: 8px; border: 1px solid var(--border); font-size: 13px; font-weight: 600; color: var(--ink); }
.btn-outline:hover { background: #f5f5f4; }
.btn-solid { padding: 10px; border-radius: 8px; background: var(--primary); color: #fff; font-size: 13px; font-weight: 600; }
.btn-solid:hover { opacity: 0.94; }

/* Modals & Drawers */
.backdrop { position: fixed; inset: 0; background: rgba(12,10,9,0.58); backdrop-filter: blur(4px); z-index: 300; display: none; align-items: center; justify-content: center; padding: 16px; }
.backdrop.show { display: flex; }
.modal { background: #fff; width: min(760px, 100%); max-height: 92vh; overflow-y: auto; border-radius: 18px; box-shadow: 0 24px 48px rgba(0,0,0,0.2); animation: fadeUp 0.25s var(--ease); position: relative; }
.modal.sm { width: min(460px, 100%); }
.modal.lg { width: min(980px, 100%); }
.modal-head { display: flex; align-items: center; justify-content: space-between; padding: 18px 24px; border-bottom: 1px solid var(--border); position: sticky; top: 0; background: #fff; z-index: 5; }
.modal-head h3 { font-family: var(--font-head); font-size: 22px; }
.modal-body { padding: 24px; }
.close-x { width: 34px; height: 34px; border-radius: 8px; font-size: 20px; color: var(--muted); display: grid; place-items: center; }
.close-x:hover { background: #f5f5f4; color: var(--ink); }

.drawer-wrap { position: fixed; inset: 0; z-index: 300; display: none; justify-content: flex-end; background: rgba(12,10,9,0.5); }
.drawer-wrap.show { display: flex; }
.drawer { width: min(420px, 100%); height: 100%; background: #fff; display: flex; flex-direction: column; box-shadow: -12px 0 32px rgba(0,0,0,0.12); }

/* Forms & Styled Dropzone */
.fg { margin-bottom: 14px; }
.fg label { display: block; font-size: 12px; font-weight: 600; color: #3f3f46; margin-bottom: 5px; }
.fc { width: 100%; padding: 10px 12px; border: 1px solid #d4d4d8; border-radius: 8px; font-size: 14px; outline: none; font-family: inherit; }
.fc:focus { border-color: var(--ink); }
.frow { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.dropzone { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; padding: 20px; border: 2px dashed #d4d4d8; border-radius: 12px; background: #fafaf9; cursor: pointer; text-align: center; transition: border-color 0.2s, background 0.2s; }
.dropzone:hover { border-color: var(--primary); background: #f5f5f4; }
.dropzone input[type="file"] { display: none; }
.slot-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-top: 12px; }
.slot { aspect-ratio: 1/1; border: 1px dashed var(--border); border-radius: 10px; position: relative; overflow: hidden; display: grid; place-items: center; font-size: 11px; color: var(--muted); background: #fafaf9; }
.slot img { width: 100%; height: 100%; }
.slot .s-del { position: absolute; top: 4px; right: 4px; width: 22px; height: 22px; border-radius: 50%; background: #fff; color: #dc2626; font-weight: 700; font-size: 12px; }
.slot .s-cov { position: absolute; bottom: 4px; left: 4px; padding: 2px 6px; border-radius: 4px; background: rgba(255,255,255,0.92); font-size: 10px; font-weight: 700; }
.slot .s-cov.active { background: #fef3c7; color: #92400e; }

.acc-layout { display: grid; grid-template-columns: 210px 1fr; min-height: 400px; }
.acc-side { background: #fafaf9; border-right: 1px solid var(--border); padding: 16px; display: flex; flex-direction: column; gap: 6px; }
.acc-side button { text-align: left; padding: 10px 12px; border-radius: 8px; font-size: 13px; font-weight: 600; color: var(--muted); }
.acc-side button.active { background: var(--ink); color: #fff; }
.admin-tabs { display: flex; gap: 6px; padding: 12px 24px; background: #fafaf9; border-bottom: 1px solid var(--border); overflow-x: auto; }
.admin-tabs button { padding: 8px 14px; border-radius: 8px; font-size: 13px; font-weight: 600; color: var(--muted); white-space: nowrap; }
.admin-tabs button.active { background: var(--primary); color: #fff; }
.tbl { width: 100%; border-collapse: collapse; margin-top: 14px; font-size: 13px; }
.tbl th, .tbl td { padding: 10px 12px; border-bottom: 1px solid var(--border); text-align: left; }
.tbl th { background: #fafaf9; color: var(--muted); font-weight: 600; }
.tbl img { width: 38px; height: 38px; border-radius: 6px; }

.toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%) translateY(16px); background: var(--ink); color: #fff; padding: 11px 22px; border-radius: 8px; font-size: 13px; font-weight: 600; opacity: 0; pointer-events: none; transition: all 0.25s; z-index: 999; }
.toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }

@media (max-width: 980px) {
  .nav-links { display: none; }
  .grid { grid-template-columns: repeat(2, 1fr); }
  .acc-layout { grid-template-columns: 1fr; }
}
@media (max-width: 600px) {
  .grid { grid-template-columns: 1fr; }
  .frow { grid-template-columns: 1fr; }
  .search-input { width: 130px; }
  .hero { height: 430px; }
}
</style>
</head>
<body>
<div class="top-bar"><div class="top-track" id="topTrack"></div></div>

<header class="site-header" id="siteHeader">
  <div class="wrap header-row">
    <div class="brand" onclick="selectCategory('All')">
      <div class="brand-icon" id="brandIcon">C</div>
      <div class="brand-name" id="brandName">CozyCaryy</div>
    </div>
    <nav class="nav-links" id="navLinks"></nav>
    <div class="header-actions">
      <input class="search-input" id="searchInput" placeholder="Search products..." oninput="onSearch(this.value)">
      <button class="hdr-btn" onclick="openAccount('wishlist')">♡ <span class="wish-pill tabular" id="wishCount">0</span></button>
      <button class="hdr-btn" onclick="openAccount('profile')" id="accountBtn">Account</button>
      <button class="hdr-btn primary" onclick="openCart()">Cart <span class="count-pill tabular" id="cartCount">0</span></button>
    </div>
  </div>
</header>

<section class="hero" onmouseenter="pauseHero=true" onmouseleave="pauseHero=false">
  <div class="hero-track" id="heroTrack"></div>
  <button class="hero-arrow prev" onclick="stepHero(-1)">‹</button>
  <button class="hero-arrow next" onclick="stepHero(1)">›</button>
  <div class="hero-dots" id="heroDots"></div>
</section>

<section class="section">
  <div class="wrap">
    <div class="sec-head">
      <div><h2>Shop by Category</h2><p>Hover any category in the top bar for instant sub-categories</p></div>
    </div>
    <div class="cat-strip" id="catStrip"></div>

    <div id="shopSection" class="sec-head">
      <div><h2 id="catalogHeading">Featured Collection</h2><p id="catalogSub">Curated products ready for delivery</p></div>
      <select class="sort-sel" id="sortSelect" onchange="renderProducts()">
        <option value="featured">Featured First</option>
        <option value="low">Price: Low to High</option>
        <option value="high">Price: High to Low</option>
      </select>
    </div>

    <div class="filters">
      <div class="seg-group" id="tagFilters"></div>
      <div class="seg-group" id="subFilters" style="display:none;"></div>
    </div>

    <div class="grid" id="productGrid"></div>
  </div>
</section>

<footer style="border-top:1px solid var(--border);background:#fff;padding:36px 0;margin-top:40px;">
  <div class="wrap" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px;font-size:13px;color:var(--muted);">
    <div><strong style="color:var(--ink);" id="footerBrand">CozyCaryy</strong> — Local Single-File Storefront</div>
    <div style="display:flex;gap:16px;align-items:center;">
      <button onclick="openAccount('orders')" style="color:var(--ink);font-weight:600;">Track Orders</button>
      <button onclick="openAdmin()" style="color:var(--accent);font-weight:600;">Admin Panel</button>
    </div>
  </div>
</footer>

<!-- Cart Drawer -->
<div class="drawer-wrap" id="cartDrawer" onclick="if(event.target===this)closeCart()">
  <div class="drawer">
    <div class="modal-head"><h3>Shopping Cart</h3><button class="close-x" onclick="closeCart()">×</button></div>
    <div id="cartList" style="flex:1;overflow-y:auto;padding:20px;"></div>
    <div style="padding:20px;border-top:1px solid var(--border);background:#fafaf9;">
      <div style="display:flex;justify-content:space-between;font-weight:700;font-size:17px;margin-bottom:14px;">
        <span>Subtotal</span><span class="tabular" id="cartTotal">Rs. 0</span>
      </div>
      <button class="btn-solid" style="width:100%;padding:13px;" onclick="startCartCheckout()">Proceed to Checkout</button>
    </div>
  </div>
</div>

<!-- Product Detail Modal -->
<div class="backdrop" id="prodModal" onclick="if(event.target===this)closeProdModal()">
  <div class="modal" id="prodModalBody"></div>
</div>

<!-- Checkout Modal (Buy Now & Cart) -->
<div class="backdrop" id="checkoutModal" onclick="if(event.target===this)closeCheckout()">
  <div class="modal" id="checkoutBody"></div>
</div>

<!-- Account / Login Modal -->
<div class="backdrop" id="accountModal" onclick="if(event.target===this)closeAccount()">
  <div class="modal" id="accountBody"></div>
</div>

<!-- Admin Modal -->
<div class="backdrop" id="adminModal" onclick="if(event.target===this)closeAdmin()">
  <div class="modal lg" id="adminBody"></div>
</div>

<div class="toast" id="toast"></div>

<script>
const INITIAL_SEED = ${serializedState};
const STORAGE_KEY = 'storeData_singleHtml_v1';
let state = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') || INITIAL_SEED;
let activeCat = 'All', activeSub = 'All', activeTag = 'All', searchQ = '', heroIdx = 0, pauseHero = false;
let adminLoggedIn = false, adminTab = 'overview', editingProdId = null, tempImgs = [null,null,null,null], tempCover = 0;

function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function esc(v) { return String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function money(v) { return (state.settings.currency || 'Rs.') + ' ' + Number(v || 0).toLocaleString(); }
function toast(m) { const t = document.getElementById('toast'); t.textContent = m; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 2500); }
function getCustomer() { return state.customers.find(c => c.email === state.currentCustomerEmail) || null; }
function getWishlist() { const c = getCustomer(); return c ? (c.wishlist || []) : (state.guestWishlist || []); }

function trackVisit() {
  const t = JSON.parse(localStorage.getItem('storeTraffic') || '{"total":0,"daily":{}}');
  const d = new Date().toISOString().slice(0,10);
  t.total = (t.total || 0) + 1; t.daily = t.daily || {}; t.daily[d] = (t.daily[d] || 0) + 1;
  localStorage.setItem('storeTraffic', JSON.stringify(t));
}

function applyTheme() {
  const s = state.settings;
  document.documentElement.style.setProperty('--primary', s.primary);
  document.documentElement.style.setProperty('--accent', s.accent);
  document.documentElement.style.setProperty('--font-body', s.font);
  document.documentElement.style.setProperty('--font-head', s.headFont);
  document.getElementById('brandName').textContent = s.brandName;
  document.getElementById('footerBrand').textContent = s.brandName;
  const bi = document.getElementById('brandIcon');
  if (s.brandIconUrl) { bi.innerHTML = '<img src="'+esc(s.brandIconUrl)+'">'; bi.style.background='transparent'; }
  else { bi.textContent = s.brandIcon || 'C'; bi.style.background='var(--primary)'; }
  const txt = esc(s.announcement || '');
  document.getElementById('topTrack').innerHTML = txt ? '<span>'+txt+'</span><span>'+txt+'</span><span>'+txt+'</span>' : '';
  const cust = getCustomer();
  document.getElementById('accountBtn').textContent = cust ? cust.name.split(' ')[0] : 'Account';
  document.getElementById('wishCount').textContent = getWishlist().length;
  document.getElementById('cartCount').textContent = state.cart.reduce((a,b)=>a+b.qty, 0);
}

function renderNav() {
  const nav = document.getElementById('navLinks');
  nav.innerHTML = '<div class="nav-item"><button class="nav-link '+(activeCat==='All'?'active':'')+'" onclick="selectCategory(\\'All\\')">All Finds</button></div>' +
    state.categories.map(c => \`
      <div class="nav-item">
        <button class="nav-link \${activeCat===c.name?'active':''}" onclick="selectCategory('\${esc(c.name)}')">\${esc(c.name)} \${c.subCats?.length ? '▾' : ''}</button>
        \${c.subCats?.length ? \`
          <div class="sub-dropdown"><div class="sub-dropdown-card">
            <button onclick="selectCategory('\${esc(c.name)}','All')">All \${esc(c.name)}</button>
            \${c.subCats.map(sc => \`<button onclick="selectCategory('\${esc(c.name)}','\${esc(sc)}')">\${esc(sc)}</button>\`).join('')}
          </div></div>\` : ''}
      </div>\`).join('');
}

function renderHero() {
  const slides = state.heroSlides || [];
  document.getElementById('heroTrack').innerHTML = slides.map((s,i) => \`
    <div class="hero-slide \${i===heroIdx?'active':''}">
      <img src="\${esc(s.img)}" alt="\${esc(s.title)}">
      <div class="hero-scrim"></div>
      <div class="wrap hero-inner">
        <div class="hero-copy">
          <div class="hero-kicker">\${esc(s.kicker||'Curated Selection')}</div>
          <h1>\${esc(s.title)}</h1>
          <p>\${esc(s.desc)}</p>
          <button class="hero-cta" onclick="selectCategory('\${esc(s.targetCategory||'All')}')">\${esc(s.btn||'Shop Now')} →</button>
        </div>
      </div>
    </div>\`).join('');
  document.getElementById('heroDots').innerHTML = slides.map((_,i) => \`<button class="hero-dot \${i===heroIdx?'active':''}" onclick="goHero(\${i})"></button>\`).join('');
  document.getElementById('heroTrack').style.transform = \`translateX(-\${heroIdx * 100}%)\`;
}
function goHero(i) { heroIdx = i; renderHero(); }
function stepHero(d) { const len = state.heroSlides.length || 1; heroIdx = (heroIdx + d + len) % len; renderHero(); }

function renderCatStrip() {
  document.getElementById('catStrip').innerHTML = state.categories.map(c => \`
    <button class="cat-card" onclick="selectCategory('\${esc(c.name)}')">
      <img src="\${esc(c.img)}" alt="\${esc(c.name)}">
      <div><strong>\${esc(c.name)}</strong><span>\${(c.subCats||[]).length} sub-categories</span></div>
    </button>\`).join('');
}

function selectCategory(cat, sub = 'All') {
  activeCat = cat; activeSub = sub;
  renderNav(); renderFilters(); renderProducts();
  if (cat !== 'All') document.getElementById('shopSection').scrollIntoView({ behavior: 'smooth' });
}

function onSearch(v) { searchQ = v.toLowerCase(); renderProducts(); }

function renderFilters() {
  const tags = ['All', 'New', 'Bestseller', 'Featured'];
  document.getElementById('tagFilters').innerHTML = tags.map(t => \`
    <button class="seg-btn \${activeTag===t?'active':''}" onclick="activeTag='\${t}';renderFilters();renderProducts()">\${t==='All'?'All Products':t}</button>\`).join('');
  const subWrap = document.getElementById('subFilters');
  const catObj = state.categories.find(c => c.name === activeCat);
  if (activeCat !== 'All' && catObj && catObj.subCats?.length) {
    subWrap.style.display = 'flex';
    subWrap.innerHTML = ['All', ...catObj.subCats].map(sc => \`
      <button class="seg-btn \${activeSub===sc?'active':''}" onclick="activeSub='\${esc(sc)}';renderFilters();renderProducts()">\${sc==='All'?'All '+esc(activeCat):esc(sc)}</button>\`).join('');
  } else {
    subWrap.style.display = 'none';
  }
}

function renderProducts() {
  let list = [...state.products];
  if (activeCat !== 'All') list = list.filter(p => p.category === activeCat);
  if (activeSub !== 'All') list = list.filter(p => p.subCat === activeSub);
  if (activeTag === 'Featured') list = list.filter(p => p.featured);
  else if (activeTag !== 'All') list = list.filter(p => p.tag === activeTag);
  if (searchQ) list = list.filter(p => (p.name + ' ' + p.category + ' ' + p.subCat).toLowerCase().includes(searchQ));
  const sort = document.getElementById('sortSelect').value;
  if (sort === 'low') list.sort((a,b)=>a.price-b.price);
  if (sort === 'high') list.sort((a,b)=>b.price-a.price);
  document.getElementById('catalogHeading').textContent = activeCat === 'All' ? 'Featured Collection' : activeCat + (activeSub !== 'All' ? ' — ' + activeSub : '');
  const wish = getWishlist();
  const grid = document.getElementById('productGrid');
  if (!list.length) { grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;padding:40px;color:var(--muted);">No matching products found.</p>'; return; }
  grid.innerHTML = list.map(p => \`
    <div class="card">
      <div class="card-img" onclick="openProdModal(\${p.id})">
        <img src="\${esc(p.coverImage || p.images?.[0] || '')}" alt="\${esc(p.name)}">
        \${p.tag ? \`<span class="card-tag">\${esc(p.tag)}</span>\` : ''}
        <button class="wish-btn \${wish.includes(p.id)?'active':''}" onclick="event.stopPropagation();toggleWish(\${p.id})">\${wish.includes(p.id)?'♥':'♡'}</button>
      </div>
      <div class="card-body">
        <div class="card-meta">\${esc(p.category)} · \${esc(p.subCat||'General')}</div>
        <div class="card-title" onclick="openProdModal(\${p.id})">\${esc(p.name)}</div>
        <div class="card-price"><strong class="tabular">\${money(p.price)}</strong>\${p.oldPrice ? \`<del class="tabular">\${money(p.oldPrice)}</del>\` : ''}</div>
        <div class="card-actions">
          <button class="btn-outline" onclick="addCart(\${p.id},1)">Add to Cart</button>
          <button class="btn-solid" onclick="openCheckout('buyNow',\${p.id})">Buy Now</button>
        </div>
      </div>
    </div>\`).join('');
}

function toggleWish(id) {
  const c = getCustomer();
  if (c) {
    c.wishlist = c.wishlist || [];
    c.wishlist = c.wishlist.includes(id) ? c.wishlist.filter(x=>x!==id) : [...c.wishlist, id];
  } else {
    state.guestWishlist = state.guestWishlist || [];
    state.guestWishlist = state.guestWishlist.includes(id) ? state.guestWishlist.filter(x=>x!==id) : [...state.guestWishlist, id];
  }
  save(); applyTheme(); renderProducts();
  toast('Wishlist updated');
}

function addCart(id, qty = 1) {
  const ex = state.cart.find(i => i.id === id);
  if (ex) ex.qty += qty; else state.cart.push({ id, qty });
  save(); applyTheme(); toast('Added to cart');
}
function openCart() { renderCart(); document.getElementById('cartDrawer').classList.add('show'); }
function closeCart() { document.getElementById('cartDrawer').classList.remove('show'); }
function renderCart() {
  const el = document.getElementById('cartList');
  let sub = 0;
  if (!state.cart.length) { el.innerHTML = '<p style="text-align:center;color:var(--muted);margin-top:40px;">Your cart is empty.</p>'; document.getElementById('cartTotal').textContent = money(0); return; }
  el.innerHTML = state.cart.map(item => {
    const p = state.products.find(x => x.id === item.id); if (!p) return '';
    sub += p.price * item.qty;
    return \`<div style="display:flex;gap:12px;padding-bottom:14px;margin-bottom:14px;border-bottom:1px solid var(--border);align-items:center;">
      <img src="\${esc(p.coverImage||p.images[0])}" style="width:62px;height:62px;border-radius:10px;">
      <div style="flex:1;min-width:0;"><div style="font-size:14px;font-weight:600;">\${esc(p.name)}</div><div class="tabular" style="font-size:13px;color:var(--muted);">\${money(p.price)} × \${item.qty}</div></div>
      <button onclick="state.cart=state.cart.filter(x=>x.id!==\${p.id});save();applyTheme();renderCart();" style="color:#dc2626;font-size:18px;">×</button>
    </div>\`;
  }).join('');
  document.getElementById('cartTotal').textContent = money(sub);
}
function startCartCheckout() { if (!state.cart.length) return toast('Cart is empty'); closeCart(); openCheckout('cart'); }

/* Product Modal */
function openProdModal(id) {
  const p = state.products.find(x => x.id === id); if (!p) return;
  const imgs = p.images?.length ? p.images : [p.coverImage];
  document.getElementById('prodModalBody').innerHTML = \`
    <div class="modal-head"><h3>\${esc(p.name)}</h3><button class="close-x" onclick="closeProdModal()">×</button></div>
    <div class="modal-body frow">
      <div>
        <img id="pmMain" src="\${esc(p.coverImage||imgs[0])}" style="width:100%;aspect-ratio:1/1;border-radius:12px;">
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:10px;">
          \${imgs.slice(0,4).map(im => \`<img src="\${esc(im)}" onclick="document.getElementById('pmMain').src='\${esc(im)}'" style="aspect-ratio:1/1;border-radius:8px;cursor:pointer;border:1px solid var(--border);">\`).join('')}
        </div>
      </div>
      <div style="display:flex;flex-direction:column;">
        <div style="font-size:12px;color:var(--muted);text-transform:uppercase;margin-bottom:8px;">\${esc(p.category)} · \${esc(p.subCat||'')}</div>
        <div class="tabular" style="font-size:26px;font-weight:700;margin-bottom:14px;">\${money(p.price)}</div>
        <p style="font-size:14px;color:var(--muted);line-height:1.6;margin-bottom:24px;">\${esc(p.desc)}</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:auto;">
          <button class="btn-outline" style="padding:13px;" onclick="addCart(\${p.id},1);closeProdModal();">Add to Cart</button>
          <button class="btn-solid" style="padding:13px;" onclick="closeProdModal();openCheckout('buyNow',\${p.id});">Buy Now</button>
        </div>
      </div>
    </div>\`;
  document.getElementById('prodModal').classList.add('show');
}
function closeProdModal() { document.getElementById('prodModal').classList.remove('show'); }

/* Checkout (Buy Now & Cart) */
let coMode = 'cart', coProdId = null;
function openCheckout(mode, prodId = null) {
  coMode = mode; coProdId = prodId;
  const cust = getCustomer();
  const items = mode === 'buyNow' ? [state.products.find(p=>p.id===prodId)].filter(Boolean).map(p=>({p, qty:1})) :
    state.cart.map(c=>({p:state.products.find(x=>x.id===c.id), qty:c.qty})).filter(x=>x.p);
  if (!items.length) return toast('No items to checkout');
  const sub = items.reduce((s,i)=>s + i.p.price * i.qty, 0);
  const fee = sub >= (state.settings.freeDeliveryThreshold||5000) ? 0 : (state.settings.deliveryFee||250);
  const total = sub + fee;
  document.getElementById('checkoutBody').innerHTML = \`
    <div class="modal-head"><h3>Customer Info & Checkout</h3><button class="close-x" onclick="closeCheckout()">×</button></div>
    <div class="modal-body">
      <div style="background:#fafaf9;border:1px solid var(--border);border-radius:12px;padding:14px;margin-bottom:18px;font-size:13px;">
        \${items.map(i=>\`<div style="display:flex;justify-content:space-between;margin-bottom:6px;"><span>\${esc(i.p.name)} × \${i.qty}</span><strong class="tabular">\${money(i.p.price*i.qty)}</strong></div>\`).join('')}
        <div style="display:flex;justify-content:space-between;color:var(--muted);margin-bottom:6px;"><span>Delivery</span><span>\${fee===0?'Free':money(fee)}</span></div>
        <div style="display:flex;justify-content:space-between;font-size:15px;font-weight:700;padding-top:8px;border-top:1px solid var(--border);"><span>Total</span><span class="tabular">\${money(total)}</span></div>
      </div>
      <form onsubmit="submitOrder(event)">
        <div class="frow">
          <div class="fg"><label>Full Name *</label><input class="fc" id="coName" required value="\${esc(cust?.name||'')}"></div>
          <div class="fg"><label>Phone Number *</label><input class="fc" id="coPhone" required value="\${esc(cust?.phone||'')}"></div>
        </div>
        <div class="frow">
          <div class="fg"><label>Email (for order tracking)</label><input class="fc" type="email" id="coEmail" value="\${esc(cust?.email||'')}"></div>
          <div class="fg"><label>City *</label><input class="fc" id="coCity" required value="\${esc(cust?.city||'')}"></div>
        </div>
        <div class="fg"><label>Delivery Address *</label><textarea class="fc" id="coAddr" rows="2" required>\${esc(cust?.address||'')}</textarea></div>
        <div class="fg"><label>Notes (Optional)</label><input class="fc" id="coNotes"></div>
        <button class="btn-solid" style="width:100%;padding:14px;background:var(--accent);">Confirm & Place Order (\${money(total)})</button>
      </form>
    </div>\`;
  document.getElementById('checkoutModal').classList.add('show');
}
function closeCheckout() { document.getElementById('checkoutModal').classList.remove('show'); }
function submitOrder(e) {
  e.preventDefault();
  const cust = getCustomer();
  const items = coMode === 'buyNow' ? [state.products.find(p=>p.id===coProdId)].filter(Boolean).map(p=>({productId:p.id,name:p.name,qty:1,price:p.price})) :
    state.cart.map(c=>{const p=state.products.find(x=>x.id===c.id);return p?{productId:p.id,name:p.name,qty:c.qty,price:p.price}:null;}).filter(Boolean);
  const sub = items.reduce((s,i)=>s+i.price*i.qty,0);
  const fee = sub >= (state.settings.freeDeliveryThreshold||5000) ? 0 : (state.settings.deliveryFee||250);
  const ord = {
    id: 'CC-' + Math.floor(100000 + Math.random()*900000),
    date: new Date().toLocaleString(),
    customerEmail: cust?.email || document.getElementById('coEmail').value.trim(),
    name: document.getElementById('coName').value.trim(),
    phone: document.getElementById('coPhone').value.trim(),
    email: document.getElementById('coEmail').value.trim(),
    city: document.getElementById('coCity').value.trim(),
    address: document.getElementById('coAddr').value.trim(),
    notes: document.getElementById('coNotes').value.trim(),
    paymentMethod: 'Cash on Delivery',
    items, subtotal: sub, deliveryFee: fee, total: sub+fee, status: 'Pending',
    source: coMode === 'buyNow' ? 'Direct Buy Now' : 'Cart Checkout'
  };
  state.orders.unshift(ord);
  if (coMode === 'cart') state.cart = [];
  save(); applyTheme();
  const msg = encodeURIComponent(\`*Order \${ord.id}*\nName: \${ord.name}\nPhone: \${ord.phone}\nAddress: \${ord.address}, \${ord.city}\nTotal: \${money(ord.total)}\`);
  document.getElementById('checkoutBody').innerHTML = \`
    <div class="modal-head"><h3>Order Confirmed</h3><button class="close-x" onclick="closeCheckout()">×</button></div>
    <div class="modal-body" style="text-align:center;">
      <p style="font-size:18px;font-weight:700;color:#047857;margin-bottom:8px;">Order #\${esc(ord.id)} Placed (Pending)</p>
      <p style="font-size:14px;color:var(--muted);margin-bottom:20px;">Track status anytime inside your customer account.</p>
      <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
        <a target="_blank" href="https://wa.me/\${state.settings.whatsapp}?text=\${msg}" class="btn-solid" style="padding:12px 20px;background:#047857;">Send via WhatsApp</a>
        <button class="btn-outline" style="padding:12px 20px;" onclick="closeCheckout()">Continue Shopping</button>
      </div>
    </div>\`;
  toast('Order placed!');
}

/* Customer Account & Auth */
let accTab = 'profile';
function openAccount(tab = 'profile') { accTab = tab; renderAccount(); document.getElementById('accountModal').classList.add('show'); }
function closeAccount() { document.getElementById('accountModal').classList.remove('show'); }
function renderAccount() {
  const c = getCustomer();
  const body = document.getElementById('accountBody');
  if (!c) {
    body.innerHTML = \`
      <div class="modal-head"><h3>Customer Account</h3><button class="close-x" onclick="closeAccount()">×</button></div>
      <div class="modal-body">
        <div class="frow">
          <form onsubmit="doLogin(event)">
            <h4 style="margin-bottom:12px;">Sign In</h4>
            <div class="fg"><label>Email</label><input class="fc" type="email" id="liEmail" required></div>
            <div class="fg"><label>Password</label><input class="fc" type="password" id="liPass" required></div>
            <button class="btn-solid" style="width:100%;padding:12px;">Sign In</button>
            <button type="button" onclick="closeAccount();openAdmin()" style="margin-top:12px;font-size:12px;color:var(--accent);font-weight:600;">Admin Panel Login →</button>
          </form>
          <form onsubmit="doReg(event)">
            <h4 style="margin-bottom:12px;">Register</h4>
            <div class="fg"><label>Full Name</label><input class="fc" id="rgName" required></div>
            <div class="fg"><label>Phone</label><input class="fc" id="rgPhone" required></div>
            <div class="fg"><label>Email</label><input class="fc" type="email" id="rgEmail" required></div>
            <div class="fg"><label>Password</label><input class="fc" type="password" id="rgPass" required></div>
            <button class="btn-outline" style="width:100%;padding:12px;">Create Account</button>
          </form>
        </div>
      </div>\`;
    return;
  }
  const myOrders = state.orders.filter(o => o.customerEmail === c.email || o.email === c.email || o.phone === c.phone);
  const myWish = state.products.filter(p => (c.wishlist||[]).includes(p.id));
  let inner = '';
  if (accTab === 'profile') {
    inner = \`<form onsubmit="saveProfile(event)">
      <h4 style="margin-bottom:14px;">Profile Information</h4>
      <div class="frow"><div class="fg"><label>Full Name</label><input class="fc" id="prName" value="\${esc(c.name)}" required></div><div class="fg"><label>Phone</label><input class="fc" id="prPhone" value="\${esc(c.phone)}" required></div></div>
      <div class="frow"><div class="fg"><label>Email</label><input class="fc" value="\${esc(c.email)}" disabled></div><div class="fg"><label>City</label><input class="fc" id="prCity" value="\${esc(c.city||'')}"></div></div>
      <div class="fg"><label>Address</label><input class="fc" id="prAddr" value="\${esc(c.address||'')}"></div>
      <button class="btn-solid" style="padding:11px 22px;">Save Profile</button>
    </form>\`;
  } else if (accTab === 'orders') {
    inner = \`<h4 style="margin-bottom:14px;">Order History & Live Status</h4>\` + (myOrders.length ? myOrders.map(o => \`
      <div style="border:1px solid var(--border);border-radius:12px;padding:14px;margin-bottom:12px;">
        <div style="display:flex;justify-content:space-between;font-weight:700;"><span>\${esc(o.id)}</span><span>\${esc(o.status)}</span></div>
        <div style="font-size:12px;color:var(--muted);margin:4px 0;">\${esc(o.date)} · \${esc(o.city)}</div>
        <div style="font-size:13px;">\${o.items.map(i=>esc(i.name)+' × '+i.qty).join(', ')} — <strong class="tabular">\${money(o.total)}</strong></div>
      </div>\`).join('') : '<p style="color:var(--muted);">No orders yet.</p>');
  } else if (accTab === 'wishlist') {
    inner = \`<h4 style="margin-bottom:14px;">Wishlist (\${myWish.length})</h4>\` + (myWish.length ? myWish.map(p => \`
      <div style="display:flex;align-items:center;gap:12px;border:1px solid var(--border);border-radius:10px;padding:10px;margin-bottom:10px;">
        <img src="\${esc(p.coverImage||p.images[0])}" style="width:52px;height:52px;border-radius:8px;">
        <div style="flex:1;"><strong>\${esc(p.name)}</strong><div class="tabular" style="font-size:13px;">\${money(p.price)}</div></div>
        <button class="btn-solid" style="padding:8px 12px;" onclick="closeAccount();openCheckout('buyNow',\${p.id})">Buy</button>
        <button class="btn-outline" style="padding:8px 12px;" onclick="toggleWish(\${p.id});renderAccount();">Remove</button>
      </div>\`).join('') : '<p style="color:var(--muted);">Wishlist is empty.</p>');
  } else if (accTab === 'security') {
    inner = \`<form onsubmit="changePass(event)">
      <h4 style="margin-bottom:14px;">Change Password</h4>
      <div class="fg"><label>Current Password</label><input class="fc" type="password" id="cpOld" required></div>
      <div class="fg"><label>New Password</label><input class="fc" type="password" id="cpNew" required></div>
      <button class="btn-solid" style="padding:11px 22px;">Update Password</button>
    </form>\`;
  }
  body.innerHTML = \`
    <div class="modal-head"><h3>\${esc(c.name)}</h3><div style="display:flex;gap:8px;"><button class="btn-outline" style="padding:6px 12px;" onclick="state.currentCustomerEmail=null;save();applyTheme();renderAccount();">Sign Out</button><button class="close-x" onclick="closeAccount()">×</button></div></div>
    <div class="acc-layout">
      <div class="acc-side">
        <button class="\${accTab==='profile'?'active':''}" onclick="accTab='profile';renderAccount()">Profile</button>
        <button class="\${accTab==='orders'?'active':''}" onclick="accTab='orders';renderAccount()">Orders (\${myOrders.length})</button>
        <button class="\${accTab==='wishlist'?'active':''}" onclick="accTab='wishlist';renderAccount()">Wishlist (\${myWish.length})</button>
        <button class="\${accTab==='security'?'active':''}" onclick="accTab='security';renderAccount()">Change Password</button>
      </div>
      <div class="modal-body">\${inner}</div>
    </div>\`;
}
function doLogin(e) {
  e.preventDefault();
  const em = document.getElementById('liEmail').value.trim().toLowerCase(), pw = document.getElementById('liPass').value;
  const c = state.customers.find(x => x.email.toLowerCase() === em && x.pass === pw);
  if (!c) return toast('Invalid email or password');
  state.currentCustomerEmail = c.email; save(); applyTheme(); renderProducts(); renderAccount(); toast('Signed in');
}
function doReg(e) {
  e.preventDefault();
  const em = document.getElementById('rgEmail').value.trim();
  if (state.customers.some(x => x.email.toLowerCase() === em.toLowerCase())) return toast('Email already registered');
  state.customers.push({ id:'C'+Date.now(), name:document.getElementById('rgName').value.trim(), phone:document.getElementById('rgPhone').value.trim(), email:em, pass:document.getElementById('rgPass').value, wishlist:[...(state.guestWishlist||[])], joinedAt:new Date().toLocaleDateString() });
  state.currentCustomerEmail = em; state.guestWishlist = []; save(); applyTheme(); renderAccount(); toast('Account created');
}
function saveProfile(e) {
  e.preventDefault(); const c = getCustomer(); if (!c) return;
  c.name = document.getElementById('prName').value.trim(); c.phone = document.getElementById('prPhone').value.trim();
  c.city = document.getElementById('prCity').value.trim(); c.address = document.getElementById('prAddr').value.trim();
  save(); applyTheme(); toast('Profile updated');
}
function changePass(e) {
  e.preventDefault(); const c = getCustomer(); if (!c) return;
  if (document.getElementById('cpOld').value !== c.pass) return toast('Current password incorrect');
  c.pass = document.getElementById('cpNew').value; save(); toast('Password updated');
}

/* Admin Panel */
function openAdmin() { renderAdmin(); document.getElementById('adminModal').classList.add('show'); }
function closeAdmin() { document.getElementById('adminModal').classList.remove('show'); }
function renderAdmin() {
  const body = document.getElementById('adminBody');
  if (!adminLoggedIn) {
    body.innerHTML = \`
      <div class="modal-head"><h3>Admin Login</h3><button class="close-x" onclick="closeAdmin()">×</button></div>
      <div class="modal-body" style="max-width:400px;margin:0 auto;">
        <form onsubmit="doAdminLogin(event)">
          <div class="fg"><label>Username</label><input class="fc" id="admU" value="admin" required></div>
          <div class="fg"><label>Password</label><input class="fc" type="password" id="admP" value="admin123" required></div>
          <button class="btn-solid" style="width:100%;padding:12px;">Access Dashboard</button>
        </form>
      </div>\`;
    return;
  }
  const tabs = ['overview','products','categories','hero','branding','orders','customers','settings'];
  let content = '';
  if (adminTab === 'overview') {
    const rev = state.orders.reduce((s,o)=>s+Number(o.total||0),0);
    const tr = JSON.parse(localStorage.getItem('storeTraffic')||'{"total":0}');
    content = \`<div class="frow">
      <div style="padding:16px;border:1px solid var(--border);border-radius:12px;"><small style="color:var(--muted);">Products</small><div class="tabular" style="font-size:24px;font-weight:700;">\${state.products.length}</div></div>
      <div style="padding:16px;border:1px solid var(--border);border-radius:12px;"><small style="color:var(--muted);">Orders</small><div class="tabular" style="font-size:24px;font-weight:700;">\${state.orders.length}</div></div>
      <div style="padding:16px;border:1px solid var(--border);border-radius:12px;"><small style="color:var(--muted);">Revenue</small><div class="tabular" style="font-size:24px;font-weight:700;">\${money(rev)}</div></div>
      <div style="padding:16px;border:1px solid var(--border);border-radius:12px;"><small style="color:var(--muted);">Visits</small><div class="tabular" style="font-size:24px;font-weight:700;">\${tr.total||0}</div></div>
    </div>\`;
  } else if (adminTab === 'products') {
    content = \`<button class="btn-solid" style="padding:10px 18px;" onclick="startEditProd(null)">+ Add Product</button>
      <table class="tbl"><tr><th>Img</th><th>Name</th><th>Category</th><th>Price</th><th>Actions</th></tr>
      \${state.products.map(p=>\`<tr><td><img src="\${esc(p.coverImage||p.images[0])}"></td><td>\${esc(p.name)}</td><td>\${esc(p.category)}</td><td class="tabular">\${money(p.price)}</td><td><button onclick="startEditProd(\${p.id})" style="color:var(--primary);font-weight:600;margin-right:10px;">Edit</button><button onclick="delProd(\${p.id})" style="color:#dc2626;font-weight:600;">Delete</button></td></tr>\`).join('')}</table>\`;
  } else if (adminTab === 'editProd') {
    const p = editingProdId ? state.products.find(x=>x.id===editingProdId) : null;
    content = \`<form onsubmit="saveProd(event)">
      <h4 style="margin-bottom:14px;">\${p?'Edit':'Add'} Product</h4>
      <div class="frow"><div class="fg"><label>Name</label><input class="fc" id="epN" required value="\${esc(p?.name||'')}"></div><div class="fg"><label>Price</label><input class="fc" type="number" id="epP" required value="\${p?.price||''}"></div></div>
      <div class="frow"><div class="fg"><label>Category</label><select class="fc" id="epC">\${state.categories.map(c=>\`<option \${p?.category===c.name?'selected':''}>\${esc(c.name)}</option>\`).join('')}</select></div><div class="fg"><label>Sub-Category</label><input class="fc" id="epS" value="\${esc(p?.subCat||'')}"></div></div>
      <div class="fg"><label>Description</label><textarea class="fc" id="epD">\${esc(p?.desc||'')}</textarea></div>
      <div class="fg"><label>Upload Multiple Images (up to 4)</label>
        <label class="dropzone"><input type="file" accept="image/*" multiple onchange="onProdFiles(event)"><strong>Click to upload up to 4 product images</strong><span style="font-size:12px;color:var(--muted);">PNG, JPG, WEBP supported</span></label>
        <div class="slot-grid" id="slotGrid"></div>
      </div>
      <button class="btn-solid" style="padding:11px 22px;">Save Product</button>
      <button type="button" class="btn-outline" style="padding:11px 22px;margin-left:8px;" onclick="adminTab='products';renderAdmin()">Cancel</button>
    </form>\`;
  } else if (adminTab === 'categories') {
    content = \`<form onsubmit="addCat(event)" class="frow" style="margin-bottom:16px;"><div class="fg"><label>Category Name</label><input class="fc" id="ncN" required></div><div class="fg"><label>Image URL</label><input class="fc" id="ncI" required></div><button class="btn-solid" style="padding:10px;">Add Category</button></form>
      <form onsubmit="addSub(event)" class="frow" style="margin-bottom:16px;"><div class="fg"><label>Parent</label><select class="fc" id="nsP">\${state.categories.map(c=>\`<option>\${esc(c.name)}</option>\`).join('')}</select></div><div class="fg"><label>Sub-Category</label><input class="fc" id="nsN" required></div><button class="btn-outline" style="padding:10px;">Add Sub-Category</button></form>
      <table class="tbl"><tr><th>Name</th><th>Sub-Categories</th><th>Action</th></tr>\${state.categories.map((c,i)=>\`<tr><td>\${esc(c.name)}</td><td>\${(c.subCats||[]).join(', ')}</td><td><button onclick="state.categories.splice(\${i},1);save();renderNav();renderCatStrip();renderAdmin();" style="color:#dc2626;">Delete</button></td></tr>\`).join('')}</table>\`;
  } else if (adminTab === 'hero') {
    content = \`<h4 style="margin-bottom:12px;">Hero Slides (\${state.heroSlides.length})</h4>\` + state.heroSlides.map((s,i)=>\`
      <div style="border:1px solid var(--border);padding:14px;border-radius:12px;margin-bottom:12px;">
        <div class="frow"><div class="fg"><label>Slide \${i+1} Title</label><input class="fc" value="\${esc(s.title)}" onchange="state.heroSlides[\${i}].title=this.value;save();renderHero();"></div><div class="fg"><label>Button</label><input class="fc" value="\${esc(s.btn)}" onchange="state.heroSlides[\${i}].btn=this.value;save();renderHero();"></div></div>
        <div class="fg"><label>Description</label><input class="fc" value="\${esc(s.desc)}" onchange="state.heroSlides[\${i}].desc=this.value;save();renderHero();"></div>
        <label class="dropzone"><input type="file" accept="image/*" onchange="onHeroFile(event,\${i})"><span>Replace Slide \${i+1} Image</span></label>
      </div>\`).join('');
  } else if (adminTab === 'branding') {
    const s = state.settings;
    content = \`<form onsubmit="saveBrand(event)">
      <div class="frow"><div class="fg"><label>Store Name</label><input class="fc" id="brN" value="\${esc(s.brandName)}"></div><div class="fg"><label>Announcement</label><input class="fc" id="brA" value="\${esc(s.announcement)}"></div></div>
      <div class="frow"><div class="fg"><label>Primary Color</label><input class="fc" type="color" id="brP" value="\${s.primary}" style="height:44px;"></div><div class="fg"><label>Accent Color</label><input class="fc" type="color" id="brAc" value="\${s.accent}" style="height:44px;"></div></div>
      <button class="btn-solid" style="padding:11px 22px;">Save Branding</button>
    </form>\`;
  } else if (adminTab === 'orders') {
    content = state.orders.length ? state.orders.map(o=>\`
      <div style="border:1px solid var(--border);padding:14px;border-radius:12px;margin-bottom:12px;">
        <div style="display:flex;justify-content:space-between;font-weight:700;"><span>\${esc(o.id)} — \${esc(o.name)}</span><span class="tabular">\${money(o.total)}</span></div>
        <div style="font-size:12px;color:var(--muted);margin:4px 0;">\${esc(o.phone)} · \${esc(o.address)}, \${esc(o.city)}</div>
        <select class="fc" style="margin-top:8px;max-width:220px;" onchange="setOrdStatus('\${esc(o.id)}',this.value)">\${['Pending','Confirmed','Processing','Shipped','Delivered','Cancelled'].map(st=>\`<option \${o.status===st?'selected':''}>\${st}</option>\`).join('')}</select>
      </div>\`).join('') : '<p style="color:var(--muted);">No orders yet.</p>';
  } else if (adminTab === 'customers') {
    content = \`<table class="tbl"><tr><th>Name</th><th>Email</th><th>Phone</th></tr>\${state.customers.map(c=>\`<tr><td>\${esc(c.name)}</td><td>\${esc(c.email)}</td><td>\${esc(c.phone)}</td></tr>\`).join('')}</table>\`;
  } else if (adminTab === 'settings') {
    content = \`<div class="fg"><label>WhatsApp Number</label><input class="fc" id="stWa" value="\${esc(state.settings.whatsapp)}"></div>
      <button class="btn-solid" style="padding:10px 20px;" onclick="state.settings.whatsapp=document.getElementById('stWa').value;save();toast('Saved');">Save Settings</button>\`;
  }

  body.innerHTML = \`
    <div class="modal-head"><h3>Admin Control Panel</h3><button class="close-x" onclick="closeAdmin()">×</button></div>
    <div class="admin-tabs">\${tabs.map(t=>\`<button class="\${adminTab===t?'active':''}" onclick="adminTab='\${t}';renderAdmin()">\${t.toUpperCase()}</button>\`).join('')}</div>
    <div class="modal-body">\${content}</div>\`;
  if (adminTab === 'editProd') renderSlots();
}

function doAdminLogin(e) {
  e.preventDefault();
  if (document.getElementById('admU').value === (state.settings.adminUser||'admin') && document.getElementById('admP').value === (state.settings.adminPass||'admin123')) {
    adminLoggedIn = true; renderAdmin(); toast('Welcome Admin');
  } else toast('Invalid credentials');
}
function startEditProd(id) {
  editingProdId = id; tempImgs = [null,null,null,null]; tempCover = 0;
  if (id) { const p = state.products.find(x=>x.id===id); if (p) { (p.images||[]).slice(0,4).forEach((im,i)=>tempImgs[i]=im); } }
  adminTab = 'editProd'; renderAdmin();
}
function renderSlots() {
  const g = document.getElementById('slotGrid'); if (!g) return;
  g.innerHTML = tempImgs.map((x,i)=>\`<div class="slot">\${x?\`<img src="\${x}"><button type="button" class="s-del" onclick="tempImgs[\${i}]=null;renderSlots()">×</button><button type="button" class="s-cov \${i===tempCover?'active':''}" onclick="tempCover=\${i};renderSlots()">★ Cover</button>\`:'Slot '+(i+1)}</div>\`).join('');
}
function readImg(file) { return new Promise(res => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(file); }); }
async function onProdFiles(e) {
  for (const f of [...e.target.files].slice(0,4)) { const idx = tempImgs.findIndex(x=>!x); if (idx>=0) tempImgs[idx] = await readImg(f); }
  renderSlots();
}
async function onHeroFile(e, i) { const f = e.target.files[0]; if (!f) return; state.heroSlides[i].img = await readImg(f); save(); renderHero(); toast('Slide updated'); }
function saveProd(e) {
  e.preventDefault(); const imgs = tempImgs.filter(Boolean); if (!imgs.length) return toast('Add at least 1 image');
  const cov = tempImgs[tempCover] || imgs[0];
  const p = { id: editingProdId || Date.now(), name: document.getElementById('epN').value, price: Number(document.getElementById('epP').value), category: document.getElementById('epC').value, subCat: document.getElementById('epS').value, desc: document.getElementById('epD').value, images: imgs, coverImage: cov, featured: true, inStock: true, rating: 4.9, tag: 'New' };
  if (editingProdId) { const i = state.products.findIndex(x=>x.id===editingProdId); state.products[i]=p; } else state.products.unshift(p);
  save(); renderProducts(); adminTab='products'; renderAdmin(); toast('Product saved');
}
function delProd(id) { state.products = state.products.filter(x=>x.id!==id); save(); renderProducts(); renderAdmin(); }
function addCat(e) { e.preventDefault(); state.categories.push({name:document.getElementById('ncN').value,img:document.getElementById('ncI').value,subCats:[]}); save(); renderNav(); renderCatStrip(); renderAdmin(); }
function addSub(e) { e.preventDefault(); const c = state.categories.find(x=>x.name===document.getElementById('nsP').value); if(c){c.subCats.push(document.getElementById('nsN').value);save();renderNav();renderAdmin();} }
function saveBrand(e) { e.preventDefault(); state.settings.brandName=document.getElementById('brN').value; state.settings.announcement=document.getElementById('brA').value; state.settings.primary=document.getElementById('brP').value; state.settings.accent=document.getElementById('brAc').value; save(); applyTheme(); toast('Branding saved'); }
function setOrdStatus(id, st) { const o = state.orders.find(x=>x.id===id); if(o){o.status=st;save();toast('Order status updated');} }

window.addEventListener('scroll', () => document.getElementById('siteHeader').classList.toggle('scrolled', window.scrollY > 16));
trackVisit(); applyTheme(); renderNav(); renderHero(); renderCatStrip(); renderFilters(); renderProducts();
setInterval(() => { if (!pauseHero) stepHero(1); }, 5500);
</script>
</body>
</html>`;
}
