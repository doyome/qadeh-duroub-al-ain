const D=require('./stub.js'), dt=1/120;
// طيّار يلعب مثل إنسان: بنزين على الأرض، وفي الهواء يوازن أو يرفع إيده
function pilot(stage,veh,secs){
  D.SAVE.unlocked[stage]=1; D.SAVE.owned[veh]=1;
  D.startRun(stage,veh);
  let maxAir=0,jumps=0,prevAir=0,alt=0;
  for(let i=0;i<120*secs;i++){
    const c=D.getCar(), r=D.getRun();
    const grounded = c.wheels.some(w=>w.ct);
    if(grounded){ D.setInput(false,true); }
    else {
      const slope=Math.atan2(D.groundY(c.x+70)-D.groundY(c.x-70),140);
      const err=slope-c.a;
      if(err>0.10) D.setInput(true,false);        // زاوية أقل من الميل = الأنف عالي → فرامل تنزّله
      else if(err<-0.10) D.setInput(false,true);
      else D.setInput(false,false);               // متزن → ارفع إيدك
    }
    if(r.air>0) alt=Math.max(alt,D.groundY(c.x)-c.y);
    if(r.air===0&&prevAir>0.35) jumps++;
    maxAir=Math.max(maxAir,r.air); prevAir=r.air;
    D.physics(dt); D.pickups();
    if(D.getRun().over) break;
  }
  const r=D.getRun();
  return {dist:Math.round(r.dist),goal:D.STAGES.find(s=>s.id===stage).goal,
          maxAir:+maxAir.toFixed(2),alt:Math.round(alt),jumps,coins:r.coins,end:r.reason||'still'};
}
const rows=[];
for(const st of D.STAGES) for(const v of ['scooter','bike','fatak','lc'])
  rows.push(Object.assign({stage:st.id,veh:v},pilot(st.id,v,150)));
console.table(rows);
const early=rows.filter(r=>r.dist<r.goal*0.25);
console.log(`\nجولات انتهت قبل ٢٥٪ من الهدف: ${early.length}/${rows.length}`);
console.log(`متوسط أطول طيران: ${(rows.reduce((a,b)=>a+b.maxAir,0)/rows.length).toFixed(2)} ث`);
console.log(`مجموع القفزات: ${rows.reduce((a,b)=>a+b.jumps,0)}`);
