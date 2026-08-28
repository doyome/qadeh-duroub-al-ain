const D=require('./stub.js');
let fails=[];
function t(name,fn){ try{ fn(); console.log('PASS  '+name); }catch(e){ fails.push(name+': '+e.message); console.log('FAIL  '+name+' :: '+e.message);} }

// كل مرحلة: تشغيل حلقة الرسم كاملة عبر مسافة طويلة (كل الديكورات والالتقاطات)
for(const st of D.STAGES){
  D.SAVE.unlocked[st.id]=1;
  t('render '+st.id, ()=>{
    D.startRun(st.id,'fatak');
    for(let i=0;i<40;i++){ for(let k=0;k<60;k++) D.physics(1/120); D.render(1/60); }
  });
}
// كل مركبة تُرسم داخل المشهد
for(const v of D.VEH){
  D.SAVE.owned[v.id]=1;
  t('draw vehicle '+v.id, ()=>{
    D.startRun('hili',v.id);
    for(let i=0;i<10;i++){ for(let k=0;k<30;k++) D.physics(1/120); D.render(1/60); }
  });
}
// مصغّرات الكراج + شاشات القوائم
for(const v of D.VEH) t('thumb '+v.id, ()=>D.vehThumb(v));
t('garage screen', ()=>{D.renderGarage();D.renderUpg();});
t('stages screen', ()=>D.renderStages());
t('menu scene', ()=>{ for(let i=0;i<90;i++) D.menuScene(1/60); });
console.log('\n'+(fails.length?('FAILURES:\n - '+fails.join('\n - ')):'ALL RENDER PATHS OK'));
process.exit(fails.length?1:0);
