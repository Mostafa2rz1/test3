/* Catalogue PDF viewer (pdf.js, vendored in assets/vendor/pdfjs). Needs js/catalogue-config.js. */
(function(){
"use strict";
const $=s=>document.querySelector(s);
const fa=n=>Number(n).toLocaleString("fa-IR");
const pagesEl=$("#pdf-pages"), scroller=$("#pdf-scroll"), stateEl=$("#pdf-state"),
      prev=$("#pdf-prev"), next=$("#pdf-next"), pageIn=$("#pdf-page"), totalEl=$("#pdf-total"),
      zIn=$("#pdf-zin"), zOut=$("#pdf-zout"), zLabel=$("#pdf-zoom"), zFit=$("#pdf-fit"),
      dl=$("#pdf-download"), open=$("#pdf-open");
dl.href=CATALOGUE.pdf; dl.setAttribute("download",CATALOGUE.downloadName);
open.href=CATALOGUE.pdf;

function showState(kind,text){
  stateEl.hidden=!kind;
  if(!kind)return;
  stateEl.innerHTML=kind==="loading"
    ?`<div class="pdf-spin" aria-hidden="true"></div><p>در حال بارگذاری کاتالوگ…</p>`
    :`<p class="pdf-error">${text}</p><div class="pdf-group"><a class="btn solid" href="${CATALOGUE.pdf}" download>دانلود کاتالوگ</a><button class="btn" type="button" id="pdf-retry">تلاش دوباره</button></div>`;
  const r=$("#pdf-retry"); if(r)r.addEventListener("click",()=>location.reload());
}
function disableControls(on){[prev,next,pageIn,zIn,zOut,zFit].forEach(e=>e.disabled=on)}
disableControls(true);
showState("loading");

if(typeof pdfjsLib==="undefined"){showState("error","نمایشگر PDF بارگذاری نشد. می‌توانید کاتالوگ را دانلود کنید.");return}
pdfjsLib.GlobalWorkerOptions.workerSrc=CATALOGUE.worker;

let pdf=null, total=0, zoom=1, current=1, views=[], token=0, io=null;
const MIN=0.5, MAX=3, STEP=0.25;

const baseWidth=()=>Math.max(260,Math.min(scroller.clientWidth-8,860));
const cssWidth=()=>Math.round(baseWidth()*zoom);

async function renderView(v){
  if(v.busy||v.doneWidth===cssWidth())return;
  v.busy=true; const my=token, w=cssWidth();
  try{
    const page=await pdf.getPage(v.n), vp1=page.getViewport({scale:1}), scale=w/vp1.width;
    const dpr=Math.min(window.devicePixelRatio||1,2), vp=page.getViewport({scale:scale*dpr});
    const c=document.createElement("canvas"); c.width=Math.floor(vp.width); c.height=Math.floor(vp.height);
    c.style.width=w+"px"; c.style.height=Math.floor(vp1.height*scale)+"px";
    c.setAttribute("role","img"); c.setAttribute("aria-label",`صفحهٔ ${fa(v.n)} از ${fa(total)}`);
    await page.render({canvasContext:c.getContext("2d"),viewport:vp}).promise;
    if(my!==token){v.busy=false;return renderView(v)}
    v.el.style.width=w+"px"; v.el.style.height=c.style.height;
    const old=v.el.querySelector("canvas"); old?old.replaceWith(c):v.el.prepend(c);
    v.doneWidth=w;
  }catch(e){ if(!v.err){v.err=true;v.el.insertAdjacentHTML("afterbegin",`<p class="pdf-state">نمایش این صفحه ممکن نشد.</p>`)} }
  v.busy=false;
}
function layout(){
  token++; const w=cssWidth();
  views.forEach(v=>{v.doneWidth=0;v.el.style.width=w+"px";v.el.style.height=Math.round(w*v.ratio)+"px"});
  zLabel.textContent=fa(Math.round(zoom*100))+"٪";
  zOut.disabled=zoom<=MIN; zIn.disabled=zoom>=MAX;
  observe();
  goTo(current,false);
}
function observe(){
  if(io)io.disconnect();
  io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)renderView(views[e.target.dataset.n-1])}),{rootMargin:"900px 0px"});
  views.forEach(v=>io.observe(v.el));
}
function goTo(n,smooth=true){
  n=Math.min(total,Math.max(1,n|0||1)); current=n; update();
  lockUntil=performance.now()+(smooth?900:150);          // ignore scroll events caused by this jump
  setTimeout(onScroll,smooth?950:200);
  views[n-1].el.scrollIntoView({behavior:smooth&&!matchMedia("(prefers-reduced-motion:reduce)").matches?"smooth":"auto",block:"start"});
}
function update(){
  pageIn.value=current; prev.disabled=current<=1; next.disabled=current>=total;
}
let tick=false, lockUntil=0;
function onScroll(){
  if(tick||performance.now()<lockUntil)return; tick=true;
  requestAnimationFrame(()=>{tick=false;
    const mid=innerHeight/2+60; let best=current,bd=1e9;
    views.forEach(v=>{const r=v.el.getBoundingClientRect(),d=Math.abs((r.top+r.bottom)/2-mid);if(d<bd){bd=d;best=v.n}});
    if(best!==current){current=best;update()}
  });
}

(async function init(){
  try{
    pdf=await pdfjsLib.getDocument(CATALOGUE.pdf).promise;
  }catch(e){
    const missing=e&&(e.name==="MissingPDFException"||e.status===404);
    showState("error",missing?"فایل کاتالوگ پیدا نشد.":"فایل کاتالوگ نامعتبر است یا بارگذاری نشد.");
    return;
  }
  total=pdf.numPages; totalEl.textContent=fa(total); pageIn.max=total;
  const first=await pdf.getPage(1), v1=first.getViewport({scale:1}), ratio=v1.height/v1.width;
  for(let n=1;n<=total;n++){
    const el=document.createElement("div"); el.className="pdf-page"; el.dataset.n=n;
    el.innerHTML=`<span class="pn">${fa(n)}</span>`; pagesEl.appendChild(el);
    views.push({n,el,ratio,busy:false,doneWidth:0});
  }
  showState(null); disableControls(false);
  layout();
  prev.addEventListener("click",()=>goTo(current-1));
  next.addEventListener("click",()=>goTo(current+1));
  pageIn.addEventListener("change",()=>goTo(+pageIn.value));
  pageIn.addEventListener("keydown",e=>{if(e.key==="Enter")goTo(+pageIn.value)});
  zIn.addEventListener("click",()=>{zoom=Math.min(MAX,+(zoom+STEP).toFixed(2));layout()});
  zOut.addEventListener("click",()=>{zoom=Math.max(MIN,+(zoom-STEP).toFixed(2));layout()});
  zFit.addEventListener("click",()=>{zoom=1;layout()});
  window.addEventListener("scroll",onScroll,{passive:true});
  let rt;window.addEventListener("resize",()=>{clearTimeout(rt);rt=setTimeout(layout,200)});
})();
})();
