import { Agency, Project } from '../types';

export const DEFAULT_KPSTI_AGENCIES: Agency[] = [
  {
    id: 'agency-kpsti',
    name: 'Kementerian Pendidikan, Sains, Teknologi & Inovasi (KPSTI)',
    code: 'KPSTI',
    category: 'KPSTI (Kementerian)',
    description: 'Kementerian induk peneraju dasar dan program pendidikan, sains, teknologi serta inovasi negeri Sabah.'
  },
  {
    id: 'agency-jtdi',
    name: 'Jabatan Teknologi Digital Dan Inovasi Negeri Sabah (JTDI)',
    code: 'JTDI',
    category: 'KPSTI (Jabatan)',
    description: 'Menerajui inisiatif transformasi teknologi digital dan ekosistem inovasi sektor awam negeri Sabah.'
  },
  {
    id: 'agency-jpsm',
    name: 'Jabatan Pembangunan Sumber Manusia (JPSM)',
    code: 'JPSM',
    category: 'KPSTI (Jabatan)',
    description: 'Pembangunan modal insan, penajaan kemahiran teknikal dan pemerkasaan tenaga kerja tempatan Sabah.'
  },
  {
    id: 'agency-pns',
    name: 'Perpustakaan Negeri Sabah (PNS)',
    code: 'PNS',
    category: 'KPSTI (Jabatan)',
    description: 'Penyediaan perkhidmatan perpustakaan, pusat literasi digital komuniti dan pembudayaan ilmu pengetahuan.'
  },
  {
    id: 'agency-sstc',
    name: 'Sabah Skills and Technology Centre (SSTC)',
    code: 'SSTC',
    category: 'KPSTI (Agensi)',
    description: 'Pusat latihan kemahiran industri teknologi tinggi, kejuruteraan automasi dan pembangunan bakat TVET Sabah.'
  },
  {
    id: 'agency-scenic',
    name: 'Sabah Creative Economy And Innovation Centre (SCENIC)',
    code: 'SCENIC',
    category: 'KPSTI (Agensi)',
    description: 'Pemangkin ekonomi kreatif, inkubasi usahawan tekno, pembangunan bakat digital dan inovasi berpaksikan impak rakyat.'
  },
  {
    id: 'agency-dgd',
    name: 'Bahagian Kerajaan Digital (DGD)',
    code: 'DGD',
    category: 'KPSTI (Bahagian)',
    description: 'Penyelarasan governans kerajaan digital, perkhidmatan awam pintar tanpa kertas dan seni bina data bersepadu.'
  },
  // Others / Agensi Luar & Rakan Strategik
  {
    id: 'agency-jpans',
    name: 'Jabatan Perkhidmatan Awam Negeri Sabah (JPANS)',
    code: 'JPANS',
    category: 'Agensi Negeri (Others)',
    description: 'Pengurusan perkhidmatan awam dan governans pentadbiran kerajaan negeri Sabah.'
  },
  {
    id: 'agency-mofsabah',
    name: 'Kementerian Kewangan Negeri Sabah (MOF Sabah)',
    code: 'MOF',
    category: 'Agensi Negeri (Others)',
    description: 'Pengurusan fiskal dan kelulusan dana peruntukan projek pembangunan negeri.'
  },
  {
    id: 'agency-jkr',
    name: 'Jabatan Kerja Raya Sabah (JKR)',
    code: 'JKR',
    category: 'Agensi Negeri (Others)',
    description: 'Pelaksanaan projek infrastruktur fizikal, fasiliti awam dan kejuruteraan negeri.'
  },
  {
    id: 'agency-jkns',
    name: 'Jabatan Kesihatan Negeri Sabah (JKNS)',
    code: 'JKNS',
    category: 'Agensi Persekutuan (Others)',
    description: 'Penyampaian perkhidmatan kesihatan awam dan integrasi telekesihatan luar bandar.'
  },
  {
    id: 'agency-others',
    name: 'Lain-lain Agensi / Rakan Strategik (Others)',
    code: 'LAIN',
    category: 'Lain-lain (Others)',
    description: 'Rakan kerjasama universiti, industri atau badan berkanun berkaitan.'
  }
];

export const MOCK_AGENCIES: Agency[] = DEFAULT_KPSTI_AGENCIES;

export const INITIAL_SAMPLE_PROJECTS: Project[] = [
  {
    id: 'PRJ-2026-001',
    title: 'Pelaksanaan Inisiatif Hab Inovasi & AI Komuniti Sabah (Sabah AI Sandpit)',
    description: 'Mewujudkan hab inovasi kecerdasan buatan (AI) komuniti dan program pembudayaan tekno-kreatif untuk usahawan mikro, pelajar, dan pencipta teknologi tempatan di seluruh bahagian negeri Sabah.',
    leadAgency: 'Sabah Creative Economy And Innovation Centre (SCENIC)',
    participatingAgencies: [
      'Kementerian Pendidikan, Sains, Teknologi & Inovasi (KPSTI)',
      'Sabah Skills and Technology Centre (SSTC)',
      'Jabatan Teknologi Digital Dan Inovasi Negeri Sabah (JTDI)'
    ],
    unitSection: 'Bahagian Pembangunan Ekosistem & Inkubasi Tekno',
    projectLead: 'Viviantie Sarjuni',
    assignedTeam: 'Pasukan Pengurusan Hab Inovasi, Unit Impak Komuniti & Kerjasama Industri',
    startDate: '2025-08-01',
    targetCompletionDate: '2026-11-30',
    status: 'In Progress',
    progressPercentage: 72,
    latestProgressUpdate: 'Modul latihan asas AI telah siap dibangunkan bersama SSTC dan JTDI. Bengkel percubaan pertama di Sandakan berjaya melatih 120 peserta tempatan.',
    currentIssueBlocker: 'Kelulusan tapak hab satelit Pantai Timur masih dalam perbincangan akhir bersama pihak berkuasa tempatan.',
    nextAction: 'Sesi penyelarasan bersama Pegawai Daerah Tawau dan Sandakan dijadualkan pada 12 September 2026.',
    lastUpdatedDate: '2026-08-28',
    history: [
      {
        id: 'upd-001-1',
        date: '2026-05-15',
        progressPercentage: 35,
        status: 'In Progress',
        progressUpdate: 'Pelan strategik Sabah AI Sandpit diluluskan oleh Jawatankuasa Pemandu KPSTI.',
        issueBlocker: 'Penyelarasan peruntukan geran bersama agensi persekutuan.',
        nextAction: 'Sediakan kertas kerja spesifikasi perkakasan komputer grafik tinggi.',
        recordedBy: 'Viviantie Sarjuni'
      },
      {
        id: 'upd-001-2',
        date: '2026-07-20',
        progressPercentage: 55,
        status: 'In Progress',
        progressUpdate: 'Perolehan peralatan komputer makmal AI Kota Kinabalu selesai ditandatangani.',
        issueBlocker: '',
        nextAction: 'Laksanakan ujian perintis bengkel modular.',
        recordedBy: 'Mohd Firdaus (Pengurus Projek SCENIC)'
      },
      {
        id: 'upd-001-3',
        date: '2026-08-28',
        progressPercentage: 72,
        status: 'In Progress',
        progressUpdate: 'Modul latihan asas AI telah siap dibangunkan bersama SSTC dan JTDI. Bengkel percubaan pertama di Sandakan berjaya melatih 120 peserta tempatan.',
        issueBlocker: 'Kelulusan tapak hab satelit Pantai Timur masih dalam perbincangan akhir bersama pihak berkuasa tempatan.',
        nextAction: 'Sesi penyelarasan bersama Pegawai Daerah Tawau dan Sandakan dijadualkan pada 12 September 2026.',
        recordedBy: 'Viviantie Sarjuni'
      }
    ]
  },
  {
    id: 'PRJ-2026-002',
    title: 'Portal Bersepadu Pensijilan Kemahiran & Penempatan Pekerjaan Modal Insan Sabah (e-Latihan Sabah)',
    description: 'Membangunkan pangkalan data tunggal dan platform pintar mengesan keperluan latihan kemahiran, pensijilan TVET, serta pemadanan kerjaya graduan anak Sabah dengan sektor industri.',
    leadAgency: 'Jabatan Pembangunan Sumber Manusia (JPSM)',
    participatingAgencies: [
      'Sabah Skills and Technology Centre (SSTC)',
      'Kementerian Pendidikan, Sains, Teknologi & Inovasi (KPSTI)',
      'Jabatan Perkhidmatan Awam Negeri Sabah (JPANS)'
    ],
    unitSection: 'Sektor Perancangan & Penyelidikan Latihan',
    projectLead: 'Tiaing Rundukan',
    assignedTeam: 'Unit Sistem Maklumat JPSM, Pegawai Penyelaras TVET SSTC',
    startDate: '2025-06-01',
    targetCompletionDate: '2026-08-20', // Overdue for demonstration
    status: 'Delayed',
    progressPercentage: 84,
    latestProgressUpdate: 'Modul pendaftaran pelatih dan integrasi portal industri 95% siap. Ujian penerimaan pengguna (UAT) fasa 2 sedang dijalankan.',
    currentIssueBlocker: 'Kelewatan integrasi API pengesahan kad pengenalan dan rekod caruman akibat naik taraf pelayan keselamatan luar.',
    nextAction: 'Mesyuarat teknikal khas bersama pihak pembekal integrasi sistem pada 8 September 2026.',
    lastUpdatedDate: '2026-08-22',
    history: [
      {
        id: 'upd-002-1',
        date: '2026-03-10',
        progressPercentage: 50,
        status: 'In Progress',
        progressUpdate: 'Seni bina pangkalan data e-Latihan disahkan mematuhi piawaian DGD.',
        issueBlocker: '',
        nextAction: 'Pembangunan antara muka portal majikan.',
        recordedBy: 'Tiaing Rundukan'
      },
      {
        id: 'upd-002-2',
        date: '2026-08-22',
        progressPercentage: 84,
        status: 'Delayed',
        progressUpdate: 'Modul pendaftaran pelatih dan integrasi portal industri 95% siap. Ujian penerimaan pengguna (UAT) fasa 2 sedang dijalankan.',
        issueBlocker: 'Kelewatan integrasi API pengesahan kad pengenalan dan rekod caruman akibat naik taraf pelayan keselamatan luar.',
        nextAction: 'Mesyuarat teknikal khas bersama pihak pembekal integrasi sistem pada 8 September 2026.',
        recordedBy: 'Tiaing Rundukan'
      }
    ]
  },
  {
    id: 'PRJ-2026-003',
    title: 'Platform Kerajaan Digital Pintar & Integrasi Data Sektor Awam Sabah (SabahGov Cloud & API Exchange)',
    description: 'Mewujudkan ekosistem perkongsian data terbuka dan API berpusat antara kementerian/jabatan negeri bagi membolehkan perkhidmatan awam digital tanpa kertas dan perkongsian data pantas.',
    leadAgency: 'Jabatan Teknologi Digital Dan Inovasi Negeri Sabah (JTDI)',
    participatingAgencies: [
      'Bahagian Kerajaan Digital (DGD)',
      'Kementerian Pendidikan, Sains, Teknologi & Inovasi (KPSTI)',
      'Kementerian Kewangan Negeri Sabah (MOF Sabah)',
      'Jabatan Perkhidmatan Awam Negeri Sabah (JPANS)'
    ],
    unitSection: 'Bahagian Infrastruktur Digital & Keselamatan Siber',
    projectLead: 'Ernywati Binti Mohd Azmi',
    assignedTeam: 'Pasukan Arkitek Cloud JTDI, Jurutera Integrasi API DGD',
    startDate: '2025-09-01',
    targetCompletionDate: '2026-12-15',
    status: 'In Progress',
    progressPercentage: 65,
    latestProgressUpdate: 'Gerbang API kerajaan negeri berjaya menghubungkan 8 agensi rintis termasuk sistem e-Penyata Kewangan dan direktori perjawatan JPANS.',
    currentIssueBlocker: 'Memorandum Persefahaman (MoU) perkongsian data silang agensi sedang menunggu pengesahan peguam besar negeri.',
    nextAction: 'Bengkel keselamatan siber dan simulasi penggodaman beretika (pen-test) dijadualkan pada 18 September 2026.',
    lastUpdatedDate: '2026-08-29',
    history: [
      {
        id: 'upd-003-1',
        date: '2026-04-15',
        progressPercentage: 35,
        status: 'In Progress',
        progressUpdate: 'Pemasangan pelayan keselamatan awan hibrid di Pusat Data Kerajaan Negeri siap.',
        issueBlocker: '',
        nextAction: 'Mulakan pengujian protokol keselamatan siber zero-trust.',
        recordedBy: 'Ernywati Binti Mohd Azmi'
      },
      {
        id: 'upd-003-2',
        date: '2026-08-29',
        progressPercentage: 65,
        status: 'In Progress',
        progressUpdate: 'Gerbang API kerajaan negeri berjaya menghubungkan 8 agensi rintis termasuk sistem e-Penyata Kewangan dan direktori perjawatan JPANS.',
        issueBlocker: 'Memorandum Persefahaman (MoU) perkongsian data silang agensi sedang menunggu pengesahan peguam besar negeri.',
        nextAction: 'Bengkel keselamatan siber dan simulasi penggodaman beretika (pen-test) dijadualkan pada 18 September 2026.',
        recordedBy: 'Ernywati Binti Mohd Azmi'
      }
    ]
  },
  {
    id: 'PRJ-2026-004',
    title: 'Program Transformasi Digital Perpustakaan Komuniti Luar Bandar (Smart Rural Library Hub)',
    description: 'Menaik taraf 28 cawangan dan perpustakaan desa PNS dengan zon pembelajaran sains & teknologi, peranti interaktif IoT, perkhidmatan jalur lebar satelit dan kiosk e-buku.',
    leadAgency: 'Perpustakaan Negeri Sabah (PNS)',
    participatingAgencies: [
      'Jabatan Teknologi Digital Dan Inovasi Negeri Sabah (JTDI)',
      'Kementerian Pendidikan, Sains, Teknologi & Inovasi (KPSTI)'
    ],
    unitSection: 'Bahagian Perpustakaan Wilayah & Rangkaian Komuniti',
    projectLead: 'Hajjah Fatimah Abdillah',
    assignedTeam: 'Unit Perpustakaan Maya & Pustakawan Lapangan Zon Pedalaman',
    startDate: '2025-05-01',
    targetCompletionDate: '2026-10-31',
    status: 'In Progress',
    progressPercentage: 88,
    latestProgressUpdate: 'Pemasangan terminal satelit Starlink dan kiosk tablet e-PNS selesai di 22 lokasi perpustakaan desa termasuk di Keningau, Ranau dan Beluran.',
    currentIssueBlocker: '',
    nextAction: 'Latihan pengurusan literasi maklumat digital untuk kakitangan perpustakaan daerah pada minggu hadapan.',
    lastUpdatedDate: '2026-08-25',
    history: [
      {
        id: 'upd-004-1',
        date: '2026-08-25',
        progressPercentage: 88,
        status: 'In Progress',
        progressUpdate: 'Pemasangan terminal satelit Starlink dan kiosk tablet e-PNS selesai di 22 lokasi perpustakaan desa termasuk di Keningau, Ranau dan Beluran.',
        issueBlocker: '',
        nextAction: 'Latihan pengurusan literasi maklumat digital untuk kakitangan perpustakaan daerah pada minggu hadapan.',
        recordedBy: 'Hajjah Fatimah Abdillah'
      }
    ]
  },
  {
    id: 'PRJ-2026-005',
    title: 'Program Pembangunan Bakat TVET Teknologi Tinggi & Kejuruteraan Automasi Industri 4.0',
    description: 'Inisiatif pensijilan kepakaran teknikal peringkat industri tinggi merangkumi automasi robotik, pengelasan bawah air, mekatronik industri dan automotif elektrik (EV) untuk anak tempatan.',
    leadAgency: 'Sabah Skills and Technology Centre (SSTC)',
    participatingAgencies: [
      'Jabatan Pembangunan Sumber Manusia (JPSM)',
      'Sabah Creative Economy And Innovation Centre (SCENIC)',
      'Kementerian Pendidikan, Sains, Teknologi & Inovasi (KPSTI)'
    ],
    unitSection: 'Jabatan Latihan Teknikal & Pembangunan Korporat',
    projectLead: 'Natalie Fung',
    assignedTeam: 'Pakar Latihan Industri Mekatronik & Automasi SSTC, Pasukan Penempatan Industri',
    startDate: '2025-03-01',
    targetCompletionDate: '2026-06-30',
    status: 'Completed',
    progressPercentage: 100,
    latestProgressUpdate: 'Kohort pertama seramai 250 juruteknik mahir telah tamat pensijilan antarabangsa dengan kadar kebolehpasaran 94% dalam tempoh 3 bulan.',
    currentIssueBlocker: '',
    nextAction: 'Menyediakan laporan impak tahunan untuk dibentangkan kepada Majlis Tindakan Ekonomi Sabah.',
    lastUpdatedDate: '2026-07-15',
    history: [
      {
        id: 'upd-005-1',
        date: '2026-02-15',
        progressPercentage: 70,
        status: 'In Progress',
        progressUpdate: 'Latihan fasa amali makmal Siemens Mechatronic Systems di SSTC berjalan lancar.',
        issueBlocker: '',
        nextAction: 'Jalankan peperiksaan pensijilan tahap profesional.',
        recordedBy: 'Natalie Fung'
      },
      {
        id: 'upd-005-2',
        date: '2026-07-15',
        progressPercentage: 100,
        status: 'Completed',
        progressUpdate: 'Kohort pertama seramai 250 juruteknik mahir telah tamat pensijilan antarabangsa dengan kadar kebolehpasaran 94% dalam tempoh 3 bulan.',
        issueBlocker: '',
        nextAction: 'Menyediakan laporan impak tahunan untuk dibentangkan kepada Majlis Tindakan Ekonomi Sabah.',
        recordedBy: 'Natalie Fung'
      }
    ]
  },
  {
    id: 'PRJ-2026-006',
    title: 'Kerangka Tadbir Urus Kerajaan Digital Tanpa Kertas & Piawaian Keselamatan Maklumat Awam',
    description: 'Merangka pekeliling, prosedur operasi standard (SOP) dan garis panduan pengurusan tandatangan digital, arkib rekod elektronik serta dasar data terbuka bagi agensi kerajaan negeri.',
    leadAgency: 'Bahagian Kerajaan Digital (DGD)',
    participatingAgencies: [
      'Jabatan Teknologi Digital Dan Inovasi Negeri Sabah (JTDI)',
      'Kementerian Kewangan Negeri Sabah (MOF Sabah)'
    ],
    unitSection: 'Unit Dasar, Governans & Piawaian Digital',
    projectLead: 'Mohd Razali Bin Zainal',
    assignedTeam: 'Pasukan Audit Keselamatan Maklumat, Pegawai Perundangan Digital',
    startDate: '2026-01-15',
    targetCompletionDate: '2026-09-30',
    status: 'In Progress',
    progressPercentage: 78,
    latestProgressUpdate: 'Draf pekeliling tandatangan digital kerajaan telah selesai disemak bersama Jabatan Peguam Besar Negeri.',
    currentIssueBlocker: '',
    nextAction: 'Sesi taklimat penerangan kepada semua Pegawai Maklumat Utama (CIO) jabatan pada 24 September 2026.',
    lastUpdatedDate: '2026-08-26',
    history: [
      {
        id: 'upd-006-1',
        date: '2026-08-26',
        progressPercentage: 78,
        status: 'In Progress',
        progressUpdate: 'Draf pekeliling tandatangan digital kerajaan telah selesai disemak bersama Jabatan Peguam Besar Negeri.',
        issueBlocker: '',
        nextAction: 'Sesi taklimat penerangan kepada semua Pegawai Maklumat Utama (CIO) jabatan pada 24 September 2026.',
        recordedBy: 'Mohd Razali Bin Zainal'
      }
    ]
  },
  {
    id: 'PRJ-2026-007',
    title: 'Inisiatif Pembudayaan STEM & Hab Sains Komuniti Pedalaman Sabah',
    description: 'Penyelaras program pendedahan sains praktikal, kit eksperimen robotik bergerak, dan penganjuran Karnival STEM Tahunan untuk pelajar sekolah rendah dan menengah luar bandar.',
    leadAgency: 'Kementerian Pendidikan, Sains, Teknologi & Inovasi (KPSTI)',
    participatingAgencies: [
      'Perpustakaan Negeri Sabah (PNS)',
      'Sabah Creative Economy And Innovation Centre (SCENIC)',
      'Sabah Skills and Technology Centre (SSTC)'
    ],
    unitSection: 'Bahagian Pembudayaan Sains & Teknologi',
    projectLead: '', // Unassigned Lead
    assignedTeam: '', // Unassigned Team
    startDate: '2026-02-01',
    targetCompletionDate: '2027-03-31',
    status: 'Planning',
    progressPercentage: 25,
    latestProgressUpdate: 'Pelan modul pembelajaran STEM luar bilik darjah telah dirangka bersama fakulti sains UMS dan guru pakar sains tempatan.',
    currentIssueBlocker: '',
    nextAction: 'Lantik Pegawai Pengurus Projek dan mulakan tender perolehan 4 buah van pameran sains bergerak.',
    lastUpdatedDate: '2026-08-15',
    history: [
      {
        id: 'upd-007-1',
        date: '2026-08-15',
        progressPercentage: 25,
        status: 'Planning',
        progressUpdate: 'Pelan modul pembelajaran STEM luar bilik darjah telah dirangka bersama fakulti sains UMS dan guru pakar sains tempatan.',
        issueBlocker: '',
        nextAction: 'Lantik Pegawai Pengurus Projek dan mulakan tender perolehan 4 buah van pameran sains bergerak.',
        recordedBy: 'Sekretariat Bahagian Sains KPSTI'
      }
    ]
  },
  {
    id: 'PRJ-2026-008',
    title: 'Rangkaian Jalur Lebar Pusat Komuniti Desa & Kiosk e-Perkhidmatan Kesihatan Awam',
    description: 'Pemasangan infrastruktur telekesihatan digital di dewan komuniti kampung terpilih bagi membolehkan konsultasi perubatan jarak jauh bersama pakar hospital rujukan.',
    leadAgency: 'Jabatan Kesihatan Negeri Sabah (JKNS)',
    participatingAgencies: [
      'Jabatan Teknologi Digital Dan Inovasi Negeri Sabah (JTDI)',
      'Jabatan Kerja Raya Sabah (JKR)'
    ],
    unitSection: 'Unit Kesihatan Awam & Teleperubatan Luar Bandar',
    projectLead: 'Dr. Raymond Lo',
    assignedTeam: 'Jurutera Sistem Komunikasi JKNS, Bahagian Elektrik JKR',
    startDate: '2025-07-01',
    targetCompletionDate: '2026-11-15',
    status: 'On Hold',
    progressPercentage: 40,
    latestProgressUpdate: '15 kiosk perubatan telah dibekalkan ke fasiliti daerah. Pemasangan peranti telemetri jantung dan tekanan darah terhenti sementara.',
    currentIssueBlocker: 'Gangguan bekalan kuasa luar grid dan ketiadaan generator sandaran di 5 klinik desa pedalaman Pensiangan & Nabawan.',
    nextAction: 'Mesyuarat pelan mitigasi bekalan tenaga solar bersama SESB dan JKR Cawangan Elektrik pada 15 September 2026.',
    lastUpdatedDate: '2026-08-12',
    history: [
      {
        id: 'upd-008-1',
        date: '2026-08-12',
        progressPercentage: 40,
        status: 'On Hold',
        progressUpdate: '15 kiosk perubatan telah dibekalkan ke fasiliti daerah. Pemasangan peranti telemetri jantung dan tekanan darah terhenti sementara.',
        issueBlocker: 'Gangguan bekalan kuasa luar grid dan ketiadaan generator sandaran di 5 klinik desa pedalaman Pensiangan & Nabawan.',
        nextAction: 'Mesyuarat pelan mitigasi bekalan tenaga solar bersama SESB dan JKR Cawangan Elektrik pada 15 September 2026.',
        recordedBy: 'Dr. Raymond Lo'
      }
    ]
  }
];
