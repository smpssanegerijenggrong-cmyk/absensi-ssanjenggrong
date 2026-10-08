import {eq} from 'drizzle-orm';
import type {getDb} from '../db/index';
import {settings, students} from '../db/schema.ts';
import {recordAttendance} from './record-attendance.ts';
import {storageError} from './server-errors.ts';

const headers = {'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer'};

/** Public access grants only attendance for the student whose random QR is presented. */
export function createScanHandlers({database}: {database: () => ReturnType<typeof getDb>}) {
  async function GET() {
    try {
      const db = database();
      const [school, roster] = await Promise.all([
        db.select({latitude: settings.latitude, longitude: settings.longitude, radius: settings.radius}).from(settings).where(eq(settings.id, 'school')),
        db.select({id: students.id}).from(students).limit(1),
      ]);
      return Response.json({settings: school[0] || null, hasStudents: roster.length > 0}, {headers});
    } catch (error) {
      const failure = storageError(error);
      return Response.json(failure, {status: failure.status, headers});
    }
  }

  async function POST(req: Request) {
    try {
      const origin = req.headers.get('origin');
      if ((origin && origin !== new URL(req.url).origin) || req.headers.get('sec-fetch-site') === 'cross-site') {
        return Response.json({error: 'Permintaan tidak diizinkan.'}, {status: 403, headers});
      }
      if (Number(req.headers.get('content-length') || 0) > 4096) return Response.json({error: 'Data scan terlalu besar.'}, {status: 413, headers});
      const text = await req.text();
      if (text.length > 4096) return Response.json({error: 'Data scan terlalu besar.'}, {status: 413, headers});
      let raw: unknown;
      try {raw = JSON.parse(text);} catch {return Response.json({error: 'Data JSON tidak valid.'}, {status: 400, headers});}
      if (!raw || typeof raw !== 'object' || Array.isArray(raw) || Object.keys(raw).some(key => !['token', 'location'].includes(key))) {
        return Response.json({error: 'Halaman siswa hanya menerima scan QR dan lokasi.'}, {status: 400, headers});
      }
      const data = raw as Record<string, unknown>;
      // Status, student ID, date and method are never accepted from the public client.
      const result = await recordAttendance(database(), {method: 'QR', token: data.token, location: data.location});
      for (const [key, value] of Object.entries(headers)) result.headers.set(key, value);
      return result;
    } catch (error) {
      const failure = storageError(error);
      return Response.json(failure, {status: failure.status, headers});
    }
  }
  return {GET, POST};
}
