import {readFile, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import sharp from 'sharp';
import {createCardSVG} from '../lib/id-card.ts';

// Illustration only: no live student data or database writes.
const student = {name: 'NAMA LENGKAP SISWA', nis: '20260001', nisn: '0123456789', gender: 'L', className: 'VII A', token: '11111111-1111-4111-8111-111111111111'};
const logo = 'data:image/png;base64,' + (await readFile(new URL('../public/branding/logo-sekolah.png', import.meta.url))).toString('base64');
const cards = await Promise.all(['front', 'back'].map(async side => {
  const svg = await createCardSVG(student, side, logo);
  return sharp(Buffer.from(svg), {density: 144}).resize(540, 856).png().toBuffer();
}));
const caption = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="1170"><g font-family="Arial, Helvetica, sans-serif"><text x="72" y="54" fill="#52775d" font-size="12" font-weight="700" letter-spacing="3">SANJARA HADIR / KARTU SISWA</text><text x="72" y="106" fill="#153f33" font-size="35" font-weight="700">Lebih rapi. Lebih berkarisma.</text><text x="72" y="141" fill="#728374" font-size="16">SMP SSA Negeri Jenggrong Ranuyoso · Desain hijau dan emas</text><text x="342" y="197" text-anchor="middle" fill="#617969" font-size="12" letter-spacing="2">DEPAN · IDENTITAS</text><text x="938" y="197" text-anchor="middle" fill="#617969" font-size="12" letter-spacing="2">BELAKANG · QR ABSENSI</text><text x="72" y="1121" fill="#65806e" font-size="13">CONTOH DESAIN · DATA ILUSTRASI · QR contoh ini tidak digunakan untuk absensi.</text></g></svg>`);
const output = resolve(process.argv[2] || 'SANJARA_Kartu_Siswa_Hijau_Emas.png');
await writeFile(output, await sharp({create: {width: 1280, height: 1170, channels: 4, background: '#eef3eb'}}).composite([{input: caption}, {input: cards[0], left: 72, top: 218}, {input: cards[1], left: 668, top: 218}]).png().toBuffer());
console.log(output);
