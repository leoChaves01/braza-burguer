import * as THREE from '../vendor/three.module.min.js';

// All five pieces sample the user's SAME original photograph. The masks partition
// its pixels along ingredient contours; assembly and separation never swap photos.
const CONTOURS = [
  [[0,539],[96,535],[139,516],[193,502],[255,486],[327,477],[402,467],[481,462],[560,464],[646,474],[718,484],[794,495],[861,511],[936,531],[1008,545],[1085,563],[1154,578],[1214,567],[1280,553]],
  [[0,714],[86,697],[142,668],[195,653],[257,659],[309,650],[367,647],[423,652],[480,668],[541,676],[610,683],[673,700],[733,719],[787,748],[839,756],[894,754],[951,737],[1015,719],[1075,705],[1131,722],[1201,752],[1280,793]],
  [[0,813],[88,810],[149,796],[209,803],[273,820],[340,829],[409,851],[479,869],[548,874],[613,870],[677,879],[745,859],[809,887],[864,916],[922,884],[984,865],[1050,836],[1118,817],[1174,830],[1230,854],[1280,866]],
  [[0,994],[108,995],[166,986],[238,1003],[305,999],[372,1010],[447,1020],[529,1010],[610,1013],[692,1023],[771,1030],[845,1019],[915,992],[989,997],[1067,1002],[1145,989],[1210,971],[1280,953]]
];
const top = [[0,0],[1280,0]], bottom = [[0,1280],[1280,1280]];
const loader = new THREE.TextureLoader();
const load = async url => { const t = await loader.loadAsync(url); t.colorSpace=THREE.SRGBColorSpace; return t; };

function ingredientMask(index) {
  const c=document.createElement('canvas'); c.width=c.height=1280;
  const ctx=c.getContext('2d'); ctx.fillStyle='#000'; ctx.fillRect(0,0,1280,1280);
  const upper=index===0?top:CONTOURS[index-1];
  const lower=index===4?bottom:CONTOURS[index];
  ctx.beginPath(); ctx.moveTo(...upper[0]); upper.slice(1).forEach(p=>ctx.lineTo(...p));
  [...lower].reverse().forEach(p=>ctx.lineTo(...p)); ctx.closePath();ctx.fillStyle='#fff';ctx.fill();
  return new THREE.CanvasTexture(c);
}
function brandTexture(w,h,stacked=false,reference) {
  const c=document.createElement('canvas');c.width=w;c.height=h;
  const ctx=c.getContext('2d');ctx.fillStyle='#202020';ctx.fillRect(0,0,w,h);
  // Fine paper texture and the existing Braza wordmark, authored natively.
  for(let i=0;i<12000;i++){const x=(i*139.71)%w,y=(i*91.31)%h;ctx.fillStyle=i%2?'#ffffff06':'#0000000b';ctx.fillRect(x,y,1.5,1.5);}
  if(reference){ctx.drawImage(reference,92,65,50,125,0,0,w,h);}
  if(stacked){
    const cx=w/2,r=h*.09,cy=h*.17;
    ctx.fillStyle='#df5420';ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fill();
    ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#eadfc6';
    ctx.font=`${r*1.40}px Anton, Impact, sans-serif`;ctx.fillText('B',cx,cy+r*.04);
    ctx.font=`${h*.28}px Anton, Impact, sans-serif`;ctx.fillText('BRAZA',cx,h*.45);
    ctx.font=`${h*.245}px Anton, Impact, sans-serif`;ctx.fillText('BURGUER',cx,h*.73);
  }else{
  const r=h*.32,cy=h*.50;
  ctx.font=`${h*.50}px Anton, Impact, sans-serif`;
  const wordWidth=ctx.measureText('BRAZA').width,gap=h*.18;
  const start=(w-(r*2+gap+wordWidth))/2,cx=start+r,tx=cx+r+gap;
  ctx.fillStyle='#e76627';ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#f0e8d7';ctx.lineWidth=Math.max(2,h*.005);ctx.beginPath();ctx.arc(cx,cy,r*.90,0,Math.PI*2);ctx.stroke();
  ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#f0e8d7';ctx.font=`${r*1.28}px Anton, Impact, sans-serif`;ctx.fillText('B',cx,cy+r*.04);
  ctx.textAlign='left';ctx.fillStyle='#f0e8d7';ctx.font=`${h*.50}px Anton, Impact, sans-serif`;ctx.fillText('BRAZA',tx,h*.40);
  ctx.fillStyle='#e76627';ctx.font=`${h*.18}px Anton, Impact, sans-serif`;ctx.fillText('BURGUER',tx,h*.77);
  }
  // Fibres remain visible through the ink, as on uncoated printed stock.
  let seed=71;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  for(let i=0;i<w*h*.13;i++){const x=random()*w,y=random()*h;ctx.fillStyle=random()>.5?'#ffffff0b':'#08060419';ctx.fillRect(x,y,random()*2+.5,.65);}
  const edge=ctx.createLinearGradient(0,0,0,h);edge.addColorStop(0,'#ffffff0c');edge.addColorStop(.08,'#ffffff00');edge.addColorStop(.94,'#00000000');edge.addColorStop(1,'#00000022');ctx.fillStyle=edge;ctx.fillRect(0,0,w,h);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t;
}
function paperGrain(){
  const c=document.createElement('canvas');c.width=c.height=512;const ctx=c.getContext('2d');
  const pixels=ctx.createImageData(512,512);let seed=19;
  for(let i=0;i<pixels.data.length;i+=4){seed=(seed*1664525+1013904223)>>>0;const n=106+(seed>>>24)*.17;pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=n;pixels.data[i+3]=255;}
  ctx.putImageData(pixels,0,0);const texture=new THREE.CanvasTexture(c);texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(5,3);return texture;
}
// Map only the photographed cardboard panels, excluding the surrounding image.
// UV reprojection keeps the photographic print attached to the articulated lid.
function photographedPanel(w,h,corners){
  const geometry=new THREE.PlaneGeometry(w,h,32,16),uv=geometry.attributes.uv;
  for(let i=0;i<uv.count;i++){
    const u=uv.getX(i),v=1-uv.getY(i);
    const x=(1-v)*((1-u)*corners[0][0]+u*corners[1][0])+v*((1-u)*corners[3][0]+u*corners[2][0]);
    const y=(1-v)*((1-u)*corners[0][1]+u*corners[1][1])+v*((1-u)*corners[3][1]+u*corners[2][1]);
    uv.setXY(i,x/1536,1-y/1024);
  }
  return geometry;
}
function cropTexture(atlas,box,sourceWidth=1536,sourceHeight=1024) {
  const t=atlas.clone();const [x,y,w,h]=box;
  t.repeat.set(w/sourceWidth,h/sourceHeight);t.offset.set(x/sourceWidth,1-(y+h)/sourceHeight);t.needsUpdate=true;
  return t;
}
function food(map) {
  const material=new THREE.MeshBasicMaterial({map,transparent:true,alphaTest:.08,depthWrite:true,side:THREE.DoubleSide,toneMapped:false});
  return new THREE.Mesh(new THREE.PlaneGeometry(1,1),material);
}

export async function createScene(host) {
  const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'high-performance'});
  renderer.setClearColor(0x000000,0);renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;
  renderer.localClippingEnabled=true;
  host.appendChild(renderer.domElement);renderer.domElement.setAttribute('aria-hidden','true');
  const scene=new THREE.Scene();
  const camera=new THREE.OrthographicCamera(-8,8,5,-5,.1,100);camera.position.set(0,0,25);
  scene.add(new THREE.HemisphereLight(0xfff6e6,0x30241b,1.2));
  const light=new THREE.DirectionalLight(0xfff1de,3.4);light.position.set(-6,9,10);light.castShadow=true;light.shadow.mapSize.set(2048,2048);Object.assign(light.shadow.camera,{left:-14,right:14,top:12,bottom:-12,near:1,far:40});light.shadow.bias=-.0003;light.shadow.normalBias=.025;light.shadow.radius=3;scene.add(light);
  const rim=new THREE.DirectionalLight(0xffb36b,.65);rim.position.set(8,3,-8);scene.add(rim);
  const [burgerTexture,atlas,ingredientTexture,cartonPhoto,openReference]=await Promise.all([load('assets/images/braza-cutout.png'),load('assets/images/food-sprite-atlas.png'),load('assets/images/braza-exploded-burger.png'),load('assets/images/braza-carton-photographic.png'),load('assets/images/braza-carton-open-reference.png')]);
  cartonPhoto.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
  const whole=food(burgerTexture);scene.add(whole);
  const pieces=Array.from({length:5},(_,i)=>{const mesh=food(burgerTexture);mesh.material.alphaMap=ingredientMask(i);scene.add(mesh);return mesh;});
  // The original visible fronts stay in place. Hidden top surfaces unfold behind
  // them as space opens, giving the patties volume instead of flat cut ribbons.
  const surfaces=[[80,392,880,249],[85,660,860,277],[85,940,865,284]];
  const backs=surfaces.map(rect=>{const mesh=food(cropTexture(ingredientTexture,rect,1024,1536));scene.add(mesh);return mesh;});
  const crops=[[0,396,453,441],[453,125,317,782],[806,516,314,296],[1182,516,314,296]];
  const props=crops.map(box=>{const mesh=food(cropTexture(atlas,box));scene.add(mesh);return mesh;});
  const floorClip=new THREE.Plane(new THREE.Vector3(0,1,0),10000);
  [whole,...pieces,...backs,...props].forEach(mesh=>mesh.material.clippingPlanes=[floorClip]);
  const box=new THREE.Group();scene.add(box);
  const grain=paperGrain();
  const cardboard=new THREE.MeshStandardMaterial({color:0x242321,roughness:.92,bumpMap:grain,bumpScale:.025,metalness:0});
  const floorMat=new THREE.MeshStandardMaterial({color:0x25221d,roughness:1,bumpMap:grain,bumpScale:.025});
  const kraft=new THREE.MeshStandardMaterial({color:0x806342,roughness:1,bumpMap:grain,bumpScale:.02});
  const printMaterial=map=>new THREE.MeshStandardMaterial({map,roughness:.92,bumpMap:grain,bumpScale:.018});
  function board(w,h,d,x,y,z,material=cardboard,parent=box) {
    const shape=new THREE.Shape();shape.moveTo(-w/2,-h/2);shape.lineTo(w/2,-h/2);shape.lineTo(w/2,h/2);shape.lineTo(-w/2,h/2);shape.closePath();
    const bevel=Math.min(.018,d*.22,w*.1,h*.1);
    const geo=new THREE.ExtrudeGeometry(shape,{depth:d-2*bevel,bevelEnabled:true,bevelThickness:bevel,bevelSize:bevel,bevelSegments:2,steps:1});geo.translate(0,0,-d/2+bevel);
    const mesh=new THREE.Mesh(geo,material);mesh.position.set(x,y,z);mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);return mesh;
  }
  const W=12.2,D=4.5,H=1.65,T=.035;
  board(W,T,D,0,0,0,floorMat);
  board(W,H,T,0,H/2,D/2);
  board(W,H,T,0,H/2,-D/2);
  board(T,H,D,-W/2,H/2,0);
  board(T,H,D,W/2,H/2,0);
  board(T,H*.64,D*.88,-1.25,H*.32,0);
  board(T,H*.64,D*.88,2.45,H*.32,0);
  const photographicMaterial=new THREE.MeshBasicMaterial({map:cartonPhoto,toneMapped:false});
  const frontBrand=new THREE.Mesh(photographedPanel(W-.06,H-.04,[[57,478],[1380,660],[1378,816],[56,638]]),photographicMaterial);frontBrand.position.set(0,H/2,D/2+.025);frontBrand.receiveShadow=true;box.add(frontBrand);
  const rightPrint=new THREE.Mesh(photographedPanel(D-.04,H-.04,[[1395,647],[1490,395],[1490,550],[1387,810]]),photographicMaterial);rightPrint.rotation.y=Math.PI/2;rightPrint.position.set(W/2+.026,H/2,0);rightPrint.receiveShadow=true;box.add(rightPrint);
  const hinge=new THREE.Group();hinge.position.set(0,H,-D/2);box.add(hinge);
  board(W,D,T,0,D/2,0,cardboard,hinge);
  const inner=new THREE.Mesh(new THREE.PlaneGeometry(W-.15,D-.15),printMaterial(brandTexture(2048,739,true,openReference.image)));inner.position.set(0,D/2,T/2+.004);inner.receiveShadow=true;hinge.add(inner);
  const outer=new THREE.Mesh(photographedPanel(W-.06,D-.055,[[210,216],[1479,376],[1383,633],[58,454]]),photographicMaterial);outer.position.set(0,D/2,-T/2-.004);outer.rotation.y=Math.PI;outer.receiveShadow=true;hinge.add(outer);
  outer.rotation.z=Math.PI;
  // Folded cardboard lip travels with the hinged lid and lands over the front wall.
  board(W,.34,T,0,D,.15,cardboard,hinge).rotation.x=Math.PI/2;
  // Exposed kraft edges, lid skirts and the front locking tongue are real folds.
  board(W,.024,.025,0,D-.01,-T/2,kraft,hinge);
  for(const side of [-1,1]){
    board(.025,D,.028,side*(W/2-.005),D/2,0,kraft,hinge);
    board(T,D-.09,.28,side*(W/2+.025),D/2,.14,cardboard,hinge);
    board(.025,.028,D,side*(W/2),H,0,kraft);
    board(.045,H-.12,.065,side*(W/2-.065),H/2,D/2+.018,kraft);
  }
  const tabShape=new THREE.Shape();tabShape.moveTo(-.48,0);tabShape.lineTo(.48,0);tabShape.lineTo(.40,.30);tabShape.quadraticCurveTo(.36,.38,.26,.38);tabShape.lineTo(-.26,.38);tabShape.quadraticCurveTo(-.36,.38,-.40,.30);tabShape.closePath();
  const lockingTab=new THREE.Mesh(new THREE.ExtrudeGeometry(tabShape,{depth:.035,bevelEnabled:true,bevelSize:.012,bevelThickness:.01,bevelSegments:2,steps:1}),cardboard);lockingTab.rotation.x=Math.PI/2;lockingTab.position.set(0,D+.035,0);lockingTab.castShadow=true;hinge.add(lockingTab);
  const slot=board(.98,.045,.012,0,H-.12,D/2+.041,new THREE.MeshStandardMaterial({color:0x090807,roughness:1}));
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(35,24),new THREE.ShadowMaterial({opacity:.36}));ground.rotation.x=-Math.PI/2;ground.position.y=-.065;ground.receiveShadow=true;box.add(ground);
  const shadowCanvas=document.createElement('canvas');shadowCanvas.width=256;shadowCanvas.height=128;const shadowCtx=shadowCanvas.getContext('2d');const gradient=shadowCtx.createRadialGradient(128,64,10,128,64,125);gradient.addColorStop(0,'#000000c9');gradient.addColorStop(.65,'#00000070');gradient.addColorStop(1,'#00000000');shadowCtx.fillStyle=gradient;shadowCtx.fillRect(0,0,256,128);
  const contact=new THREE.Mesh(new THREE.PlaneGeometry(W*1.14,D*1.22),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(shadowCanvas),transparent:true,depthWrite:false,toneMapped:false}));contact.rotation.x=-Math.PI/2;contact.position.y=-.05;box.add(contact);
  const destinations=[new THREE.Vector3(-3.72,2.02,.18),new THREE.Vector3(.52,2.16,-.25),new THREE.Vector3(4.12,2.46,-.18),new THREE.Vector3(-.47,1.08,1.45),new THREE.Vector3(1.55,1.08,1.45)];
  const positions=destinations.map(()=>new THREE.Vector3());
  function resize(width,height) {renderer.setSize(width,height,false);const half=width/height*5;camera.left=-half;camera.right=half;camera.updateProjectionMatrix();}
  function render(f) {
    const sc=f.boxScale;
    box.visible=f.boxEnter>0;
    box.position.set(0,-13+(11.48*f.boxEnter),0);
    box.rotation.set(.53*(1-f.close)+.56*f.close,-.18*(1-f.boxTurn)+.015*f.boxTurn-.24*f.close,-.015*(1-f.boxTurn));
    box.scale.setScalar(sc*(1-.10*f.close));
    hinge.rotation.x=f.close*Math.PI/2;
    box.updateMatrixWorld(true);
    if(f.assemble>.92){
      const normal=new THREE.Vector3(0,1,0).applyNormalMatrix(new THREE.Matrix3().getNormalMatrix(box.matrixWorld));
      floorClip.setFromNormalAndCoplanarPoint(normal,box.localToWorld(new THREE.Vector3(0,.025,0)));
    }else floorClip.set(new THREE.Vector3(0,1,0),10000);
    destinations.forEach((v,i)=>{positions[i].copy(v);positions[i].y-=f.sink*(i===2?2.7:2.0);box.localToWorld(positions[i]);positions[i].y+=(1-f.boxEnter)*11.48;});
    const burgerPosition=new THREE.Vector3(f.burgerX,f.burgerY,7);
    burgerPosition.lerp(positions[0],f.assemble);
    const size=f.burgerSize*(1-f.assemble)+4.12*sc*(1-f.sink*.58)*f.assemble;
    whole.position.copy(burgerPosition);whole.scale.set(size,size,1);
    whole.visible=f.split<.0001&&f.close<.98;
    pieces.forEach((piece,i)=>{
      piece.visible=f.split>=.0001&&f.close<.98;
      piece.position.copy(burgerPosition);piece.position.y+=f.offsets[i]*f.split;
      piece.position.x+=f.split*([.02,-.03,.015,-.01,.01][i]);
      piece.position.z+=.01*(5-i);piece.scale.set(size,size,1);
      piece.rotation.z=f.split*[.025,-.035,.015,-.015,.008][i];
    });
    backs.forEach((back,j)=>{
      const i=j+1,ratio=surfaces[j][3]/surfaces[j][2];
      const w=size*.93,h=w*ratio*f.split;
      back.visible=f.split>.0001&&f.close<.98;
      back.position.copy(burgerPosition);
      back.position.y+=(.5-[720,880,1020][j]/1280)*size+f.offsets[i]*f.split+h/2;
      back.position.z-=.025;back.scale.set(w,h,1);
      back.rotation.z=pieces[i].rotation.z;
    });
    const floating=[[-3.8,2.2,6],[4.25,.72,6],[.4,3.2,6],[1.9,1.6,6]];
    const entering=[[-12,7,6],[12,4,6],[-1,9,6],[5,9,6]];
    const dimensions=[[3.25,3.16],[1.82,4.49],[1.34,1.26],[1.34,1.26]];
    props.forEach((prop,i)=>{
      prop.visible=f.propsEnter>0&&f.close<.98;
      const start=new THREE.Vector3(...entering[i]),float=new THREE.Vector3(...floating[i]);
      start.x*=f.floatingFit;float.x*=f.floatingFit;
      prop.position.copy(start.lerp(float,f.propsEnter)).lerp(positions[i+1],f.assemble);
      const scale=(f.floatingFit+(sc-f.floatingFit)*f.assemble)*(1-f.sink*.79);
      prop.scale.set(dimensions[i][0]*scale,dimensions[i][1]*scale,1);
      prop.rotation.z=(1-f.assemble)*(1-f.propsEnter)*[.22,-.15,.2,-.2][i];
    });
    renderer.render(scene,camera);
  }
  return {resize,render,dispose(){renderer.dispose();scene.traverse(o=>{o.geometry?.dispose();if(o.material){const mats=Array.isArray(o.material)?o.material:[o.material];mats.forEach(m=>m.dispose());}});}};
}
