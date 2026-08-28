const D=require('./stub.js'), dt=1/120;
const rows=[]; let fails=[];
for(const st of D.STAGES){
  D.SAVE.unlocked[st.id]=1;
  for(const vid of ['scooter','bike','fatak','lc']){
    D.SAVE.owned[vid]=1;
    D.startRun(st.id,vid); D.setInput(false,true);
    let air=0, maxAir=0, maxAlt=0, jumps=0, prevAir=0;
    for(let i=0;i<120*70;i++){
      D.physics(dt); D.pickups();
      const c=D.getCar(), r=D.getRun();
      if(r.air>0){ maxAlt=Math.max(maxAlt, D.groundY(c.x)-c.y); }
      if(r.air===0 && prevAir>0.35) jumps++;
      maxAir=Math.max(maxAir,r.air); prevAir=r.air;
      if(r.over) break;
    }
    const r=D.getRun();
    rows.push({stage:st.id,veh:vid,dist:Math.round(r.dist),maxAir:+maxAir.toFixed(2),
               maxAlt:Math.round(maxAlt),jumps,flips:r.flips,end:r.reason||'still'});
  }
}
console.table(rows);
// كل مركبة لازم تطير فعليًا في مرحلة البداية على الأقل
for(const veh of ['scooter','bike','fatak','lc']){
  const hili=rows.find(r=>r.stage==='hili'&&r.veh===veh);
  const ok = hili.jumps>=1 && hili.maxAir>=0.45;
  console.log((ok?'PASS  ':'FAIL  ')+`${veh} يطير في هيلي  maxAir=${hili.maxAir}s alt=${hili.maxAlt}px jumps=${hili.jumps}`);
  if(!ok) fails.push(veh);
}
const totJumps=rows.reduce((a,b)=>a+b.jumps,0);
console.log(`\nمجموع القفزات عبر ٢٤ جولة: ${totJumps}`);
console.log(fails.length?('FAILURES: '+fails.join(', ')):'ALL AIR CHECKS PASSED');
