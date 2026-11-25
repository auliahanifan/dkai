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
export type TelegramTone = 'executive' | 'operational' | 'paragraph';

/**
 * Telegram Desktop/Mobile client bold syntax uses double asterisks (**text**).
 * Single asterisks (*text*) render literally in Telegram chat input.
 */
function bold(text: string, format: TelegramFormat): string {
  return format === 'markdown' ? `**${text}**` : text;
}

function buildFilterScope(filters: SalesFilters): string {
  const parts: string[] = [];
  if (filters.region !== 'ALL') parts.push(`Region ${filters.region}`);
  if (filters.brand !== 'ALL') parts.push(`Brand ${filters.brand}`);
  if (filters.outletType !== 'ALL') parts.push(`Kanal ${filters.outletType}`);
  if (parts.length === 0) return 'Nasional';
  return parts.join(' · ');
}

function buildActionRecommendation(metrics: DashboardMetrics, includeSalesmen: boolean): string {
  const weakest = metrics.weakestOutlets;
  if (weakest.length === 0) {
    return 'Pantau ketersediaan stok dan ritme kunjungan sales.';
  }

  const allSingleCarton = weakest.every(
    (o) => o.invoiceCount > 0 && o.avgCartonsPerInvoice <= 1.2,
  );
  const avgWeakDrop =
    weakest.reduce((sum, o) => sum + o.avgCartonsPerInvoice, 0) / weakest.length;
  const missingCoreCount = weakest.filter((o) => o.missingCoreBrand).length;
  const coreBrand = weakest[0]?.coreBrandName || 'brand utama';

  if (allSingleCarton) {
    const coreNote =
      missingCoreCount > 0 ? ` (${missingCoreCount} belum masuk ${coreBrand})` : '';
    return `Kelima outlet rata-rata hanya order ${formatDecimal(avgWeakDrop, 1)} karton/invoice${coreNote} — dorong paket bundling min. 3 karton & penetrasi SKU utama.`;
  }

  const uniqueSalesmen = Array.from(
    new Set(weakest.map((o) => o.primarySalesman).filter((s) => s && s !== 'Tidak tercatat')),
  );
  if (includeSalesmen && uniqueSalesmen.length > 0) {
    return `Jadwalkan follow-up bersama ${uniqueSalesmen.join(', ')} untuk cek stok display, drop size, dan aktivasi promo.`;
  }
  return 'Jadwalkan follow-up tim sales untuk evaluasi drop size, frekuensi kunjungan, dan aktivasi promo.';
}

/**
 * Generates a readable Indonesian Telegram briefing for a Sales Manager:
 * - 'executive' (default): scannable multi-line Telegram update ideal for mobile reading.
 * - 'operational': multi-line update with branch, salesman per weak outlet, and churn radar.
 * - 'paragraph': compact single-paragraph summary without line breaks.
 */
export function generateTelegramSummary(
  metrics: DashboardMetrics,
  filters: SalesFilters,
  format: TelegramFormat = 'markdown',
  tone: TelegramTone = 'executive',
): string {
  if (metrics.totals.rowCount === 0) {
    return 'Tidak ada transaksi penjualan yang cocok dengan filter aktif saat ini. Longgarkan filter tanggal, region, brand, atau tipe outlet untuk menyusun ringkasan Telegram.';
  }

  const periodLabel = formatDateRange(metrics.totals.dateMin, metrics.totals.dateMax);
  const scopeLabel = buildFilterScope(filters);
  const totalNet = bold(formatIdrCompact(metrics.totals.netSalesIdr), format);
  const totalQty = `${formatNumber(metrics.totals.qtyCarton)} karton`;
  const outletCount = `${formatNumber(metrics.totals.activeOutletCount)} outlet`;

  const { latestMonth, prevMonth, runRateDeltaPct } = metrics.monthlyComparison;
  let momentumClause = '';
  if (latestMonth && prevMonth && runRateDeltaPct !== null) {
    const latestShort = latestMonth.label.split(' ')[0];
    const prevShort = prevMonth.label.split(' ')[0];
    momentumClause = `, run-rate harian ${latestShort} ${bold(formatSignedPct(runRateDeltaPct), format)} vs ${prevShort}`;
  }

  const topChannel = metrics.byChannel[0];
  const channelClause =
    filters.outletType === 'ALL' && topChannel && topChannel.sharePct >= 50
      ? `; ${formatPct(topChannel.sharePct, 0)} dari ${topChannel.outletCount} ${topChannel.outletType}`
      : '';

  const topRegion = metrics.byRegion[0];
  const bottomRegion =
    metrics.byRegion.length > 1 ? metrics.byRegion[metrics.byRegion.length - 1] : null;
  const topBrand = metrics.byBrand[0];
  const secondBrand = metrics.byBrand.length > 1 ? metrics.byBrand[1] : null;
  const weakest = metrics.weakestOutlets;
  const weakCount = weakest.length;
  const actionLine = buildActionRecommendation(metrics, tone === 'operational');

  // Strict single-paragraph option
  if (tone === 'paragraph') {
    const regText = topRegion
      ? bottomRegion && filters.region === 'ALL'
        ? `${bold(topRegion.name, format)} memimpin wilayah (${formatIdrCompact(topRegion.netSalesIdr)}; ${formatPct(topRegion.sharePct)}) dan ${bottomRegion.name} terendah (${formatIdrCompact(bottomRegion.netSalesIdr)})`
        : `Wilayah ${bold(topRegion.name, format)} membukukan ${formatIdrCompact(topRegion.netSalesIdr)}`
      : '';
    const brandText = topBrand
      ? secondBrand && filters.brand === 'ALL'
        ? `${bold(topBrand.name, format)} terkuat (${formatPct(topBrand.sharePct)}) diikuti ${secondBrand.name} (${formatPct(secondBrand.sharePct)})`
        : `brand ${bold(topBrand.name, format)} mencatat ${formatNumber(topBrand.qtyCarton)} karton`
      : '';
    const weakList = weakest
      .map((o) => `${o.outletName}/${o.outletId} (${formatIdrCompact(o.netSalesIdr)})`)
      .join(', ');

    return [
      `${bold(`Update Penjualan ${periodLabel}`, format)} (${scopeLabel}): net sales ${totalNet} (${totalQty} · ${outletCount}${channelClause})${momentumClause}.`,
      regText && brandText ? `${regText}; dari sisi brand, ${brandText}.` : '',
      weakCount > 0
        ? `Perlu perhatian pada ${bold(`${weakCount} outlet terlemah`, format)}: ${weakList}. ${actionLine}`
        : '',
    ]
      .filter(Boolean)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Scannable multi-line Telegram formats ('executive' & 'operational')
  const lines: string[] = [];

  lines.push(`📊 ${bold(`Update Penjualan ${periodLabel}`, format)} (${scopeLabel})`);
  lines.push(
    `Net sales ${totalNet} (${totalQty} · ${outletCount}${channelClause})${momentumClause}.`,
  );
  lines.push('');

  if (topRegion) {
    if (bottomRegion && filters.region === 'ALL') {
      lines.push(
        `• ${bold('Region:', format)} ${topRegion.name} terkuat (${formatIdrCompact(topRegion.netSalesIdr)}; ${formatPct(topRegion.sharePct)}) · ${bottomRegion.name} terendah (${formatIdrCompact(bottomRegion.netSalesIdr)}; ${formatPct(bottomRegion.sharePct)})`,
      );
    } else {
      lines.push(
        `• ${bold('Region:', format)} ${topRegion.name} — ${formatIdrCompact(topRegion.netSalesIdr)} (${formatPct(topRegion.sharePct)})`,
      );
    }
  }

  if (topBrand) {
    if (secondBrand && filters.brand === 'ALL') {
      lines.push(
        `• ${bold('Brand:', format)} ${topBrand.name} #1 (${formatIdrCompact(topBrand.netSalesIdr)}; ${formatPct(topBrand.sharePct)}) · diikuti ${secondBrand.name} (${formatPct(secondBrand.sharePct)})`,
      );
    } else {
      lines.push(
        `• ${bold('Brand:', format)} ${topBrand.name} — ${formatIdrCompact(topBrand.netSalesIdr)} (${formatNumber(topBrand.qtyCarton)} karton)`,
      );
    }
  }

  if (weakCount > 0) {
    lines.push('');
    lines.push(
      `🔻 ${bold(`${weakCount} Outlet Terlemah:`, format)}`,
    );
    weakest.forEach((o, idx) => {
      if (tone === 'operational') {
        lines.push(
          `${idx + 1}. ${o.outletName} [${o.outletId}, ${o.branch} · ${o.primarySalesman}] — ${formatIdrCompact(o.netSalesIdr)}`,
        );
      } else {
        lines.push(
          `${idx + 1}. ${o.outletName} (${o.outletId}, ${o.branch}) — ${formatIdrCompact(o.netSalesIdr)}`,
        );
      }
    });
  }

  if (tone === 'operational' && metrics.dormantOutlets.length > 0) {
    const topDormant = metrics.dormantOutlets[0];
    lines.push('');
    lines.push(
      `⚠️ ${bold('Radar Churn:', format)} ${metrics.dormantOutlets.length} outlet ${topDormant.priorPeriodLabel} belum repeat order di ${topDormant.silentPeriodLabel} (terbesar: ${topDormant.outletName}/${topDormant.outletId}, ${formatIdrCompact(topDormant.priorNetSalesIdr)}).`,
    );
  }

  lines.push('');
  lines.push(`🎯 ${bold('Fokus:', format)} ${actionLine}`);

  return lines.join('\n');
}
