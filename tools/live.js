/* ---- live trainingen en opnames ---- */
const LONG=['zondag','maandag','dinsdag','woensdag','donderdag','vrijdag','zaterdag'];
const pad2=n=>String(n).padStart(2,'0');
function fmtWhen(iso){const d=new Date(iso); return LONG[d.getDay()]+' '+d.getDate()+' '+MON[d.getMonth()]+' · '+pad2(d.getHours())+':'+pad2(d.getMinutes())}
const isPast=x=>new Date(x.starts_at)<new Date(Date.now()-2*36e5); // tot twee uur na de start telt nog als "nu"
function nextSession(){return SESS.filter(x=>!isPast(x))[0]||null}
async function loadSessions(){try{const r=await api('GET','/sessions'); SESS=r.sessions||[]}catch(e){}}
const toLocalInput=iso=>{const d=new Date(iso);return d.getFullYear()+'-'+pad2(d.getMonth()+1)+'-'+pad2(d.getDate())+'T'+pad2(d.getHours())+':'+pad2(d.getMinutes())};
let EDITING=null;

function sessCard(x,admin){
  const d=new Date(x.starts_at), past=isPast(x);
  const w=x.week!=null?(x.week===0?'Start':'Week '+x.week):'';
  const btns=[];
  if(!past&&x.join_url) btns.push(`<a class="btn" href="${h(x.join_url)}" target="_blank" rel="noopener">Doe mee</a>`);
  if(x.recording_url) btns.push(`<a class="btn ${past?'':'ghost'}" href="${h(x.recording_url)}" target="_blank" rel="noopener">Bekijk de opname</a>`);
  else if(past) btns.push('<span class="muted">Opname volgt</span>');
  if(x.week) btns.push(`<a class="btn ghost" href="#week-${x.week}">Naar week ${x.week}</a>`);
  const adm=admin?`<div class="row adm"><button class="btn ghost sm" type="button" data-sess="edit" data-id="${x.id}">Wijzig</button><button class="btn ghost sm" type="button" data-sess="del" data-id="${x.id}">Verwijder</button></div>`:'';
  return `<article class="card sess ${past?'past':''}"><div class="sessdate" aria-hidden="true"><b>${d.getDate()}</b><span>${MON[d.getMonth()]}</span></div>
  <div class="sessbody"><div class="row" style="gap:8px"><h3>${h(x.title)}</h3>${w?`<span class="pill">${w}</span>`:''}</div>
  <div class="muted">${fmtWhen(x.starts_at)}</div>${x.notes?`<p style="margin:0">${h(x.notes)}</p>`:''}
  ${btns.length?`<div class="row">${btns.join('')}</div>`:''}${adm}</div></article>`}

function sessForm(){
  const e=EDITING&&SESS.find(x=>x.id===EDITING)||null;
  const weeks=['<option value="">Geen week</option><option value="0">Start / kennismaking</option>'].concat(Array.from({length:13},(_,i)=>`<option value="${i+1}" ${e&&e.week===i+1?'selected':''}>Week ${i+1} · ${h(WEEKS[i].title)}</option>`)).join('');
  return `<form id="sessform" class="card sec" novalidate data-id="${e?e.id:''}"><div class="mono">${e?'Training wijzigen':'Live training of opname toevoegen'}</div>
  <div class="cols2"><div class="f"><label class="lb" for="se-title">Titel</label><input id="se-title" type="text" value="${h(e?e.title:'')}" autocomplete="off"></div>
  <div class="f"><label class="lb" for="se-start">Datum en tijd</label><input id="se-start" type="datetime-local" value="${e?toLocalInput(e.starts_at):''}"></div></div>
  <div class="cols2"><div class="f"><label class="lb" for="se-week">Hoort bij</label><select id="se-week">${weeks}</select></div>
  <div class="f"><label class="lb" for="se-join">Link om mee te doen (Zoom, Meet, Teams)</label><input id="se-join" type="url" inputmode="url" placeholder="https://" value="${h(e?e.join_url:'')}"></div></div>
  <div class="f"><label class="lb" for="se-rec">Link naar de opname (komt erbij na afloop)</label><input id="se-rec" type="url" inputmode="url" placeholder="https://" value="${h(e?e.recording_url:'')}"></div>
  <div class="f"><label class="lb" for="se-notes">Notitie voor de deelnemers (optioneel)</label><textarea id="se-notes" rows="2">${h(e?e.notes:'')}</textarea></div>
  <p class="err" id="serr" role="alert"></p>
  <div class="row"><button class="btn" type="submit">${e?'Opslaan':'Toevoegen'}</button>${e?'<button class="btn ghost" type="button" data-sess="cancel">Annuleren</button>':''}</div></form>`}

function vLive(){
  const admin=ME&&ME.role==='admin'&&!VIEW;
  const up=SESS.filter(x=>!isPast(x)), past=SESS.filter(isPast).reverse();
  return `<div class="sec" style="gap:32px"><div><div class="kick">Sales Foundations 90</div><h1>Live trainingen</h1>
  <p class="muted" style="margin:8px 0 0">Hier staan de live trainingen en de opnames. Heb je er een gemist? Kijk de opname en vink daarna in de week aan dat je de training hebt gevolgd.</p></div>
  ${admin?sessForm():''}
  <section class="sec"><div class="sechead"><h2>Eerstvolgende</h2></div>${up.map(x=>sessCard(x,admin)).join('')||'<p class="muted">Er staat nog geen training gepland.</p>'}</section>
  <section class="sec"><div class="sechead"><h2>Opnames</h2></div>${past.map(x=>sessCard(x,admin)).join('')||'<p class="muted">Nog geen afgelopen trainingen.</p>'}</section></div>`}

async function saveSession(f){
  const err=document.getElementById('serr'); err.textContent='';
  const v=id=>document.getElementById(id).value.trim();
  if(!v('se-title')||!v('se-start')){err.textContent='Vul een titel en een datum in.';return}
  const wk=v('se-week');
  const body={title:v('se-title'),starts_at:new Date(v('se-start')).toISOString(),week:wk===''?null:+wk,join_url:v('se-join'),recording_url:v('se-rec'),notes:v('se-notes')};
  try{
    if(f.dataset.id) await api('PUT','/admin/sessions/'+f.dataset.id,body); else await api('POST','/admin/sessions',body);
    EDITING=null; await loadSessions(); route();
  }catch(e){err.textContent=e.message}
}
async function sessAction(b){
  const a=b.dataset.sess,id=b.dataset.id;
  if(a==='edit'){EDITING=id; await route(); const f=document.getElementById('sessform'); if(f) f.scrollIntoView({block:'center'}); return}
  if(a==='cancel'){EDITING=null; return route()}
  if(a==='del'){
    if(b.dataset.armed!=='1'){b.dataset.armed='1';b.textContent='Zeker weten?';return}
    try{await api('DELETE','/admin/sessions/'+id); EDITING=null; await loadSessions(); route()}catch(e){b.textContent=e.message}
  }
}
