'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import AdminManager from './AdminManager';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
const sections = [
  { id:'overview', title:'Visão geral', icon:'▦', description:'Resumo do sistema e próximos recursos.' },
  { id:'employees', title:'Funcionários', icon:'♙', description:'Cadastro, funções, valores por hora e status de funcionários.' },
  { id:'roles', title:'Classificações', icon:'▣', description:'Gerencie as funções e seus valores por hora.' },
  { id:'time', title:'Registro de ponto', icon:'◷', description:'Entradas, saídas e conferência de horas trabalhadas.' },
  { id:'payments', title:'Pagamentos', icon:'$', description:'Cálculo de horas e valores para conferência.' },
  { id:'reports', title:'Relatórios', icon:'▤', description:'Relatórios por funcionário e período.' }
];
export default function Dashboard() {
  const [employee,setEmployee] = useState(null);
  const [status,setStatus] = useState('Verificando acesso...');
  const [section,setSection] = useState('overview');
  useEffect(()=>{
    let active=true;
    const timeout=setTimeout(()=>{if(active)setStatus('A verificação está demorando. Atualize a página ou entre novamente.')},15000);
    (async()=>{
      try {
        const {data,error}=await supabase.auth.getSession();
        if(error) throw error;
        if(!data.session){window.location.replace('/login');return;}
        const response=await fetch('/api/me',{headers:{Authorization:'Bearer '+data.session.access_token},cache:'no-store'});
        if(!response.ok) throw new Error(response.status===401?'Seu acesso não foi autorizado.':'Não foi possível verificar o acesso. Tente novamente.');
        const json=await response.json();
        if(active){setEmployee(json.employee);setStatus('');}
      }catch(error){if(active)setStatus(error.message || 'Erro ao verificar acesso.');}
      finally{clearTimeout(timeout);}
    })();
    return ()=>{active=false;clearTimeout(timeout)};
  },[]);
  async function logout(){await supabase.auth.signOut();window.location.replace('/login');}
  const selected=sections.find(item=>item.id===section);
  const admin=employee?.is_admin;
  return <main style={{minHeight:'100vh',background:'#f4f7fb',fontFamily:'Arial, sans-serif',color:'#17243b'}}>
    <header style={{background:'#fff',borderBottom:'1px solid #e2e8f0',padding:'18px max(20px, calc((100vw - 1160px)/2))',display:'flex',justifyContent:'space-between',alignItems:'center',gap:16,flexWrap:'wrap'}}>
      <strong style={{fontSize:24}}>Paycheck<span style={{color:'#2563eb'}}>RB</span></strong>
      {employee&&<div style={{display:'flex',gap:12,alignItems:'center',flexWrap:'wrap'}}><span style={{fontSize:14}}>{employee.name} · {admin?'Administrador':'Funcionário'}</span><button onClick={logout} style={{border:'1px solid #cbd5e1',background:'#fff',borderRadius:9,padding:'9px 14px',cursor:'pointer'}}>Sair</button></div>}
    </header>
    {!employee?<div style={{maxWidth:700,margin:'80px auto',padding:24,textAlign:'center'}} role="status">{status}</div>:
    <div style={{maxWidth:1160,margin:'auto',padding:'30px 20px',display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:24}}>
      <nav aria-label="Seções do painel" style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:18,padding:14,alignSelf:'start'}}>
        <div style={{padding:'12px 14px',fontSize:12,fontWeight:700,color:'#64748b',letterSpacing:1}}>PAINEL {admin?'ADMINISTRATIVO':'DO FUNCIONÁRIO'}</div>
        {sections.filter(s=>admin||['overview','time'].includes(s.id)).map(item=><button key={item.id} onClick={()=>setSection(item.id)} style={{display:'block',width:'100%',textAlign:'left',padding:'15px 14px',marginBottom:5,border:0,borderRadius:11,background:section===item.id?'#eaf1ff':'transparent',color:section===item.id?'#1d4ed8':'#334155',fontWeight:section===item.id?700:500,cursor:'pointer',fontSize:15}}>{item.icon} &nbsp; {item.title}</button>)}
      </nav>
      <section style={{gridColumn:'span 2',minWidth:0}}>
        <div style={{marginBottom:24}}><div style={{color:'#2563eb',fontSize:12,fontWeight:800,letterSpacing:1.5}}>PAYCHECKRB CLOUD</div><h1 style={{fontSize:'clamp(28px,4vw,38px)',margin:'10px 0'}}> {section==='overview'?'Bem-vindo, '+employee.name:selected.title}</h1><p style={{color:'#64748b',lineHeight:1.6}}>{selected.description}</p></div>
        {admin&&(section==='employees'||section==='roles')?<AdminManager key={section} kind={section}/>:section==='overview'?<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))',gap:14}}>
          {sections.filter(s=>s.id!=='overview'&&(admin||s.id==='time')).map(item=><button key={item.id} onClick={()=>setSection(item.id)} style={{textAlign:'left',background:'#fff',border:'1px solid #e2e8f0',borderRadius:16,padding:20,cursor:'pointer',color:'#17243b'}}><div style={{fontSize:26,color:'#2563eb',marginBottom:12}}>{item.icon}</div><strong>{item.title}</strong><p style={{fontSize:13,lineHeight:1.5,color:'#64748b'}}>{item.description}</p><span style={{fontSize:12,color:'#b45309'}}>Em desenvolvimento</span></button>)}
        </div>:<div style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:18,padding:28}}><strong>Área em preparação</strong><p style={{color:'#64748b',lineHeight:1.6}}>A interface desta seção já está organizada. Os dados e operações reais serão habilitados na próxima etapa, após a validação das regras e permissões. Nenhum valor de pagamento ou hora foi inventado.</p></div>}
      </section>
    </div>}
  </main>;
}
