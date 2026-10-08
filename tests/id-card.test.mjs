import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import sharp from 'sharp';
import jsQR from 'jsqr';
import {createCardSVG} from '../lib/id-card.ts';

const logo = 'data:image/png;base64,' + (await readFile(new URL('../public/branding/logo-sekolah.png', import.meta.url))).toString('base64');
const student = {name: 'NAMA LENGKAP SISWA', nis: '000123', nisn: '0012345678', gender: 'P', className: 'VII A', token: '5a2f58f9-9b68-4b7c-a54b-77423e499ce1'};

test('redesigned card preserves the student QR at display, print and smaller camera sizes', async () => {
  for (const token of [student.token, 'c9c6d42e-8526-488d-a8be-2b28d69d632b']) {
    const svg = await createCardSVG({...student, token}, 'back', logo);
    for (const height of [1712, 856, 428]) {
      const {data, info} = await sharp(Buffer.from(svg), {density: 144}).resize({height}).ensureAlpha().raw().toBuffer({resolveWithObject: true});
      const decoded = jsQR(new Uint8ClampedArray(data), info.width, info.height);
      assert.equal(decoded?.data, 'SANJARA:' + token, 'QR failed at card height ' + height);
    }
  }
});

test('card keeps leading zeros and safely renders names and long identity values', async () => {
  const front = await createCardSVG({...student, name: 'W'.repeat(100)}, 'front', logo);
  assert.match(front, /000123/);
  assert.match(front, /0012345678/);
  const lines = front.match(/>WW[^<]+<\/text>/g) || [];
  assert.equal(lines.length <= 3, true);
  assert.equal(lines.join('').replace(/<[^>]+>/g, '').replace(/[\s>]/g, '').length, 100);
  const safe = await createCardSVG({...student, name: '<script> & "Siswa"'}, 'front', logo);
  assert.doesNotMatch(safe, /<script>/i);
  assert.match(safe, /&lt;SCRIPT&gt;/);
  await sharp(Buffer.from(front)).png().toBuffer();
});
