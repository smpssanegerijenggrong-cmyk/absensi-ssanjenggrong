'use client';

import {useEffect, useState} from 'react';
import {RefreshCw, ScanLine, ShieldCheck} from 'lucide-react';
import type {SchoolLocation} from '../../lib/attendance-rules';
import QRScanner from './qr-scanner';

type Setup = {settings: SchoolLocation | null; hasStudents: boolean};

export default function StudentScan() {
  const [setup, setSetup] = useState<Setup | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    void (async () => {
      try {
        const response = await fetch('/api/scan', {cache: 'no-store', signal: controller.signal});
        const data = await response.json();
        if (!response.ok) throw Error('Layanan absensi belum tersedia. Hubungi guru/operator, lalu coba lagi.');
        if (!controller.signal.aborted) setSetup(data);
      } catch (e) {if (!controller.signal.aborted) {setSetup(null); setError((e as Error).message);}}
      finally {if (!controller.signal.aborted) setLoading(false);}
    })();
    return () => controller.abort();
  }, [retry]);

  return <main className="student-page">
    <header className="student-header"><a href="/" className="student-brand"><img src="/branding/logo-sekolah.png" width="42" height="50" alt="Logo sekolah"/><span>SANJARA <b>Hadir</b><small>SMP SSA Negeri Jenggrong Ranuyoso</small></span></a><a href="/admin" className="secondary"><ShieldCheck size={16}/>Login admin</a></header>
    <div className="student-content">
      <section className="student-intro"><span className="eyebrow">ABSENSI SISWA</span><h1>Scan kartu. Kehadiran tercatat.</h1><p>Klik Scan QR, izinkan kamera dan lokasi, lalu tunjukkan QR di kartu siswa. Tunggu bunyi “tit” dan bukti sukses di layar.</p><div className="student-steps"><span><b>1</b>Klik Scan QR</span><span><b>2</b>Tunjukkan kartu</span><span><b>3</b>Lihat bukti sukses</span></div><div className="student-location"><ShieldCheck size={18}/><p>Absensi hadir dilakukan di lingkungan sekolah. Waktu setelah 07.00 WIB ditandai terlambat.</p></div></section>
      <section className="student-scanner" aria-label="Scan absensi siswa"><div className="student-scanner-title"><ScanLine size={23}/><div><h2>Scan QR siswa</h2><p>Tanpa login admin · tersimpan otomatis</p></div></div>
        {loading ? <p role="status" className="student-loading">Menyiapkan pemindai…</p> : error ? <div role="alert" className="alert"><p>{error}</p><button className="text-button" onClick={() => setRetry(n => n + 1)}><RefreshCw size={15}/>Coba lagi</button></div> : setup && <QRScanner settings={setup.settings} hasStudents={setup.hasStudents} publicMode/>}
      </section>
    </div>
  </main>;
}
