import { supabase, PAYMENT, SOCIALS } from './app.js';

const catList = document.getElementById('catList');
const itemGrid = document.getElementById('itemGrid');
const modal = document.getElementById('modal');
const closeModal = document.getElementById('closeModal');
const modalBody = document.getElementById('modalBody');

closeModal.onclick = ()=> modal.classList.add('hidden');
modal.addEventListener('click', (e)=>{ if(e.target===modal) modal.classList.add('hidden'); });

(async function init(){
  // load categories
  const { data: cats } = await supabase.from('categories').select('*').order('sort');
  renderCats(cats);

  // auto select first
  if (cats?.length) loadItems(cats[0].id);

  // socials
  document.querySelector('.social-row').innerHTML = `
    <a class="chip" target="_blank" href="${SOCIALS.tg}">Telegram</a>
    <a class="chip" target="_blank" href="${SOCIALS.fb}">Messenger</a>
    <a class="chip" target="_blank" href="${SOCIALS.ig}">Instagram</a>`;
})();

function renderCats(cats){
  catList.innerHTML = '';
  cats.forEach((c, i)=>{
    const li = document.createElement('li');
    li.innerHTML = `<button ${i===0?'class="active"':''}>${c.name}</button>`;
    li.querySelector('button').onclick = ()=>{
      catList.querySelectorAll('button').forEach(b=>b.classList.remove('active'));
      li.querySelector('button').classList.add('active');
      loadItems(c.id);
    };
    catList.appendChild(li);
  });
}

async function loadItems(catId){
  const { data: items, error } = await supabase
    .from('products')
    .select('*')
    .eq('category_id', catId)
    .eq('available', true)
    .order('name');
  if (error) { itemGrid.innerHTML = `<div class="card">Error: ${error.message}</div>`; return; }
  itemGrid.innerHTML = '';
  items.forEach(p=>{
    const div = document.createElement('div');
    div.className = 'item';
    div.innerHTML = `
      <h4>${p.name}</h4>
      <div class="muted">${p.description||''}</div>
      <p><b>₱${Number(p.price).toFixed(2)}</b> • <small>${p.available_stock} on-hand</small></p>
      <button class="btn">Order</button>
    `;
    div.querySelector('button').onclick = ()=> openCheckout(p);
    itemGrid.appendChild(div);
  });
}

function openCheckout(p){
  modalBody.innerHTML = `
    <h3>${p.name}</h3>
    <p class="muted">${p.description||''}</p>
    <p><b>Price:</b> ₱${Number(p.price).toFixed(2)} • <small>${p.available_stock} on-hand</small></p>

    <div class="paybox card">
      <img id="qrImg" src="${PAYMENT.gcash.qr}" alt="QR">
      <div>
        <label><input type="radio" name="pay" value="gcash" checked> GCash</label>
        <label style="margin-left:8px"><input type="radio" name="pay" value="maya"> Maya</label>
        <p class="muted">Scan & pay the exact amount then provide your payment reference below.</p>
      </div>
    </div>

    <form id="orderForm" class="stack">
      <label>Name <input id="name" required></label>
      <label>Email <input id="email" type="email" required></label>
      <label>Payment reference (optional) <input id="payref" placeholder="e.g., GCash Ref # or Maya Ref #"></label>
      <label>Upload receipt (optional) <input id="receipt" type="file" accept="image/*"></label>
      <button class="btn" type="submit">Place Order</button>
      <div id="msg" class="muted"></div>
    </form>
  `;
  // change QR when method switches
  modalBody.querySelectorAll('input[name="pay"]').forEach(r=>{
    r.onchange = ()=>{
      document.getElementById('qrImg').src = PAYMENT[r.value].qr;
    };
  });

  modal.classList.remove('hidden');

  modalBody.querySelector('#orderForm').onsubmit = (e)=> submitOrder(e, p);
}

async function uploadReceipt(file, orderId){
  if (!file) return null;
  const path = `${orderId}/${Date.now()}_${file.name}`;
  const { error } = await supabase.storage.from('receipts').upload(path, file);
  if (error) throw error;
  const { data: pub } = supabase.storage.from('receipts').getPublicUrl(path);
  return pub.publicUrl;
}

async function submitOrder(e, p){
  e.preventDefault();
  const name = modalBody.querySelector('#name').value.trim();
  const email = modalBody.querySelector('#email').value.trim();
  const ref = modalBody.querySelector('#payref').value.trim();
  const method = modalBody.querySelector('input[name="pay"]:checked').value;
  const file = modalBody.querySelector('#receipt').files[0];

  const { data: order, error } = await supabase.from('orders').insert({
    product_id: p.id,
    product_name: p.name,
    price: p.price,
    customer_name: name,
    customer_email: email,
    payment_method: method,
    payment_ref: ref || null,
    status: 'pending'
  }).select().single();

  if (error){ modalBody.querySelector('#msg').textContent = error.message; return; }

  try{
    const url = await uploadReceipt(file, order.id);
    if (url) await supabase.from('orders').update({receipt_url:url}).eq('id', order.id);
  }catch(_){}

  modalBody.querySelector('#msg').innerHTML =
    `✅ Order placed! <br><small>ID: <code>${order.id}</code></small><br>
     We’ll verify payment and drop your account via email.`;
}
