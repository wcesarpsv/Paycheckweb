'use client';
import {useEffect,useState} from 'react';
import {createClient} from '@supabase/supabase-js';

const sb=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
const cad=value=>new Intl.NumberFormat('en-CA',{style:'currency',currency:'CAD'}).format(Number(value)||0);
const tile={background:'#fff',border:'1px solid #e2e8f0',borderRadius:16,padding:20};
async function load(action,admin=false){
 const {data}=await sb.auth.getSession();
 if(!data.session)throw new Error('Sessão expirada. Entre novamente.');
 const response=await fetch(admin?'/api/admin':'/api/workflow?action='+action,{headers:{Authorization:'Bearer '+data.session.access_token},cache:'no-store'});
 const result=await response.json();
 if(!response.ok)throw new Error(result.error||'Falha ao carregar dados.');
 return result;
}
export default function AdminOverview({onNavigate}){
 const [state,setState]=useState({loading:true,error:'',employees:[],entries:[],payroll:[]});
 async function refresh(){
  setState(s=>({...s,loading:true,error:''}));
  try{
   const [admin,entries,payroll]=await Promise.all([load('',true),load('entries'),load('payroll')]);
   setState({loading:false,error:'',employees:admin.employees||[],entries:entries.entries||[],payroll:payroll.rows||[]});
  }catch(e){setState(s=>({...s,loading:false,error:e.message}));}
 }
 useEffect(()=>{refresh()},[]);
 const active=state.employees.filter(e=>e.active).length;
 const open=state.entries.filter(e=>e.status==='OPEN').length;
 const closed=state.entries.filter(e=>e.status==='CLOSED');
 const hours=closed.reduce((sum,e)=>sum+(Number(e.hours_worked)||0),0);
 const total=state.payroll.reduce((sum,e)=>sum+(Number(e.total)||0),0);
 const metrics=[['Funcionários ativos',active],['Pontos abertos',open],['Horas fechadas (acumuladas)',hours.toLocaleString('pt-BR',{maximumFractionDigits:2})+' h'],['Folha estimada (acumulada)',cad(total)]];
 return <div style={{display:'grid',gap:18}}>
  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}>
   <h2 style={{margin:0}}>Resumo administrativo</h2><button onClick={refresh} disabled={state.loading} style={{padding:'10px 15px',border:'1px solid #cbd5e1',background:'white',borderRadius:9,cursor:'pointer'}}>Atualizar dados</button>
  </div>
  {state.loading?<p role="status">Carregando indicadores reais...</p>:state.error?<p role="alert" style={{color:'#b91c1c'}}>Não foi possível atualizar os indicadores: {state.error}</p>:<>
   <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))',gap:14}}>
    {metrics.map(([label,value])=><div key={label} style={tile}><div style={{fontSize:13,color:'#64748b'}}>{label}</div><strong style={{display:'block',fontSize:26,marginTop:9}}>{value}</strong></div>)}
   </div>
   <p style={{fontSize:13,color:'#92400e',margin:0}}>Horas e pagamentos são acumulados de todos os períodos disponíveis, não apenas desta semana. Os valores são estimativas para conferência, não uma folha aprovada.</p>
   <div style={tile}><h3 style={{marginTop:0}}>Acesso rápido</h3><div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
    {[['Funcionários','employees'],['Registro de ponto','time'],['Pagamentos','payments'],['Obras','sites']].map(([label,id])=><button key={id} onClick={()=>onNavigate(id)} style={{padding:'11px 14px',background:'#eff6ff',border:'1px solid #bfdbfe',borderRadius:9,color:'#1d4ed8',cursor:'pointer'}}>{label}</button>)}
   </div></div>
   <div style={{...tile,overflowX:'auto'}}><h3 style={{marginTop:0}}>Pagamentos por funcionário</h3>
    {state.payroll.length===0?<p>Nenhum pagamento calculado.</p>:<table style={{width:'100%',borderCollapse:'collapse',textAlign:'left'}}><thead><tr><th style={{padding:9}}>Funcionário</th><th style={{padding:9}}>Horas por hora</th><th style={{padding:9}}>Dias</th><th style={{padding:9}}>Total estimado (CAD)</th></tr></thead><tbody>{state.payroll.map(r=><tr key={r.employee_id}><td style={{padding:9,borderTop:'1px solid #e2e8f0'}}>{r.employee_name}</td><td style={{padding:9,borderTop:'1px solid #e2e8f0'}}>{r.hourly_hours}</td><td style={{padding:9,borderTop:'1px solid #e2e8f0'}}>{r.days}</td><td style={{padding:9,borderTop:'1px solid #e2e8f0'}}>{cad(r.total)}</td></tr>)}</tbody></table>}
   </div>
  </>}
 </div>;
}
