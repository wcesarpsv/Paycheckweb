'use client';
import {useEffect,useState} from 'react';
import {createClient} from '@supabase/supabase-js';
const sb=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
const style={padding:11,border:'1px solid #cbd5e1',borderRadius:9,width:'100%',boxSizing:'border-box'};
const button={background:'#2563eb',color:'white',border:0,borderRadius:9,padding:'12px 16px',fontWeight:700,cursor:'pointer'};
async function api(action,payload){
 const {data}=await sb.auth.getSession();if(!data.session)throw Error('Entre novamente no sistema.');
 const response=await fetch('/api/workflow'+(payload===undefined?'?action='+action:''),{method:payload===undefined?'GET':'POST',headers:{Authorization:'Bearer '+data.session.access_token,...(payload===undefined?{}:{'Content-Type':'application/json'})},body:payload===undefined?undefined:JSON.stringify({action,payload}),cache:'no-store'});
 const json=await response.json();if(!response.ok)throw Error(json.error||'Erro');return json;
}
export default function WorkManager({kind,admin}){
 const [sites,setSites]=useState([]),[entries,setEntries]=useState([]),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[form,setForm]=useState({name:'',address:'',latitude:'',longitude:'',radius_m:100,active:true}),[editing,setEditing]=useState(null),[adjust,setAdjust]=useState(null),[hours,setHours]=useState(''),[reason,setReason]=useState('');
 async function reload(){try{const [s,e]=await Promise.all([api('sites'),api('entries')]);setSites(s.sites||[]);setEntries(e.entries||[])}catch(e){setMessage(e.message)}}
 useEffect(()=>{reload()},[]);
 async function save(e){e.preventDefault();setBusy(true);try{await api('site_save',{...form,id:editing,latitude:Number(form.latitude),longitude:Number(form.longitude),radius_m:Number(form.radius_m)});setForm({name:'',address:'',latitude:'',longitude:'',radius_m:100,active:true});setEditing(null);setMessage('Obra salva.');await reload()}catch(e){setMessage(e.message)}finally{setBusy(false)}}
 async function arrival(){
  if(!navigator.geolocation){setMessage('Seu navegador não oferece localização GPS.');return;}
  setBusy(true);setMessage('Obtendo localização atual...');
  navigator.geolocation.getCurrentPosition(async position=>{
   try{const c=position.coords;const r=await api('arrive',{latitude:c.latitude,longitude:c.longitude,accuracy:c.accuracy});setMessage('Chegada registrada! Distância da obra: '+r.distance_m+' m.');await reload()}catch(e){setMessage(e.message)}finally{setBusy(false)}
  },error=>{setMessage('Localização não disponível: '+error.message);setBusy(false)},{enableHighAccuracy:true,timeout:20000,maximumAge:0});
 }
 async function checkout(){setBusy(true);try{const r=await api('checkout',{});setMessage('Saída registrada. '+r.hours+' horas.');await reload()}catch(e){setMessage(e.message)}finally{setBusy(false)}}
 async function correction(e){e.preventDefault();setBusy(true);try{await api('adjust',{id:adjust.id,hours_worked:Number(hours),reason});setAdjust(null);setReason('');setMessage('Horas corrigidas com auditoria.');await reload()}catch(e){setMessage(e.message)}finally{setBusy(false)}}
 const open=entries.find(e=>e.status==='OPEN');
 return <div style={{display:'grid',gap:18}}>
 {kind==='sites'?<>
  <form onSubmit={save} style={{background:'white',borderRadius:15,padding:20,display:'grid',gap:12}}>
   <h2>{editing?'Editar obra':'Cadastrar obra'}</h2>
   <label>Nome da obra<input style={style} required value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label>
   <label>Endereço completo<input style={style} required value={form.address} onChange={e=>setForm({...form,address:e.target.value})}/></label>
   <p style={{fontSize:13,color:'#64748b',margin:0}}>Informe as coordenadas exatas do imóvel. O endereço sozinho não é suficiente para validar GPS.</p>
   <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:10}}>
    <label>Latitude<input style={style} type="number" step="any" required value={form.latitude} onChange={e=>setForm({...form,latitude:e.target.value})}/></label>
    <label>Longitude<input style={style} type="number" step="any" required value={form.longitude} onChange={e=>setForm({...form,longitude:e.target.value})}/></label>
    <label>Raio GPS (metros)<input style={style} type="number" min="25" max="1000" required value={form.radius_m} onChange={e=>setForm({...form,radius_m:e.target.value})}/></label>
   </div>
   {editing&&<label><input type="checkbox" checked={form.active} onChange={e=>setForm({...form,active:e.target.checked})}/> Obra ativa</label>}
   <div><button disabled={busy} style={button}>Salvar obra</button></div>
  </form>
  <div style={{display:'grid',gap:10}}>{sites.map(s=><div key={s.id} style={{background:'white',borderRadius:12,padding:15}}><strong>{s.name}</strong><p>{s.address} · Raio {s.radius_m}m · {s.active?'Ativa':'Inativa'}</p><button style={button} onClick={()=>{setEditing(s.id);setForm(s)}}>Editar</button></div>)}</div>
 </>:<>
  <div style={{background:'white',borderRadius:15,padding:20,display:'grid',gap:14}}>
   <h2 style={{margin:0}}>Minha presença na obra</h2>
   {open?<><p>Trabalho iniciado: {new Date(open.check_in).toLocaleString('pt-BR')} · {open.site_name||'Obra'}</p><button disabled={busy} onClick={checkout} style={{...button,background:'#dc2626'}}>FINISH WORK / CHECK-OUT</button></>:<><p>Ao chegar à obra, toque em ARRIVED. O GPS identificará automaticamente uma obra ativa.</p><button disabled={busy} onClick={arrival} style={{...button,background:'#16a34a',fontSize:18}}>📍 ARRIVED / CHECK-IN</button></>}
   <small>O GPS é solicitado apenas no check-in. Exige HTTPS e permissão de localização. Precisão máxima aceita: 100 m.</small>
  </div>
  <div style={{background:'white',borderRadius:15,padding:20,overflowX:'auto'}}>
   <h2>Registros de ponto {admin?'da equipe':'recentes'}</h2>
   <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}><thead><tr>{['Funcionário','Obra','Data','Entrada','Saída','Horas','Status',...(admin?['Correção']:[])].map(x=><th key={x} style={{textAlign:'left',padding:9,borderBottom:'1px solid #ddd'}}>{x}</th>)}</tr></thead><tbody>{entries.map(e=><tr key={e.id}>{[e.employee_name,e.site_name||'—',e.work_date,new Date(e.check_in).toLocaleTimeString('pt-BR'),e.check_out?new Date(e.check_out).toLocaleTimeString('pt-BR'):'—',e.hours_worked,e.status].map((v,i)=><td key={i} style={{padding:9,borderBottom:'1px solid #eee'}}>{v}</td>)}{admin&&<td><button disabled={e.status!=='CLOSED'} onClick={()=>{setAdjust(e);setHours(String(e.hours_worked||0))}} style={{...button,padding:7}}>Ajustar</button></td>}</tr>)}</tbody></table>
  </div>
  {admin&&adjust&&<form onSubmit={correction} style={{background:'white',borderRadius:15,padding:20,display:'grid',gap:12}}><h3>Corrigir horas — {adjust.employee_name} ({adjust.work_date})</h3><label>Horas reconhecidas<input type="number" step="0.01" min="0" max="24" required style={style} value={hours} onChange={e=>setHours(e.target.value)}/></label><label>Motivo da correção<textarea required minLength={5} style={style} value={reason} onChange={e=>setReason(e.target.value)}/></label><div><button disabled={busy} style={button}>Salvar correção</button> <button type="button" onClick={()=>setAdjust(null)}>Cancelar</button></div></form>}
 </>}
 {message&&<p role="status" style={{padding:14,background:'#eff6ff',borderRadius:10}}>{message}</p>}
 </div>;
}
