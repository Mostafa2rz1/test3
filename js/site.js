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

/* ---------- 2. Cart ---------- */
const CART_KEY="riva_cart_v1", ORDERS_KEY="riva_orders_v1";
const find=id=>PRODUCTS.find(p=>p.id===id);
const readCart=()=>{try{const v=JSON.parse(localStorage.getItem(CART_KEY)||"[]");
  return Array.isArray(v)?v.filter(x=>x&&find(x.id)&&find(x.id).price&&x.qty>0).map(x=>({id:x.id,qty:Math.min(99,Math.floor(x.qty))})):[]}catch(e){return[]}};
let cart=readCart();
const saveCart=()=>{try{localStorage.setItem(CART_KEY,JSON.stringify(cart))}catch(e){}};
/* Orders: no backend exists yet. This only READS orders that a future checkout/backend stores
   under "riva_orders_v1" (array of {id,date,status,items:[{name,qty}],total}). Nothing writes here today. */
const loadOrders=()=>{try{const v=JSON.parse(localStorage.getItem(ORDERS_KEY)||"[]");return Array.isArray(v)?v:[]}catch(e){return[]}};

const oldBtn=document.querySelector(".tools .cart");
if(!oldBtn)return;
const wrap=document.createElement("div");
wrap.className="cart-wrap";
wrap.innerHTML=`
 <button class="cart-btn" type="button" aria-label="سبد خرید" aria-expanded="false" aria-controls="cart-panel">🛒<span class="cart-count" hidden></span></button>
 <div class="cart-panel" id="cart-panel" role="dialog" aria-label="سبد خرید و سفارش‌ها" hidden>
  <div class="cart-tabs" role="group">
   <button type="button" data-tab="cart" aria-pressed="true">سبد خرید</button>
   <button type="button" data-tab="orders" aria-pressed="false">سفارش‌های قبلی</button>
  </div>
  <div class="cart-body"></div>
 </div>`;
oldBtn.replaceWith(wrap);
const btn=wrap.querySelector(".cart-btn"), panel=wrap.querySelector(".cart-panel"),
      body=wrap.querySelector(".cart-body"), badge=wrap.querySelector(".cart-count");
let tab="cart", note="";

const lines=()=>cart.map(c=>({c,p:find(c.id)}));
const subtotal=()=>lines().reduce((s,{c,p})=>s+c.qty*p.price,0);
const count=()=>cart.reduce((s,c)=>s+c.qty,0);

function render(){
  const n=count();
  badge.hidden=!n; badge.textContent=n.toLocaleString("fa-IR");
  btn.setAttribute("aria-label",n?`سبد خرید، ${n.toLocaleString("fa-IR")} کالا`:"سبد خرید");
  panel.querySelectorAll("[data-tab]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.tab===tab)));
  if(tab==="orders"){
    const orders=loadOrders();
    body.innerHTML=orders.length?`<ul class="order-list">${orders.map(o=>`
      <li><div class="order-top"><b>سفارش ${escHTML(o.id)}</b><span>${escHTML(o.status||"")}</span></div>
      <div class="muted">${escHTML(o.date||"")}</div>
      <div>${(o.items||[]).map(i=>`${escHTML(i.name)} × ${Number(i.qty).toLocaleString("fa-IR")}`).join("، ")}</div>
      <div class="order-total">${fmtPrice(o.total||0)} تومان</div></li>`).join("")}</ul>`
     :`<p class="cart-empty">سفارش ثبت‌شده‌ای برای نمایش وجود ندارد.<br><small>سوابق خرید پس از اتصال سامانهٔ ثبت سفارش در این بخش نمایش داده می‌شود.</small></p>`;
    return;
  }
  if(!cart.length){body.innerHTML=`<p class="cart-empty">سبد خرید شما خالی است.<br><a class="btn solid sm" href="products.html">مشاهده محصولات</a></p>`;return}
  body.innerHTML=`<ul class="cart-items">${lines().map(({c,p})=>`
   <li><img src="assets/img/${p.img}" alt="">
    <div class="ci-info"><b>${escHTML(p.name)}</b><span class="muted">${fmtPrice(p.price)} تومان</span>
     <div class="qty" role="group" aria-label="تعداد ${escHTML(p.name)}">
      <button type="button" data-act="dec" data-id="${p.id}" aria-label="کاهش تعداد">−</button>
      <output>${c.qty.toLocaleString("fa-IR")}</output>
      <button type="button" data-act="inc" data-id="${p.id}" aria-label="افزایش تعداد">+</button>
     </div></div>
    <div class="ci-side"><b>${fmtPrice(c.qty*p.price)} تومان</b>
     <button type="button" class="ci-rm" data-act="rm" data-id="${p.id}" aria-label="حذف ${escHTML(p.name)}">حذف</button></div></li>`).join("")}</ul>
   <div class="cart-sum"><span>جمع کل</span><b>${fmtPrice(subtotal())} تومان</b></div>
   <small class="muted">هزینهٔ ارسال و تخفیف هنوز در سایت تعریف نشده است.</small>
   <button type="button" class="btn solid cart-checkout" data-act="checkout">ادامه و ثبت سفارش</button>
   <p class="cart-note" role="status">${escHTML(note)}</p>`;
}
function change(id,fn){const c=cart.find(x=>x.id===id);if(!c)return;fn(c);cart=cart.filter(x=>x.qty>0);saveCart();render()}
function add(id){const p=find(id);if(!p||!p.price)return;const c=cart.find(x=>x.id===id);c?c.qty=Math.min(99,c.qty+1):cart.push({id,qty:1});note="";saveCart();render()}

panel.addEventListener("click",e=>{
  const t=e.target.closest("[data-tab],[data-act]");if(!t)return;
  if(t.dataset.tab){tab=t.dataset.tab;render();return}
  const id=t.dataset.id;
  if(t.dataset.act==="inc")change(id,c=>c.qty=Math.min(99,c.qty+1));
  if(t.dataset.act==="dec")change(id,c=>c.qty-=1);
  if(t.dataset.act==="rm")change(id,c=>c.qty=0);
  if(t.dataset.act==="checkout"){note="ثبت سفارش و پرداخت آنلاین هنوز به این سایت متصل نشده است.";render()}
});
document.addEventListener("click",e=>{
  const a=e.target.closest("[data-add]");
  if(a){add(a.dataset.add);const old=a.textContent;a.textContent="افزوده شد ✓";setTimeout(()=>a.textContent=old,1200);return}
  if(!panel.hidden&&!e.composedPath().includes(wrap))toggle(false);
});
function toggle(open){
  panel.hidden=!open;btn.setAttribute("aria-expanded",String(open));
  if(open){tab="cart";render()}
}
btn.addEventListener("click",()=>toggle(panel.hidden));
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!panel.hidden){toggle(false);btn.focus()}});
window.addEventListener("storage",e=>{if(e.key===CART_KEY){cart=readCart();render()}});
render();
})();
