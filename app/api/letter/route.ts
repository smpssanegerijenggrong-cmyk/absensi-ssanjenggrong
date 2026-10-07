import {env} from 'cloudflare:workers';
import {eq} from 'drizzle-orm';
import {getDb} from '../../../db';
import {attendance} from '../../../db/schema';
import {renderLeaveDocument,type LeaveDocument} from '../../../lib/leave-document';
export async function GET(req:Request){
 const url=new URL(req.url),key=url.searchParams.get('key')||'';
 const headers={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'};
 if(/^generated:[a-f0-9-]{36}$/.test(key)){
  try{const [record]=await getDb().select({letterData:attendance.letterData,status:attendance.status,letter:attendance.letter}).from(attendance).where(eq(attendance.id,key.slice(10)));
   if(!record?.letterData||record.status!=='Izin'||record.letter!==key)return new Response('Surat tidak ditemukan.',{status:404,headers});
   const html=await renderLeaveDocument(JSON.parse(record.letterData) as LeaveDocument,url.origin+'/api/letter?key='+encodeURIComponent(key));
   return new Response(html,{headers:{...headers,'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src 'self' data:; base-uri 'none'; frame-ancestors 'self'; form-action 'none'"}});
  }catch{return new Response('Surat belum dapat dibuka. Coba lagi.',{status:500,headers});}
 }
 if(!/^letters\/[a-f0-9-]+\.(pdf|jpg|png)$/.test(key))return new Response('Not found',{status:404,headers});
 const file=await env.BUCKET?.get(key);return file?new Response(file.body,{headers:{...headers,'Content-Type':key.endsWith('.pdf')?'application/pdf':key.endsWith('.png')?'image/png':'image/jpeg','Content-Disposition':`inline; filename="surat-izin.${key.split('.').pop()}"`}}):new Response('Not found',{status:404,headers});
}
