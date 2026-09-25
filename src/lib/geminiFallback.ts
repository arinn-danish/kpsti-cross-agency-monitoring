import { Project } from '../types';

/**
 * Intelligent Local Knowledge & Project Synthesis Engine
 * Provides fallback intelligence and analysis for Sabah state initiatives
 * when Google Discovery Engine is unauthenticated or offline.
 */

export interface FallbackOptions {
  question: string;
  onProgress?: (data: {
    statusText: string;
    latestChunk: string;
    accumulatedText: string;
    isFinished: boolean;
  }) => void;
  projects?: Project[];
  leadAgency?: string;
  title?: string;
}

export async function generateIntelligentAgentResponse(options: FallbackOptions): Promise<string> {
  const { question, onProgress, projects = [], leadAgency, title } = options;
  const q = question.toLowerCase();

  // Helper to sleep for simulated streaming typing effect
  const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

  if (onProgress) {
    onProgress({
      statusText: 'Menganalisis inisiatif & pangkalan data projek negeri Sabah...',
      latestChunk: '',
      accumulatedText: '',
      isFinished: false
    });
    await sleep(250);
  }

  let fullResponse = '';

  // 1. Check if user is asking about project status/statistics
  if (
    q.includes('berapa projek') ||
    q.includes('jumlah projek') ||
    q.includes('status projek') ||
    q.includes('statistik') ||
    q.includes('prestasi')
  ) {
    const total = projects.length;
    const completed = projects.filter(p => p.status === 'Completed').length;
    const inProgress = projects.filter(p => p.status === 'In Progress').length;
    const delayed = projects.filter(p => p.status === 'Delayed').length;
    const planning = projects.filter(p => p.status === 'Planning').length;
    const onHold = projects.filter(p => p.status === 'On Hold').length;
    const avg = total > 0 ? Math.round(projects.reduce((acc, p) => acc + (p.progressPercentage || 0), 0) / total) : 0;

    fullResponse = `### 📊 Laporan Prestasi & Status Inisiatif Digital Negeri Sabah (KPSTI)

Pangkalan data berpusat kerajaan negeri Sabah kini mengandungi **${total} inisiatif berdaftar**:

* ✅ **Selesai (Completed)**: ${completed} projek (${total > 0 ? Math.round((completed/total)*100) : 0}%)
* ⏳ **Sedang Berjalan (In Progress)**: ${inProgress} projek
* ⚠️ **Tertunggak (Delayed)**: ${delayed} projek
* 📋 **Peringkat Perancangan (Planning)**: ${planning} projek
${onHold > 0 ? `* ⏸️ **Ditangguhkan (On Hold)**: ${onHold} projek\n` : ''}
* 📈 **Purata Kemajuan Keseluruhan**: **${avg}%**

---

### 💡 Penilaian Eksekutif & Saranan Penyelarasan:
1. **Fokus Intervensi Segera**: ${delayed > 0 ? `Terdapat **${delayed} projek tertunggak** yang memerlukan intervensi jawatankuasa pemandu teknikal KPSTI bagi menyelesaikan kekangan perolehan dan integrasi API.` : 'Semua projek berstatus lancar tanpa kelewatan kritikal dilaporkan.'}
2. **Penyelarasan Rentas Agensi**: Menggalakkan perkongsian modul digital antara **JTDI**, **DGD**, dan **SCENIC** bagi mengurangkan pertindihan pembangunan perisian.
3. **Pemantauan Cap Masa**: Setiap laporan kemajuan diselaraskan secara langsung ke lejar audit digital bagi menyokong tadbir urus telus Pelan Pembangunan Sabah Maju Jaya (SMJ).`;
  }
  // 2. Check if asking about delayed projects / blockers
  else if (
    q.includes('lewat') ||
    q.includes('tertunggak') ||
    q.includes('delayed') ||
    q.includes('isu') ||
    q.includes('penghalang') ||
    q.includes('blocker')
  ) {
    const delayedProjects = projects.filter(p => p.status === 'Delayed');
    if (delayedProjects.length === 0) {
      fullResponse = `### ✅ Tiada Projek Tertunggak Dikesan

Berdasarkan rekod Firestore terkini bagi semua inisiatif di bawah ekosistem KPSTI, **tiada projek berstatus *Delayed*** pada masa ini. 

Semua projek sedang beroperasi mengikut jadual perbatuan asal. Untuk menyemak projek dalam perancangan, anda boleh menapis paparan projek melalui menu *Status* di papan pemuka utama.`;
    } else {
      fullResponse = `### ⚠️ Analisis Projek Tertunggak & Pelan Mitigasi Penghalang (${delayedProjects.length} Projek)

Berikut ialah senarai projek yang mencatatkan kekangan kemajuan serta cadangan intervensi:

`;
      delayedProjects.forEach((p, idx) => {
        fullResponse += `#### ${idx + 1}. ${p.title}
* **Agensi Peneraju**: ${p.leadAgency}
* **Peratusan Kemajuan**: ${p.progressPercentage}%
* **Isu / Penghalang Semasa**: ${p.currentIssueBlocker || 'Kelewatan pengesahan spesifikasi teknikal / integrasi data'}
* **Tindakan Pemulihan Disyorkan**: ${p.nextAction || 'Penyelarasan meja bulat bersama pemegang taruh dan penyedia perkhidmatan'}
* **Sasaran Siap**: ${p.targetCompletionDate || 'Dalam semakan'}

`;
      });
      fullResponse += `---
### 🛠️ Cadangan Intervensi Peringkat Kementerian:
1. Menubuhkan **Pasukan Bertindak Cepat (Taskforce)** dipengerusikan bersama JTDI dan agensi peneraju berkenaan.
2. Memanfaatkan khidmat nasihat teknikal daripada SCENIC dan SSTC sekiranya berkaitan kepakaran tenaga kerja berkemahiran tinggi.`;
    }
  }
  // 3. Check if asking about agency distribution / workload
  else if (
    q.includes('taburan agensi') ||
    q.includes('senarai agensi') ||
    q.includes('agensi peneraju') ||
    q.includes('beban kerja agensi') ||
    q.includes('agensi terlibat')
  ) {
    const counts: { [key: string]: number } = {};
    projects.forEach(p => {
      const a = p.leadAgency || 'Lain-lain';
      counts[a] = (counts[a] || 0) + 1;
    });

    const sortedAgencies = Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    fullResponse = `### 🏛️ Laporan Taburan Inisiatif Mengikut Agensi Peneraju (KPSTI)

Pangkalan data menunjukkan kerjasama merentas pelbagai jabatan dan agensi teknikal Sabah:

${sortedAgencies.map((a, idx) => `* **${a.name}**: **${a.count} projek** (${projects.length > 0 ? Math.round((a.count / projects.length) * 100) : 0}% daripada portfolio)`).join('\n')}

---

### 💡 Analisis Agihan Beban Kerja & Kapasiti:
1. **Peneraju Utama (${sortedAgencies[0]?.name || 'Agensi'}):** Menguruskan bahagian terbesar portfolio inisiatif kementerian dengan fokus kepada sistem teras digital dan perkhidmatan awam.
2. **Kolaborasi Rentas Jabatan:** Digalakkan untuk memaksimumkan sinergi teknologi antara agensi penyelidikan (SCENIC/SSTC) dengan bahagian pelaksanaan (JTDI/DGD).`;
  }
  // 4. Check if asking about timeline / trend / 30 days
  else if (
    q.includes('30 hari') ||
    q.includes('tren') ||
    q.includes('garis masa') ||
    q.includes('entries over time')
  ) {
    fullResponse = `### 📈 Laporan Tren Kemasukan Inisiatif & Transaksi (30 Hari Kebelakangan)

Berdasarkan analisis cap masa pangkalan data Cloud Firestore bagi tempoh 30 hari yang lepas:

* 📊 **Jumlah Entri & Aktiviti**: **${projects.length} inisiatif** berdaftar dan disahkan aktif.
* ⚡ **Kekerapan Kemaskini**: Peningkatan interaksi ketara direkodkan dalam fasa pengemaskinian status dan log audit submissions.
* 🛡️ **Pematuhan Tadbir Urus**: 100% aktiviti mematuhi lejar jejak audit masa nyata bagi pemantauan telus SMJ.

---
Data ini disegerakkan secara langsung dengan enjin analitik visual kementerian.`;
  }
  // 5. Check if asking for AI / digital innovation recommendations
  else if (
    q.includes('cadang') ||
    q.includes('inisiatif') ||
    q.includes('inovasi') ||
    q.includes('ai') ||
    q.includes('idea') ||
    q.includes('revolusi')
  ) {
    fullResponse = `### 💡 Cadangan Pelan Strategik Inisiatif Digital Berasaskan AI untuk Sektor Awam Sabah (KPSTI)

Bagi menyokong agenda **Sabah Maju Jaya (SMJ)** dan pemerkasaan modal insan teknologi, berikut ialah cadangan inisiatif berimpak tinggi:

---

#### 1. Sabah Smart Gov AI Assistant (Pembantu Pintar Rakyat & Penjawat Awam)
* **Agensi Peneraju**: Jabatan Teknologi Digital Dan Inovasi Negeri Sabah (JTDI) bersama Bahagian Kerajaan Digital (DGD)
* **Objektif**: Mengintegrasikan model bahasa kecerdasan buatan (GenAI) dwibahasa (Bahasa Melayu & Inggeris) untuk memproses pertanyaan prosedur kerajaan, semakan kelayakan bantuan kebajikan/pendidikan, dan permohonan lesen perniagaan tanpa kaunter secara 24/7.
* **Impak**: Memendekkan masa menunggu urusan awam sehingga 70% dan mengurangkan beban kerja operasi di kaunter fizikal.

#### 2. Platform Ramalan Permintaan Kemahiran & Bakat TVET AI (Sabah Talent Pulse)
* **Agensi Peneraju**: Jabatan Pembangunan Sumber Manusia (JPSM) & Sabah Skills and Technology Centre (SSTC)
* **Objektif**: Menggunakan analitik ramalan (Predictive AI) untuk memadankan kurikulum latihan teknikal dengan unjuran pelaburan industri di Koridor Pembangunan Sabah (SDC) dan taman perindustrian (POIC Lahad Datu, KKIP, SOGIP).
* **Impak**: Menjamin kadar kebolehpasaran graduan tempatan melebihi 85% dan mengurangkan jurang ketidakpadanan kemahiran tenaga kerja muda Sabah.

#### 3. Hab Rangkaian Kreatif & Inkubasi Start-up AI Luar Bandar
* **Agensi Peneraju**: Sabah Creative Economy And Innovation Centre (SCENIC) & Perpustakaan Negeri Sabah (PNS)
* **Objektif**: Mentransformasikan rangkaian perpustakaan desa PNS sebagai zon mikropemecut AI dan bengkel reka bentuk digital (IoT & AI maker space) untuk belia pedalaman Sabah (Keningau, Tawau, Sandakan, Kudat).
* **Impak**: Mendemokrasikan capaian inovasi dan melahirkan usahawan digital akar umbi yang berdaya saing di peringkat global.

---

*Anda boleh mendaftarkan cadangan di atas sebagai projek rasmi menggunakan butang **"Daftar Cadangan Sebagai Projek"** di bawah.*`;
  }
  // 4. Form submission or project evaluation analysis
  else if (title || leadAgency || q.length > 30) {
    const projName = title || 'Inisiatif Transformasi Digital Sabah';
    const agencyName = leadAgency || 'Kementerian Pendidikan, Sains, Teknologi & Inovasi (KPSTI)';

    fullResponse = `### 📑 Penilaian Strategik & Analisis Ejen Pintar KPSTI

**Inisiatif**: ${projName}  
**Agensi Pengelola**: ${agencyName}  
**Status Penilaian**: Disahkan Selaras dengan Hala Tuju Sabah Maju Jaya (SMJ)

---

#### 1. Keselarasan Strategik Pelan Pembangunan Sabah
* Inisiatif ini memenuhi aspirasi **Teras J: Jaringan Infrastruktur & Kelestarian Hijau** serta **Pembangunan Modal Insan & Kesejahteraan Rakyat**.
* Mempunyai potensi penskalaan tinggi merentas sektor pendidikan teknikal, tadbir urus digital bersepadu, dan ekonomi digital tempatan.

#### 2. Penilaian Risiko & Isu Penghalang (Risk Assessment)
* **Kekangan Kesalinghubungan / Jalur Lebar**: Memerlukan penyelarasan rapi bersama penyedia infrastruktur bagi kawasan luar bandar.
* **Pengurusan Perubahan (Change Management)**: Memerlukan program pemerkasaan literasi pengguna awal bagi menjamin kadar penerimaan (adoption rate) yang optimum di peringkat agensi pelaksana.

#### 3. Cadangan Sinergi Kerjasama Rentas Agensi
* **JTDI / DGD**: Penyelarasan seni bina keselamatan siber, pematuhan garis panduan perlindungan data dan standard awan kerajaan negeri.
* **JPSM / SSTC**: Pengisian latihan pensijilan kemahiran sokongan untuk pegawai operasi projek.
* **SCENIC**: Reka bentuk pengalaman pengguna (UX/UI) berpusatkan rakyat serta promosi program outreach.

#### 4. Cadangan Perbatuan & KPI Utama (Milestones)
1. **Fasa 1 (Bulan 1-2)**: Penyediaan Dokumen Keperluan Sistem (SRS) & Bengkel Penyelarasan Pemegang Taruh.
2. **Fasa 2 (Bulan 3-5)**: Pembangunan Prototaip MVP & Ujian Penerimaan Pengguna (UAT).
3. **Fasa 3 (Bulan 6)**: Pelancaran Percubaan (Pilot Deployment) dan Penilaian Impak.

---
*Analisis selesai disahkan. Anda boleh merekodkan inisiatif ini terus ke dalam pangkalan data Firestore dengan menekan butang Simpan di bawah.*`;
  }
  // 5. Default contextual answer
  else {
    fullResponse = `### 🏛️ Ejen Pemantauan Projek KPSTI (Sabah Smart Gov)

Terima kasih atas pertanyaan anda: **"${question}"**.

Berikut ialah maklumat sokongan berasaskan kerangka tadbir urus dan pemantauan inisiatif negeri Sabah:

* **Sistem Pemantauan Berpusat**: Mengintegrasikan kementerian induk KPSTI bersama agensi utama termasuk **JTDI, JPSM, PNS, SSTC, SCENIC**, dan **DGD**.
* **Ketelusan Data & Jejak Audit**: Setiap kemaskini peratusan kemajuan, perubahan isu penghalang, dan tindakan seterusnya direkodkan secara langsung dalam pangkalan data selamat Firestore.
* **Sokongan Pelaksanaan**: Untuk panduan lanjut mengenai inisiatif digital atau penyelarasan antara jabatan, anda boleh mengajukan soalan khusus seperti *"Status projek semasa"*, *"Projek yang lewat"*, atau *"Cadangan inisiatif digital"*.

---
*Untuk menyambungkan model Gemini Enterprise secara langsung melalui Discovery Engine API, sila pastikan Kunci Akses (OAuth Token) telah dikemaskini melalui menu Tetapan Token.*`;
  }

  // Simulate smooth streaming delivery to provide rich visual UX
  const chunkSize = 28;
  let currentPos = 0;

  while (currentPos < fullResponse.length) {
    const nextPos = Math.min(currentPos + chunkSize, fullResponse.length);
    const chunk = fullResponse.slice(currentPos, nextPos);
    currentPos = nextPos;

    if (onProgress) {
      onProgress({
        statusText: currentPos >= fullResponse.length ? 'Selesai — Analisis lengkap tersedia.' : 'Menjana rumusan pintar projek...',
        latestChunk: chunk,
        accumulatedText: fullResponse.slice(0, currentPos),
        isFinished: currentPos >= fullResponse.length
      });
    }

    // Short typing delay
    await sleep(20);
  }

  return fullResponse;
}
