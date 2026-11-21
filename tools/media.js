/* ---- privé-bestanden (PDF) en opnames (Cloudflare Stream) ---- */
const FILE=k=>FILES.find(f=>f.key===k);
async function loadMedia(){
  try{const r=await api('GET','/files'); FILES=r.files||[]; FSLOTS=r.slots||[]}catch(e){}
  try{const r=await api('GET','/recordings'); RECS=r.recordings||[]; LINKED=!!r.linked}catch(e){}
}
function fileBtn(k,label,cls){
  return FILE(k)?`<a class="${cls}" href="/api/files/${k}" target="_blank" rel="noopener">${h(label)}</a>`:`<span class="muted">${h(label)} · volgt</span>`}
function matLink(k,label){
  return FILE(k)?`<a href="/api/files/${k}" target="_blank" rel="noopener">${h(label)}</a>`:`<span class="lockedmat">${h(label)}<span class="small">volgt</span></span>`}

/* opnames per hoofdstuk */
function recBlock(training){
  const rs=RECS.filter(r=>r.training===training&&(r.visible||(ME&&ME.role==='admin')));
  if(!rs.length) return '';
  return `<div class="sec" style="gap:8px"><div class="mono">Opname per hoofdstuk</div>${rs.map(recRow).join('')}</div>`}
function recRow(r){
  return `<div class="card recrow" data-recid="${r.id}"><div class="row" style="justify-content:space-between;gap:10px"><span><span class="mono">${pad2(r.order)}</span> · <b>${h(r.title)}</b>${r.visible?'':' <span class="pill">Verborgen</span>'}</span><button class="btn ghost sm" type="button" data-play="${r.id}">Bekijk</button></div></div>`}
function recSection(){
  const ts=[...new Set(RECS.map(r=>r.training))].sort((a,b)=>a-b);
  const admin=ME&&ME.role==='admin'&&!VIEW;
  const rows=ts.map(t=>{const w=WEEKS.find(x=>x.mod===t); const rs=RECS.filter(r=>r.training===t&&(r.visible||admin)); if(!rs.length) return '';
    return `<div class="sec" style="gap:8px"><div class="mono">Training ${pad2(t)}${w?' · '+h(w.title):''}</div>${rs.map(recRow).join('')}</div>`}).join('');
  return rows?`<section class="sec"><div class="sechead"><h2>Opnames per hoofdstuk</h2></div>${rows}</section>`:''}
async function playRec(btn){
  const box=btn.closest('[data-recid]'); const old=box.querySelector('iframe');
  if(old){old.remove(); btn.textContent='Bekijk'; return}
  btn.disabled=true; btn.textContent='Laden…';
  try{
    const r=await api('GET','/recordings/'+btn.dataset.play+'/play');
    const f=document.createElement('iframe'); f.src=r.url; f.allow='autoplay; encrypted-media; picture-in-picture; fullscreen'; f.allowFullscreen=true; f.title='Opname'; f.className='recplayer';
    box.appendChild(f); btn.textContent='Sluiten';
  }catch(e){btn.textContent='Bekijk'; box.insertAdjacentHTML('beforeend',`<p class="err" role="alert">${h(e.message)}</p>`)}
  btn.disabled=false;
}

/* herteken Beheer maar blijf op dezelfde plek en laat uitgeklapte blokken open */
async function keepRoute(){
  const y=scrollY, open=[...document.querySelectorAll('#app details')].map(d=>d.open);
  await route();
  document.querySelectorAll('#app details').forEach((d,i)=>{if(open[i]) d.open=true});
  scrollTo(0,y);
}
/* beheer: bestanden en opnames */
function mediaAdminHtml(){
  const files=FSLOTS.map(s=>{const f=FILE(s.key)||(FILES.find(x=>x.key===s.key));
    const st=f?`${(f.size/1048576).toFixed(1)} MB · ${f.visible?'zichtbaar':'verborgen'}`:'nog niet geüpload';
    return `<div class="card"><div class="row" style="justify-content:space-between;gap:10px"><b>${h(s.label)}</b><span class="muted small">${st}</span></div>
    <div class="row"><label class="btn ghost sm" style="cursor:pointer">${f?'Vervang PDF':'Upload PDF'}<input type="file" accept="application/pdf" data-fup="${s.key}" hidden></label>${f?`<button class="btn ghost sm" type="button" data-fvis="${s.key}" data-on="${f.visible?1:0}">${f.visible?'Verbergen':'Zichtbaar maken'}</button><button class="btn ghost sm" type="button" data-fdel="${s.key}">Verwijderen</button>`:''}</div></div>`}).join('');
  const card=r=>`<div class="card"><div class="row" style="gap:10px"><span class="mono">T${r.training}·${pad2(r.order)}</span><input type="text" value="${h(r.title)}" data-rectitle="${r.id}" aria-label="Titel" style="flex:1;min-width:180px"><span class="pill ${r.visible?'on':''}">${r.visible?'Zichtbaar':'Verborgen'}</span></div>
    <div class="row"><button class="btn ghost sm" type="button" data-recvis="${r.id}" data-on="${r.visible?1:0}">${r.visible?'Verbergen':'Zichtbaar maken'}</button><button class="btn ghost sm" type="button" data-recdel="${r.id}">Verwijderen</button></div></div>`;
  const trainings=[...new Set(RECS.map(r=>r.training))].sort((a,b)=>a-b);
  const recs=trainings.map(n=>{const rs=RECS.filter(r=>r.training===n), vis=rs.filter(r=>r.visible).length, all=vis===rs.length;
    return `<details class="card"><summary style="cursor:pointer;display:flex;gap:10px;align-items:center;justify-content:space-between"><b>Training ${n}</b><span class="muted small">${vis} van ${rs.length} zichtbaar</span></summary>
    <div class="sec" style="margin-top:12px"><div class="row"><button class="btn sm ${all?'ghost':''}" type="button" data-trvis="${n}" data-on="${all?0:1}">${all?'Hele training verbergen':'Hele training zichtbaar maken'}</button></div>${rs.map(card).join('')}</div></details>`}).join('');
  return `<details class="sec"><summary class="sechead" style="cursor:pointer"><h2 style="display:inline">Bestanden (PDF)</h2><span class="muted">${FILES.length} van ${FSLOTS.length} geüpload</span></summary><p class="muted">Exporteer in Canva als PDF en upload hier. Nieuwe bestanden staan eerst verborgen. Alleen ingelogde deelnemers kunnen ze openen.</p><div id="ferr" class="err" role="alert"></div>
  <details class="card"><summary class="mono" style="cursor:pointer">Importeer via links (werkt ook vanaf je telefoon)</summary><div class="sec" style="margin-top:12px"><p class="muted small">Eén regel per bestand: de naam van het slot, een spatie en de link naar de PDF (bijvoorbeeld <code>werkboek https://…</code>). De server haalt de PDF zelf op. De link moet een directe download zijn.</p><textarea id="fbulk" rows="6" aria-label="Links" placeholder="cursusboek https://…&#10;deck-1 https://…" style="font-family:monospace;font-size:.85rem"></textarea><div class="row"><button class="btn sm" type="button" data-fbulk="1">Importeer</button></div><p class="muted small">Namen: ${FSLOTS.map(x=>x.key).join(', ')}</p></div></details>${files}</details>
  <details class="sec"><summary class="sechead" style="cursor:pointer"><h2 style="display:inline">Opnames (Cloudflare)</h2><span class="muted">${RECS.filter(r=>r.visible).length} van ${RECS.length} zichtbaar</span></summary>
  ${LINKED?'':'<p class="err">Cloudflare is nog niet gekoppeld. Zet CF_ACCOUNT_ID, CF_STREAM_TOKEN en CF_STREAM_SUBDOMAIN in Render.</p>'}
  <p class="muted">Upload de video\'s in Cloudflare Stream met hun bestandsnaam (bijvoorbeeld T2-03-eerst-rust-dan-techniek.mp4) en klik hieronder. Ze komen verborgen binnen, met "alleen met getekende link" aan.</p>
  <div class="row"><button class="btn sm" type="button" data-recimport="1">Haal video's op uit Cloudflare</button></div><div id="rerr" class="err" role="alert"></div>${recs||'<p class="muted">Nog geen hoofdstukken.</p>'}</details>`}

async function mediaClick(e){
  const t=e.target, c=s=>t.closest(s);
  let b;
  if(b=c('[data-play]')){playRec(b);return true}
  if(b=c('[data-fbulk]')){
    const box=document.getElementById('fbulk'), o=document.getElementById('ferr'); o.style.color='';
    const lines=box.value.split('\n').map(x=>x.trim()).filter(Boolean);
    if(!lines.length){o.textContent='Plak eerst minstens één regel.';return true}
    b.disabled=true; let ok=0, fail=[];
    for(let i=0;i<lines.length;i++){
      const m=lines[i].match(/^([\w-]+)[\s=]+(https:\/\/\S+)$/);
      o.textContent='Bezig… '+(i+1)+' van '+lines.length;
      if(!m){fail.push(lines[i].slice(0,30)+': regel niet herkend');continue}
      try{await api('POST','/admin/files/import',{key:m[1],url:m[2]}); ok++}catch(x){fail.push(m[1]+': '+x.message)}
    }
    await keepRoute(); const o2=document.getElementById('ferr');
    if(o2){o2.style.color=fail.length?'':'var(--ok)'; o2.textContent=ok+' geïmporteerd'+(fail.length?' · mislukt: '+fail.join(' | '):'')}
    return true}
  if(b=c('[data-fvis]')){try{await api('PATCH','/admin/files/'+b.dataset.fvis,{visible:b.dataset.on!=='1'}); keepRoute()}catch(x){document.getElementById('ferr').textContent=x.message} return true}
  if(b=c('[data-fdel]')){
    if(b.dataset.armed!=='1'){b.dataset.armed='1';b.textContent='Zeker weten?';return true}
    try{await api('DELETE','/admin/files/'+b.dataset.fdel); keepRoute()}catch(x){document.getElementById('ferr').textContent=x.message} return true}
  if(b=c('[data-trvis]')){try{await api('PATCH','/admin/recordings/training/'+b.dataset.trvis,{visible:b.dataset.on==='1'}); await keepRoute()}catch(x){document.getElementById('rerr').textContent=x.message} return true}
  if(b=c('[data-recvis]')){try{await api('PATCH','/admin/recordings/'+b.dataset.recvis,{visible:b.dataset.on!=='1'}); keepRoute()}catch(x){document.getElementById('rerr').textContent=x.message} return true}
  if(b=c('[data-recdel]')){
    if(b.dataset.armed!=='1'){b.dataset.armed='1';b.textContent='Zeker weten?';return true}
    try{await api('DELETE','/admin/recordings/'+b.dataset.recdel); keepRoute()}catch(x){document.getElementById('rerr').textContent=x.message} return true}
  if(b=c('[data-recimport]')){
    b.disabled=true; const o=document.getElementById('rerr');
    try{const r=await api('POST','/admin/recordings/import'); await keepRoute(); const o2=document.getElementById('rerr'); if(o2){o2.style.color='var(--ok)'; o2.textContent=r.added+' nieuw, '+r.skipped+' overgeslagen'+(r.unsigned?' · '+r.unsigned+' kon niet op "getekende link" gezet worden':'')}}
    catch(x){o.textContent=x.message; b.disabled=false}
    return true}
  return false;
}
async function mediaChange(e){
  const t=e.target;
  if(t.matches&&t.matches('[data-fup]')&&t.files[0]){
    const f=t.files[0], err=document.getElementById('ferr'); err.style.color=''; err.textContent='Uploaden…';
    try{
      const r=await fetch('/api/admin/files/'+t.dataset.fup,{method:'PUT',credentials:'same-origin',headers:{'Content-Type':'application/pdf','X-Requested-With':'run90'},body:await f.arrayBuffer()});
      if(!r.ok){let d=null;try{d=(await r.json()).detail}catch(x){} throw new Error(typeof d==='string'?d:'Uploaden mislukt.')}
      keepRoute();
    }catch(x){err.textContent=x.message}
    return true}
  if(t.matches&&t.matches('[data-rectitle]')){
    const v=t.value.trim(); if(!v) return true;
    try{await api('PATCH','/admin/recordings/'+t.dataset.rectitle,{title:v}); status('Opgeslagen')}catch(x){t.title=x.message}
    return true}
  return false;
}
