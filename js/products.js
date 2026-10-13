// Edit this list to add or change products. Images live in assets/img/.
const PRODUCTS = [
  {name:"لیف حمام پولیشی صورت و بدن (قرمز)", img:"p-washcloth-red.jpg",   type:"loofah", material:"fiber",    size:"m", price:"۴۵۰,۰۰۰"},
  {name:"لیف حمام پولیشی صورت و بدن (سفید)", img:"p-washcloth-white.jpg", type:"loofah", material:"fiber",    size:"m", price:"۴۵۰,۰۰۰"},
  {name:"لیف حمام توری توپی",                img:"p-mesh-globe.jpg",      type:"loofah", material:"mesh",     size:"l", price:"۲۹۰,۰۰۰"},
  {name:"لیف دستکشی",                        img:"p-glove.jpg",           type:"loofah", material:"fiber",    size:"m", price:"۳۲۰,۰۰۰"},
  {name:"دستمال نظافت پنبه‌ای (۴ عددی)",     img:"p-cleaning-cloth.jpg",  type:"cloth",  material:"fiber",    size:"m", price:"۷۸۰,۰۰۰"},
  {name:"دستمال پنج ستاره",                  img:"p-star-roll.jpg",       type:"cloth",  material:"nonwoven", size:"l", price:"۶۳۰,۰۰۰"},
  {name:"دستمال جادویی",                     img:"p-magic-roll.jpg",      type:"cloth",  material:"nonwoven", size:"l", price:"۶۵۰,۰۰۰"}
];
function cardHTML(p){
  return `<article class="card"><div class="thumb"><span class="badge" aria-hidden="true">ریوا</span><img src="assets/img/${p.img}" alt="${p.name}" loading="lazy"></div>
  <h3>${p.name}</h3>${p.price?`<div class="price">${p.price} تومان</div>`:""}<a class="btn solid sm" href="#">مشاهده محصول</a></article>`;
}
function renderProducts(sel,{limit,filter}={}){
  let list = PRODUCTS.filter(p=>!filter||Object.entries(filter).every(([k,v])=>!v||p[k]===v));
  if(limit) list=list.slice(0,limit);
  document.querySelector(sel).innerHTML = list.length ? list.map(cardHTML).join("") : '<p class="empty">محصولی با این فیلتر پیدا نشد.</p>';
}
function initCatalog(){
  const ids={type:"#f-type",material:"#f-material",size:"#f-size"};
  const q=new URLSearchParams(location.search);
  if(q.get("type")) document.querySelector(ids.type).value=q.get("type");
  const run=()=>renderProducts("#all",{filter:Object.fromEntries(Object.entries(ids).map(([k,s])=>[k,document.querySelector(s).value]))});
  Object.values(ids).forEach(s=>document.querySelector(s).addEventListener("change",run));
  run();
}
