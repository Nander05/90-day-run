/* ---- server en opslag ---- */
let ME=null, OWN={}, VIEW=null, ACCESS={unlock_to:null}, SESS=[]; // ME: ingelogde gebruiker, OWN: eigen boek, VIEW: boek van een deelnemer (beheerder, alleen lezen)
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
