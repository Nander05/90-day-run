'use strict';
const C = window.COURSE;
const START = new Date(2026,10,2);
const MON = ['jan','feb','mrt','apr','mei','jun','jul','aug','sep','okt','nov','dec'];
const DOW = ['ma','di','wo','do','vr','za','zo'];
const CANVA = {
  boek:'https://www.canva.com/d/FLQwrdqrsrgChG6', werkboek:'https://www.canva.com/d/yQkxHvn4feoyMD6',
  deck:{1:'https://www.canva.com/d/_iyDooGlxYkcD5f',2:'https://www.canva.com/d/IpcLvhq28_Y5oKW',3:'https://www.canva.com/d/lIph8V1t7B7ie5l',4:'https://www.canva.com/d/rcNuvHcXL_ZbZ8w',5:'https://www.canva.com/d/Z5D1vu1jyCGZMCi',6:'https://www.canva.com/d/rEsAZMr2e1NkE-P',7:'https://www.canva.com/d/0lk0AN28vm7jn8D',8:'https://www.canva.com/d/YTxr3OkqIhTOhZ8',9:'https://www.canva.com/d/ZVKxbsl85hvu4Tz',10:'https://www.canva.com/d/q9miVfWupH0tpxl',11:'https://www.canva.com/d/UoIljVZDmTzvrHH',12:'https://www.canva.com/d/40iRUnFrc5jwGT3',bonus:'https://www.canva.com/d/jfp7FP_lNjS_xko'}
};
const W = (n,mod,ph,title,sub,gew,tt,tq)=>({n,mod,ph,title,sub,gew,tt,tq});
const WEEKS = [
 W(1,1,'Fundament','Verkopen is verantwoordelijkheid','Helpen, waarheid en keuzevrijheid. Zwijgen is ook een keuze.','Elke dag één echt gesprek starten.','Elke dag één echt gesprek.','In hoeveel gesprekken klopte je eerste inschatting?'),
 W(2,2,'Fundament','Eerst rust, dan techniek','Je houding en emotionele staat in een gesprek.','Elke dag één echt gesprek, met een reset vooraf.','Eerst reset, dan gesprek.','Wat deed jij boven een zes?'),
 W(3,3,'Fundament','Mensen beslissen zelf','Reactance, autonomie en zelfovertuiging.','Elke dag één echt gesprek.','Elke dag één echt gesprek.','Welke toestand kwam het vaakst voor?'),
 W(4,4,'Fundament','Bouw een deur in je winkel','Prospecting, zichtbaarheid en gesprekken starten.','Elke dag één echt gesprek.','Elke dag een nieuw gesprek.','Hoeveel gesprekken werden inhoudelijk?'),
 W(5,5,'Zichtbaarheid','Zet de lijnen op het veld','Het gesprek openen: agenda, exit en rapport.','Elke dag één Story of post met een vraag.','Elke dag zichtbaar.','Hoe voelde de exit voor de ander?'),
 W(6,6,'Zichtbaarheid','Begrijp eerst, adviseer daarna','Discovery, de vier W-vragen en de teach back.','Elke dag één Story of post met een vraag.','Elke dag zichtbaar.','Welke tegenstrijdigheid hoorde je?'),
 W(7,7,'Zichtbaarheid','Waar wil je naartoe?','Verlangen, impact en eerlijke urgentie.','Elke dag één Story of post met een vraag.','Elke dag zichtbaar.','Welk antwoord was het meest concreet?'),
 W(8,0,'Kerst','Inhaalweek','Kerstweek. Geen nieuwe module. Haal in wat bleef liggen, of laad op voor de tweede helft.','','',''),
 W(9,8,'Zichtbaarheid','Minder zeggen, meer helpen','Een oplossing eenvoudig en relevant presenteren.','Elke dag één Story of post met een vraag.','Elke dag zichtbaar.','Hoeveel kon je schrappen?'),
 W(10,9,'Uitnodigen','Durf de vraag te stellen','Beslissingen begeleiden, prijs en commitment.','Elke dag één opvolging.','Elke dag één opvolging.','Hoeveel duidelijke beslissingen?'),
 W(11,10,'Uitnodigen','Twijfel is informatie','Bezwaren erkennen, onderzoeken en opnieuw vragen.','Elke dag één opvolging.','Elke dag één opvolging.','Welk bezwaar kwam het vaakst?'),
 W(12,11,'Uitnodigen','Opvolgen zonder jagen','Context, ritme en heldere grenzen.','Elke dag één opvolging.','Elke dag één opvolging.','Hoeveel contacten sloot je bewust af?'),
 W(13,12,'Uitnodigen','Bouw een ritme dat blijft','Een herhaalbaar proces, metingen en coaching.','Elke dag één opvolging.','Elke dag één opvolging.','Welke vaardigheid kies je voor de komende dertig dagen?')
];
// WEEKS[7] is de inhaalweek (n=8): geen module, geen tracker
const HABIT = [1,2,3,4,5,6,7,9,10,11,12,13];
const EVALS = {4:{d:30,weeks:[1,2,3,4],next:'Wat stel ik bij voor fase 2: zichtbaarheid?'},10:{d:60,weeks:[5,6,7,9,10],next:'Wat stel ik bij voor fase 3: uitnodigen?'},13:{d:90,weeks:[11,12,13],next:'Mijn volgende doel'}};

/* ---- fiches ---- */
const tx=(k,l,r=3)=>({t:'text',k,l,r});
const col=(h,ty='text',o)=>({h,ty,o});
const tb=(k,cols,n,rows)=>({t:'table',k,cols,n:rows?rows.length:n,rows});
const FI = {
 1:[
  {id:'1.1',p:'oef',kind:'Zelfscan · 10 min',title:'Waar sta je vandaag?',intro:'1 = herken ik niet · 5 = dat ben ik helemaal. Eerlijk is sneller.',b:[
    {t:'scale',k:'s',items:['Ik start zelden een gesprek omdat ik niet opdringerig wil zijn.','Ik noem snel een product, nog voor ik weet wat iemand zoekt.','Ik durf duidelijk te zeggen wat ik zou aanraden.','Ik zeg eerlijk nee als iets niet past.','Ik spreek altijd een volgende stap af.','Na een nee voelt de relatie nog goed.'],max:5},
    {t:'pick',k:'v',l:'Ik ben vooral',o:['Te terughoudend','Te snel']}]},
  {id:'1.2',p:'oef',kind:'In duo · 20 min',title:'Welke vraag ontbrak?',steps:['Beschrijf twee situaties: één keer te terughoudend, één keer te snel.','Zoek met je partner welke vraag het gesprek had verbeterd.','Duid aan welke plicht wegviel: waarheid, proces of vrijheid.'],b:[
    tx('a','Ik was te terughoudend toen…'),tx('b','Ik was te snel toen…'),tx('c','De vraag die het gesprek had verbeterd'),{t:'pick',k:'p',l:'Welke plicht viel weg?',o:['Waarheid','Proces','Vrijheid']}]},
  {id:'1.3',p:'opdr',kind:'De opdracht',title:'5 gesprekken. 7 dagen.',intro:'Vul binnen het uur na elk gesprek een rij in. Je verkoopt niets, tenzij de ander er zelf om vraagt.',b:[
    tb('t',[col('Wat ik dacht'),col('Wat hij zei'),col('Het verschil')],5),{t:'num',k:'n',l:'In hoeveel gesprekken klopte mijn eerste inschatting? (van 5)',max:5}]}
 ],
 2:[
  {id:'2.2',p:'oef',kind:'In duo · 20 min',title:'Twee seconden stilte',steps:['A vertelt twee minuten over een twijfel die hij echt heeft.','B stelt alleen vragen en wacht na elk antwoord twee seconden.','Wissel van rol en bespreek wat de stilte deed.'],b:[
    tx('a','Wat deed de stilte met het gesprek?'),tx('b','Wat deed ze met mij?'),tx('c','Mijn reset · drie zinnen die ik tegen mezelf zeg',3)]},
  {id:'2.3',p:'opdr',kind:'De opdracht',title:'Spanning van 0 tot 10',intro:'Noteer bij tien gesprekken je spanning vóór en na. Schrijf erbij welk gedrag verscheen boven een zes.',b:[
    tb('t',[col('Vóór (0–10)','num'),col('Na (0–10)','num'),col('Gedrag boven 6')],10),tx('r','Mijn reset voor de volgende keer')]}
 ],
 3:[
  {id:'3.2',p:'oef',kind:'In trio · 20 min',title:'Drie cases',intro:'Per case: één slechte reactie en drie goede vragen.',b:[
    tb('t',[col('Slechte reactie'),col('Drie goede vragen')],0,['Onverschillig','Verward','Voorzichtig'])]},
  {id:'3.3',p:'opdr',kind:'De opdracht',title:'Tien prospects, drie toestanden',intro:'Geen warm of koud. Onverschillig, verward of voorzichtig?',b:[
    tb('t',[col('Toestand','select',['Onverschillig','Verward','Voorzichtig']),col('Bewijs'),col('Passende vraag')],10)]}
 ],
 4:[
  {id:'4.2',p:'oef',kind:'Oefening · 20 min',title:'Dertig namen',intro:'Verdeel dertig namen over de drie markten.',b:[
    tb('t',[col('Warm'),col('Verbonden'),col('Nieuw')],10),tx('o','Vijf openingszinnen met echte context',5)]},
  {id:'4.3',p:'opdr',kind:'De opdracht',title:'Twintig nieuwe gesprekken',intro:'Echte gesprekken, geen pitches. Vink af wat er gebeurde.',b:[
    tb('t',[col('Naam'),col('Gestart','check'),col('Inhoudelijk','check'),col('Vervolgafspraak','check')],20)]}
 ],
 5:[
  {id:'5.2',p:'oef',kind:'In duo · 20 min',title:'Negentig seconden',steps:['Situatie 1: een gesprek van twintig minuten.','Situatie 2: een uitgebreid consult.','Situatie 3: een online kennismaking met iemand die je nog niet kent.'],b:[
    tx('a','Mijn opening · situatie 1',4),tx('b','Mijn opening · situatie 2',4),tx('c','Mijn opening · situatie 3',4)]},
  {id:'5.3',p:'opdr',kind:'De opdracht',title:'Vijf keer agenda en exit',intro:'Vraag na elk gesprek: “Was het duidelijk wat we gingen doen, en voelde je ruimte om eerlijk te kiezen?” Noteer het antwoord zonder je te verdedigen.',b:[
    tb('t',[col('Met wie'),col('Wat de ander antwoordde')],5)]}
 ],
 6:[
  {id:'6.2',p:'oef',kind:'In trio · 25 min',title:'Acht minuten, niets presenteren',steps:['Consultant: stelt alleen vragen en eindigt met een samenvatting van maximaal 60 seconden.','Observator: noteert gesloten vragen, onderbrekingen en aannames als feit.','Klant: scoort de samenvatting op herkenning, van 0 tot 10.'],b:[
    tx('a','Mijn samenvatting',4),{t:'num',k:'s',l:'Score herkenning (van 10)',max:10},tx('o','Wat de observator zag')]},
  {id:'6.3',p:'opdr',kind:'De opdracht',title:'Drie discoverygesprekken',intro:'Presenteer pas als je samenvatting bevestigd wordt.',b:[
    tb('t',[col('Feit'),col('Ervaring'),col('Interpretatie'),col('Tegenstrijdigheid')],3)]}
 ],
 7:[
  {id:'7.2',p:'oef',kind:'In trio · 20 min',title:'Vaag doel, zichtbaar gedrag',steps:['Zet een vaag doel om in zichtbaar gedrag.','Formuleer 3 vragen over impact, 3 over de toekomst en 2 over timing.','De observator grijpt in bij elke vraag die het antwoord al voorzegt.'],b:[
    tx('a','Vaag doel → zichtbaar gedrag'),tx('b','Drie vragen over impact'),tx('c','Drie vragen over de toekomst'),tx('d','Twee vragen over timing',2)]},
  {id:'7.3',p:'opdr',kind:'De opdracht',title:'“Waaraan zou je het merken?”',intro:'Stel die vraag in vijf gesprekken en noteer de exacte antwoorden.',b:[
    tb('t',[col('Met wie'),col('Het exacte antwoord')],5)]}
 ],
 9:[
  {id:'8.2',p:'oef',kind:'In duo · 20 min',title:'Drie minuten, dan negentig seconden',steps:['Presenteer een case in drie minuten, met maximaal drie onderdelen.','Eindig met een teach back van je partner.','Doe het opnieuw in 90 seconden. Niet sneller praten: minder zeggen.'],b:[
    tx('a','Mijn drie onderdelen'),tx('b','Wat de teach back liet horen'),tx('c','Wat ik schrapte in de korte versie')]},
  {id:'8.3',p:'opdr',kind:'De opdracht',title:'Schrap wat niet helpt',intro:'Neem één presentatie op. Markeer elke zin en test de korte versie in drie gesprekken.',b:[
    tb('t',[col('Zin of onderdeel'),col('Beoordeling','select',['Relevant','Nuttig, niet nodig','Zelfpromotie'])],12)]}
 ],
 10:[
  {id:'9.2',p:'oef',kind:'In trio · 20 min',title:'Vijf closes, vijf uitkomsten',intro:'De observator let op wat er ná de vraag gebeurt.',b:[
    tb('t',[col('Wat ik zei'),col('Wat er ná de vraag gebeurde')],0,['Een ja ontvangen','Een nee ontvangen','Later, met afspraak','Info vinden','Afsluiten zonder follow-up'])]},
  {id:'9.3',p:'opdr',kind:'De opdracht',title:'Elk gesprek eindigt met een beslissing',intro:'“Goed gesprek” is geen status. Noteer de exacte uitkomst.',b:[
    tb('t',[col('Met wie'),col('Uitkomst','select',['Ja','Later + datum','Nee','Info ontbreekt']),col('Datum of notitie')],12)]}
 ],
 11:[
  {id:'10.2',p:'oef',kind:'In trio · 20 min',title:'Rondes van drie minuten',steps:['Klant: geeft één bezwaar uit de lijst van vandaag.','Consultant: pas een oplossing na erkenning, uitgang en twee vragen.','Observator: scoort rust, relevantie, vrijheid en de hernieuwde vraag.'],b:[
    tx('a','Mijn erkenning',2),tx('b','Mijn uitgang',2),tx('c','Mijn twee vragen',2),tx('d','Score van de observator',2)]},
  {id:'10.3',p:'opdr',kind:'De opdracht',title:'Jouw bezwarenbibliotheek',intro:'Geen perfecte comeback. Begrijpen, niet verbaal winnen.',b:[
    tb('t',[col('Bezwaar'),col('Drie mogelijke redenen'),col('Twee vragen'),col('Korte respons')],10)]}
 ],
 12:[
  {id:'11.2',p:'oef',kind:'In duo · 20 min',title:'Vijf berichten herschrijven',intro:'Elk nieuw bericht: context, een duidelijk doel en een makkelijk antwoord.',b:[
    tb('t',[col('Zwak bericht'),col('Nieuw bericht')],5),tx('a','Mijn afsluitbericht, zonder passief-agressieve prik',3)]},
  {id:'11.3',p:'opdr',kind:'De opdracht',title:'Ruim je opvolglijst op',intro:'Geef elk contact een status en een volgende datum, of sluit het bewust af.',b:[
    tb('t',[col('Contact'),col('Status'),col('Volgende datum','date'),col('Bewust afgesloten','check')],16)]}
 ],
 13:[
  {id:'12.2',p:'oef',kind:'Afsluiten',title:'Drie vragen om af te sluiten',steps:['Begin klein.','Luister beter.','Vraag duidelijker. Doe het opnieuw.'],b:[
    tx('a','Wat doe ik nu bewust?'),tx('b','Waar verlies ik nog rust?'),tx('c','Welke vaardigheid kies ik voor de komende dertig dagen?')]},
  {id:'12.3',p:'opdr',kind:'Eindoefening',title:'Teken je klantreis',intro:'Sla je een fase over, dan duikt het probleem later op in vermomming.',b:[
    tb('t',[col('Doel'),col('Zichtbaar gedrag'),col('Eén cijfer')],0,['Aandacht','Kwalificatie','Discovery','Plan','Beslissing','Onboarding','Opvolging']),
    tx('l','Mijn grootste lek',2),tx('v','Mijn ene verbetering voor dertig dagen',2)]}
 ]
};
const BONUS = {
  oef:'Werk in trio. De klant vraagt: “Wat verdien je ermee?” en “Moet ik dan mijn vrienden lastigvallen?” De consultant gebruikt erkenning, uitgang en een vraag, en geeft dan een eerlijk antwoord zonder bedragen. De observator noteert letterlijke zinnen en let op claims en druk: wat klonk eerlijk, wat schuurde? Wissel na elke ronde van rol.',
  opdr:'Voer drie gesprekken over de business. Dat mogen ook mensen zijn die eerder interesse toonden. Noteer per gesprek: wat zoeken ze, hun woorden letterlijk, en de volgende stap die past. Het doel is luisteren, niet inschrijven.',
  fi:[
   {id:'B.2',p:'oef',kind:'In trio',title:'Wat klonk eerlijk, wat schuurde?',b:[tx('a','Zinnen die eerlijk klonken',3),tx('b','Zinnen met een claim of druk',3)]},
   {id:'B.3',p:'opdr',kind:'De opdracht',title:'Drie gesprekken over de business',b:[tb('t',[col('Wat ze zoeken'),col('Hun woorden, letterlijk'),col('Volgende stap')],3)]}
  ]
};

/* ---- server en opslag ---- */
let ME=null, OWN={}, VIEW=null; // ME: ingelogde gebruiker, OWN: eigen boek, VIEW: boek van een deelnemer (beheerder, alleen lezen)
const get=k=>(VIEW?VIEW.d:OWN)[k];
async function api(method,path,body,keepalive){
  const r=await fetch('/api'+path,{method,credentials:'same-origin',keepalive:!!keepalive,
    headers:{'Content-Type':'application/json','X-Requested-With':'run90'},body:body===undefined?undefined:JSON.stringify(body)});
  let data=null; try{data=await r.json()}catch(e){}
  if(!r.ok){
    const d=data&&data.detail;
    const err=new Error(typeof d==='string'?d:'Controleer je invoer en probeer het opnieuw.'); err.status=r.status; throw err;
  }
  return data;
}
let pend={set:{},unset:new Set()}, saveT=0, retryT=0, inflight=false, svT=0;
function status(t){const s=document.getElementById('sv'); if(!s) return; s.textContent=t; clearTimeout(svT); if(t==='Opgeslagen') svT=setTimeout(()=>{s.textContent=''},2500)}
function put(k,v){
  if(VIEW) return;
  if(v===''||v===false||v==null){delete OWN[k]; delete pend.set[k]; pend.unset.add(k)}
  else{OWN[k]=v; pend.unset.delete(k); pend.set[k]=v}
  status('Opslaan…'); clearTimeout(saveT); saveT=setTimeout(()=>flush(),700);
}
async function flush(keep){
  if(inflight||(!Object.keys(pend.set).length&&!pend.unset.size)) return;
  const body={set:pend.set,unset:[...pend.unset]}; pend={set:{},unset:new Set()}; inflight=true;
  try{await api('PATCH','/me/progress',body,keep); status('Opgeslagen')}
  catch(e){
    for(const k in body.set){if(!(k in pend.set)&&!pend.unset.has(k)) pend.set[k]=body.set[k]}
    for(const k of body.unset){if(!(k in pend.set)) pend.unset.add(k)}
    if(e.status===401){status('Je bent uitgelogd'); ME=null; chrome(); showLogin('Je sessie is verlopen. Log opnieuw in; je laatste wijzigingen worden dan alsnog bewaard.')}
    else{status('Opslaan mislukt, nieuwe poging…'); clearTimeout(retryT); retryT=setTimeout(()=>flush(),5000)}
  }finally{
    inflight=false;
    if(ME&&(Object.keys(pend.set).length||pend.unset.size)&&!retryT){clearTimeout(saveT); saveT=setTimeout(()=>flush(),700)}
    retryT=0;
  }
}

const h=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sid=k=>'f_'+k.replace(/[^\w]/g,'_');
const sentence=s=>s?s[0]+s.slice(1).toLowerCase():'';

/* ---- datum ---- */
const day0=d=>new Date(d.getFullYear(),d.getMonth(),d.getDate());
const addDays=(d,n)=>new Date(d.getFullYear(),d.getMonth(),d.getDate()+n);
const fmt=d=>d.getDate()+' '+MON[d.getMonth()];
const todayIdx=()=>Math.round((day0(new Date())-START)/864e5);
const weekRange=n=>fmt(addDays(START,(n-1)*7))+' – '+fmt(addDays(START,(n-1)*7+6));
function current(){const i=todayIdx(); if(i<0) return {i,w:1,d:0,state:'before'}; if(i>90) return {i,w:13,d:6,state:'after'}; return {i,w:Math.min(13,Math.floor(i/7)+1),d:Math.min(6,i%7),state:'run'}}

/* ---- metrics ---- */
const wd=n=>{let c=0;for(let i=0;i<7;i++) if(get(`w${n}|d${i}`)) c++;return c};
const totalDays=()=>HABIT.reduce((a,n)=>a+wd(n),0);
const weeksDone=()=>WEEKS.filter(w=>get(`w${w.n}|done`)).length;
const sumRow=(r,f)=>HABIT.reduce((a,n)=>a+(Number(get(`w${n}|t.${r}.${f}`))||0),0);
function streak(){const c=current(); if(c.i<0) return 0; const top=Math.min(c.i,90); let s=0;
  for(let k=top;k>=0;k--){const w=Math.floor(k/7)+1; if(w===8) continue; if(get(`w${w}|d${k%7}`)) s++; else if(k===top&&c.state==='run') continue; else break}
  return s}
const pct=()=>Math.round(totalDays()/84*100);

/* ---- velden ---- */
function text(key,label,rows){const id=sid(key);return `<div class="f"><label class="lb" for="${id}">${h(label)}</label><textarea id="${id}" data-k="${key}" rows="${rows||3}">${h(get(key)||'')}</textarea></div>`}
function cellInput(key,c,label){const id=sid(key),v=get(key);
  if(c.ty==='check') return `<label class="chk"><input type="checkbox" id="${id}" data-k="${key}" ${v?'checked':''} aria-label="${h(label)}"><span class="box">✓</span></label>`;
  if(c.ty==='num') return `<input type="number" inputmode="numeric" min="0" max="10" id="${id}" data-k="${key}" value="${h(v||'')}" aria-label="${h(label)}">`;
  if(c.ty==='date') return `<input type="date" id="${id}" data-k="${key}" value="${h(v||'')}" aria-label="${h(label)}">`;
  if(c.ty==='select') return `<select id="${id}" data-k="${key}" aria-label="${h(label)}"><option value="">Kies…</option>${c.o.map(o=>`<option ${v===o?'selected':''}>${h(o)}</option>`).join('')}</select>`;
  return `<textarea id="${id}" data-k="${key}" rows="1" aria-label="${h(label)}">${h(v||'')}</textarea>`}
function table(base,b){
  const grid=['2.4rem'].concat(b.cols.map(c=>c.ty==='check'?'5.5rem':c.ty==='num'?'5.2rem':c.ty==='select'?'minmax(0,9.5rem)':c.ty==='date'?'minmax(0,9rem)':'minmax(0,1fr)'));
  if(b.rows) grid[0]='minmax(0,8rem)';
  let o=`<div class="tbl" style="--cols:${grid.join(' ')}"><div class="tr th"><span>${b.rows?'':'#'}</span>${b.cols.map(c=>`<span>${h(c.h)}</span>`).join('')}</div>`;
  for(let r=0;r<b.n;r++){
    o+=`<div class="tr">${b.rows?`<span class="rl">${h(b.rows[r])}</span>`:`<span class="rn">${r+1}</span>`}`;
    b.cols.forEach((c,ci)=>{const key=`${base}.${r}.${ci}`;o+=`<div class="cell ${c.ty==='check'?'c':''}" data-l="${h(c.h)}">${cellInput(key,c,c.h+' '+(r+1))}</div>`});
    o+='</div>'}
  return o+'</div>'}
function block(sc,fid,b){
  const base=`${sc}|${fid}.${b.k}`;
  if(b.t==='text') return text(base,b.l,b.r);
  if(b.t==='num'){const id=sid(base);return `<div class="f"><label class="lb" for="${id}">${h(b.l)}</label><input type="number" inputmode="numeric" min="0" max="${b.max}" id="${id}" data-k="${base}" value="${h(get(base)||'')}" style="max-width:8rem"></div>`}
  if(b.t==='pick') return `<div class="f" role="radiogroup" aria-label="${h(b.l)}"><span class="lb">${h(b.l)}</span><div class="scale">${b.o.map(o=>`<label class="opt wide"><input type="radio" name="${sid(base)}" data-k="${base}" value="${h(o)}" ${get(base)===o?'checked':''}><span>${h(o)}</span></label>`).join('')}</div></div>`;
  if(b.t==='scale') return b.items.map((it,i)=>{const k=`${base}.${i}`;return `<div class="scalerow" role="radiogroup" aria-label="${h(it)}"><span>${h(it)}</span><div class="scale">${Array.from({length:b.max},(_,j)=>`<label class="opt"><input type="radio" name="${sid(k)}" data-k="${k}" value="${j+1}" ${String(get(k))===String(j+1)?'checked':''}><span>${j+1}</span></label>`).join('')}</div></div>`}).join('');
  if(b.t==='table') return table(base,b);
  return ''}
function fiche(sc,f){return `<section class="fiche" id="fiche-${f.id.replace('.','-')}"><div><div class="mono">Fiche ${f.id} · ${h(f.kind)}</div><h3>${h(f.title)}</h3></div>${f.intro?`<p class="muted" style="margin:0">${h(f.intro)}</p>`:''}${f.steps?`<ol class="steps">${f.steps.map(s=>`<li>${h(s)}</li>`).join('')}</ol>`:''}${f.b.map(b=>block(sc,f.id,b)).join('')}</section>`}

/* ---- weergaven ---- */
function ring(){
  const c=current(), n=c.state==='run'?Math.min(90,c.i+1):c.state==='after'?90:0;
  let t='';
  for(let i=0;i<90;i++){
    const a=(-90+i*4)*Math.PI/180, x1=110+84*Math.cos(a), y1=110+84*Math.sin(a), x2=110+104*Math.cos(a), y2=110+104*Math.sin(a);
    const w=Math.floor(i/7)+1, on=get(`w${w}|d${i%7}`);
    const cls=c.state==='run'&&i===c.i?'now':on?'done':i<n?'past':'';
    t+=`<line class="tk ${cls}" x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"/>`}
  return `<svg class="ringsvg" viewBox="0 0 220 220" role="img" aria-label="Negentig dagen, ${n} voorbij">${t}<text class="ringlab" x="110" y="84" text-anchor="middle">DAG</text><text class="ringnum" x="110" y="144" text-anchor="middle">${n||'–'}</text><text class="ringlab" x="110" y="166" text-anchor="middle">VAN 90</text></svg>`}

function vStart(){
  const c=current(), w=WEEKS[c.w-1], name=get('me|naam');
  let head, action='';
  if(c.state==='before'){const dd=-c.i; head=`<div class="mono">De run start op ${fmt(START)}</div><h1>Nog ${dd} ${dd===1?'dag':'dagen'}</h1>`}
  else if(c.state==='after'){head=`<div class="mono">Dag 90</div><h1>Dit heb jij gebouwd</h1>`}
  else head=`<div class="mono">${DOW[(c.i%7)]} ${fmt(addDays(START,c.i))} · week ${c.w} · ${h(w.ph)}</div><h1>${h(w.title)}</h1>`;
  if(c.state==='run'){
    if(c.w===8) action=`<a class="today" href="#week-8" style="text-decoration:none"><span class="box" style="border-color:var(--accent)"></span><span><b>Inhaalweek.</b><br><span class="muted">Haal in wat bleef liggen, of laad op voor de tweede helft.</span></span></a>`;
    else{const k=`w${c.w}|d${c.d}`; action=`<button class="today" id="todaybtn" data-day="${k}" aria-pressed="${get(k)?'true':'false'}"><span class="box">✓</span><span><b id="todaylab">${get(k)?'Vandaag gedaan':'Vandaag afvinken'}</b><br><span class="muted">${h(w.gew)}</span></span></button>`}}
  const first=!get('me|doel')?`<div class="card"><div class="mono">Eerste stap</div><p style="margin:6px 0 12px"><b>Schrijf je doel voor dag 90 op.</b> Het is het enige dat je nodig hebt om te starten.</p><a class="btn" href="#mijn-90">Mijn 90 dagen invullen</a></div>`:`<div class="card"><div class="mono">Mijn doel${name?' · '+h(name):''}</div><p style="margin:6px 0 0;font-size:1.1rem">${h(get('me|doel'))}</p></div>`;
  return `<div class="sec"><div class="hero">${ring()}<div class="sec">${head}${action}<div class="row"><a class="btn ghost" href="#week-${c.w}">Open week ${c.w}</a><a class="btn ghost" href="#reis">Hele reis</a></div></div></div>
  ${first}
  <div class="stats" id="stats"></div></div>`}
function statsHtml(){return `<div><span class="mono">Gewoonte-dagen</span><b>${totalDays()}<span class="muted" style="font-size:1rem"> / 84</span></b></div><div><span class="mono">Reeks</span><b>${streak()}</b></div><div><span class="mono">Weken afgerond</span><b>${weeksDone()}<span class="muted" style="font-size:1rem"> / 13</span></b></div>`}

function vReis(){
  const phases=[['Fundament','Jezelf: je houding, je rust en je respect voor de keuze van de ander.',[1,2,3,4]],['Zichtbaarheid','Gesprekken starten en echt begrijpen.',[5,6,7,8,9]],['Uitnodigen','Durven vragen, twijfel onderzoeken en opvolgen tot de lus gesloten is.',[10,11,12,13]]];
  return `<div class="sec"><div><div class="mono">13 weken · één route</div><h1>De reis</h1></div>`+phases.map(([p,d,ws])=>`<section class="phase"><div class="sechead"><h2>${p}</h2><span class="muted">${d}</span></div>${ws.map(n=>{const w=WEEKS[n-1],c=wd(n),r=n===8;
    return `<a class="wk ${r?'rest':''}" href="#week-${n}"><span class="n">${String(n).padStart(2,'0')}</span><span><span class="t">${h(w.title)}</span><br><span class="mono">${weekRange(n)}${get(`w${n}|done`)?' · afgerond':''}</span></span>${r?`<span class="pill">Kerst</span>`:`<span class="track" title="${c} van 7 dagen"><i style="width:${c/7*100}%"></i></span>`}</a>${EVALS[n]?`<a class="pill evmark ${get('ev'+EVALS[n].d+'|score')?'on':''}" href="#week-${n}-evaluatie" data-ev="1">Dag ${EVALS[n].d} · evaluatie</a>`:''}`}).join('')}</section>`).join('')+
  `<section class="phase"><div class="sechead"><h2>Bonus</h2><span class="muted">Wanneer nodig</span></div><a class="wk" href="#bonus"><span class="n">+</span><span><span class="t">Het brand partner-gesprek</span><br><span class="mono">Business</span></span><span></span></a></section></div>`}

function trackerHtml(n,w){
  const c=current(), ti=(c.state==='run'&&c.w===n)?c.d:-1;
  const rows=[['gesprekken','Echte gesprekken gestart'],['opvolgingen','Opvolgingen'],['posts','Stories of posts met een vraag'],['sessie','Sessie of check-in bijgewoond']];
  return `<div class="sec"><div class="days" role="group" aria-label="Dagen van week ${n}">${DOW.map((d,i)=>{const k=`w${n}|d${i}`;return `<button class="day ${i===ti?'now':''}" data-day="${k}" aria-pressed="${get(k)?'true':'false'}" aria-label="${d} ${fmt(addDays(START,(n-1)*7+i))}"><span>${d.toUpperCase()}</span><small>${addDays(START,(n-1)*7+i).getDate()}</small></button>`}).join('')}</div>
  <div class="counters"><div class="cr h"><span>Wat ik tel</span><span>Doel</span><span>Gedaan</span></div>${rows.map(([r,l])=>`<div class="cr"><span>${l}</span><input type="number" min="0" inputmode="numeric" data-k="w${n}|t.${r}.doel" id="${sid(`w${n}|t.${r}.doel`)}" aria-label="Doel: ${l}" value="${h(get(`w${n}|t.${r}.doel`)||'')}"><input type="number" min="0" inputmode="numeric" data-k="w${n}|t.${r}.gedaan" id="${sid(`w${n}|t.${r}.gedaan`)}" aria-label="Gedaan: ${l}" value="${h(get(`w${n}|t.${r}.gedaan`)||'')}"></div>`).join('')}</div>
  <div class="cols2">${text(`w${n}|werkte`,'Vrijdag · wat werkte?',3)}${text(`w${n}|niet`,'Vrijdag · wat niet?',3)}</div>${text(`w${n}|win`,'Mijn win van deze week',2)}</div>`}

function evalHtml(n){const e=EVALS[n],k=`ev${e.d}`;
  return `<section class="sec" id="evaluatie"><div class="sechead"><h2>Dag ${e.d} · waar sta je?</h2></div>
  <div class="f" role="radiogroup" aria-label="Hoe dicht ben ik bij mijn doel?"><span class="lb">Hoe dicht ben ik bij mijn doel?</span><div class="scale">${Array.from({length:10},(_,j)=>`<label class="opt"><input type="radio" name="${k}_score" data-k="${k}|score" value="${j+1}" ${String(get(k+'|score'))===String(j+1)?'checked':''}><span>${j+1}</span></label>`).join('')}</div></div>
  <div class="f"><span class="lb">Weken waarin ik het ritme volhield</span><div class="scale">${e.weeks.map(x=>`<label class="opt"><input type="checkbox" data-k="${k}|wk${x}" ${get(`${k}|wk${x}`)?'checked':''}><span>W${x}</span></label>`).join('')}</div></div>
  ${text(k+'|beter','Wat ging beter dan verwacht?')}${text(k+'|vast','Waar liep ik vast?')}${text(k+'|next',e.next)}
  <p class="muted">Bespreek deze pagina met je buddy vóór de live sessie.</p>
  ${n===13?`<div class="card"><div class="mono">Dag 90</div><h2 style="margin:6px 0 10px">Dit heb jij gebouwd.</h2><p style="margin:0">Begin klein. Luister beter. Vraag duidelijker. Doe het opnieuw.</p></div>`:''}</section>`}

function vWeek(n){
  const w=WEEKS[n-1], m=C&&C[w.mod], full=get('me|mode')!=='light', sc='w'+n;
  const pager=`<div class="pager">${n>1?`<a class="btn ghost" href="#week-${n-1}">← Week ${n-1}</a>`:'<span></span>'}${n<13?`<a class="btn ghost" href="#week-${n+1}">Week ${n+1} →</a>`:`<a class="btn ghost" href="#voortgang">Naar je voortgang →</a>`}</div>`;
  if(n===8){
    return `<article class="sec" style="gap:40px"><header class="wkhead"><div class="row"><span class="pill on">${h(w.ph)}</span><span class="pill">Week 8 · ${weekRange(8)}</span></div><h1>Inhaalweek. Of rust.</h1><p class="muted" style="font-size:1.1rem">${h(w.sub)}</p></header>
    <section class="sec"><div class="f"><span class="lb">Wat haal ik in?</span><div class="scale">${[1,2,3,4,5,6,7].map(x=>`<label class="opt"><input type="checkbox" data-k="w8|in${x}" ${get('w8|in'+x)?'checked':''}><span>W${x}</span></label>`).join('')}</div></div>${text('w8|a','Wat wil ik inhalen?')}${text('w8|b','Hoe laad ik op?')}${text('w8|c','Mijn intentie voor de tweede helft')}
    <label class="today" style="cursor:pointer"><span class="chk"><input type="checkbox" data-k="w8|done" ${get('w8|done')?'checked':''}><span class="box">✓</span></span><b>Inhaalweek afgerond</b></label></section>${pager}</article>`}
  const fi=FI[n]||[], oef=fi.filter(f=>f.p==='oef'), opdr=fi.filter(f=>f.p==='opdr');
  const slides=CANVA.deck[w.mod];
  let o=`<article class="sec" style="gap:40px">`;
  o+=`<header class="wkhead"><div class="row"><span class="pill on">${h(w.ph)}</span><span class="pill">Week ${n} · ${weekRange(n)}</span><span class="pill">Training ${String(w.mod).padStart(2,'0')}</span></div><h1>${h(w.title)}.</h1><p class="muted" style="font-size:1.1rem">${h(w.sub)}</p></header>`;
  o+=`<section class="sec"><div class="sechead"><h2>De training</h2><span class="mono">Maandag · live</span></div>${m?`<p style="font-size:1.12rem"><b>${h(m.thesis)}</b></p>`:''}
   <div class="row"><a class="btn" href="${slides}" target="_blank" rel="noopener">Open de presentatie</a><a class="btn ghost" href="${CANVA.boek}" target="_blank" rel="noopener">Cursusboek · hoofdstuk ${w.mod}</a></div>
   ${m?`<div class="cols2"><div><div class="mono" style="margin-bottom:8px">Na deze training kun je</div><ul class="list">${m.goals.map(g=>`<li>${h(g.replace(/;$|\.$/,''))}</li>`).join('')}</ul></div><div><div class="mono" style="margin-bottom:8px">Kernpunten</div><ul class="list">${m.kern.map(g=>`<li>${h(g)}</li>`).join('')}</ul></div></div>
   ${m.beeld?`<div class="card"><div class="mono">Het beeld van deze week</div><p style="margin:4px 0 0;font-size:1.15rem"><b>${h(sentence(m.beeld))}</b></p></div>`:''}`:''}
   <label class="today" style="cursor:pointer"><span class="chk"><input type="checkbox" data-k="${sc}|read" ${get(sc+'|read')?'checked':''}><span class="box">✓</span></span><span><b>Training gevolgd en hoofdstuk gelezen</b></span></label></section>`;
  o+=`<section class="sec"><div class="sechead"><h2>Oefening in de ruimte</h2></div>${m?`<p>${h(m.oef)}</p>`:''}${oef.map(f=>fiche(sc,f)).join('')}</section>`;
  o+=`<section class="sec"><div class="sechead"><h2>De weekopdracht</h2>${full?'':'<span class="pill">Light · optioneel</span>'}</div><details ${full?'open':''}><summary>${full?'Weekopdracht en fiche':'Toon de weekopdracht'}</summary><div class="sec" style="margin-top:10px">${m?`<p>${h(m.opdr)}</p>`:''}${opdr.map(f=>fiche(sc,f)).join('')}</div></details></section>`;
  o+=`<section class="sec"><div class="sechead"><h2>De gewoonte</h2><span class="mono" id="wkcount"></span></div><p class="q">${h(w.gew)}</p><div class="track" style="max-width:320px"><i id="wkbar"></i></div>${trackerHtml(n,w)}</section>`;
  o+=`<section class="sec"><div class="sechead"><h2>Zondag · terugblik</h2></div><p class="q">${h(w.tq)}</p>${text(sc+'|tq','Mijn antwoord',2)}${m?m.refl.map((q,i)=>text(`${sc}|r${i}`,q,2)).join(''):''}
   <label class="today" style="cursor:pointer"><span class="chk"><input type="checkbox" data-k="${sc}|done" ${get(sc+'|done')?'checked':''}><span class="box">✓</span></span><span><b>Scorebord ingevuld · week afgerond</b></span></label></section>`;
  if(EVALS[n]) o+=evalHtml(n);
  return o+pager+`</article>`}

function vBonus(){return `<article class="sec" style="gap:40px"><header class="wkhead"><div class="row"><span class="pill on">Business</span><span class="pill">Wanneer nodig</span></div><h1>Het brand partner-gesprek.</h1></header>
  <section class="sec"><div class="row"><a class="btn" href="${CANVA.deck.bonus}" target="_blank" rel="noopener">Open de presentatie</a></div></section>
  <section class="sec"><div class="sechead"><h2>Oefening in de ruimte</h2></div><p>${h(BONUS.oef)}</p>${fiche('bonus',BONUS.fi[0])}</section>
  <section class="sec"><div class="sechead"><h2>Opdracht</h2></div><p>${h(BONUS.opdr)}</p>${fiche('bonus',BONUS.fi[1])}</section></article>`}

function vMijn(){const mode=get('me|mode')||'full';
  return `<div class="sec" style="gap:28px"><div><div class="mono">Sales Foundations 90 · my vision</div><h1>Mijn 90 dagen</h1></div>
  <div class="f"><label class="lb" for="f_me_naam">Dit boek is van</label><input type="text" id="f_me_naam" data-k="me|naam" value="${h(get('me|naam')||'')}" autocomplete="name"></div>
  ${text('me|doel','Mijn doel: wat wil jij anders zien op dag 90?',3)}${text('me|waarom','Waarom dit belangrijk is voor mij',3)}
  <div class="f" role="radiogroup" aria-label="Ik kies"><span class="lb">Ik kies</span><div class="cols2">
   <label class="card" style="cursor:pointer;display:flex;gap:12px"><input type="radio" name="mode" data-k="me|mode" value="light" ${mode==='light'?'checked':''}><span><b>Light</b><br><span class="muted">Sessies, dagelijkse gewoonte, wekelijkse reflectie.</span></span></label>
   <label class="card" style="cursor:pointer;display:flex;gap:12px"><input type="radio" name="mode" data-k="me|mode" value="full" ${mode==='full'?'checked':''}><span><b>Full</b><br><span class="muted">Alles van Light plus de weekopdrachten en het scorebord.</span></span></label></div></div>
  <div class="f"><label class="lb" for="f_me_buddy">Mijn buddy</label><input type="text" id="f_me_buddy" data-k="me|buddy" value="${h(get('me|buddy')||'')}"></div>
  <div class="cols2"><div class="f"><label class="lb" for="f_me_sign">Handtekening</label><input type="text" id="f_me_sign" data-k="me|sign" value="${h(get('me|sign')||'')}" placeholder="Typ je naam"></div><div class="f"><label class="lb" for="f_me_dat">Datum</label><input type="date" id="f_me_dat" data-k="me|dat" value="${h(get('me|dat')||'')}"></div></div></div>`}

function chart(){
  const bw=34,gap=14,x0=34,H=150,top=16;let svg='';
  svg+=`<line class="axis" x1="${x0-6}" y1="${top+H}" x2="${x0+13*(bw+gap)}" y2="${top+H}"/><line class="axis" x1="${x0-6}" y1="${top}" x2="${x0+13*(bw+gap)}" y2="${top}"/><text class="ct" x="${x0-10}" y="${top+4}" text-anchor="end">7</text><text class="ct" x="${x0-10}" y="${top+H+4}" text-anchor="end">0</text>`;
  WEEKS.forEach((w,i)=>{const x=x0+i*(bw+gap)+gap/2;
    if(w.n===8){svg+=`<rect class="barbg" x="${x}" y="${top}" width="${bw}" height="${H}"/><text class="ct" x="${x+bw/2}" y="${top+H/2}" text-anchor="middle">rust</text>`}
    else{const c=wd(w.n),bh=c/7*H;svg+=`<rect class="barbg" x="${x}" y="${top}" width="${bw}" height="${H}"/><rect class="bar1" x="${x}" y="${top+H-bh}" width="${bw}" height="${bh}"/>${c?`<text class="ct" x="${x+bw/2}" y="${top+H-bh-4}" text-anchor="middle">${c}</text>`:''}`}
    svg+=`<text class="ct" x="${x+bw/2}" y="${top+H+16}" text-anchor="middle">W${w.n}</text>`});
  return `<div class="chartwrap"><svg class="chart" viewBox="0 0 ${x0+13*(bw+gap)+10} ${top+H+26}" role="img" aria-label="Aantal afgevinkte dagen per week, maximaal zeven">${svg}</svg></div>`}
function vVoortgang(){
  const ev=[30,60,90].map(d=>({d,s:get(`ev${d}|score`)}));
  return `<div class="sec" style="gap:32px"><div><div class="mono">Scorebord</div><h1>Voortgang</h1></div>
  <div class="stats">${statsHtml()}<div><span class="mono">Totaal</span><b>${pct()}%</b></div></div>
  <section class="sec"><div class="sechead"><h2>Dagen per week</h2><span class="muted">Afgevinkte gewoonte-dagen, maximaal 7.</span></div>${chart()}</section>
  <section class="sec"><div class="sechead"><h2>Wat ik telde</h2><span class="muted">We tellen wat je doet, niet wat je verkoopt.</span></div><div class="sums">${[['gesprekken','Gesprekken'],['opvolgingen','Opvolgingen'],['posts','Stories of posts'],['sessie','Sessies']].map(([r,l])=>`<div><span class="mono">${l}</span><span class="big">${sumRow(r,'gedaan')}<span class="muted" style="font-size:1rem"> / ${sumRow(r,'doel')||'–'}</span></span></div>`).join('')}</div></section>
  <section class="sec"><div class="sechead"><h2>Meetmomenten</h2></div><div class="sums">${ev.map(e=>`<a href="#week-${e.d===30?4:e.d===60?10:13}-evaluatie" style="text-decoration:none"><div><span class="mono">Dag ${e.d}</span><span class="big">${e.s||'–'}<span class="muted" style="font-size:1rem"> / 10</span></span></div></a>`).join('')}</div></section>
  ${accountHtml()}</div>`}

function vMateriaal(){
  return `<div class="sec" style="gap:32px"><div><div class="mono">Alles bij elkaar</div><h1>Materiaal</h1></div>
  <section class="sec"><div class="sechead"><h2>Boeken</h2></div><div class="mat"><a href="${CANVA.boek}" target="_blank" rel="noopener">Cursusboek · de theorie</a><a href="${CANVA.werkboek}" target="_blank" rel="noopener">Werkboek · papieren versie</a></div></section>
  <section class="sec"><div class="sechead"><h2>Presentaties</h2></div><div class="mat">${WEEKS.filter(w=>w.mod).map(w=>`<a href="${CANVA.deck[w.mod]}" target="_blank" rel="noopener">${String(w.mod).padStart(2,'0')} · ${h(w.title)}</a>`).join('')}<a href="${CANVA.deck.bonus}" target="_blank" rel="noopener">Bonus · het brand partner-gesprek</a></div></section>
  <section class="sec"><div class="sechead"><h2>Het ritme</h2></div><div class="rules">${[['Maandag','Weekfocus in de groep. Lees je opdracht.'],['Woensdag','Check-in: waar loop je vast?'],['Vrijdag','Deel je wins. Ook kleine.'],['Zondag','Vul je scorebord in.']].map(([d,t])=>`<div><b>${d}</b> · ${t}</div>`).join('')}</div>
   <p class="muted">Elke week heeft drie onderdelen: de training, de weekopdracht en de gewoonte, één kleine actie per dag.</p></section>
  <section class="sec"><div class="sechead"><h2>Drie spelregels</h2></div><div class="rules">
   <div><b>Geen gezondheidsclaims.</b> Essentiële oliën genezen, behandelen of voorkomen geen ziekten en vervangen geen medische zorg. Spreek vanuit eigen ervaring en de officiële productinformatie, en verwijs bij medische vragen naar een arts.</div>
   <div><b>Geen inkomensclaims.</b> Niet in de groep, niet in je posts, niet in je gesprekken. Geen bedragen, geen beloftes over verdiensten.</div>
   <div><b>Wie een week mist, valt niet uit.</b> Je pakt het gewoon terug op. Daarvoor bestaat de inhaalweek.</div></div></section></div>`}

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
  return `<div class="sec" style="gap:28px"><div><div class="mono">Alleen voor de beheerder</div><h1>Deelnemers</h1></div>
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
  mainEl().innerHTML=`<div class="auth"><div><div class="mono">Sales Foundations 90</div><h1>90 Day Run</h1></div>
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
  mainEl().innerHTML=`<div class="auth"><div><div class="mono">Welkom bij de 90 Day Run</div><h1>Hallo ${h(info.name)}</h1></div>
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

/* ---- start ---- */
(async function boot(){
  try{ME=await api('GET','/auth/me')}catch(e){ME=null}
  if(ME){try{await loadOwn()}catch(e){}}
  route();
})();
