const D=require('./stub.js');

function finite(o, keys){ return keys.every(k=>Number.isFinite(o[k])); }

let failures = [];
function check(name, cond, extra){
  if(!cond) failures.push(name + (extra!==undefined?(' :: '+JSON.stringify(extra)):''));
  console.log((cond?'PASS  ':'FAIL  ')+name+(extra!==undefined?('  '+JSON.stringify(extra)):''));
}

// ---- run every stage x a few vehicles, full-throttle, for 60 simulated seconds
const dt = 1/120;
const vehIds = ['scooter','bike','fatak','plane','tank','lc'];
const summary = [];

for(const st of D.STAGES){
  D.SAVE.unlocked[st.id]=1;
  for(const vid of vehIds){
    D.SAVE.owned[vid]=1;
    D.startRun(st.id, vid);
    D.setInput(false,true);
    const car = D.getCar();
    const spawnGap = D.groundY(car.x) - (car.y);
    let steps=0, maxSpd=0, nan=false, ended='';
    const run0 = D.getRun();
    // ensure not instantly crashed
    for(let i=0;i<120*60;i++){
      D.physics(dt);
      steps++;
      const c = D.getCar();
      if(!finite(c,['x','y','vx','vy','a','av'])){ nan=true; break; }
      maxSpd = Math.max(maxSpd, Math.abs(c.vx));
      const r = D.getRun();
      if(r.over){ ended=r.reason; break; }
    }
    const r = D.getRun(), c = D.getCar();
    summary.push({stage:st.id, veh:vid, dist:Math.round(r.dist), sec:+(steps/120).toFixed(1),
                  kmh:Math.round(maxSpd/34*3.6), fuel:Math.round(r.fuel*100), end:ended||'still-going', coins:r.coins});
    check(`no NaN ${st.id}/${vid}`, !nan, nan?{x:c.x,y:c.y,a:c.a}:undefined);
    check(`survives >2s ${st.id}/${vid}`, steps>240, {steps, ended});
    check(`moves forward ${st.id}/${vid}`, r.dist>20, {dist:Math.round(r.dist)});
  }
}
console.log('\n--- run summary ---');
console.table ? console.table(summary) : console.log(summary);

// ---- idle test: no throttle, car should settle on the ground, not sink or launch
D.startRun('hili','fatak');
D.setInput(false,false);
for(let i=0;i<120*8;i++) D.physics(dt);
const idle = D.getCar();
const gy = D.groundY(idle.x);
check('idle: rests near ground', Math.abs((idle.y) - (gy-40)) < 60, {y:Math.round(idle.y), gy:Math.round(gy)});
check('idle: settled (|vy| small)', Math.abs(idle.vy) < 60, {vy:+idle.vy.toFixed(1)});
check('idle: level (|angle| small)', Math.abs(idle.a) < 0.6, {a:+idle.a.toFixed(3)});
check('idle: does not drift far', Math.abs(idle.vx) < 90, {vx:+idle.vx.toFixed(1)});

// ---- reverse works
D.startRun('hili','fatak');
D.setInput(true,false);
let backOK=false;
for(let i=0;i<120*4;i++){ D.physics(dt); if(D.getCar().vx < -40) backOK=true; if(D.getRun().over) break; }
check('brake/reverse pushes backwards', backOK, {vx:+D.getCar().vx.toFixed(1)});

// ---- fuel drains and ends the run
D.startRun('hili','scooter');
D.setInput(false,true);
let fuelEnd=false;
for(let i=0;i<120*400;i++){ D.physics(dt); const r=D.getRun(); if(r.over){ fuelEnd = (r.reason==='fuel'||r.reason==='crash'||r.reason==='finish'); break; } }
check('run terminates eventually', D.getRun().over, {reason:D.getRun().reason});

// ---- upgrades actually change stats
const before = D.VEH.find(v=>v.id==='fatak');
const u = D.upgOf('fatak');
u.engine = 9; u.tires = 9;
D.startRun('hili','fatak');
const upCar = D.getCar();
check('engine upgrade raises power', upCar.mod.power > before.power*1.5, {base:before.power, upg:Math.round(upCar.mod.power)});

console.log('\n'+(failures.length? 'FAILURES:\n - '+failures.join('\n - ') : 'ALL CHECKS PASSED'));
process.exit(failures.length?1:0);
