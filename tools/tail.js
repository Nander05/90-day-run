/* ---- account ---- */
function accountHtml(){
  if(VIEW||!ME) return '';
  return `<section class="sec"><div class="sechead"><h2>Account</h2></div>
  <p class="muted">Ingelogd als <b>${h(ME.name)}</b> (${h(ME.email)}). Alleen jij en je begeleider kunnen jouw boek zien. Andere deelnemers zien niets van jou.</p>
  <form id="pwform" class="sec" novalidate style="max-width:420px">
    <div class="f"><label class="lb" for="pw-cur">Huidig wachtwoord</label><input id="pw-cur" name="cur" type="password" autocomplete="current-password"></div>
    <div class="f"><label class="lb" for="pw-new">Nieuw wachtwoord (minstens 10 tekens)</label><input id="pw-new" name="nw" type="password" autocomplete="new-password"></div>
    <div class="f"><label class="lb" for="pw-rep">Herhaal nieuw wachtwoord</label><input id="pw-rep" name="rep" type="password" autocomplete="new-password"></div>
    <p class="err" id="perr" role="alert"></p>
    <div class="row"><button class="btn" type="submit">Wachtwoord wijzigen</button><button class="btn ghost" type="button" data-logout="1">Uitloggen</button></div>
  </form></section>`}

/* ---- router ---- */
const NAV=[['start','Vandaag'],['reis','Reis'],['mijn-90','Mijn 90'],['voortgang','Voortgang'],['materiaal','Materiaal']];
const mainEl=()=>document.getElementById('app');
function chrome(){document.body.classList.toggle('anon',!ME);document.getElementById('lo').hidden=!ME}
function setNav(active){
  const prefix=VIEW?'deelnemer-'+VIEW.id+'-':'';
  const items=NAV.concat(ME&&ME.role==='admin'&&!VIEW?[['beheer','Deelnemers']]:[]);
  document.getElementById('nav').innerHTML=ME?items.map(([id,l])=>`<a href="#${prefix}${id}" ${id===active?'aria-current="page"':''}>${l}</a>`).join(''):'';
}
function viewFor(raw){
  let r=raw,anchor='',v;
  const m=raw.match(/^week-(\d+)(-evaluatie)?$/);
  if(m&&+m[1]>=1&&+m[1]<=13){r='week-'+m[1];v=vWeek(+m[1]);anchor=m[2]?'evaluatie':''}
  else if(r==='bonus') v=vBonus();
  else if(r==='reis') v=vReis();
  else if(r==='mijn-90') v=vMijn();
  else if(r==='voortgang') v=vVoortgang();
  else if(r==='materiaal') v=vMateriaal();
  else {r='start';v=vStart()}
  return {r,v,anchor};
}
function draw(raw,prefix){
  const {r,v,anchor}=viewFor(raw);
  let html=v;
  if(prefix){
    html=html.replace(/href="#(?!deelnemer)/g,'href="#'+prefix);
    html=`<div class="viewas"><span>Je bekijkt het boek van <b>${h(VIEW.name)}</b>. Alleen lezen.</span><a class="btn ghost" href="#beheer">← Alle deelnemers</a></div>`+html;
  }
  mainEl().innerHTML=html;
  if(prefix) mainEl().querySelectorAll('input,textarea,select,button[data-day]').forEach(e=>{e.disabled=true});
  setNav(r.startsWith('week')||r==='bonus'?'reis':r);
  paint();
  if(anchor){const e=document.getElementById(anchor); if(e) e.scrollIntoView(); else window.scrollTo(0,0)} else window.scrollTo(0,0);
}
let seq=0;
async function route(){
  const my=++seq;
  const raw=(location.hash||'#start').slice(1);
  chrome();
  const inv=raw.match(/^uitnodiging-(.+)$/);
  if(inv) return showInvite(inv[1]);
  if(!ME) return showLogin();
  const vm=raw.match(/^deelnemer-([0-9a-f]{24})(?:-(.+))?$/);
  if(vm&&ME.role==='admin'){
    mainEl().innerHTML='<p class="muted">Laden…</p>';
    try{
      if(!VIEW||VIEW.id!==vm[1]){
        const r=await api('GET','/admin/participants/'+vm[1]+'/progress');
        if(my!==seq) return;
        VIEW={id:vm[1],name:r.participant.name,d:r.d||{}};
      }
    }catch(e){VIEW=null;location.hash='#beheer';return}
    return draw(vm[2]||'start','deelnemer-'+vm[1]+'-');
  }
  VIEW=null;
  if(raw==='beheer'){
    if(ME.role!=='admin'){location.hash='#start';return}
    mainEl().innerHTML='<p class="muted">Laden…</p>';
    let html; try{html=await vBeheer()}catch(e){html=`<p class="err">${h(e.message)}</p>`}
    if(my!==seq) return;
    mainEl().innerHTML=html; setNav('beheer'); paint(); window.scrollTo(0,0); return;
  }
  draw(raw,'');
}
addEventListener('hashchange',route);
function paint(){
  const p=pct(), c=current();
  document.getElementById('hpl').textContent=(c.state==='run'?'Dag '+Math.min(90,c.i+1)+' · ':'')+p+'%';
  document.getElementById('hpb').style.width=p+'%';
  const st=document.getElementById('stats'); if(st) st.innerHTML=statsHtml();
  const m=(location.hash||'').match(/week-(\d+)(?:-evaluatie)?$/);
  if(m){const n=+m[1],d=wd(n),b=document.getElementById('wkbar'),t=document.getElementById('wkcount'); if(b) b.style.width=d/7*100+'%'; if(t) t.textContent=d+' van 7 dagen'}
}

/* ---- beheer ---- */
let LASTLINK=null;
function ago(iso){
  if(!iso) return 'nog niet';
  const d=new Date(iso), n=Math.floor((day0(new Date())-day0(d))/864e5);
  if(n<=0) return 'vandaag'; if(n===1) return 'gisteren'; if(n<7) return n+' dagen geleden'; return fmt(d);
}
async function vBeheer(){
  const ps=(await api('GET','/admin/participants')).participants;
  const link=LASTLINK?`<div class="card linkbox"><div class="mono">Uitnodiging voor ${h(LASTLINK.name)}</div><p style="margin:6px 0">Stuur deze link persoonlijk door, bijvoorbeeld via WhatsApp. Hij werkt één keer en is 14 dagen geldig.</p><div class="row"><input id="invurl" type="text" readonly value="${h(LASTLINK.url)}" aria-label="Uitnodigingslink" style="flex:1;min-width:200px"><button class="btn" type="button" data-copy="invurl">Kopieer</button></div></div>`:'';
  const cards=ps.map(p=>{
    const status=!p.active?['Uitgeschakeld','']:!p.has_password?['Uitnodiging open','']:['Actief','on'];
    return `<article class="card pcard"><div class="row"><b style="font-size:1.1rem">${h(p.name)}</b><span class="pill ${status[1]}">${status[0]}</span><span class="pill">${p.mode==='light'?'Light':'Full'}</span></div>
    <div class="muted">${h(p.email)} · laatst actief ${ago(p.updated_at||p.last_login)}</div>
    <div class="row"><div class="track" style="width:160px"><i style="width:${p.days/p.days_total*100}%"></i></div><span class="mono">${p.days} / ${p.days_total} dagen · ${p.weeks_done} / 13 weken</span></div>
    ${p.goal?`<p style="margin:0"><span class="mono">Doel</span><br>${h(p.goal)}</p>`:''}
    <div class="row"><a class="btn sm" href="#deelnemer-${p.id}-start">Bekijk boek</a><button class="btn ghost sm" type="button" data-act="invite" data-id="${p.id}" data-name="${h(p.name)}">Nieuwe link</button><button class="btn ghost sm" type="button" data-act="toggle" data-id="${p.id}" data-active="${p.active?1:0}">${p.active?'Uitschakelen':'Activeren'}</button><button class="btn ghost sm" type="button" data-act="del" data-id="${p.id}">Verwijderen</button></div></article>`}).join('');
  return `<div class="sec" style="gap:28px"><div><div class="kick">Alleen voor de beheerder</div><h1>Deelnemers</h1></div>
  <form id="addform" class="card sec" novalidate><div class="mono">Nieuwe deelnemer</div>
   <div class="cols2"><div class="f"><label class="lb" for="ad-name">Naam</label><input id="ad-name" name="name" type="text" autocomplete="off"></div><div class="f"><label class="lb" for="ad-email">E-mail</label><input id="ad-email" name="email" type="email" autocomplete="off"></div></div>
   <p class="err" id="aerr" role="alert"></p><div><button class="btn" type="submit">Uitnodiging maken</button></div></form>
  ${link}
  <section class="sec"><div class="sechead"><h2>${ps.length} ${ps.length===1?'deelnemer':'deelnemers'}</h2><button class="btn ghost sm" type="button" data-act="refresh">Vernieuwen</button></div>${cards||'<p class="muted">Nog geen deelnemers. Maak hierboven de eerste uitnodiging.</p>'}</section></div>`}
async function adminAction(a){
  const act=a.dataset.act,id=a.dataset.id;
  try{
    if(act==='refresh') return route();
    if(act==='invite'){const r=await api('POST','/admin/participants/'+id+'/invite'); LASTLINK={name:a.dataset.name,url:location.origin+'/#uitnodiging-'+r.invite_token}; route()}
    else if(act==='toggle'){await api('PATCH','/admin/participants/'+id,{active:a.dataset.active!=='1'}); route()}
    else if(act==='del'){
      if(a.dataset.armed!=='1'){a.dataset.armed='1';a.textContent='Zeker weten? Alles wordt gewist';return}
      await api('DELETE','/admin/participants/'+id); route();
    }
  }catch(e){a.textContent=e.message}
}
async function copyText(btn){
  const el=document.getElementById(btn.dataset.copy);
  try{await navigator.clipboard.writeText(el.value);btn.textContent='Gekopieerd'}catch(e){el.focus();el.select()}
}

/* ---- inloggen ---- */
function showLogin(msg){
  chrome(); setNav('');
  mainEl().innerHTML=`<div class="auth"><div><div class="kick">Sales Foundations 90</div><h1>90 Day Run</h1></div>
  <form id="loginform" class="sec" novalidate>
   <div class="f"><label class="lb" for="li-email">E-mail</label><input id="li-email" name="email" type="email" autocomplete="username"></div>
   <div class="f"><label class="lb" for="li-pw">Wachtwoord</label><input id="li-pw" name="password" type="password" autocomplete="current-password"></div>
   <p class="err" id="lerr" role="alert">${msg?h(msg):''}</p>
   <div><button class="btn" type="submit">Inloggen</button></div></form>
  <p class="muted">Nog geen account? Je krijgt een persoonlijke link van Nander.</p>
  <p class="muted small">Alleen jij en je begeleider kunnen jouw boek zien. Andere deelnemers zien niets van jou.</p></div>`;
}
async function loadOwn(){const p=await api('GET','/me/progress'); OWN=p.d||{}}
async function doLogin(f){
  const err=document.getElementById('lerr'),btn=f.querySelector('button'); err.textContent=''; btn.disabled=true;
  try{
    ME=await api('POST','/auth/login',{email:f.email.value,password:f.password.value});
    await loadOwn(); history.replaceState(null,'','#start'); route();
  }catch(e){err.textContent=e.message;btn.disabled=false}
}
async function showInvite(token){
  chrome(); setNav('');
  mainEl().innerHTML='<div class="auth"><p class="muted">Laden…</p></div>';
  let info; try{info=await api('GET','/auth/invite/'+encodeURIComponent(token))}
  catch(e){mainEl().innerHTML=`<div class="auth"><h1>Link niet geldig</h1><p>${h(e.message)}</p><a class="btn ghost" href="#start" data-reload="1">Naar inloggen</a></div>`;return}
  mainEl().innerHTML=`<div class="auth"><div><div class="kick">Welkom bij de 90 Day Run</div><h1>Hallo ${h(info.name)}</h1></div>
  <p>Kies een wachtwoord voor <b>${h(info.email)}</b>. Daarna zit je in je eigen boek.</p>
  <form id="inviteform" class="sec" novalidate data-token="${h(token)}">
   <div class="f"><label class="lb" for="iv-pw">Wachtwoord (minstens 10 tekens)</label><input id="iv-pw" name="pw" type="password" autocomplete="new-password"></div>
   <div class="f"><label class="lb" for="iv-rep">Herhaal wachtwoord</label><input id="iv-rep" name="rep" type="password" autocomplete="new-password"></div>
   <p class="err" id="verr" role="alert"></p>
   <div><button class="btn" type="submit">Account maken</button></div></form>
  <p class="muted small">Alleen jij en je begeleider kunnen jouw boek zien. Andere deelnemers zien niets van jou.</p></div>`;
}
async function doInvite(f){
  const err=document.getElementById('verr'),btn=f.querySelector('button'); err.textContent='';
  if(f.pw.value!==f.rep.value){err.textContent='De twee wachtwoorden zijn niet hetzelfde.';return}
  btn.disabled=true;
  try{
    ME=await api('POST','/auth/accept-invite',{token:f.dataset.token,password:f.pw.value});
    await loadOwn(); history.replaceState(null,'','#mijn-90'); route();
  }catch(e){err.textContent=e.message;btn.disabled=false}
}
async function doPassword(f){
  const err=document.getElementById('perr'); err.textContent='';
  if(f.nw.value!==f.rep.value){err.textContent='De twee nieuwe wachtwoorden zijn niet hetzelfde.';return}
  try{await api('POST','/me/password',{current:f.cur.value,new:f.nw.value}); f.reset(); err.style.color='var(--ok)'; err.textContent='Wachtwoord gewijzigd.'}
  catch(e){err.style.color=''; err.textContent=e.message}
}
async function doAdd(f){
  const err=document.getElementById('aerr'); err.textContent='';
  try{
    const r=await api('POST','/admin/participants',{name:f.name.value,email:f.email.value});
    LASTLINK={name:r.participant.name,url:location.origin+'/#uitnodiging-'+r.invite_token}; route();
  }catch(e){err.textContent=e.message}
}
async function logout(){
  await flush(true);
  try{await api('POST','/auth/logout')}catch(e){}
  ME=null;OWN={};VIEW=null;LASTLINK=null;
  history.replaceState(null,'','#start'); showLogin();
}

/* ---- invoer ---- */
document.addEventListener('click',e=>{
  const d=e.target.closest('[data-day]');
  if(d&&!VIEW){
    const k=d.dataset.day,on=!get(k); put(k,on);
    d.setAttribute('aria-pressed',on?'true':'false');
    const l=document.getElementById('todaylab'); if(l&&d.id==='todaybtn') l.textContent=on?'Vandaag gedaan':'Vandaag afvinken';
    paint();
    if(d.id==='todaybtn'){const r=document.querySelector('.ringsvg'); if(r){const t=document.createElement('div'); t.innerHTML=ring(); r.replaceWith(t.firstChild)}}
    return;
  }
  const a=e.target.closest('[data-act]'); if(a) return adminAction(a);
  const c=e.target.closest('[data-copy]'); if(c) return copyText(c);
  if(e.target.closest('#lo')||e.target.closest('[data-logout]')) return logout();
});
document.addEventListener('submit',e=>{
  e.preventDefault();
  const f=e.target;
  if(f.id==='loginform') doLogin(f);
  else if(f.id==='inviteform') doInvite(f);
  else if(f.id==='pwform') doPassword(f);
  else if(f.id==='addform') doAdd(f);
});
function onField(e){
  const el=e.target; if(VIEW||!el.dataset||!el.dataset.k) return;
  if(el.type==='checkbox') put(el.dataset.k,el.checked);
  else if(el.type==='radio'){ if(el.checked) put(el.dataset.k,el.value) }
  else put(el.dataset.k,el.value.trim()===''?'':el.value);
  paint();
}
document.addEventListener('input',onField);
document.addEventListener('change',onField);

/* ---- terug in beeld: nieuwste gegevens ophalen ---- */
const same=(a,b)=>{const ka=Object.keys(a),kb=Object.keys(b);return ka.length===kb.length&&ka.every(k=>a[k]===b[k])};
document.addEventListener('visibilitychange',async()=>{
  if(document.visibilityState==='hidden'){flush(true);return}
  if(ME&&ME.role==='admin'&&location.hash==='#beheer'&&!document.activeElement.matches('input,textarea')){route();return}
  if(!ME||VIEW||Object.keys(pend.set).length||pend.unset.size||inflight) return;
  try{
    const p=await api('GET','/me/progress');
    if(!same(p.d||{},OWN)&&!document.activeElement.matches('input,textarea,select')){const y=scrollY; OWN=p.d||{}; await route(); scrollTo(0,y)}
  }catch(e){}
});
addEventListener('pagehide',()=>{flush(true)});

/* ---- laatste woord van elke kop in accentkleur, zoals in de presentaties ---- */
function decorate(){
  document.querySelectorAll('#app h1').forEach(el=>{
    if(el.children.length) return;
    const tx=el.textContent.trim(), i=tx.lastIndexOf(' '); if(i<0) return;
    el.textContent=''; el.append(tx.slice(0,i)+' ');
    const s=document.createElement('span'); s.className='hl'; s.textContent=tx.slice(i+1); el.append(s);
  });
}
new MutationObserver(decorate).observe(document.getElementById('app'),{childList:true,subtree:true});

/* ---- start ---- */
(async function boot(){
  try{ME=await api('GET','/auth/me')}catch(e){ME=null}
  if(ME){try{await loadOwn()}catch(e){}}
  route();
})();
