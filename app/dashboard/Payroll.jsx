'use client';
import {useEffect,useState} from 'react';
import {createClient} from '@supabase/supabase-js';
const sb=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
const cad=n=>new Intl.NumberFormat('en-CA',{style:'currency',currency:'CAD'}).format(Number(n)||0);
export default function Payroll(){
 const [rows,setRows]=useState([]),[error,setError]=useState(''),[loading,setLoading]=useState(true);
 useEffect(()=>{(async()=>{try{const {data}=await sb.auth.getSession();if(!data.session)throw Error('Sessão expirada');const r=await fetch('/api/workflow?action=payroll',{headers:{Authorization:'Bearer '+data.session.access_token},cache:'no-store'});const j=await r.json();if(!r.ok)throw Error(j.error);setRows(j.rows||[])}catch(e){setError(e.message)}finally{setLoading(false)}})()},[]);
 return <div style={{background:'white',padding:22,borderRadius:16,overflowX:'auto'}}>
  <h2>Resumo de pagamentos</h2>
  <p style={{color:'#64748b'}}>Valores calculados com base nos registros fechados. Diária: menos de 5 horas = metade; 5 horas ou mais = inteira. Horas de diferentes obras são somadas por funcionário e data.</p>
  <p style={{color:'#b45309'}}>Resumo acumulado de todos os períodos, ainda sem filtros por data e sem divisão automática de turnos que atravessam a meia-noite. Confira antes de usar para pagamento.</p>
  {loading?<p>Carregando...</p>:error?<p role="alert">{error}</p>:<table style={{width:'100%',borderCollapse:'collapse',textAlign:'left'}}><thead><tr>{['Funcionário','Horas (por hora)','Horas (diária)','Dias','Total estimado'].map(t=><th key={t} style={{padding:10,borderBottom:'1px solid #ddd'}}>{t}</th>)}</tr></thead><tbody>{rows.map(r=><tr key={r.employee_id}>{[r.employee_name,r.hourly_hours,r.daily_hours,r.days,cad(r.total)].map((x,i)=><td key={i} style={{padding:10,borderBottom:'1px solid #eee'}}>{x}</td>)}</tr>)}</tbody></table>}
 </div>
}
