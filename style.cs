:root{
  --cocoa:#A7816D; --beige:#AF8F7E; --blush:#DFC1CB; --rose:#C48197; --mauve:#B66681;
  --bg:#faf8f9; --card:#fff; --ink:#1b1b1b; --muted:#6c6c6c;
  --radius:16px; --shadow:0 12px 28px rgba(0,0,0,.08);
}
*{box-sizing:border-box}
html,body{margin:0;background:var(--bg);color:var(--ink);font-family:Inter,system-ui,Segoe UI,Roboto,Arial}
h1,h2,h3{font-family:"Playfair Display",serif}
.site-header{position:sticky;top:0;z-index:10;background:rgba(255,255,255,.9);backdrop-filter:blur(8px);border-bottom:1px solid #eee;padding:14px 18px;display:flex;justify-content:space-between;align-items:center}
.brand{display:flex;align-items:center;gap:12px}
.logo{width:38px;height:38px;border-radius:12px;background:linear-gradient(135deg,var(--blush),var(--rose));box-shadow:var(--shadow)}
.wrap{max-width:1100px;margin:22px auto;padding:0 16px;display:grid;grid-template-columns:260px 1fr;gap:18px}
.sidebar h3{margin:6px 0 10px}
.menu{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:6px}
.menu button{width:100%;text-align:left;background:#fff;border:1px solid #eee;color:#333;padding:10px 12px;border-radius:12px;cursor:pointer}
.menu button.active{background:var(--blush);border-color:var(--rose)}
.card{background:var(--card);border:1px solid #eee;border-radius:var(--radius);box-shadow:var(--shadow);padding:16px}
.content .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px}
.item{padding:12px;border:1px solid #eee;border-radius:14px;background:#fff}
.item h4{margin:0 0 6px;color:var(--mauve)}
.btn{display:inline-block;padding:10px 14px;border-radius:12px;font-weight:600;text-decoration:none;border:none;cursor:pointer;background:var(--beige);color:#fff}
.btn:hover{background:var(--mauve)}
.btn.ghost{background:#f0eef0;color:#333}
.chip{display:inline-block;padding:6px 10px;border-radius:999px;background:#f3e7eb;color:#7a3c56;text-decoration:none;font-weight:600}
.socials{margin-top:16px}
.social-row{display:flex;gap:8px;flex-wrap:wrap}
.muted{color:var(--muted);font-size:13px}

.grid-2{display:grid;grid-template-columns:1fr 1fr;gap:18px}
input,select,textarea{width:100%;padding:10px;border:1px solid #e7e7e7;border-radius:10px;background:#fff}
.stack>*{margin:6px 0}
.site-footer{text-align:center;color:var(--muted);padding:16px}

.modal{position:fixed;inset:0;background:rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center;padding:16px}
.modal.hidden{display:none}
.sheet{max-width:520px;width:100%;position:relative}
.icon-close{position:absolute;right:12px;top:8px;border:0;background:transparent;font-size:26px;cursor:pointer;color:#444}
.paybox{display:flex;gap:12px;align-items:center;margin:10px 0}
.paybox img{width:120px;border-radius:10px;border:1px solid #eee}
