import {eq, and} from 'drizzle-orm';
import type {getDb} from '../db/index';
import {students, attendance, settings} from '../db/schema.ts';
import {normalizeStudentQR} from './qr-session.ts';
import {attendanceTiming, jakartaDate} from './attendance-time.ts';
import {checkLocation} from './attendance-rules.ts';
import {validateLeaveForm, type LeaveDocument} from './leave-document.ts';

/** Both operator and public QR routes use the same atomic attendance write. */
export async function recordAttendance(db: ReturnType<typeof getDb>, b: Record<string, unknown>) {
 const method=String(b.method||'');
 if(!['QR','Manual'].includes(method))return Response.json({error:'Metode tidak valid.'},{status:400});
 const token=method==='QR'?normalizeStudentQR(b.token):null;
 if(method==='QR'&&!token)return Response.json({error:'QR ini bukan kartu siswa SANJARA. Gunakan QR dari menu ID card siswa.'},{status:400});
 const [student]=await db.select().from(students).where(method==='QR'?eq(students.token,token!.slice(8)):eq(students.id,String(b.studentId||'')));
 if(!student)return Response.json({error:'Murid atau kartu QR tidak terdaftar.'},{status:404});
 const status=method==='Manual'?String(b.status||''):'Hadir';
 if(!(method==='Manual'?['Izin','Sakit','Alpa']:['Hadir']).includes(status))return Response.json({error:'Status tidak valid.'},{status:400});
 let geo:{latitude:number;longitude:number;accuracy:number;distance:number}|undefined;let leave:ReturnType<typeof validateLeaveForm>|undefined;
 try{
 if(status==='Hadir'){const [school]=await db.select().from(settings).where(eq(settings.id,'school'));geo=checkLocation(school,b.location);}
 if(status==='Izin')leave=validateLeaveForm(b);
 }catch(e){return Response.json({error:(e as Error).message},{status:400});}
 const reason=leave?.reason||null;const note=leave?.note||null;
 const today=jakartaDate();
 const date=leave?.date||today;
 const time=new Date().toISOString();const id=crypto.randomUUID();const letter=leave?'generated:'+id:null;
 const document:LeaveDocument|null=leave?{version:1,id,studentName:student.name,nipd:student.nis,nisn:student.nisn,className:student.className,...leave,createdAt:time}:null;
 const inserted=await db.insert(attendance).values({id,studentId:student.id,date,time,status,method,reason,note,letter,parentName:leave?.parentName||null,letterData:document?JSON.stringify(document):null,...geo}).onConflictDoNothing({target:[attendance.studentId,attendance.date]}).returning({id:attendance.id});
 if(!inserted.length){
 const [previous]=await db.select().from(attendance).where(and(eq(attendance.studentId,student.id),eq(attendance.date,date)));
 return Response.json({error:'Siswa sudah tercatat pada tanggal tersebut. Catatan lama tidak diubah.',receipt:{name:student.name,nis:student.nis,nisn:student.nisn,gender:student.gender,className:student.className,status:previous.status,time:previous.time,...attendanceTiming(previous.time,previous.status)}},{status:409});
 }
 return Response.json({ok:true,name:student.name,letter,receipt:{name:student.name,nis:student.nis,nisn:student.nisn,gender:student.gender,className:student.className,status,time,...attendanceTiming(time,status)}});
}
