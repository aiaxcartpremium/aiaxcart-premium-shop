// shop.js
import { supabase } from './app.js';

const grid      = document.getElementById('grid');
const catChips  = document.getElementById('catChips');
const dlg       = document.getElementById('checkout');

let allCats = [];
let allProds = [];
let activeCat = null;      // category_id filter
let currentProd = null;    // product selected for checkout

/* ============== UI helpers ============== */
function php(n) { return '₱' + Number(n ?? 0).toFixed(2); }
function byId(id){ return document.getElementById(id); }
function el(tag, attrs={}, html=''){
  const e = document.createElement(tag);
  Object.entries(attrs).forEach(([k,v]) => e.setAttribute(k,v));
  if (html) e.innerHTML = html;
  return e;
}

/* ============== Load categories + products ============== */
async function loadData(){
  const { data: cats } = await supabase.from('categories').select('id,name,sort').order('sort');
  allCats = cats || [];
  renderCatChips();

  const { data: prods, error } = await supabase
    .from('products')
    .select('id,category_id,name,price,description,available_stock,available')
    .eq('available', true)
    .order('created_at', { ascending:false });

  if (error) {
    grid.innerHTML = `<div class="card">Error: ${error.message}</div>`;
    return;
  }
  allProds = prods || [];
  renderGrid();
}

function renderCatChips(){
  catChips.innerHTML = '';
  const all = el('button', {class:'chip'}, 'All');
  all.onclick = () => {activeCat = null; renderGrid(); highlightChip(all);};
  catChips.appendChild(all);
  allCats.forEach(c=>{
    const b = el('button', {class:'chip', 'data-id': c.id}, c.name);
    b.onclick = () => {activeCat = c.id; renderGrid(); highlightChip(b);};
    catChips.appendChild(b);
  });
  highlightChip(all);
}
function highlightChip(btn){
  [...catChips.querySelectorAll('.chip')].forEach(c=>c.classList.remove('active'));
  btn.classList.add('active');
}

function renderGrid(){
  const list = activeCat ? allProds.filter(p=>p.category_id===activeCat) : allProds.slice();
  if (!list.length){
    grid.innerHTML = `<div class="card">No items yet. Add products in Admin and set <b>Available</b>=true.</div>`;
    return;
  }
  grid.innerHTML = list.map(p => cardHTML(p)).join('');
  grid.querySelectorAll('[data-order]').forEach(btn=>{
    btn.onclick = () => openCheckout(btn.dataset.id);
  });
}

function cardHTML(p){
  return `
  <div class="card">
    <h3 style="margin:0 0 6px">${p.name}</h3>
    <div class="muted" style="margin-bottom:8px">${p.description ?? ''}</div>
    <div style="font-weight:700;color:#a35d73">${php(p.price)}</div>
    <div class="muted" style="margin:6px 0 12px">${p.available_stock ?? 0} on-hand</div>
    <button class="btn primary" data-order data-id="${p.id}">Order</button>
  </div>`;
}

/* ============== Checkout ============== */
async function openCheckout(productId){
  currentProd = allProds.find(x=>x.id===productId);
  if (!currentProd){ alert('Product not found.'); return; }
  byId('ckTitle').textContent = currentProd.name;
  byId('ckSubtitle').textContent = `${php(currentProd.price)} • ${currentProd.available_stock ?? 0} on-hand`;
  byId('ckName').value=''; byId('ckEmail').value=''; byId('ckRef').value='';
  byId('ckFile').value=null; byId('ckMsg').textContent='';
  dlg.showModal();
}

document.getElementById('placeBtn').addEventListener('click', async (e)=>{
  e.preventDefault();
  if (!currentProd) return;

  const name   = byId('ckName').value.trim();
  const email  = byId('ckEmail').value.trim();
  const ref    = byId('ckRef').value.trim();
  const fileEl = byId('ckFile');
  const pay    = (document.querySelector('input[name="pay"]:checked')?.value ?? 'gcash');

  if (!name || !email){ byId('ckMsg').textContent='Please fill name and email.'; return; }
  if (!ref && fileEl.files.length===0){
    byId('ckMsg').textContent='Reference number or receipt is required.'; return;
  }

  byId('ckMsg').textContent='Placing order…';

  // upload receipt if any
  let receipt_url = null;
  if (fileEl.files.length){
    const f = fileEl.files[0];
    const key = `rcpt_${Date.now()}_${Math.random().toString(36).slice(2)}_${f.name}`;
    const up = await supabase.storage.from('receipts').upload(key, f, {contentType: f.type || 'application/octet-stream'});
    if (up.error){ byId('ckMsg').textContent = up.error.message; return; }
    const pub = supabase.storage.from('receipts').getPublicUrl(up.data.path);
    receipt_url = pub.data.publicUrl;
  }

  // create the order
  const { error } = await supabase.from('orders').insert({
    product_id:     currentProd.id,
    product_name:   currentProd.name,
    price:          currentProd.price,
    customer_name:  name,
    customer_email: email,
    payment_method: pay,
    payment_ref:    ref || null,
    receipt_url:    receipt_url,
    status:         'pending'
  });

  if (error){ byId('ckMsg').textContent = error.message; return; }

  byId('ckMsg').textContent='Order placed! We’ll message you shortly.';
  setTimeout(()=> dlg.close(), 600);
});

/* ============== Start ============== */
loadData();
