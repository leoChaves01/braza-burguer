const clamp=n=>Math.max(0,Math.min(1,n));
const range=(n,a,b)=>clamp((n-a)/(b-a));
const ease=n=>n*n*(3-2*n);
const phase=(n,a,b)=>ease(range(n,a,b));
const mix=(a,b,n)=>a+(b-a)*n;

// The reference is a single scroll-scrubbed shot. All coordinates are derived from
// progress, so reversing scroll returns every actor and the physical lid exactly.
function frameAt(progress,width,height){
  const p=clamp(progress),mobile=width<=600,u=height/10,worldWidth=width/u;
  const move=phase(p,.06,.29),grow=phase(p,.015,.085);
  const split=phase(p,.125,.32)*(1-phase(p,.405,.48));
  const base=Math.min(width*(mobile?.95:.52),height*(mobile?.64:.84))/u;
  const exploded=Math.min(width*(mobile?.61:.33),height*(mobile?.34:.40))/u;
  let burgerSize=mix(base*(1+grow*.10),exploded,phase(p,.12,.31));
  burgerSize=mix(burgerSize,Math.min(base*.8,6),phase(p,.415,.49));
  let burgerX=mix(worldWidth*(mobile?.03:.235),worldWidth*(mobile?-.15:.05),move);
  let burgerY=mix(mobile?-2.35:-.72,mobile?-.75:0,move);
  burgerX=mix(burgerX,worldWidth*(mobile?-.11:-.06),phase(p,.405,.49));
  burgerY=mix(burgerY,-.75,phase(p,.405,.49));
  const offsets=[2.15,1.08,.10,-.90,-1.55];
  const labelCenters=[300,600,790,938,1080];
  return {p,worldWidth,burgerSize,burgerX,burgerY,split,offsets,
    labelY:labelCenters.map((y,i)=>(5-(burgerY+(.5-y/1280)*burgerSize+offsets[i]*split))*u),
    heroOpacity:1-phase(p,.035,.115),heroLift:phase(p,.02,.13)*-90,
    paper:phase(p,.20,.33),paperLeave:phase(p,.72,.82),
    anatomy:phase(p,.29,.34)*(1-phase(p,.395,.435)),
    propsEnter:phase(p,.407,.49),assemble:phase(p,.49,.635),
    floatingFit:Math.min(1,worldWidth/9),
    boxEnter:phase(p,.50,.635),boxTurn:phase(p,.635,.77),
    boxScale:Math.min(1.12,worldWidth*.92/12.2),
    close:phase(p,.775,.90),sink:phase(p,.768,.865),
    comboCaption:phase(p,.62,.66)*(1-phase(p,.705,.735)),
    shakeCaption:phase(p,.715,.75)*(1-phase(p,.82,.865)),
  };
}
if(typeof module!=='undefined')module.exports={frameAt};

if(typeof document!=='undefined'){
  const $=s=>document.querySelector(s);
  const story=$('.story'),stage=$('.story-stage'),host=$('.scene-host'),photo=$('.hero-burger');
  const heroCopy=$('.hero-copy'),paper=$('.paper-background'),anatomy=$('.anatomy-copy');
  const labelGroup=$('.ingredient-labels'),labels=[...document.querySelectorAll('.ingredient-labels p')];
  const hint=$('.scroll-hint'),combo=$('.combo-caption'),shake=$('.shake-caption');
  const preference=matchMedia('(prefers-reduced-motion: reduce)');
  let scene,geometry,pending=0,failed=false;
  function measure(){
    const header=$('.site-header').offsetHeight;
    geometry={width:stage.clientWidth,height:stage.clientHeight,top:story.getBoundingClientRect().top+scrollY-header,distance:Math.max(1,story.offsetHeight-stage.offsetHeight)};
    for(const [id,p]of[['stack',.36],['combo',.68]])$('#'+id).style.top=geometry.distance*p+'px';
    scene?.resize(geometry.width,geometry.height);
  }
  function visibility(el,value,interactive=false){
    el.style.opacity=value;el.style.visibility=value<.001?'hidden':'visible';
    if(interactive){el.inert=value<.4;el.style.pointerEvents=value<.4?'none':'auto';}
  }
  function render(){
    pending=0;if(!geometry||preference.matches||failed)return;
    const f=frameAt(clamp((scrollY-geometry.top)/geometry.distance),geometry.width,geometry.height);
    // The pre-WebGL fallback uses the same photograph, position and dimensions.
    const u=geometry.height/10;
    photo.style.width=f.burgerSize*u+'px';photo.style.left=(geometry.width/2+f.burgerX*u)+'px';photo.style.top=(geometry.height/2-f.burgerY*u)+'px';
    scene?.render(f);
    visibility(heroCopy,f.heroOpacity,true);heroCopy.style.translate=`0 ${f.heroLift}px`;
    visibility(hint,f.heroOpacity);
    paper.style.clipPath=`inset(0 0 0 ${(1-f.paper)*100}%)`;paper.style.opacity=1-f.paperLeave;
    visibility(anatomy,f.anatomy);visibility(labelGroup,f.anatomy);
    labels.forEach((label,i)=>label.style.top=f.labelY[i]+'px');
    visibility(combo,f.comboCaption,true);visibility(shake,f.shakeCaption);
    combo.style.translate=`0 ${(1-f.comboCaption)*24}px`;shake.style.translate=`0 ${(1-f.shakeCaption)*24}px`;
  }
  function schedule(){if(!pending)pending=requestAnimationFrame(render);}
  function refresh(){measure();schedule();}
  function applyPreference(){
    document.documentElement.classList.toggle('reduced-motion',preference.matches);
    if(preference.matches){document.querySelectorAll('[inert]').forEach(el=>el.inert=false);heroCopy.style.visibility='visible';heroCopy.style.opacity='1';heroCopy.style.translate='none';}
    else refresh();
  }
  async function startScene(){
    try{
      const [module]=await Promise.all([import('./scene.mjs'),document.fonts.ready]);
      scene=await module.createScene(host);measure();render();document.documentElement.classList.add('webgl-ready');
    }catch(error){
      failed=true;document.documentElement.classList.add('scene-fallback');
      console.error('Braza: static presentation enabled.',error);
    }
  }
  addEventListener('scroll',schedule,{passive:true});addEventListener('resize',refresh);addEventListener('pageshow',refresh);
  preference.addEventListener('change',applyPreference);
  applyPreference();startScene();
  for(const link of document.querySelectorAll('a[href="#stack"],a[href="#combo"],a[href="#home"]')){
    link.addEventListener('click',event=>{
      if(preference.matches||failed){
        if(link.hash==='#combo'){event.preventDefault();$('.static-combo').scrollIntoView({behavior:'auto'});}
        else if(link.hash==='#stack'){event.preventDefault();photo.scrollIntoView({behavior:'auto',block:'center'});}
        return;
      }
      event.preventDefault();measure();const target=link.hash==='#stack'?.36:link.hash==='#combo'?.68:0;
      scrollTo({top:Math.max(0,geometry.top+target*geometry.distance),behavior:'smooth'});history.replaceState(null,'',link.hash);
    });
  }
  let toastTimer;const toast=$('.toast');
  for(const button of document.querySelectorAll('[data-product]'))button.addEventListener('click',()=>{toast.textContent=button.dataset.product+' adicionado.';toast.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('show'),2400);});
  measure();render();
}
