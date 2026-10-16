// Product data. Edit here. Images live in assets/img/.
// price = number in Toman, or null when no price has been provided (those items cannot be added to the cart).
const CATEGORIES = [
  {id:"pad",      name:"پد ظرفشویی"},
  {id:"loofah",   name:"لیف حمام"},
  {id:"cloth",    name:"دستمال تنظیف"},
  {id:"descaler", name:"جرم‌گیر سماور"}
];
const PRODUCTS = [
  {id:"pad-soft",       name:"پد ظرفشویی خورشیدی نرم",            img:"p-pad-soft.png",          cat:"pad",    material:"fiber",    size:"m", price:250000},
  {id:"loofah-polish",  name:"لیف حمام پولیشی صورت و بدن",         img:"p-washcloth-white.jpg", cat:"loofah", material:"fiber",    size:"m", price:450000},
  {id:"loofah-red",     name:"لیف حمام پولیشی صورت و بدن (قرمز)",  img:"p-washcloth-red.jpg",   cat:"loofah", material:"fiber",    size:"m", price:null},
  {id:"loofah-globe",   name:"لیف حمام توری توپی",                 img:"p-mesh-globe.jpg",      cat:"loofah", material:"mesh",     size:"l", price:null},
  {id:"loofah-glove",   name:"لیف دستکشی",                         img:"p-glove.jpg",           cat:"loofah", material:"fiber",    size:"m", price:null},
  {id:"cloth-4pack",    name:"دستمال نظافت پنبه‌ای (۴ عددی)",      img:"p-cleaning-cloth.jpg",  cat:"cloth",  material:"fiber",    size:"m", price:780000},
  {id:"star-roll",      name:"دستمال پنج ستاره",                   img:"p-star-roll.jpg",       cat:"cloth",  material:"nonwoven", size:"l", price:630000},
  {id:"magic-roll",     name:"دستمال جادویی",                      img:"p-magic-roll.jpg",      cat:"cloth",  material:"nonwoven", size:"l", price:null}
];
const fmtPrice = n => Number(n).toLocaleString("fa-IR");
const escHTML = s => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

function cardHTML(p){
  const price = p.price ? `<div class="price">${fmtPrice(p.price)} تومان</div>` : `<div class="price muted">قیمت اعلام نشده</div>`;
  const add = p.price ? `<button class="btn solid sm" type="button" data-add="${p.id}">افزودن به سبد</button>` : "";
  return `<article class="card"><div class="thumb"><span class="badge" aria-hidden="true">ریوا</span><img src="assets/img/${p.img}" alt="${escHTML(p.name)}" loading="lazy"></div>
  <h3>${escHTML(p.name)}</h3>${price}<div class="card-actions">${add}<a class="btn sm" href="#">مشاهده محصول</a></div></article>`;
}
function renderProducts(sel,{ids,filter,emptyText}={}){
  let list = ids ? ids.map(id=>PRODUCTS.find(p=>p.id===id)).filter(Boolean)
                 : PRODUCTS.filter(p=>!filter||Object.entries(filter).every(([k,v])=>!v||p[k]===v));
  document.querySelector(sel).innerHTML = list.length ? list.map(cardHTML).join("")
    : `<p class="empty">${escHTML(emptyText||"محصولی با این فیلتر پیدا نشد.")}</p>`;
}
function initCatalog(){
  const ids={cat:"#f-type",material:"#f-material",size:"#f-size"};
  const sel=k=>document.querySelector(ids[k]);
  const title=document.getElementById("grid-title"), clear=document.getElementById("clear-filter");
  const sync=()=>{
    document.querySelectorAll(".cat-tile").forEach(t=>{
      if(t.dataset.cat===sel("cat").value) t.setAttribute("aria-current","true"); else t.removeAttribute("aria-current");
    });
  };
  const run=()=>{
    const f=Object.fromEntries(Object.keys(ids).map(k=>[k,sel(k).value]));
    const cat=CATEGORIES.find(c=>c.id===f.cat);
    title.textContent = cat ? cat.name : "همه محصولات";
    clear.hidden = !(f.cat||f.material||f.size);
    renderProducts("#all",{filter:f,emptyText: cat && !f.material && !f.size ? `هنوز محصولی در دستهٔ «${cat.name}» ثبت نشده است.` : "محصولی با این فیلتر پیدا نشد."});
    sync();
  };
  const q=new URLSearchParams(location.search);
  const initial=q.get("cat")||q.get("type");
  if(CATEGORIES.some(c=>c.id===initial)) sel("cat").value=initial;
  Object.keys(ids).forEach(k=>sel(k).addEventListener("change",()=>{
    if(k==="cat"){const u=new URL(location);sel(k).value?u.searchParams.set("cat",sel(k).value):u.searchParams.delete("cat");u.searchParams.delete("type");history.replaceState(null,"",u)}
    run();
  }));
  document.querySelectorAll(".cat-tile").forEach(t=>t.addEventListener("click",e=>{
    e.preventDefault(); sel("cat").value=t.dataset.cat;
    history.pushState(null,"",t.getAttribute("href")); run();
    document.getElementById("products-section").scrollIntoView({behavior:"smooth"}); title.focus({preventScroll:true});
  }));
  clear.addEventListener("click",e=>{e.preventDefault();Object.keys(ids).forEach(k=>sel(k).value="");history.pushState(null,"",location.pathname);run()});
  window.addEventListener("popstate",()=>{const c=new URLSearchParams(location.search).get("cat")||"";sel("cat").value=CATEGORIES.some(x=>x.id===c)?c:"";run()});
  run();
}
