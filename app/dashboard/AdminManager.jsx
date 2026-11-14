'use client';
import {useEffect,useState} from 'react';
import {createClient} from '@supabase/supabase-js';
const supabase=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
const money=v=>new Intl.NumberFormat('en-CA',{style:'currency',currency:'CAD'}).format(Number(v)||0);
const field={width:'100%',boxSizing:'border-box',border:'1px solid #cbd5e1',borderRadius:9,padding:'11px 12px',fontSize:15,background:'white'};
const btn={border:0,borderRadius:9,padding:'11px 16px',background:'#2563eb',color:'white',cursor:'pointer',fontWeight:700};
export default function AdminManager({kind}){
 const [data,setData]=useState({roles:[],employees:[]}),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[editing,setEditing]=useState(null);
 const [form,setForm]=useState({name:'',email:'',password:'',role_id:'',is_admin:false,hourly_rate:25,active:true});
 async function api(action,payload){
  const {data:session}=await supabase.auth.getSession();if(!session.session)throw new Error('Sessão expirada. Entre novamente.');
  const r=await fetch('/api/admin',{method:action?'POST':'GET',headers:{Authorization:'Bearer '+session.session.access_token,...(action?{'Content-Type':'application/json'}:{})},body:action?JSON.stringify({action,payload}):undefined,cache:'no-store'});
  const j=await r.json();if(!r.ok)throw new Error(j.error||'Erro ao carregar');return j;
 }
 async function refresh(){setLoading(true);try{setData(await api());setMessage('')}catch(e){setMessage(e.message)}finally{setLoading(false)}}
 useEffect(()=>{refresh()},[]);
 const roles=data.roles||[],employees=data.employees||[],roleMode=kind==='roles';
 function startEdit(item){setEditing(item.id);setForm({...item,password:''});setMessage('')}
 function reset(){setEditing(null);setForm({name:'',email:'',password:'',role_id:'',is_admin:false,hourly_rate:25,active:true});}
 async function submit(e){
  e.preventDefault();setBusy(true);setMessage('');
  try{
   const action=roleMode?(editing?'role_update':'role_create'):(editing?'employee_update':'employee_create');
   await api(action,{...form,id:editing||undefined,role_id:Number(form.role_id),hourly_rate:Number(form.hourly_rate)});
   reset();await refresh();setMessage('Alterações salvas com sucesso.');
  }catch(e){setMessage(e.message)}finally{setBusy(false)}
 }
 return <div style={{display:'grid',gap:20}}>
  <form onSubmit={submit} style={{background:'white',border:'1px solid #e2e8f0',borderRadius:16,padding:22,display:'grid',gap:14}}>
   <h2 style={{margin:0,fontSize:20}}>{editing?'Editar':'Cadastrar'} {roleMode?'classificação':'funcionário'}</h2>
   <label>Nome<input required minLength={2} style={field} value={form.name} onChange={e=>setForm({...form,name:e.target.value})} disabled={!!editing&&!roleMode}/></label>
   {roleMode?<label>Valor por hora (CAD)<input required type="number" min="0" max="10000" step="0.01" style={field} value={form.hourly_rate} onChange={e=>setForm({...form,hourly_rate:e.target.value})}/></label>:<>
    <label>Email/login<input required type="email" style={field} disabled={!!editing} value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label>
    {!editing&&<label>Senha inicial (mínimo 8 caracteres)<input required minLength={8} type="password" autoComplete="new-password" style={field} value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/></label>}
    <label>Classificação<select required style={field} value={form.role_id||''} onChange={e=>setForm({...form,role_id:e.target.value})}><option value="">Selecione</option>{roles.filter(r=>r.active||r.id===Number(form.role_id)).map(r=><option key={r.id} value={r.id}>{r.name} — {money(r.hourly_rate)}/h</option>)}</select></label>
    <label style={{display:'flex',gap:8,alignItems:'center'}}><input type="checkbox" checked={!!form.is_admin} onChange={e=>setForm({...form,is_admin:e.target.checked})}/> Administrador</label>
   </>}
   {editing&&<label style={{display:'flex',gap:8,alignItems:'center'}}><input type="checkbox" checked={!!form.active} onChange={e=>setForm({...form,active:e.target.checked})}/> Ativo</label>}
   <div style={{display:'flex',gap:10,flexWrap:'wrap'}}><button style={btn} disabled={busy||loading}>{busy?'Salvando...':editing?'Salvar alterações':'Cadastrar'}</button>{editing&&<button type="button" onClick={reset} style={{...btn,background:'#64748b'}}>Cancelar</button>}</div>
  </form>
  {message&&<p role="status" style={{background:'#eff6ff',borderRadius:10,padding:14,margin:0}}>{message}</p>}
  <section style={{background:'white',border:'1px solid #e2e8f0',borderRadius:16,padding:20,overflowX:'auto'}}>
   <h2 style={{fontSize:20,margin:'0 0 15px'}}>{roleMode?'Classificações cadastradas':'Funcionários cadastrados'}</h2>
   {loading?<p>Carregando...</p>:<table style={{width:'100%',borderCollapse:'collapse',fontSize:14,textAlign:'left'}}><thead><tr>{(roleMode?['Nome','Valor/hora','Status','Ação']:['Nome','Email','Classificação','Valor/hora','Perfil','Status','Ação']).map(t=><th key={t} style={{padding:10,borderBottom:'1px solid #e2e8f0',whiteSpace:'nowrap'}}>{t}</th>)}</tr></thead><tbody>{(roleMode?roles:employees).map(item=><tr key={item.id}>{(roleMode?[item.name,money(item.hourly_rate),item.active?'Ativo':'Inativo']:[item.name,item.email,item.role_name||'Sem classificação',money(item.hourly_rate),item.is_admin?'Admin':'Funcionário',item.active?'Ativo':'Inativo']).map((value,i)=><td key={i} style={{padding:10,borderBottom:'1px solid #f1f5f9',whiteSpace:'nowrap'}}>{value}</td>)}<td style={{padding:10,borderBottom:'1px solid #f1f5f9'}}><button type="button" onClick={()=>startEdit(item)} style={{...btn,padding:'7px 11px'}}>Editar</button></td></tr>)}</tbody></table>}
   {!loading&&!(roleMode?roles:employees).length&&<p>Nenhum registro encontrado.</p>}
  </section>
  {!roleMode&&<p style={{fontSize:13,color:'#64748b'}}>Contas novas são criadas no Supabase Auth. A confirmação do email pode ser necessária antes do primeiro acesso. Senhas existentes não são exibidas nem armazenadas nesta interface.</p>}
 </div>
}
