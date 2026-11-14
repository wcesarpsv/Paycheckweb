import { NextResponse } from 'next/server';
import { getCurrentEmployee } from '../../../lib/auth';
import { getServerDatabase } from '../../../lib/supabase';
export const dynamic='force-dynamic';
async function authorize(request) {
 const user=await getCurrentEmployee(request);
 if(!user) return {error:NextResponse.json({error:'Não autorizado'},{status:401})};
 if(!user.is_admin) return {error:NextResponse.json({error:'Acesso exclusivo de administrador'},{status:403})};
 return {user};
}
function failure(error,status=400){console.error('Admin management:',error.message);return NextResponse.json({error:error.message||'Operação não concluída'},{status});}
export async function GET(request){
 try{const a=await authorize(request);if(a.error)return a.error;
 const {data,error}=await getServerDatabase().rpc('paycheckrb_admin_data',{p_action:'list',p_payload:{}});
 if(error)throw error;return NextResponse.json(data,{headers:{'Cache-Control':'no-store'}});
 }catch(e){return failure(e,503)}
}
export async function POST(request){
 try{
 const a=await authorize(request);if(a.error)return a.error;
 const body=await request.json();const {action,payload={}}=body||{};
 const actions=['role_create','role_update','employee_create','employee_update'];
 if(!actions.includes(action))return NextResponse.json({error:'Ação inválida'},{status:400});
 const db=getServerDatabase();
 if(action==='employee_create'){
  const name=String(payload.name||'').trim(),email=String(payload.email||'').trim().toLowerCase(),password=String(payload.password||'');
  if(name.length<2||!/^\S+@\S+\.\S+$/.test(email)||password.length<8||!Number.isInteger(Number(payload.role_id)))return NextResponse.json({error:'Preencha nome, email válido, classificação e senha de pelo menos 8 caracteres.'},{status:400});
  const {data:created,error:authError}=await db.auth.admin.createUser({email,password,email_confirm:false,user_metadata:{name}});
  if(authError)return failure(authError);
  const {error:dbError}=await db.rpc('paycheckrb_admin_data',{p_action:'employee_create',p_payload:{id:created.user.id,name,email,role_id:payload.role_id,is_admin:!!payload.is_admin}});
  if(dbError){await db.auth.admin.deleteUser(created.user.id);throw dbError;}
  return NextResponse.json({ok:true});
 }
 if(action==='employee_update'&&payload.id===a.user.id&&(!payload.active||!payload.is_admin))return NextResponse.json({error:'Você não pode desativar sua própria conta administrativa.'},{status:400});
 const {data,error}=await db.rpc('paycheckrb_admin_data',{p_action:action,p_payload:payload});
 if(error)throw error;return NextResponse.json(data);
 }catch(e){return failure(e)}
}
