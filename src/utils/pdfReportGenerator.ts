import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Project, Agency } from '../types';

export interface ReportGenerationOptions {
  generatedBy?: string;
  department?: string;
  notes?: string;
}

export interface ReportSummaryData {
  totalProjects: number;
  completed: number;
  inProgress: number;
  delayed: number;
  planning: number;
  onHold: number;
  avgProgress: number;
  projectsWithBlockers: Project[];
  recentMilestones: Array<{
    id: string;
    projectTitle: string;
    agency: string;
    date: string;
    progress: number;
    status: string;
    milestone: string;
    isCompletion: boolean;
  }>;
}

export interface ReportGenerationResult {
  success: boolean;
  fileName: string;
  summary: ReportSummaryData;
}

/**
 * Extracts and prepares the executive report summary data from project entities
 */
export function extractReportData(projects: Project[]): ReportSummaryData {
  const totalProjects = projects.length;
  const completed = projects.filter(p => p.status === 'Completed').length;
  const inProgress = projects.filter(p => p.status === 'In Progress').length;
  const delayed = projects.filter(p => p.status === 'Delayed').length;
  const planning = projects.filter(p => p.status === 'Planning').length;
  const onHold = projects.filter(p => p.status === 'On Hold').length;

  const totalProgress = projects.reduce((acc, p) => acc + (p.progressPercentage || 0), 0);
  const avgProgress = totalProjects > 0 ? Math.round(totalProgress / totalProjects) : 0;

  // Filter projects with blockers
  const projectsWithBlockers = projects.filter(p => {
    if (!p.currentIssueBlocker) return false;
    const issue = p.currentIssueBlocker.trim().toLowerCase();
    return (
      issue !== '' &&
      issue !== 'tiada' &&
      issue !== 'none' &&
      issue !== '-' &&
      !issue.startsWith('tiada isu') &&
      !issue.startsWith('tiada halangan')
    ) || p.status === 'Delayed';
  });

  // Extract recent milestones & progress achievements
  interface MilestoneItem {
    id: string;
    projectTitle: string;
    agency: string;
    date: string;
    progress: number;
    status: string;
    milestone: string;
    isCompletion: boolean;
  }

  const milestones: MilestoneItem[] = [];

  projects.forEach(p => {
    if (p.latestProgressUpdate && p.latestProgressUpdate.trim().length > 0) {
      milestones.push({
        id: p.id,
        projectTitle: p.title,
        agency: p.leadAgency,
        date: p.lastUpdatedDate || p.targetCompletionDate || 'Terkini',
        progress: p.progressPercentage,
        status: p.status,
        milestone: p.latestProgressUpdate,
        isCompletion: p.status === 'Completed' || p.progressPercentage === 100
      });
    }

    if (p.history && p.history.length > 0) {
      p.history.forEach(h => {
        if (h.progressUpdate && h.progressUpdate !== p.latestProgressUpdate) {
          milestones.push({
            id: p.id,
            projectTitle: p.title,
            agency: p.leadAgency,
            date: h.date,
            progress: h.progressPercentage,
            status: h.status,
            milestone: h.progressUpdate,
            isCompletion: h.status === 'Completed' || h.progressPercentage === 100
          });
        }
      });
    }
  });

  milestones.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const recentMilestones = milestones.slice(0, 10);

  return {
    totalProjects,
    completed,
    inProgress,
    delayed,
    planning,
    onHold,
    avgProgress,
    projectsWithBlockers,
    recentMilestones
  };
}

/**
 * Generates an executive PDF report containing:
 * 1. Portfolio status summary & metrics
 * 2. Current project statuses table
 * 3. Identified blockers and mitigation actions
 * 4. Recent milestones and latest updates
 * 5. Lead agency breakdown and governance audit note
 */
export async function generateProjectSummaryPDF(
  projects: Project[],
  agencies: Agency[] = [],
  options: ReportGenerationOptions = {}
): Promise<ReportGenerationResult> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // Primary colors
  const emeraldPrimary = [5, 150, 105]; // #059669
  const darkSlate = [15, 23, 42];       // #0f172a
  const slate600 = [71, 85, 105];       // #475569
  const borderSlate = [226, 232, 240];  // #e2e8f0

  const summary = extractReportData(projects);
  const {
    totalProjects,
    completed,
    inProgress,
    delayed,
    avgProgress,
    projectsWithBlockers,
    recentMilestones
  } = summary;

  // -------------------------------------------------------------
  // Header Banner & Organization Info
  // -------------------------------------------------------------
  // Top green accent bar
  doc.setFillColor(emeraldPrimary[0], emeraldPrimary[1], emeraldPrimary[2]);
  doc.rect(0, 0, pageWidth, 5, 'F');

  let currentY = 15;

  // State Ministry Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(emeraldPrimary[0], emeraldPrimary[1], emeraldPrimary[2]);
  doc.text('KEMENTERIAN SAINS, TEKNOLOGI DAN INOVASI SABAH (KPSTI)', margin, currentY);

  currentY += 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.text('Laporan Ringkasan Status Inisiatif & Analisis Portfolio', margin, currentY);

  currentY += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(slate600[0], slate600[1], slate600[2]);
  const dateStr = new Date().toLocaleDateString('ms-MY', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  const timeStr = new Date().toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' });
  const officerNote = options.generatedBy ? ` | Pegawai: ${options.generatedBy}` : '';
  const deptNote = options.department ? ` (${options.department})` : '';
  doc.text(`Dijana pada: ${dateStr}, ${timeStr}${officerNote}${deptNote} | Pangkalan Data: Cloud Firestore Live`, margin, currentY);

  currentY += 8;

  // Thin separator line
  doc.setDrawColor(borderSlate[0], borderSlate[1], borderSlate[2]);
  doc.setLineWidth(0.5);
  doc.line(margin, currentY, pageWidth - margin, currentY);

  currentY += 6;

  // -------------------------------------------------------------
  // Executive KPI Summary Boxes (4 columns)
  // -------------------------------------------------------------
  const boxGap = 3.5;
  const boxWidth = (contentWidth - boxGap * 3) / 4;
  const boxHeight = 16;

  const kpis = [
    { label: 'JUMLAH INISIATIF', value: `${totalProjects}`, sub: 'Portfolio Aktif', color: [15, 23, 42] },
    { label: 'SELESAI (COMPLETED)', value: `${completed}`, sub: `${totalProjects > 0 ? Math.round((completed / totalProjects) * 100) : 0}% daripada portfolio`, color: [13, 148, 136] },
    { label: 'SEDANG BERJALAN', value: `${inProgress}`, sub: `Purata: ${avgProgress}% Kemajuan`, color: [5, 150, 105] },
    { label: 'ISU & TERLEWAT', value: `${delayed + projectsWithBlockers.length}`, sub: `${delayed} lewat, ${projectsWithBlockers.length} isu`, color: [225, 29, 72] },
  ];

  kpis.forEach((kpi, idx) => {
    const x = margin + idx * (boxWidth + boxGap);
    // Background card
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(x, currentY, boxWidth, boxHeight, 1.5, 1.5, 'F');
    doc.setDrawColor(borderSlate[0], borderSlate[1], borderSlate[2]);
    doc.roundedRect(x, currentY, boxWidth, boxHeight, 1.5, 1.5, 'S');

    // Label
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.label, x + 3, currentY + 4.5);

    // Big Value
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.text(kpi.value, x + 3, currentY + 10.5);

    // Subtitle
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.sub, x + 3, currentY + 14);
  });

  currentY += boxHeight + 8;

  // -------------------------------------------------------------
  // SECTION 1: Status Semasa Projek (Project Status Table)
  // -------------------------------------------------------------
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.text('1. Status Semasa Portfolio Inisiatif Digital Sabah', margin, currentY);
  currentY += 3;

  const projectTableRows = projects.map((p, idx) => {
    const statusText = p.status === 'Completed' ? 'Selesai' :
      p.status === 'In Progress' ? 'Sedang Berjalan' :
      p.status === 'Delayed' ? 'Tertunggak' :
      p.status === 'Planning' ? 'Perancangan' : 'Ditangguhkan';

    return [
      `${idx + 1}`,
      p.id,
      p.title,
      p.leadAgency,
      statusText,
      `${p.progressPercentage || 0}%`,
      p.targetCompletionDate || '-'
    ];
  });

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [['No', 'Kod ID', 'Nama Inisiatif / Projek', 'Agensi Peneraju', 'Status', 'Kemajuan', 'Sasaran Selesai']],
    body: projectTableRows,
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      font: 'helvetica',
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.2
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 24, fontStyle: 'bold' },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 26 },
      4: { cellWidth: 24, halign: 'center' },
      5: { cellWidth: 16, halign: 'right', fontStyle: 'bold' },
      6: { cellWidth: 22, halign: 'center' }
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 4) {
        const text = String(data.cell.raw);
        if (text === 'Selesai') {
          data.cell.styles.textColor = [13, 148, 136];
          data.cell.styles.fontStyle = 'bold';
        } else if (text === 'Tertunggak') {
          data.cell.styles.textColor = [225, 29, 72];
          data.cell.styles.fontStyle = 'bold';
        } else if (text === 'Sedang Berjalan') {
          data.cell.styles.textColor = [5, 150, 105];
        }
      }
    }
  });

  // -------------------------------------------------------------
  // SECTION 2: Isu Penghalang & Risiko (Blockers & Mitigations)
  // -------------------------------------------------------------
  const afterProjectTableY = (doc as any).lastAutoTable.finalY + 10;
  
  // Check if we should start on new page
  if (afterProjectTableY > pageHeight - 60) {
    doc.addPage();
    currentY = 18;
  } else {
    currentY = afterProjectTableY;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.text('2. Laporan Isu Penghalang (Blockers) & Tindakan Mitigasi', margin, currentY);
  
  currentY += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(slate600[0], slate600[1], slate600[2]);
  doc.text(
    'Pengenalpastian isu operasi, kekangan teknikal dan tindakan pemulihan yang direkodkan bagi setiap inisiatif.',
    margin,
    currentY
  );
  currentY += 3;

  if (projectsWithBlockers.length === 0) {
    doc.setFillColor(240, 253, 244);
    doc.setDrawColor(187, 247, 208);
    doc.roundedRect(margin, currentY, contentWidth, 12, 1.5, 1.5, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(22, 101, 52);
    doc.text('Tiada Isu Penghalang Kritikal Direkodkan', margin + 4, currentY + 5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text('Semua inisiatif aktif di bawah KPSTI sedang beroperasi mengikut jadual pelaksanaan.', margin + 4, currentY + 9);
    currentY += 16;
  } else {
    const blockerRows = projectsWithBlockers.map((p, idx) => {
      const issue = p.currentIssueBlocker && p.currentIssueBlocker.trim() !== '' 
        ? p.currentIssueBlocker 
        : p.status === 'Delayed' ? 'Projek mengalami kelewatan berbanding jadual garis masa asal.' : 'Perlu semakan semula';
      const action = p.nextAction && p.nextAction.trim() !== '' 
        ? p.nextAction 
        : 'Menunggu semakan semula pelan tindakan antara agensi.';

      return [
        `${idx + 1}`,
        p.title,
        p.leadAgency,
        p.status === 'Delayed' ? 'Tertunggak' : p.status,
        issue,
        action
      ];
    });

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [['No', 'Nama Projek', 'Agensi', 'Status', 'Isu Penghalang / Kekangan (Blocker)', 'Tindakan Seterusnya / Mitigasi']],
      body: blockerRows,
      theme: 'grid',
      styles: {
        fontSize: 7,
        cellPadding: 2.2,
        font: 'helvetica',
        textColor: [30, 41, 59],
        lineColor: [226, 232, 240],
        lineWidth: 0.2
      },
      headStyles: {
        fillColor: [185, 28, 28], // Crimson red for blockers
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7.5
      },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 38, fontStyle: 'bold' },
        2: { cellWidth: 22 },
        3: { cellWidth: 18, halign: 'center' },
        4: { cellWidth: 50 },
        5: { cellWidth: 'auto' }
      }
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;
  }

  // -------------------------------------------------------------
  // SECTION 3: Pencapaian & Milestone Terkini (Recent Milestones)
  // -------------------------------------------------------------
  if (currentY > pageHeight - 55) {
    doc.addPage();
    currentY = 18;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.text('3. Pencapaian Milestone & Kemaskini Kemajuan Terkini', margin, currentY);

  currentY += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(slate600[0], slate600[1], slate600[2]);
  doc.text(
    'Sorotan pencapaian fasa, pelancaran sistem, dan output kemajuan terbaharu yang direkodkan oleh pasukan projek.',
    margin,
    currentY
  );
  currentY += 3;

  if (recentMilestones.length === 0) {
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, currentY, contentWidth, 10, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Belum ada log pencapaian milestone terperinci direkodkan.', margin + 4, currentY + 6);
    currentY += 15;
  } else {
    const milestoneRows = recentMilestones.map((m, idx) => [
      `${idx + 1}`,
      m.date,
      m.projectTitle,
      m.agency,
      `${m.progress}%`,
      m.milestone
    ]);

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [['No', 'Tarikh Rekod', 'Nama Inisiatif', 'Agensi Peneraju', 'Kemajuan', 'Catatan Pencapaian Milestone / Status']],
      body: milestoneRows,
      theme: 'grid',
      styles: {
        fontSize: 7,
        cellPadding: 2,
        font: 'helvetica',
        textColor: [30, 41, 59],
        lineColor: [226, 232, 240],
        lineWidth: 0.2
      },
      headStyles: {
        fillColor: [5, 150, 105], // Emerald green for achievements
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7.5
      },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 20, halign: 'center' },
        2: { cellWidth: 42, fontStyle: 'bold' },
        3: { cellWidth: 24 },
        4: { cellWidth: 16, halign: 'right', fontStyle: 'bold' },
        5: { cellWidth: 'auto' }
      }
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;
  }

  // -------------------------------------------------------------
  // SECTION 4: Taburan Mengikut Agensi (Lead Agency Distribution)
  // -------------------------------------------------------------
  if (currentY > pageHeight - 50) {
    doc.addPage();
    currentY = 18;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.text('4. Ringkasan Agihan Portfolio Mengikut Agensi Peneraju', margin, currentY);
  currentY += 3;

  const agencyCounts: { [key: string]: { count: number; completed: number; avgProgress: number; totalProg: number } } = {};
  projects.forEach(p => {
    const aName = p.leadAgency || 'Lain-lain';
    if (!agencyCounts[aName]) {
      agencyCounts[aName] = { count: 0, completed: 0, avgProgress: 0, totalProg: 0 };
    }
    agencyCounts[aName].count++;
    if (p.status === 'Completed') agencyCounts[aName].completed++;
    agencyCounts[aName].totalProg += (p.progressPercentage || 0);
  });

  const agencyRows = Object.entries(agencyCounts).map(([agencyName, stats], idx) => {
    const avg = stats.count > 0 ? Math.round(stats.totalProg / stats.count) : 0;
    const share = totalProjects > 0 ? `${Math.round((stats.count / totalProjects) * 100)}%` : '0%';
    return [
      `${idx + 1}`,
      agencyName,
      `${stats.count} Inisiatif`,
      share,
      `${stats.completed} Projek`,
      `${avg}%`
    ];
  });

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [['No', 'Nama Agensi / Jabatan', 'Jumlah Projek Diuruskan', 'Peratusan Portfolio', 'Projek Telah Selesai', 'Purata Kemajuan']],
    body: agencyRows,
    theme: 'grid',
    styles: {
      fontSize: 7,
      cellPadding: 2,
      font: 'helvetica',
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.2
    },
    headStyles: {
      fillColor: [79, 70, 229], // Indigo for agency summary
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 'auto', fontStyle: 'bold' },
      2: { cellWidth: 32, halign: 'center' },
      3: { cellWidth: 26, halign: 'center' },
      4: { cellWidth: 28, halign: 'center' },
      5: { cellWidth: 26, halign: 'right', fontStyle: 'bold' }
    }
  });

  // -------------------------------------------------------------
  // Global Footer on Every Page (Page numbering & Audit note)
  // -------------------------------------------------------------
  const totalPages = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(borderSlate[0], borderSlate[1], borderSlate[2]);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      'Kementerian Sains, Teknologi dan Inovasi Sabah (KPSTI) • Enjin Pemantauan Berpusat',
      margin,
      pageHeight - 8
    );

    const pageNumText = `Halaman ${i} daripada ${totalPages}`;
    const pageNumWidth = doc.getTextWidth(pageNumText);
    doc.text(pageNumText, pageWidth - margin - pageNumWidth, pageHeight - 8);
  }

  // Trigger download with clean sanitized filename
  const safeDate = new Date().toISOString().split('T')[0];
  const fileName = `Laporan_Ringkasan_KPSTI_Inisiatif_${safeDate}.pdf`;
  doc.save(fileName);

  return {
    success: true,
    fileName,
    summary
  };
}
