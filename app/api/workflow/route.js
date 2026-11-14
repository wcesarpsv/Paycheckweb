import {NextResponse} from 'next/server';
import {getCurrentEmployee} from '../../../lib/auth';
import {getServerDatabase} from '../../../lib/supabase';
export const dynamic='force-dynamic';
async function handle(request,action,payload={}){
 try{
  const user=await getCurrentEmployee(request);
  if(!user)return NextResponse.json({error:'Sessão inválida'},{status:401});
  if(['site_save','employee_pay','adjust','payroll'].includes(action)&&!user.is_admin)return NextResponse.json({error:'Acesso restrito ao administrador'},{status:403});
  if(!['sites','site_save','arrive','checkout','entries','employee_pay','adjust','payroll'].includes(action))return NextResponse.json({error:'Ação inválida'},{status:400});
  const {data,error}=action==='payroll'?await getServerDatabase().rpc('paycheckrb_payroll_summary',{p_actor:user.id}):await getServerDatabase().rpc('paycheckrb_workflow',{p_actor:user.id,p_action:action,p_payload:payload});
  if(error)return NextResponse.json({error:error.message},{status:400});
  return NextResponse.json(data,{headers:{'Cache-Control':'no-store'}});
 }catch(e){console.error('Workflow error',e);return NextResponse.json({error:'Não foi possível concluir a operação'},{status:503})}
}
export async function GET(request){return handle(request,new URL(request.url).searchParams.get('action'))}
export async function POST(request){try{const {action,payload}=await request.json();return handle(request,action,payload||{})}catch{return NextResponse.json({error:'Requisição inválida'},{status:400})}}
