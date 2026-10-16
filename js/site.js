/* Riva – shared behaviour: nav hover indicator + cart / order-history panel.
   Needs js/products.js loaded first (PRODUCTS, fmtPrice, escHTML). */
(function(){
"use strict";

/* ---------- 1. Nav underline follows hover ---------- */
const nav=document.querySelector(".nav");
if(nav){
  const ind=document.createElement("span");
  ind.className="nav-indicator"; ind.setAttribute("aria-hidden","true");
  nav.appendChild(ind); nav.classList.add("has-indicator");
  const active=()=>nav.querySelector('a[aria-current="page"]');
  const moveTo=a=>{
    if(!a){ind.style.opacity="0";return}
    const n=nav.getBoundingClientRect(), r=a.getBoundingClientRect();
    if(!r.width) return;                                  // menu hidden (mobile)
    ind.style.width=r.width+"px";
    ind.style.transform="translateX("+(r.left-n.left)+"px)";
    ind.style.opacity="1";
  };
  const canHover=window.matchMedia("(hover:hover)");
  nav.querySelectorAll("a").forEach(a=>{
    a.addEventListener("mouseenter",()=>{if(canHover.matches)moveTo(a)});
    a.addEventListener("focus",()=>moveTo(a));
  });
  nav.addEventListener("mouseleave",()=>moveTo(active()));
  nav.addEventListener("focusout",e=>{if(!nav.contains(e.relatedTarget))moveTo(active())});
  const place=()=>moveTo(active());
  place();
  requestAnimationFrame(()=>requestAnimationFrame(()=>ind.classList.add("ready")));  // enable animation after first placement
  window.addEventListener("resize",place);
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(place);
}

/* ---------- 2. Cart (side drawer) ---------- */
const CART_KEY="riva_cart_v1", ORDERS_KEY="riva_orders_v1";
const find=id=>PRODUCTS.find(p=>p.id===id);
const readCart=()=>{try{const v=JSON.parse(localStorage.getItem(CART_KEY)||"[]");
  return Array.isArray(v)?v.filter(x=>x&&find(x.id)&&find(x.id).price&&x.qty>0).map(x=>({id:x.id,qty:Math.min(99,Math.floor(x.qty))})):[]}catch(e){return[]}};
let cart=readCart();                       // single source of truth for header badge, cards and drawer
const saveCart=()=>{try{localStorage.setItem(CART_KEY,JSON.stringify(cart))}catch(e){}};
/* Orders: no backend yet. Only READS orders a future checkout/backend stores under "riva_orders_v1"
   (array of {id,date,status,items:[{name,qty}],total}). Nothing writes here today. */
const loadOrders=()=>{try{const v=JSON.parse(localStorage.getItem(ORDERS_KEY)||"[]");return Array.isArray(v)?v:[]}catch(e){return[]}};

const oldBtn=document.querySelector(".tools .cart");
if(!oldBtn)return;
const wrap=document.createElement("div");
wrap.className="cart-wrap";
wrap.innerHTML=`<button class="cart-btn" type="button" aria-label="سبد خرید" aria-expanded="false" aria-controls="cart-drawer">🛒<span class="cart-count" hidden></span></button>`;
oldBtn.replaceWith(wrap);
const overlay=document.createElement("div");
overlay.className="cart-overlay";
const drawer=document.createElement("aside");
drawer.className="cart-drawer"; drawer.id="cart-drawer";
drawer.setAttribute("role","dialog"); drawer.setAttribute("aria-modal","true"); drawer.setAttribute("aria-labelledby","cart-title");
drawer.inert=true;
drawer.innerHTML=`
 <div class="cd-head"><h2 id="cart-title">سبد خرید من</h2><button type="button" class="cd-close" aria-label="بستن سبد خرید">✕</button></div>
 <div class="cart-tabs" role="group" aria-label="بخش‌های سبد">
  <button type="button" data-tab="cart" aria-pressed="true">سبد خرید</button>
  <button type="button" data-tab="orders" aria-pressed="false">سفارش‌های قبلی</button>
 </div>
 <p class="cd-msg" role="status" aria-live="polite"></p>
 <div class="cart-body"></div>
 <div class="cd-foot"></div>`;
document.body.append(overlay,drawer);
const btn=wrap.querySelector(".cart-btn"), badge=wrap.querySelector(".cart-count"),
      body=drawer.querySelector(".cart-body"), foot=drawer.querySelector(".cd-foot"),
      msg=drawer.querySelector(".cd-msg"), closeBtn=drawer.querySelector(".cd-close");
let tab="cart", note="", msgTimer, lastFocus=null, isOpen=false;

const lines=()=>cart.map(c=>({c,p:find(c.id)}));
const subtotal=()=>lines().reduce((s,{c,p})=>s+c.qty*p.price,0);
const count=()=>cart.reduce((s,c)=>s+c.qty,0);
const fa=n=>Number(n).toLocaleString("fa-IR");

function render(){
  const n=count();
  badge.hidden=!n; badge.textContent=fa(n);
  btn.setAttribute("aria-label",n?`سبد خرید، ${fa(n)} کالا`:"سبد خرید");
  drawer.querySelectorAll("[data-tab]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.tab===tab)));
  foot.innerHTML="";
  if(tab==="orders"){
    const orders=loadOrders();
    body.innerHTML=orders.length?`<ul class="order-list">${orders.map(o=>`
      <li><div class="order-top"><b>سفارش ${escHTML(o.id)}</b><span>${escHTML(o.status||"")}</span></div>
      <div class="muted">${escHTML(o.date||"")}</div>
      <div>${(o.items||[]).map(i=>`${escHTML(i.name)} × ${fa(i.qty)}`).join("، ")}</div>
      <div class="order-total">${fmtPrice(o.total||0)} تومان</div></li>`).join("")}</ul>`
     :`<div class="cart-empty"><div class="ce-ico" aria-hidden="true">🧾</div><p>سفارش ثبت‌شده‌ای برای نمایش وجود ندارد.</p><small>سوابق خرید پس از اتصال سامانهٔ ثبت سفارش در این بخش نمایش داده می‌شود.</small></div>`;
    return;
  }
  if(!cart.length){
    body.innerHTML=`<div class="cart-empty"><div class="ce-ico" aria-hidden="true">🛒</div><p>سبد خرید شما خالی است</p><a class="btn solid" href="products.html">مشاهده محصولات</a></div>`;
    return;
  }
  body.innerHTML=`<ul class="cart-items">${lines().map(({c,p})=>`
   <li><img src="assets/img/${p.img}" alt="">
    <div class="ci-info"><b>${escHTML(p.name)}</b><span class="muted">${fmtPrice(p.price)} تومان</span>
     <div class="qty" role="group" aria-label="تعداد ${escHTML(p.name)}">
      <button type="button" data-act="dec" data-id="${p.id}" aria-label="کاهش تعداد">−</button>
      <output>${fa(c.qty)}</output>
      <button type="button" data-act="inc" data-id="${p.id}" aria-label="افزایش تعداد">+</button>
     </div></div>
    <div class="ci-side"><b>${fmtPrice(c.qty*p.price)} تومان</b>
     <button type="button" class="ci-rm" data-act="rm" data-id="${p.id}" aria-label="حذف ${escHTML(p.name)}">حذف</button></div></li>`).join("")}</ul>`;
  foot.innerHTML=`
   <dl class="cart-sum">
    <div><dt>تعداد کل اقلام</dt><dd>${fa(count())}</dd></div>
    <div><dt>جمع محصولات</dt><dd>${fmtPrice(subtotal())} تومان</dd></div>
    <div class="total"><dt>مبلغ قابل پرداخت</dt><dd>${fmtPrice(subtotal())} تومان</dd></div>
   </dl>
   <small class="muted">هزینهٔ ارسال و تخفیف هنوز در سایت تعریف نشده است.</small>
   <div class="cd-actions"><button type="button" class="btn" data-act="continue">ادامه خرید</button>
   <button type="button" class="btn solid" data-act="checkout">تکمیل سفارش</button></div>
   <p class="cart-note" role="status">${escHTML(note)}</p>`;
}
function flash(text){clearTimeout(msgTimer);msg.textContent=text;msgTimer=setTimeout(()=>msg.textContent="",3500)}
function change(id,fn){const c=cart.find(x=>x.id===id);if(!c)return;fn(c);cart=cart.filter(x=>x.qty>0);saveCart();render()}
function add(id){
  const p=find(id);if(!p||!p.price)return false;
  const c=cart.find(x=>x.id===id);c?c.qty=Math.min(99,c.qty+1):cart.push({id,qty:1});
  note="";saveCart();tab="cart";render();flash(`«${p.name}» به سبد خرید اضافه شد ✓`);return true;
}

/* open / close with focus management */
const focusables=()=>[...drawer.querySelectorAll("button:not([disabled]),a[href],input,[tabindex]:not([tabindex='-1'])")].filter(e=>e.offsetParent!==null);
function open(){
  if(isOpen)return; isOpen=true; lastFocus=document.activeElement;
  render(); drawer.inert=false; overlay.classList.add("open"); drawer.classList.add("open");
  document.documentElement.classList.add("cart-lock"); btn.setAttribute("aria-expanded","true");
  requestAnimationFrame(()=>closeBtn.focus());
}
function close(){
  if(!isOpen)return; isOpen=false;
  overlay.classList.remove("open"); drawer.classList.remove("open"); drawer.inert=true;
  document.documentElement.classList.remove("cart-lock"); btn.setAttribute("aria-expanded","false");
  const back=lastFocus&&document.contains(lastFocus)?lastFocus:btn; back.focus();
}
btn.addEventListener("click",()=>isOpen?close():open());
closeBtn.addEventListener("click",close);
overlay.addEventListener("click",close);
document.addEventListener("keydown",e=>{
  if(!isOpen)return;
  if(e.key==="Escape"){e.preventDefault();close();return}
  if(e.key==="Tab"){const f=focusables();if(!f.length)return;const a=f[0],z=f[f.length-1];
    if(e.shiftKey&&document.activeElement===a){e.preventDefault();z.focus()}
    else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a.focus()}
    else if(!drawer.contains(document.activeElement)){e.preventDefault();a.focus()}}
});
drawer.addEventListener("click",e=>{
  const t=e.target.closest("[data-tab],[data-act]");if(!t)return;
  if(t.dataset.tab){tab=t.dataset.tab;note="";render();return}
  const id=t.dataset.id;
  if(t.dataset.act==="inc")change(id,c=>c.qty=Math.min(99,c.qty+1));
  if(t.dataset.act==="dec")change(id,c=>c.qty-=1);          // reaching 0 removes the item
  if(t.dataset.act==="rm")change(id,c=>c.qty=0);
  if(t.dataset.act==="continue")close();
  if(t.dataset.act==="checkout"){note="ثبت سفارش و پرداخت آنلاین هنوز به این سایت متصل نشده است.";render()}
  if(!cart.length&&t.dataset.act&&tab==="cart"){closeBtn.focus()}
});
/* add-to-cart buttons anywhere on the page */
document.addEventListener("click",e=>{
  const a=e.target.closest("[data-add]");if(!a)return;
  if(add(a.dataset.add)){
    const old=a.textContent;a.textContent="افزوده شد ✓";setTimeout(()=>a.textContent=old,1200);
    open();
  }
});
window.addEventListener("storage",e=>{if(e.key===CART_KEY){cart=readCart();render()}});
render();
})();
