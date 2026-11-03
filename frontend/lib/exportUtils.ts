import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ExportDataPayload {
  auction: {
    name: string;
    sport: string;
    code?: string;
    scheduledAt?: string;
    playersPerTeam: number;
    pointsBalancePerTeam: number;
    minimumBid: number;
    maximumBid: number;
    bidIncrement: number;
  };
  teams: Array<{
    name: string;
    code: string;
    purseTotal?: number;
    purseRemaining: number;
    playersCount: number;
    maxPlayers?: number;
    ownerName?: string;
  }>;
  players: Array<{
    name: string;
    playerCode?: string;
    role: string;
    sport: string;
    basePrice: number;
    soldPrice?: number | null;
    status: string;
    teamName?: string;
  }>;
  stats: {
    sold: number;
    unsold: number;
    available: number;
    totalRegistered: number;
    totalTeams: number;
    totalSpend: number;
  };
}

/**
 * Protect against spreadsheet formula injection
 */
function sanitizeExcelCell(val: any): any {
  if (typeof val === 'string') {
    if (['=', '+', '-', '@'].includes(val.charAt(0))) {
      return `'${val}`;
    }
  }
  return val;
}

export function exportAuctionExcel(data: ExportDataPayload, filename = 'Auction_Results.xlsx') {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Overview
  const overviewRows = [
    ['AUCTION TOURNAMENT REPORT'],
    ['Generated On', new Date().toLocaleString()],
    ['Auction Name', data.auction.name],
    ['Sport', data.auction.sport],
    ['Minimum Bid', data.auction.minimumBid],
    ['Maximum Bid', data.auction.maximumBid],
    ['Bid Increment', data.auction.bidIncrement],
    ['Points Balance Per Team', data.auction.pointsBalancePerTeam],
    ['Roster Size Per Team', data.auction.playersPerTeam],
    [''],
    ['AUCTION SUMMARY STATISTICS'],
    ['Total Registered Players', data.stats.totalRegistered],
    ['Total Sold Players', data.stats.sold],
    ['Total Unsold Players', data.stats.unsold],
    ['Total Available / Remaining', data.stats.available],
    ['Total Registered Teams', data.stats.totalTeams],
    ['Total Gross Spend (Points)', data.stats.totalSpend],
  ];
  const wsOverview = XLSX.utils.aoa_to_sheet(overviewRows.map((r) => r.map(sanitizeExcelCell)));
  XLSX.utils.book_append_sheet(wb, wsOverview, 'Auction Summary');

  // Sheet 2: Sold Players
  const soldRows = [
    ['Player Code', 'Player Name', 'Sport Role', 'Base Price', 'Winning Team', 'Final Winning Bid (pts)', 'Status'],
  ];
  data.players
    .filter((p) => p.status === 'SOLD')
    .forEach((p) => {
      soldRows.push([
        p.playerCode || '-',
        p.name,
        p.role,
        String(p.basePrice || 0),
        p.teamName || 'Unassigned',
        String(p.soldPrice || 0),
        'SOLD',
      ]);
    });
  const wsSold = XLSX.utils.aoa_to_sheet(soldRows.map((r) => r.map(sanitizeExcelCell)));
  XLSX.utils.book_append_sheet(wb, wsSold, 'Sold Players');

  // Sheet 3: Unsold Players
  const unsoldRows = [['Player Code', 'Player Name', 'Sport Role', 'Base Price', 'Status']];
  data.players
    .filter((p) => p.status === 'UNSOLD')
    .forEach((p) => {
      unsoldRows.push([p.playerCode || '-', p.name, p.role, String(p.basePrice || 0), 'UNSOLD']);
    });
  const wsUnsold = XLSX.utils.aoa_to_sheet(unsoldRows.map((r) => r.map(sanitizeExcelCell)));
  XLSX.utils.book_append_sheet(wb, wsUnsold, 'Unsold Players');

  // Sheet 4: Teams Ledger
  const teamRows = [
    ['Team Code', 'Team Name', 'Owner / Captain', 'Initial Budget', 'Remaining Points', 'Players Bought', 'Roster Limit'],
  ];
  data.teams.forEach((t) => {
    teamRows.push([
      t.code,
      t.name,
      t.ownerName || '-',
      String(t.purseTotal || data.auction.pointsBalancePerTeam),
      String(t.purseRemaining),
      String(t.playersCount),
      String(t.maxPlayers || data.auction.playersPerTeam),
    ]);
  });
  const wsTeams = XLSX.utils.aoa_to_sheet(teamRows.map((r) => r.map(sanitizeExcelCell)));
  XLSX.utils.book_append_sheet(wb, wsTeams, 'Teams Standings');

  XLSX.writeFile(wb, filename);
}

export function exportAuctionPDF(data: ExportDataPayload, filename = 'Auction_Results.pdf') {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });

  // Header Banner
  doc.setFillColor(2, 19, 27); // Dark navy
  doc.rect(0, 0, doc.internal.pageSize.width, 90, 'F');

  doc.setTextColor(0, 210, 238); // Cyan
  doc.setFontSize(18);
  doc.text(data.auction.name.toUpperCase(), 40, 42);

  doc.setTextColor(200, 220, 230);
  doc.setFontSize(10);
  doc.text(`Official Live Auction Results Report • Sport: ${data.auction.sport} • ${new Date().toLocaleDateString()}`, 40, 65);

  let currentY = 110;

  // Key Metrics Table
  autoTable(doc, {
    startY: currentY,
    head: [['Total Players', 'Sold', 'Unsold', 'Available', 'Teams Count', 'Total Spent']],
    body: [
      [
        data.stats.totalRegistered,
        data.stats.sold,
        data.stats.unsold,
        data.stats.available,
        data.stats.totalTeams,
        `${data.stats.totalSpend.toLocaleString()} pts`,
      ],
    ],
    theme: 'grid',
    headStyles: { fillColor: [0, 210, 238], textColor: [2, 19, 27], fontStyle: 'bold' },
    styles: { fontSize: 9, halign: 'center' },
  });

  currentY = (doc as any).lastAutoTable.finalY + 25;

  // Team Standings Table
  doc.setTextColor(2, 19, 27);
  doc.setFontSize(12);
  doc.text('TEAM ROSTERS & REMAINING BUDGET', 40, currentY);

  autoTable(doc, {
    startY: currentY + 10,
    head: [['Team Code', 'Team Name', 'Owner', 'Remaining Points', 'Squad Filled']],
    body: data.teams.map((t) => [
      t.code,
      t.name,
      t.ownerName || '-',
      `${t.purseRemaining.toLocaleString()} pts`,
      `${t.playersCount} / ${t.maxPlayers || data.auction.playersPerTeam}`,
    ]),
    theme: 'striped',
    headStyles: { fillColor: [3, 30, 45], textColor: [255, 255, 255] },
    styles: { fontSize: 8.5 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 25;

  // Sold Players Table
  doc.setFontSize(12);
  doc.text('SOLD PLAYERS LIST', 40, currentY);

  const soldPlayers = data.players.filter((p) => p.status === 'SOLD');
  autoTable(doc, {
    startY: currentY + 10,
    head: [['Code', 'Player Name', 'Role', 'Base Price', 'Winning Team', 'Final Price']],
    body:
      soldPlayers.length > 0
        ? soldPlayers.map((p) => [
            p.playerCode || '-',
            p.name,
            p.role,
            `${p.basePrice.toLocaleString()} pts`,
            p.teamName || 'Assigned',
            `${(p.soldPrice || p.basePrice).toLocaleString()} pts`,
          ])
        : [['-', 'No players sold yet', '-', '-', '-', '-']],
    theme: 'striped',
    headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255] },
    styles: { fontSize: 8.5 },
  });

  // Footer on all pages
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(120, 140, 150);
    doc.text(
      `Page ${i} of ${pageCount} — Generated by Live Auction Control Center`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 20,
      { align: 'center' }
    );
  }

  doc.save(filename);
}
