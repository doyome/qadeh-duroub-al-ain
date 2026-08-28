// يستخرج سكربت اللعبة من index.html ويشغّله في Node مع DOM/Canvas وهمي،
// ويكشف الدوال الداخلية عبر globalThis.__dbg حتى تقدر أدوات الفحص تشتغل بدون متصفح.
const fs=require('fs'), path=require('path');
const ROOT=path.join(__dirname,'..');
function noop(){}
function makeCtx(){
  return new Proxy({},{
    get(t,k){
      if(k in t)return t[k];
      if(k==='createLinearGradient'||k==='createRadialGradient')return ()=>({addColorStop:noop});
      if(k==='measureText')return ()=>({width:10});
      if(k==='getImageData')return ()=>({data:[0,0,0,0]});
      return typeof k==='string'?(t[k]=noop):undefined;
    },
    set(t,k,v){t[k]=v;return true;}
  });
}
function el(){return{style:{setProperty:noop},classList:{add:noop,remove:noop,toggle:noop,contains:()=>false},
  addEventListener:noop,appendChild:noop,removeChild:noop,querySelector:()=>el(),querySelectorAll:()=>[],
  clientWidth:1280,clientHeight:720,width:1280,height:720,innerHTML:'',textContent:'',type:'',
  getContext:()=>makeCtx()};}
global.window={addEventListener:noop,devicePixelRatio:1,innerWidth:1280,innerHeight:720,
  matchMedia:()=>({matches:false}),AudioContext:function(){throw new Error('no audio');}};
global.document={getElementById:()=>el(),createElement:()=>el(),addEventListener:noop,
  querySelectorAll:()=>[],fonts:{check:()=>true},hidden:false};
global.localStorage={getItem:()=>null,setItem:noop};
global.requestAnimationFrame=noop;
global.setInterval=noop;
global.navigator={userAgent:'node',vibrate:noop};

const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
const m=html.match(/<script>([\s\S]*?)<\/script>/);
if(!m)throw new Error('ما لقيت وسم <script> في index.html');
const HOOK="globalThis.__dbg={render:render,prop:prop,menuScene:menuScene,vehThumb:vehThumb,"+
 "renderGarage:renderGarage,renderUpg:renderUpg,renderStages:renderStages,startRun:startRun,"+
 "physics:physics,pickups:pickups,getCar:function(){return car;},getRun:function(){return run;},"+
 "setInput:function(l,r){input.left=l;input.right=r;},setBoost:function(b){input.boost=b;},"+
 "SAVE:SAVE,STAGES:STAGES,VEH:VEH,UPGS:UPGS,groundY:function(x){return groundY(x);},"+
 "getT:function(){return T;},upgOf:upgOf};\n";
const src=m[1].replace("resize();refreshCoins();",HOOK+"resize();refreshCoins();");
if(!src.includes('__dbg'))throw new Error('ما قدرت أركّب خطاف الفحص');
(0,eval)(src);
module.exports=globalThis.__dbg;
