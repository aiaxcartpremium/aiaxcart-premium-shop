// shop.js
import { supabase } from './app.js';

/* ---------- helpers: mount target container (auto-create) ---------- */
function getMount() {
  // try common containers; else create one
  let el =
    document.getElementById('catalog') ||
    document.getElementById('productList') ||
    document.getElementById('items') ||
    document.querySelector('main');

  if (!el) {
    el = document.createElement('main');
    document.body.appendChild(el);
  }
  // make an inner grid holder
  let grid = el.querySelector('#items');
  if (!grid) {
    grid = document.createElement('div');
    grid.id = 'items';
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = 'repeat(auto-fill,minmax(240px,1fr))';
    grid.style.gap = '16px';
    grid.style.margin = '24px auto';
    grid.style.maxWidth = '1200px';
    el.appendChild(grid);
  }
  return grid;
}

function pricePhp(n) {
  return '₱' + Number(n ?? 0).toFixed(2);
}

function cardHTML(p) {
  const stock = Number(p.available_stock ?? 0);
  return `
  <div class="card" style="
      background:#fff; border:1px solid #eee; border-radius:16px;
      padding:18px; box-shadow:0 6px 20px rgba(0,0,0,.04)">
    <h3 style="margin:0 0 6px 0; font-size:18px">${p.name}</h3>
    <div style="color:#956475; font-weight:600; margin-bottom:6px">${pricePhp(p.price)}</div>
    <div style="color:#6b6b6b; min-height:32px">${p.description ?? ''}</div>
    <div style="margin:10px 0 14px; color:#777;">
      <small>${stock} on-hand</small>
    </div>
    <button data-id="${p.id}" class="orderBtn" style="
        width:100%; border:none; border-radius:12px; padding:10px 14px;
        background:#c48197; color:#fff; font-weight:600; cursor:pointer">
      Order
    </button>
  </div>`;
}

/* ---------- main ---------- */
(async function init() {
  const grid = getMount();

  // fetch available products
  const { data: products, error } = await supabase
    .from('products')
    .select('id,name,price,description,available_stock,available')
    .eq('available', true)
    .order('created_at', { ascending: false });

  if (error) {
    grid.innerHTML = `<div style="color:#b00020">Error: ${error.message}</div>`;
    return;
  }

  if (!products || products.length === 0) {
    grid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;color:#666;padding:28px;">
        <h3 style="margin:0 0 8px">No items yet</h3>
        <p style="margin:0">Add products in your Admin → Products and set <b>Available</b> = true.</p>
      </div>`;
    return;
  }

  grid.innerHTML = products.map(cardHTML).join('');

  // wire Order buttons (keep simple: scroll to social links or show toast)
  grid.querySelectorAll('.orderBtn').forEach(btn => {
    btn.addEventListener('click', () => {
      // If you already have a checkout modal, call it here.
      // For now, smooth scroll to your "Message me" section if present:
      const social = Array.from(document.querySelectorAll('a,button'))
        .find(x => /Telegram|Messenger|Instagram/i.test(x.textContent || ''));
      if (social) social.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  });
})();
