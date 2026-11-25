import {
  formatDateRange,
  formatDecimal,
  formatIdrCompact,
  formatNumber,
  formatPct,
  formatSignedPct,
} from './formatters';
import type { DashboardMetrics, SalesFilters } from './salesAnalytics';

export type TelegramFormat = 'plain' | 'markdown';
export type TelegramTone = 'executive' | 'operational';

/**
 * Telegram Desktop/Mobile client bold syntax uses double asterisks (**text**).
 * Single asterisks (*text*) render literally in Telegram chat input.
 */
function bold(text: string, format: TelegramFormat): string {
  return format === 'markdown' ? `**${text}**` : text;
}

function buildFilterScope(filters: SalesFilters): string {
  const parts: string[] = [];
  if (filters.region !== 'ALL') parts.push(`region ${filters.region}`);
  if (filters.brand !== 'ALL') parts.push(`brand ${filters.brand}`);
  if (filters.outletType !== 'ALL') parts.push(`kanal ${filters.outletType}`);
  if (parts.length === 0) return 'nasional';
  return parts.join(', ');
}

function formatWeakestClause(
  metrics: DashboardMetrics,
  tone: TelegramTone,
  format: TelegramFormat,
): string {
  const weakest = metrics.weakestOutlets;
  if (weakest.length === 0) return '';

  const weakCountLabel =
    weakest.length === 5
      ? bold('5 outlet terlemah', format)
      : bold(`${weakest.length} outlet terlemah`, format);

  const listItems = weakest.map((o) =>
    tone === 'executive'
      ? `${o.outletName}/${o.outletId} (${formatIdrCompact(o.netSalesIdr)})`
      : `${o.outletName} [${o.outletId}, ${o.branch} · ${o.primarySalesman}] ${formatIdrCompact(o.netSalesIdr)}`,
  );

  const formattedList =
    listItems.length > 1
      ? `${listItems.slice(0, -1).join(', ')}, dan ${listItems[listItems.length - 1]}`
      : listItems[0];

  const allSingleCarton =
    weakest.length > 0 && weakest.every((o) => o.invoiceCount > 0 && o.avgCartonsPerInvoice <= 1.2);
  const avgWeakDrop =
    weakest.length > 0
      ? weakest.reduce((sum, o) => sum + o.avgCartonsPerInvoice, 0) / weakest.length
      : 0;
  const missingCoreCount = weakest.filter((o) => o.missingCoreBrand).length;
  const coreBrand = weakest[0]?.coreBrandName || 'brand utama';

  let rootCauseAndAction: string;
  if (allSingleCarton) {
    rootCauseAndAction =
      missingCoreCount > 0
        ? `seluruhnya rata-rata hanya order ${formatDecimal(avgWeakDrop, 1)} karton/invoice (${missingCoreCount} outlet belum menyerap ${coreBrand}), sehingga tim sales perlu mendorong bundling min. 3 karton & penetrasi SKU utama.`
        : `seluruhnya rata-rata hanya order ${formatDecimal(avgWeakDrop, 1)} karton/invoice, sehingga tim sales perlu mendorong bundling min. 3 karton per kunjungan.`;
  } else {
    const uniqueSalesmen = Array.from(
      new Set(weakest.map((o) => o.primarySalesman).filter((s) => s && s !== 'Tidak tercatat')),
    );
    rootCauseAndAction =
      uniqueSalesmen.length > 0 && tone === 'operational'
        ? `segera jadwalkan follow-up bersama ${uniqueSalesmen.join(', ')} untuk evaluasi drop size, frekuensi kunjungan, dan aktivasi promo.`
        : 'segera jadwalkan follow-up tim sales untuk evaluasi drop size, stok display, dan aktivasi promo.';
  }

  return `Prioritas tindak lanjut pada ${weakCountLabel}: ${formattedList} — ${rootCauseAndAction}`;
}

/**
 * Generates a single crisp Indonesian paragraph ready to paste into Telegram for a Sales Manager.
 */
export function generateTelegramSummary(
  metrics: DashboardMetrics,
  filters: SalesFilters,
  format: TelegramFormat = 'markdown',
  tone: TelegramTone = 'executive',
): string {
  if (metrics.totals.rowCount === 0) {
    return 'Tidak ada transaksi penjualan yang cocok dengan filter aktif saat ini; silakan longgarkan filter tanggal, region, brand, atau tipe outlet untuk menyusun ringkasan Telegram.';
  }

  const periodLabel = formatDateRange(metrics.totals.dateMin, metrics.totals.dateMax);
  const scopeLabel = buildFilterScope(filters);
  const totalNet = bold(formatIdrCompact(metrics.totals.netSalesIdr), format);
  const totalQty = `${formatNumber(metrics.totals.qtyCarton)} karton`;
  const outletCount = `${formatNumber(metrics.totals.activeOutletCount)} outlet aktif`;

  // Momentum run-rate note (especially valuable for partial-month Oct vs Sep)
  const { latestMonth, prevMonth, runRateDeltaPct } = metrics.monthlyComparison;
  let momentumNote = '';
  if (latestMonth && prevMonth && runRateDeltaPct !== null) {
    const latestShort = latestMonth.label.split(' ')[0];
    const prevShort = prevMonth.label.split(' ')[0];
    momentumNote = ` dengan run-rate harian ${latestShort} ${bold(formatSignedPct(runRateDeltaPct), format)} vs ${prevShort}`;
  }

  // Channel dominance context if viewing all outlet types
  const topChannel = metrics.byChannel[0];
  const channelNote =
    filters.outletType === 'ALL' && topChannel && topChannel.sharePct >= 50
      ? `; ${formatPct(topChannel.sharePct, 0)} disumbang ${topChannel.outletCount} ${topChannel.outletType}`
      : '';

  const topRegion = metrics.byRegion[0];
  const bottomRegion =
    metrics.byRegion.length > 1 ? metrics.byRegion[metrics.byRegion.length - 1] : null;
  const topBrand = metrics.byBrand[0];
  const secondBrand = metrics.byBrand.length > 1 ? metrics.byBrand[1] : null;

  let perfSentence = '';
  if (topRegion && topBrand) {
    if (tone === 'executive') {
      const regPart =
        bottomRegion && filters.region === 'ALL'
          ? `${bold(topRegion.name, format)} memimpin wilayah (${formatIdrCompact(topRegion.netSalesIdr)}; ${formatPct(topRegion.sharePct)}) sementara ${bottomRegion.name} terendah (${formatIdrCompact(bottomRegion.netSalesIdr)})`
          : `wilayah ${bold(topRegion.name, format)} membukukan ${formatIdrCompact(topRegion.netSalesIdr)}`;
      const brandPart =
        secondBrand && filters.brand === 'ALL'
          ? `dari sisi produk, ${bold(topBrand.name, format)} terkuat (${formatPct(topBrand.sharePct)}), diikuti ${secondBrand.name} (${formatPct(secondBrand.sharePct)})`
          : `produk ${bold(topBrand.name, format)} mencatat ${formatNumber(topBrand.qtyCarton)} karton`;
      perfSentence = `${regPart}, dan ${brandPart}.`;
    } else {
      const regSentence =
        bottomRegion && filters.region === 'ALL'
          ? `Kontributor wilayah terbesar adalah ${bold(topRegion.name, format)} (${formatIdrCompact(topRegion.netSalesIdr)}; ${formatPct(topRegion.sharePct)}), sedangkan ${bottomRegion.name} paling rendah (${formatIdrCompact(bottomRegion.netSalesIdr)}; ${formatPct(bottomRegion.sharePct)}).`
          : `Wilayah ${bold(topRegion.name, format)} menyumbang ${formatIdrCompact(topRegion.netSalesIdr)} (${formatPct(topRegion.sharePct)}).`;
      const brandSentence =
        secondBrand && filters.brand === 'ALL'
          ? `Pada lini brand, ${bold(topBrand.name, format)} memimpin (${formatIdrCompact(topBrand.netSalesIdr)}; ${formatPct(topBrand.sharePct)}), diikuti ${secondBrand.name} (${formatPct(secondBrand.sharePct)}).`
          : `Produk ${bold(topBrand.name, format)} membukukan ${formatIdrCompact(topBrand.netSalesIdr)} (${formatNumber(topBrand.qtyCarton)} karton).`;
      perfSentence = `${regSentence} ${brandSentence}`;
    }
  }

  const weakestClause = formatWeakestClause(metrics, tone, format);

  const dormant = metrics.dormantOutlets;
  const dormantClause =
    tone === 'operational' && dormant.length > 0
      ? ` Waspadai pula ${bold(`${dormant.length} outlet dormant`, format)} yang belum repeat order di ${dormant[0].silentPeriodLabel} (terbesar: ${dormant[0].outletName}/${dormant[0].outletId}, ${formatIdrCompact(dormant[0].priorNetSalesIdr)} di ${dormant[0].priorPeriodLabel}).`
      : '';

  const lead = `${bold(`Update Penjualan ${periodLabel}`, format)} (${scopeLabel}): total net sales ${totalNet} (${totalQty}; ${outletCount}${channelNote})${momentumNote}.`;

  return [lead, perfSentence, `${weakestClause}${dormantClause}`]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}
