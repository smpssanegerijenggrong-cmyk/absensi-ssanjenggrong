import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {drizzle} from 'drizzle-orm/pglite';
import * as schema from '../db/schema.ts';
import {createScanHandlers} from '../lib/scan-handlers.ts';

const request = body => new Request('https://school.example/api/scan', {method: 'POST', headers: {Origin: 'https://school.example', 'Content-Type': 'application/json'}, body: JSON.stringify(body)});

test('anonymous students can scan their own QR without access to administrative operations or rosters', async t => {
  const pg = new PGlite();
  const db = drizzle(pg, {schema});
  const api = createScanHandlers({database: () => db});
  try {
    await pg.exec(await readFile(new URL('../migrations/0001_postgres.sql', import.meta.url), 'utf8'));
    const student = {id: crypto.randomUUID(), token: crypto.randomUUID(), nis: '007', nisn: '0000000007', gender: 'P', name: 'Siswa Uji Publik', className: 'VII B'};
    await db.insert(schema.students).values(student);
    await db.insert(schema.settings).values({id: 'school', latitude: -7.9, longitude: 113.2, radius: 100});
    const scan = () => ({token: 'SANJARA:' + student.token, location: {latitude: -7.9, longitude: 113.2, accuracy: 10, timestamp: Date.now()}});
    await t.test('public setup returns only school location and roster readiness', async () => {
      const response = await api.GET();
      const data = await response.json();
      assert.deepEqual(Object.keys(data).sort(), ['hasStudents', 'settings']);
      assert.equal(data.hasStudents, true);
      assert.equal(JSON.stringify(data).includes(student.token), false);
      assert.equal(JSON.stringify(data).includes(student.name), false);
      assert.match(response.headers.get('cache-control'), /no-store/);
    });
    await t.test('public requests cannot import, edit students, override status or attendance date', async () => {
      for (const extra of [{action: 'import', rows: []}, {studentId: student.id}, {status: 'Izin'}, {date: '2000-01-01'}, {method: 'Manual'}]) {
        assert.equal((await api.POST(request({...scan(), ...extra}))).status, 400);
      }
      const foreign = request(scan()); foreign.headers.set('origin', 'https://foreign.example');
      assert.equal((await api.POST(foreign)).status, 403);
      assert.equal((await api.POST(request({...scan(), location: {...scan().location, latitude: -8}}))).status, 400);
      assert.equal((await api.POST(request({...scan(), token: crypto.randomUUID()}))).status, 404);
      assert.equal((await db.select().from(schema.attendance)).length, 0);
    });
    await t.test('a valid QR records once and returns only that student receipt', async () => {
      const first = await api.POST(request(scan()));
      assert.equal(first.status, 200);
      const data = await first.json();
      assert.equal(data.receipt.name, student.name);
      assert.equal(data.receipt.nisn, student.nisn);
      assert.equal(data.receipt.status, 'Hadir');
      assert.match(first.headers.get('cache-control'), /no-store/);
      const repeat = await api.POST(request(scan()));
      assert.equal(repeat.status, 409);
      assert.equal((await repeat.json()).receipt.time, data.receipt.time);
      assert.equal((await db.select().from(schema.attendance)).length, 1);
    });
  } finally {await pg.close();}
});
