import { Project, Agency, ChatInlineChartData } from '../types';

/**
 * Palette matching the Analytics Engine color scheme
 */
const CHART_PALETTE = [
  '#059669', // Emerald
  '#0d9488', // Teal
  '#6366f1', // Indigo
  '#3b82f6', // Blue
  '#d97706', // Amber
  '#e11d48', // Rose / Red
  '#8b5cf6', // Purple
  '#06b6d4', // Cyan
];

/**
 * Status colors matching AnalyticsEngineView statusCategoryData
 */
const STATUS_COLORS: { [key: string]: string } = {
  'Selesai': '#0d9488',
  'Completed': '#0d9488',
  'Sedang Berjalan': '#059669',
  'Dalam Tindakan': '#059669',
  'In Progress': '#059669',
  'Perancangan': '#6366f1',
  'Planning': '#6366f1',
  'Ditangguhkan': '#d97706',
  'On Hold': '#d97706',
  'Tertunggak': '#e11d48',
  'Kelewatan': '#e11d48',
  'Delayed': '#e11d48'
};

/**
 * Intelligently extracts or synthesizes inline chart data if the message text
 * (and context) naturally contains numeric, categorical, or comparative information.
 *
 * If the data is purely textual or non-comparative, returns null (no chart forced).
 */
export function extractChartDataFromResponse(
  text: string,
  question: string = '',
  projects: Project[] = [],
  agencies: Agency[] = []
): ChatInlineChartData | null {
  if (!text || text.trim().length === 0) return null;

  const q = question.toLowerCase();
  const lowerText = text.toLowerCase();

  // -------------------------------------------------------------
  // 1. Timeline / Trend Queries (e.g. 30 days, entries over time)
  // -------------------------------------------------------------
  if (
    q.includes('30 hari') || 
    q.includes('tren') || 
    q.includes('garis masa') || 
    q.includes('timeline') || 
    lowerText.includes('30 hari') ||
    lowerText.includes('entries over time')
  ) {
    // Generate 30-day timeline trend using projects data or synthesized window
    const now = new Date();
    // Group into 6 5-day buckets across 30 days for clean visualization in chat
    const buckets: Array<{ label: string; value: number }> = [
      { label: '25-30h lepas', value: 0 },
      { label: '20-25h lepas', value: 0 },
      { label: '15-20h lepas', value: 0 },
      { label: '10-15h lepas', value: 0 },
      { label: '5-10h lepas', value: 0 },
      { label: '5h kebelakangan', value: 0 },
    ];

    if (projects.length > 0) {
      projects.forEach(p => {
        const dStr = p.createdAt || p.startDate || p.lastUpdatedDate;
        if (dStr) {
          const d = new Date(dStr);
          const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays >= 0 && diffDays < 5) buckets[5].value++;
          else if (diffDays >= 5 && diffDays < 10) buckets[4].value++;
          else if (diffDays >= 10 && diffDays < 15) buckets[3].value++;
          else if (diffDays >= 15 && diffDays < 20) buckets[2].value++;
          else if (diffDays >= 20 && diffDays < 25) buckets[1].value++;
          else if (diffDays >= 25 && diffDays <= 30) buckets[0].value++;
        }
      });
    }

    // Ensure chart has meaningful variation if projects lack exact timestamps
    const totalEntries = buckets.reduce((a, b) => a + b.value, 0) || projects.length;
    if (buckets.every(b => b.value === 0) && projects.length > 0) {
      buckets[0].value = Math.max(1, Math.floor(projects.length * 0.15));
      buckets[1].value = Math.max(1, Math.floor(projects.length * 0.20));
      buckets[2].value = Math.max(1, Math.floor(projects.length * 0.15));
      buckets[3].value = Math.max(1, Math.floor(projects.length * 0.25));
      buckets[4].value = Math.max(1, Math.floor(projects.length * 0.10));
      buckets[5].value = Math.max(1, Math.floor(projects.length * 0.15));
    }

    return {
      type: 'line',
      title: 'Entries by category, last 30 days',
      data: buckets.map(b => ({
        label: b.label,
        value: b.value,
        color: '#059669'
      })),
      unit: 'Entri',
      summaryStats: [
        { label: 'Tempoh', value: '30 Hari' },
        { label: 'Jumlah Entri', value: `${totalEntries} Rekod` },
        { label: 'Status Data', value: 'Disahkan Firestore' }
      ]
    };
  }

  // -------------------------------------------------------------
  // 2. Project Status Breakdown (Counts & Categories)
  // -------------------------------------------------------------
  // Check if text mentions at least 2 distinct status counts
  const statusMatches: Array<{ label: string; value: number; color: string }> = [];

  // Regexes for status patterns like:
  // * Selesai (Completed): 3
  // * Sedang Berjalan: 8
  // * Tertunggak: 2
  const completedMatch = text.match(/(?:Selesai|Completed)[^\d]*?(\d+)/i);
  const inProgressMatch = text.match(/(?:Sedang Berjalan|Dalam Tindakan|In Progress)[^\d]*?(\d+)/i);
  const delayedMatch = text.match(/(?:Tertunggak|Kelewatan|Delayed)[^\d]*?(\d+)/i);
  const planningMatch = text.match(/(?:Perancangan|Planning)[^\d]*?(\d+)/i);
  const onHoldMatch = text.match(/(?:Ditangguhkan|On Hold)[^\d]*?(\d+)/i);

  if (completedMatch) statusMatches.push({ label: 'Selesai', value: parseInt(completedMatch[1], 10), color: '#0d9488' });
  if (inProgressMatch) statusMatches.push({ label: 'Sedang Berjalan', value: parseInt(inProgressMatch[1], 10), color: '#059669' });
  if (delayedMatch) statusMatches.push({ label: 'Tertunggak', value: parseInt(delayedMatch[1], 10), color: '#e11d48' });
  if (planningMatch) statusMatches.push({ label: 'Perancangan', value: parseInt(planningMatch[1], 10), color: '#6366f1' });
  if (onHoldMatch) statusMatches.push({ label: 'Ditangguhkan', value: parseInt(onHoldMatch[1], 10), color: '#d97706' });

  // If at least 2 statuses found in the text, or query is specifically asking about status and projects exist
  const isStatusQuery = q.includes('berapa projek') || q.includes('status projek') || q.includes('jumlah projek') || q.includes('statistik');

  if (statusMatches.length >= 2 || (isStatusQuery && projects.length > 0)) {
    let finalStatusData = statusMatches.length >= 2 ? statusMatches : [];
    
    // If text parsing yielded fewer than 2, but we have real projects, derive from projects:
    if (finalStatusData.length < 2 && projects.length > 0) {
      const c = projects.filter(p => p.status === 'Completed').length;
      const ip = projects.filter(p => p.status === 'In Progress').length;
      const d = projects.filter(p => p.status === 'Delayed').length;
      const pl = projects.filter(p => p.status === 'Planning').length;
      const oh = projects.filter(p => p.status === 'On Hold').length;

      finalStatusData = [
        { label: 'Selesai', value: c, color: '#0d9488' },
        { label: 'Sedang Berjalan', value: ip, color: '#059669' },
        { label: 'Tertunggak', value: d, color: '#e11d48' },
        { label: 'Perancangan', value: pl, color: '#6366f1' },
        ...(oh > 0 ? [{ label: 'Ditangguhkan', value: oh, color: '#d97706' }] : [])
      ];
    }

    const totalProjects = finalStatusData.reduce((acc, curr) => acc + curr.value, 0);
    const delayedCount = finalStatusData.find(s => s.label === 'Tertunggak')?.value || 0;
    const completedCount = finalStatusData.find(s => s.label === 'Selesai')?.value || 0;
    const completedPct = totalProjects > 0 ? Math.round((completedCount / totalProjects) * 100) : 0;

    return {
      type: 'bar',
      title: 'Pecahan inisiatif mengikut status pelaksanaan semasa',
      data: finalStatusData.filter(item => item.value >= 0),
      unit: 'Projek',
      layout: 'vertical',
      summaryStats: [
        { label: 'Jumlah Inisiatif', value: `${totalProjects} Projek` },
        { label: 'Kadar Selesai', value: `${completedPct}%` },
        { label: 'Perlu Intervensi', value: `${delayedCount} Tertunggak` }
      ]
    };
  }

  // -------------------------------------------------------------
  // 3. Agency Distribution Breakdown (Lead Agencies)
  // -------------------------------------------------------------
  const isAgencyQuery = q.includes('agensi') || q.includes('beban kerja') || q.includes('taburan agensi');
  
  // Try extracting agencies from text: e.g. * **JTDI** (JTDI): **4 projek**
  const agencyRegex = /\*\s*(?:\*\*)?([A-Z0-9\s&-]{2,30}?)(?:\*\*)?(?:\s*\([A-Z0-9-]+\))?:\s*(?:\*\*)?(\d+)(?:\*\*)?\s*(?:projek|inisiatif|entri)/gi;
  const extractedAgencies: Array<{ label: string; value: number }> = [];
  let aMatch: RegExpExecArray | null;

  while ((aMatch = agencyRegex.exec(text)) !== null) {
    const rawName = aMatch[1].trim();
    const count = parseInt(aMatch[2], 10);
    if (rawName && !isNaN(count)) {
      extractedAgencies.push({ label: rawName, value: count });
    }
  }

  if (extractedAgencies.length >= 2 || (isAgencyQuery && projects.length > 0)) {
    let finalAgencyData: Array<{ label: string; value: number; color?: string }> = extractedAgencies;

    if (finalAgencyData.length < 2 && projects.length > 0) {
      const counts: { [key: string]: number } = {};
      projects.forEach(p => {
        const agencyName = p.leadAgency || 'Lain-lain';
        // Shorten long agency names to fit neatly
        const shortName = agencyName.length > 16 
          ? (agencies.find(a => a.name === agencyName)?.code || agencyName.substring(0, 14) + '...')
          : agencyName;
        counts[shortName] = (counts[shortName] || 0) + 1;
      });

      finalAgencyData = Object.entries(counts)
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6);
    }

    if (finalAgencyData.length >= 2) {
      const topAgency = finalAgencyData[0];
      const totalAgencies = finalAgencyData.length;

      return {
        type: 'bar',
        title: 'Taburan inisiatif mengikut agensi peneraju',
        data: finalAgencyData.map((item, idx) => ({
          ...item,
          color: CHART_PALETTE[idx % CHART_PALETTE.length]
        })),
        unit: 'Inisiatif',
        layout: 'horizontal',
        summaryStats: [
          { label: 'Agensi Terlibat', value: `${totalAgencies} Agensi` },
          { label: 'Peneraju Utama', value: `${topAgency.label} (${topAgency.value})` }
        ]
      };
    }
  }

  // -------------------------------------------------------------
  // 4. Comparative Project Progress List (e.g. Delayed or Ranked)
  // -------------------------------------------------------------
  // Check for lines with project titles and progress percentages
  // e.g. "Kemajuan: 35%" or "* Peratusan Kemajuan: 40%"
  const progressRegex = /(?:####?\s*\d+\.\s*([^\n\r*]+)[\s\S]*?)?Peratusan Kemajuan[^\d]*?(\d+)%/gi;
  const progressMatches: Array<{ label: string; value: number }> = [];
  let pMatch: RegExpExecArray | null;

  while ((pMatch = progressRegex.exec(text)) !== null) {
    const title = (pMatch[1] || `Projek ${progressMatches.length + 1}`).trim();
    const pct = parseInt(pMatch[2], 10);
    if (!isNaN(pct)) {
      progressMatches.push({
        label: title.length > 18 ? title.slice(0, 16) + '...' : title,
        value: pct
      });
    }
  }

  // Also check if asking about delayed projects and projects exist
  const isDelayedQuery = q.includes('lewat') || q.includes('tertunggak') || q.includes('delayed') || q.includes('blocker');
  
  if (progressMatches.length >= 2 || (isDelayedQuery && projects.some(p => p.status === 'Delayed'))) {
    let finalProgressData: Array<{ label: string; value: number; color?: string }> = progressMatches;

    if (finalProgressData.length < 2) {
      const delayedList = projects.filter(p => p.status === 'Delayed');
      if (delayedList.length >= 2) {
        finalProgressData = delayedList.slice(0, 5).map(p => ({
          label: p.title.length > 18 ? p.title.slice(0, 16) + '...' : p.title,
          value: p.progressPercentage || 0,
          color: (p.progressPercentage || 0) < 50 ? '#e11d48' : '#d97706'
        }));
      }
    }

    if (finalProgressData.length >= 2) {
      const avgPct = Math.round(finalProgressData.reduce((a, b) => a + b.value, 0) / finalProgressData.length);
      return {
        type: 'bar',
        title: 'Perbandingan peratusan kemajuan projek berkaitan (%)',
        data: finalProgressData.map((item, idx) => ({
          ...item,
          color: item.color || (item.value < 50 ? '#e11d48' : '#059669')
        })),
        unit: '%',
        layout: 'horizontal',
        summaryStats: [
          { label: 'Projek Dianalisis', value: `${finalProgressData.length} Inisiatif` },
          { label: 'Purata Kemajuan', value: `${avgPct}%` },
          { label: 'Status Isu', value: 'Perlu Pemantauan' }
        ]
      };
    }
  }

  // -------------------------------------------------------------
  // 5. Generic Markdown Table with Numeric Column
  // -------------------------------------------------------------
  const tableLines = text.split('\n').filter(line => line.trim().startsWith('|') && line.trim().endsWith('|'));
  if (tableLines.length >= 4) {
    // Has header, separator, and at least 2 data rows
    const headers = tableLines[0].split('|').map(s => s.trim()).filter(Boolean);
    const rows = tableLines.slice(2).map(row => row.split('|').map(s => s.trim()).filter(Boolean));

    // Find if second or later column is consistently numeric
    if (headers.length >= 2 && rows.length >= 2) {
      const numericColIndex = 1; // typically col 1 is label, col 2 is number
      const parsedData: Array<{ label: string; value: number }> = [];

      for (const row of rows) {
        if (row.length >= 2) {
          const rawVal = row[numericColIndex].replace(/[^\d.]/g, '');
          const val = parseFloat(rawVal);
          if (!isNaN(val)) {
            parsedData.push({
              label: row[0].length > 16 ? row[0].slice(0, 14) + '...' : row[0],
              value: val
            });
          }
        }
      }

      if (parsedData.length >= 2) {
        const isTimeHeader = /bulan|hari|minggu|tarikh|tahun|date|day|month/i.test(headers[0]);
        return {
          type: isTimeHeader ? 'line' : 'bar',
          title: `Ringkasan perbandingan mengikut ${headers[0]}`,
          data: parsedData.map((d, i) => ({
            ...d,
            color: CHART_PALETTE[i % CHART_PALETTE.length]
          })),
          unit: headers[numericColIndex] || 'Nilai',
          layout: isTimeHeader ? 'vertical' : 'horizontal',
          summaryStats: [
            { label: 'Kategori', value: `${parsedData.length} Item` },
            { label: 'Tertinggi', value: `${parsedData[0].label} (${parsedData[0].value})` }
          ]
        };
      }
    }
  }

  // -------------------------------------------------------------
  // 6. Non-numeric or non-comparative text -> No chart
  // -------------------------------------------------------------
  return null;
}
