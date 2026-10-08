import {recordAttendance} from './record-attendance.ts';
import {eq,desc} from 'drizzle-orm';
import type {getDb} from '../db/index';
import {storageError} from './server-errors.ts';
import {students,attendance,settings,classrooms} from '../db/schema.ts';
import {validCoordinates} from './attendance-rules.ts';
import {validateImport,type StudentImport,type ClassImport} from './import-rules.ts';
export function createDataHandlers({authorize,database}:{authorize:()=>Promise<boolean>;database:()=>ReturnType<typeof getDb>}){
 const unauthorized=()=>Response.json({error:'Silakan masuk sebagai operator.',code:'UNAUTHORIZED'},{status:401,headers:{'Cache-Control':'no-store'}});
 async function GET(){
 if(!await authorize())return unauthorized();
 try {
 const db=database();
 const [classes,studentRows,schoolRows,records]=await Promise.all([db.select().from(classrooms),db.select().from(students),db.select().from(settings).where(eq(settings.id,'school')),db.select().from(attendance).orderBy(desc(attendance.time))]);
 return Response.json({classes,students:studentRows,settings:schoolRows[0]||null,records},{headers:{'Cache-Control':'no-store'}});
 }catch(e){const failure=storageError(e);return Response.json(failure,{status:failure.status,headers:{'Cache-Control':'no-store'}});}
}
async function POST(req:Request){
 if(!await authorize())return unauthorized();
 try{
 if(req.headers.get('origin')&&req.headers.get('origin')!==new URL(req.url).origin)return Response.json({error:'Permintaan tidak diizinkan.'},{status:403});
 if(Number(req.headers.get('content-length')||0)>8500000)return Response.json({error:'Unggahan terlalu besar.'},{status:413});
 let raw:unknown;try{raw=await req.json();}catch{return Response.json({error:'Data JSON tidak valid.'},{status:400});}if(!raw||typeof raw!=='object')return Response.json({error:'Data tidak valid.'},{status:400});const b=raw as Record<string,unknown>;const db=database();

 if(b.action==='class'){
 let row:ClassImport;try{row=validateImport('classes',[b])[0] as ClassImport;}catch(e){return Response.json({error:(e as Error).message},{status:400});}
 await db.insert(classrooms).values(row).onConflictDoUpdate({target:classrooms.name,set:{teacher:row.teacher,room:row.room}});return Response.json({ok:true,message:'Data kelas berhasil disimpan.'});
 }
 if(b.action==='import'){
 let rows:StudentImport[]|ClassImport[];try{rows=validateImport(String(b.mode),b.rows);}catch(e){return Response.json({error:(e as Error).message},{status:400});}
 const statements=b.mode==='students'?(rows as StudentImport[]).map(row=>db.insert(students).values({...row,id:crypto.randomUUID(),token:crypto.randomUUID()}).onConflictDoNothing({target:students.nis}).returning({id:students.id})):(rows as ClassImport[]).map(row=>db.insert(classrooms).values(row).onConflictDoNothing({target:classrooms.name}).returning({id:classrooms.name}));
 const results=await db.batch(statements as any);const added=(results as unknown[][]).reduce((n,r)=>n+r.length,0);
 return Response.json({ok:true,message:`${added} data berhasil diimpor. ${rows.length-added} data yang sudah terdaftar dilewati.`});
 }
 if(b.action==='settings'){
 if(!validCoordinates(b.latitude,b.longitude)||typeof b.radius!=='number'||!Number.isFinite(b.radius)||b.radius<20||b.radius>2000)return Response.json({error:'Koordinat tidak valid. Radius harus 20–2.000 meter.'},{status:400});
 const location={latitude:b.latitude as number,longitude:b.longitude as number,radius:b.radius};
 await db.insert(settings).values({id:'school',...location}).onConflictDoUpdate({target:settings.id,set:location});return Response.json({ok:true});
 }
 if(b.action==='student'){
 let row:StudentImport;try{row=validateImport('students',[b])[0] as StudentImport;}catch(e){return Response.json({error:(e as Error).message},{status:400});}
 if(b.id){const result=await db.update(students).set(row).where(eq(students.id,String(b.id))).returning({id:students.id});if(!result.length)return Response.json({error:'Siswa tidak ditemukan.'},{status:404});}
 else await db.insert(students).values({...row,id:crypto.randomUUID(),token:crypto.randomUUID()});return Response.json({ok:true});
 }
 if(b.action!=='attendance')return Response.json({error:'Tindakan tidak valid.'},{status:400});
 return await recordAttendance(db,b);
 }catch(e){const failure=storageError(e);return Response.json(failure,{status:failure.status,headers:{'Cache-Control':'no-store'}});}
}
return {GET,POST};
}
