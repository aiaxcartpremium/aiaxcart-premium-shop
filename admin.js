import { supabase } from './app.js';

const authBox = document.getElementById('authBox');
const adminArea = document.getElementById('adminArea');

document.getElementById('loginBtn').onclick = async ()=>{
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  document.getElementById('authMsg').textContent = error ? error.message : 'Logged in!';
  if (!error) initAdmin();
};

document.getElementById('logoutBtn')?.addEventListener('click', async ()=>{
  await supabase.auth.signOut(); location.reload();
});

async function initAdmin(){
  authBox.classList.add('hidden');
  adminArea.classList.remove('hidden');
  await Promise.all([loadCategories(), loadProducts(), loadOnhand(), loadOrders(), loadStats()]);
  document.getElementById('prodForm').onsubmit = saveProduct;
  document.getElementById('invForm').onsubmit = addOnhand;
  document.getElementById('csvBtn').onclick = exportCSV;
}

/* ---------- Products ---------- */

async function loadCategories(){
  const { data } = await supabase.from('categories').select('*').order('sort');
  const sel = document.getElementById('pCat');
  const invSel = document.getElementById('invProd');
  sel.innerHTML = ''; invSel.innerHTML = '';
  data.forEach(c=>{
    sel.innerHTML += `<option value="${c.id}">${c.name}</option>`;
    invSel.innerHTML += `<option value="${c.id}" disabled>— ${c.name} —</option>`;
  });

  // fill product select options for inventory
  const { data: prods } = await supabase.from('products').select('id,name,category_id').order('name');
  prods.forEach(p=>{
    invSel.innerHTML += `<option value="${p.id}">${p.name}</option>`;
  });
}

async function loadProducts(){
  const { data, error } = await supabase.from('products').select('*, categories(name)').order('created_at',{ascending:false});
  const box = document.getElementById('prodList');
  if (error){ box.textContent = error.message; return; }
  box.innerHTML = '';
  data.forEach(p=>{
    const div = document.createElement('div');
    div.className='item';
    div.innerHTML = `
      <b>${p.name}</b> — ₱${Number(p.price).toFixed(2)} — <i>${p.categories?.name||''}</i>
      <div class="muted">${p.description||''}</div>
      <div class="muted">Stock: ${p.available_stock} • ${p.available?'Available':'Hidden'}</div>
      <div class="actions">
        <button class="btn small" data-act="edit" data-id="${p.id}">Edit</button>
        <button class="btn small" data-act="toggle" data-id="${p.id}">${p.available?'Hide':'Show'}</button>
      </div>
    `;
    div.querySelector('[data-act="edit"]').onclick = ()=> fillProduct(p);
    div.querySelector('[data-act="toggle"]').onclick = async ()=>{
      await supabase.from('products').update({available:!p.available}).eq('id', p.id);
      loadProducts();
    };
    box.appendChild(div);
  });
}

function fillProduct(p){
  document.getElementById('pCat').value = p.category_id;
  document.getElementById('pName').value = p.name;
  document.getElementById('pPrice').value = p.price;
  document.getElementById('pDesc').value = p.description||'';
  document.getElementById('pAvail').checked = !!p.available;
  document.getElementById('pStock').value = p.available_stock||0;
  document.getElementById('prodForm').dataset.editId = p.id;
}

async function saveProduct(e){
  e.preventDefault();
  const body = {
    category_id: document.getElementById('pCat').value,
    name: document.getElementById('pName').value,
    price: Number(document.getElementById('pPrice').value||0),
    description: document.getElementById('pDesc').value || null,
    available: document.getElementById('pAvail').checked,
    available_stock: Number(document.getElementById('pStock').value||0)
  };
  const id = e.target.dataset.editId;
  if (id) await supabase.from('products').update(body).eq('id', id);
  else    await supabase.from('products').insert(body);
  e.target.reset(); delete e.target.dataset.editId;
  await loadProducts(); await loadCategories();
}

/* ---------- On-hand Accounts ---------- */

async function addOnhand(e){
  e.preventDefault();
  const prodId = document.getElementById('invProd').value;
  const username = document.getElementById('invUser').value;
  const secret = document.getElementById('invSecret').value;
  const notes = document.getElementById('invNotes').value;

  await supabase.from('onhand_accounts').insert({product_id: prodId, username, secret, notes});
  // increment displayed stock too
  await supabase.rpc('increment_stock', { p_product_id: prodId });
  e.target.reset(); loadOnhand(); loadProducts();
}

async function loadOnhand(){
  const { data, error } = await supabase.from('onhand_accounts').select('*, products(name)').order('assigned, created_at');
  const box = document.getElementById('invList');
  if (error){ box.textContent = error.message; return; }
  box.innerHTML='';
  data.forEach(a=>{
    const div = document.createElement('div');
    div.className='item';
    div.innerHTML = `
      <b>${a.products?.name||''}</b> • ${a.username}
      <div class="muted">${a.assigned?'Assigned':'Available'} ${a.assigned_at?('• '+new Date(a.assigned_at).toLocaleString()):''}</div>
    `;
    box.appendChild(div);
  });
}

/* ---------- Orders & Auto-Drop ---------- */

async function loadOrders(){
  const { data, error } = await supabase.from('orders').select('*').order('created_at',{ascending:false});
  const box = document.getElementById('orderList');
  if (error){ box.textContent = error.message; return; }
  box.innerHTML='';
  data.forEach(o=>{
    const div = document.createElement('div');
    div.className='item';
    div.innerHTML = `
      <b>${o.product_name}</b> — ₱${Number(o.price).toFixed(2)} • <i>${o.payment_method}</i>
      <div class="muted">Order ${o.id} • ${o.customer_name} • ${o.customer_email}</div>
      ${o.payment_ref?`<div class="muted">Ref: ${o.payment_ref}</div>`:''}
      ${o.receipt_url?`<div><a target="_blank" href="${o.receipt_url}">View receipt</a></div>`:''}
      ${o.drop_payload?`<div class="card" style="margin:6px 0"><b>Delivered:</b> ${o.drop_payload->>'username'} / ${o.drop_payload->>'secret'} <br><small>${o.drop_payload->>'notes'}</small></div>`:''}
      <label>Status:
        <select data-id="${o.id}" class="status">
          ${['pending','paid','completed','cancelled'].map(s=>`<option ${s===o.status?'selected':''}>${s}</option>`).join('')}
        </select>
      </label>
      <div class="actions">
        <button data-id="${o.id}" class="btn small save">Save</button>
        <button data-id="${o.id}" class="btn small drop">Confirm Paid & Auto-Drop</button>
      </div>
    `;
    // Save status only
    div.querySelector('.save').onclick = async ()=>{
      const st = div.querySelector('.status').value;
      await supabase.from('orders').update({status:st}).eq('id', o.id);
      loadStats(); loadOrders();
    };
    // Auto-drop
    div.querySelector('.drop').onclick = async ()=>{
      // set status paid then fulfill
      await supabase.from('orders').update({status:'paid'}).eq('id', o.id);
      const { data: res, error } = await supabase.rpc('fulfill_order', { p_order_id: o.id });
      if (error) alert(error.message);
      await loadProducts(); await loadOnhand(); await loadOrders(); await loadStats();
    };
    box.appendChild(div);
  });
}

async function loadStats(){
  const { data } = await supabase.from('orders')
    .select('product_name,status').in('status',['paid','completed']);
  const counts = {};
  data?.forEach(o=>counts[o.product_name]=(counts[o.product_name]||0)+1);
  const html = Object.entries(counts).map(([k,v])=>`<div class="card"><h4>${k}</h4><p class="muted">${v} sold</p></div>`).join('');
  document.getElementById('stats').innerHTML = `<h3>Sales Summary</h3><div class="grid">${html || '<p class="muted">No sales yet.</p>'}</div>`;
}

async function exportCSV(){
  const { data, error } = await supabase.from('orders').select('*');
  if (error) return alert(error.message);
  if (!data.length) return alert('No orders.');
  const headers=Object.keys(data[0]); const rows=[headers.join(',')];
  data.forEach(r=>rows.push(headers.map(h=>`"${(r[h]??'').toString().replace(/"/g,'""')}"`).join(',')));
  const blob=new Blob([rows.join('\n')],{type:'text/csv'}), url=URL.createObjectURL(blob);
  const a=document.createElement('a'); a.href=url; a.download='orders.csv'; a.click(); URL.revokeObjectURL(url);
}

/* ---------- Small RPC to increment stock when adding on-hand ---------- */
