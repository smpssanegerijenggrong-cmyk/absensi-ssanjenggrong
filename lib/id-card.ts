import QRCode from 'qrcode';

export type CardStudent = {name: string; nis: string; nisn?: string; gender?: string; className: string; token: string};
export const escapeXML = (value: string) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');

const palette = {green: '#123f34', deep: '#082c24', gold: '#d4b777', ivory: '#faf9f2', ink: '#173d32', muted: '#6e8277'};
const font = 'Arial, Helvetica, sans-serif';

// Conservative glyph widths keep long names and identifiers inside the card.
function textWidth(value: string, size: number) {
  return Array.from(value).reduce((sum, char) => sum + (/\s/.test(char) ? .3 : /[MW@%]/.test(char) ? 1 : /[Iil1.,:;'|]/.test(char) ? .34 : /[A-Z0-9]/.test(char) ? .7 : .64) * size, 0);
}

function wrap(value: string, width: number, size: number) {
  const lines: string[] = [];
  let line = '';
  for (const word of value.trim().split(/\s+/)) {
    if (textWidth(word, size) > width) {
      if (line) {lines.push(line); line = '';}
      for (const char of Array.from(word)) {
        if (line && textWidth(line + char, size) > width) {lines.push(line); line = '';}
        line += char;
      }
    } else if (line && textWidth(line + ' ' + word, size) > width) {lines.push(line); line = word;}
    else line += (line ? ' ' : '') + word;
  }
  if (line) lines.push(line);
  return lines;
}

function nameBlock(value: string, y: number, width: number, maximum: number, minimum: number, step: number, color: string) {
  const name = value.trim().toLocaleUpperCase('id-ID');
  let size = maximum, lines = wrap(name, width, size);
  while (lines.length > 3 && size > minimum) {size -= 2; lines = wrap(name, width, size);}
  return lines.map((line, index) => `<text x="270" y="${y + index * step}" text-anchor="middle" font-size="${size}" font-weight="700" fill="${color}">${escapeXML(line)}</text>`).join('');
}

function label(value: string, x: number, y: number) {
  return `<text x="${x}" y="${y}" font-size="10" letter-spacing="1.6" fill="${palette.muted}">${escapeXML(value)}</text>`;
}

function value(value: string, x: number, y: number, width = 210, maximum = 21) {
  const size = Math.max(10, Math.min(maximum, maximum * width / Math.max(1, textWidth(value, maximum))));
  const condensed = textWidth(value, size) > width ? ` textLength="${width}" lengthAdjust="spacingAndGlyphs"` : '';
  return `<text x="${x}" y="${y}" font-size="${size.toFixed(1)}" font-weight="700" fill="${palette.ink}"${condensed}>${escapeXML(value)}</text>`;
}

function academicYear() {
  const parts = new Intl.DateTimeFormat('en', {timeZone: 'Asia/Jakarta', year: 'numeric', month: 'numeric'}).formatToParts(new Date());
  const year = Number(parts.find(p => p.type === 'year')?.value), month = Number(parts.find(p => p.type === 'month')?.value);
  const start = month >= 7 ? year : year - 1;
  return `${start}/${start + 1}`;
}

/** Print-ready vector card: 54 × 85.6 mm, with the school's original logo embedded. */
export async function createCardSVG(student: CardStudent, side: 'front' | 'back', logo: string) {
  const base = `<svg xmlns="http://www.w3.org/2000/svg" width="540" height="856" viewBox="0 0 540 856"><defs><clipPath id="card-edge"><rect width="540" height="856" rx="24"/></clipPath><linearGradient id="forest" x2="1" y2="1"><stop stop-color="${palette.green}"/><stop offset="1" stop-color="${palette.deep}"/></linearGradient><linearGradient id="gold"><stop stop-color="#b99b5b"/><stop offset=".5" stop-color="#ecd9a5"/><stop offset="1" stop-color="#b99b5b"/></linearGradient></defs><g clip-path="url(#card-edge)" font-family="${font}"><rect width="540" height="856" fill="${palette.ivory}"/>`;
  const edge = `<rect x=".75" y=".75" width="538.5" height="854.5" rx="23.25" fill="none" stroke="#c6d3c8" stroke-width="1.5"/></g></svg>`;

  if (side === 'front') {
    return base + `<path d="M0 0H540V219Q270 285 0 219Z" fill="url(#forest)"/>
      <g fill="none" stroke="#95b49d" stroke-opacity=".13"><circle cx="527" cy="33" r="105"/><circle cx="527" cy="33" r="145"/><circle cx="527" cy="33" r="185"/><path d="M-55 0L198 255M-90 0L163 255"/></g>
      <path d="M0 229Q270 295 540 229" fill="none" stroke="url(#gold)" stroke-width="4"/>
      <text x="270" y="35" text-anchor="middle" font-size="11" letter-spacing="3.6" fill="#e9dcc0">SANJARA HADIR</text>
      <circle cx="270" cy="111" r="61" fill="#fff" stroke="#e3c98d" stroke-width="2"/>
      <image href="${escapeXML(logo)}" x="228" y="60" width="84" height="101" preserveAspectRatio="xMidYMid meet"/>
      <text x="270" y="198" text-anchor="middle" font-size="20" font-weight="700" fill="#fff">SMP SSA NEGERI JENGGRONG</text>
      <text x="270" y="219" text-anchor="middle" font-size="10" letter-spacing="2.4" fill="#cbdcce">RANUYOSO · LUMAJANG</text>
      <text x="270" y="282" text-anchor="middle" font-size="12" font-weight="700" letter-spacing="4.2" fill="${palette.ink}">KARTU PELAJAR</text>
      <text x="270" y="317" text-anchor="middle" font-size="10" letter-spacing="1.7" fill="${palette.muted}">NAMA LENGKAP</text>
      ${nameBlock(student.name, 351, 466, 28, 12, 32, palette.ink)}
      <path d="M38 438H502" stroke="#dce3d9"/>
      ${label('NIPD', 38, 473)}${label('NISN', 288, 473)}
      ${value(student.nis, 38, 503)}${value(student.nisn || '—', 288, 503)}
      <path d="M38 524H502" stroke="#e0e6dc"/>
      ${label('KELAS', 38, 550)}${label('JENIS KELAMIN', 288, 550)}
      ${value(student.className, 38, 580)}${value(student.gender === 'L' ? 'Laki-laki' : student.gender === 'P' ? 'Perempuan' : '—', 288, 580, 214, 19)}
      ${label('TAHUN PELAJARAN', 38, 627)}${value(academicYear(), 38, 657, 215, 20)}
      <rect x="302" y="617" width="200" height="43" rx="10" fill="#e9eee2"/>
      <circle cx="322" cy="639" r="4" fill="${palette.green}"/>
      <text x="337" y="643" font-size="11" font-weight="700" letter-spacing=".7" fill="#3a6249">ABSENSI DIGITAL</text>
      <path d="M38 694H502" stroke="url(#gold)" stroke-width="1.5"/>
      <text x="270" y="735" text-anchor="middle" font-size="22" font-weight="700" letter-spacing="4.2" fill="${palette.green}">BERKARISMA</text>
      <rect y="774" width="540" height="82" fill="url(#forest)"/>
      <path d="M0 775H540" stroke="url(#gold)" stroke-width="2"/>
      <text x="270" y="813" text-anchor="middle" font-size="10" letter-spacing=".4" fill="#f5eedc">Setiap kehadiran, awal sebuah pembelajaran.</text>
      <text x="270" y="835" text-anchor="middle" font-size="8" letter-spacing="2.5" fill="#a9c0ad">IDENTITAS SISWA · SANJARA HADIR</text>` + edge;
  }

  const qr = await QRCode.toString('SANJARA:' + student.token, {type: 'svg', margin: 4, errorCorrectionLevel: 'M', color: {dark: '#000000', light: '#ffffff'}});
  const positionedQR = qr.replace('<svg ', '<svg x="91" y="266" width="358" height="358" ');
  const identifier = `NIPD ${student.nis} · Kelas ${student.className}`;
  const identifierSize = Math.max(9, Math.min(12, 12 * 434 / Math.max(1, textWidth(identifier, 12))));
  const identifierFit = textWidth(identifier, identifierSize) > 434 ? ' textLength="434" lengthAdjust="spacingAndGlyphs"' : '';
  return base + `<rect width="540" height="856" fill="url(#forest)"/>
    <g fill="none" stroke="#aac2ac" stroke-opacity=".1"><circle cx="535" cy="70" r="140"/><circle cx="535" cy="70" r="190"/><circle cx="0" cy="856" r="125"/><circle cx="0" cy="856" r="165"/></g>
    <rect x="30" y="18" width="60" height="66" rx="11" fill="#fff"/>
    <image href="${escapeXML(logo)}" x="38" y="23" width="44" height="55" preserveAspectRatio="xMidYMid meet"/>
    <text x="105" y="45" font-size="13" font-weight="700" fill="#e5e9dc">SMP SSA NEGERI</text>
    <text x="105" y="68" font-size="17" font-weight="700" fill="#fff">JENGGRONG RANUYOSO</text>
    <path d="M30 105H510" stroke="url(#gold)" stroke-width="1.5"/>
    <text x="270" y="153" text-anchor="middle" font-size="27" font-weight="700" letter-spacing="2" fill="#fff">KARTU ABSENSI</text>
    <text x="270" y="179" text-anchor="middle" font-size="12" letter-spacing=".6" fill="#c6dbc9">QR pribadi siswa · SANJARA HADIR</text>
    <rect x="28" y="214" width="484" height="542" rx="20" fill="${palette.ivory}"/>
    <text x="270" y="246" text-anchor="middle" font-size="10" font-weight="700" letter-spacing="2" fill="#607a67">PINDAI UNTUK MENCATAT KEHADIRAN</text>
    <rect x="79" y="254" width="382" height="382" rx="13" fill="#fff" stroke="#dbc48b" stroke-width="1.5"/>
    ${positionedQR}
    ${nameBlock(student.name, 669, 442, 20, 12, 20, palette.ink)}
    <text x="270" y="737" text-anchor="middle" font-size="${identifierSize.toFixed(1)}" fill="#617668"${identifierFit}>${escapeXML(identifier)}</text>
    <text x="270" y="790" text-anchor="middle" font-size="11" fill="#f4efdd">Klik Scan QR, lalu tunjukkan kartu ke kamera.</text>
    <text x="270" y="813" text-anchor="middle" font-size="10" fill="#c4d7c5">Gunakan kartumu sendiri. Simpan dengan baik.</text>
    <path d="M196 836H344" stroke="url(#gold)" stroke-width="2"/>` + edge;
}
