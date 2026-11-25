import { formatDateRange, formatIdrCompact, formatNumber, formatPct } from './formatters';
import type { DashboardMetrics, SalesFilters } from './salesAnalytics';

export type TelegramFormat = 'plain' | 'markdown';

function bold(text: string, format: TelegramFormat): string {
  return format === 'markdown' ? `*${text}*` : text;
}

function buildFilterScope(filters: SalesFilters): string {
  const parts: string[] = [];
  if (filters.region !== 'ALL') parts.push(`region ${filters.region}`);
  if (filters.brand !== 'ALL') parts.push(`brand ${filters.brand}`);
  if (filters.outletType !== 'ALL') parts.push(`kanal ${filters.outletType}`);
  if (parts.length === 0) return 'seluruh cakupan nasional';
  return parts.join(', ');
}

/**
 * Generates a single crisp Indonesian paragraph ready for a Sales Manager on Telegram.
 */
export function generateTelegramSummary(
  metrics: DashboardMetrics,
  filters: SalesFilters,
  format: TelegramFormat = 'plain',
): string {
  if (metrics.totals.rowCount === 0) {
    return 'Tidak ada transaksi penjualan yang cocok dengan filter aktif saat ini; silakan longgarkan filter tanggal, region, brand, atau tipe outlet untuk menyusun ringkasan Telegram.';
  }

  const periodLabel = formatDateRange(metrics.totals.dateMin, metrics.totals.dateMax);
  const scopeLabel = buildFilterScope(filters);
  const totalNet = bold(formatIdrCompact(metrics.totals.netSalesIdr), format);
  const totalQty = `${formatNumber(metrics.totals.qtyCarton)} karton`;
  const outletCount = `${formatNumber(metrics.totals.activeOutletCount)} outlet aktif`;

  const topRegion = metrics.byRegion[0];
  const bottomRegion = metrics.byRegion.length > 1 ? metrics.byRegion[metrics.byRegion.length - 1] : null;
  const topBrand = metrics.byBrand[0];
  const secondBrand = metrics.byBrand.length > 1 ? metrics.byBrand[1] : null;

  const regionHighlight = topRegion
    ? bottomRegion && filters.region === 'ALL'
      ? `Kontributor wilayah terbesar adalah ${bold(topRegion.name, format)} (${formatIdrCompact(topRegion.netSalesIdr)}; ${formatPct(topRegion.sharePct)}), sementara ${bottomRegion.name} tercatat paling rendah (${formatIdrCompact(bottomRegion.netSalesIdr)}; ${formatPct(bottomRegion.sharePct)}).`
      : `Wilayah ${bold(topRegion.name, format)} menyumbang ${formatIdrCompact(topRegion.netSalesIdr)} (${formatPct(topRegion.sharePct)}).`
    : '';

  const brandHighlight = topBrand
    ? secondBrand && filters.brand === 'ALL'
      ? `Dari sisi produk, ${bold(topBrand.name, format)} memimpin dengan ${formatIdrCompact(topBrand.netSalesIdr)} (${formatPct(topBrand.sharePct)}), diikuti ${secondBrand.name} (${formatPct(secondBrand.sharePct)}).`
      : `Produk ${bold(topBrand.name, format)} membukukan ${formatIdrCompact(topBrand.netSalesIdr)} (${formatNumber(topBrand.qtyCarton)} karton).`
    : '';

  const weakest = metrics.weakestOutlets;
  const weakestList = weakest
    .map(
      (o) =>
        `${o.outletName} [${o.outletId}, ${o.branch}] ${formatIdrCompact(o.netSalesIdr)}`,
    )
    .join('; ');

  const uniqueSalesmen = Array.from(
    new Set(weakest.map((o) => o.primarySalesman).filter((s) => s && s !== 'Tidak tercatat')),
  );
  const followUpTarget =
    uniqueSalesmen.length > 0
      ? `segera jadwalkan follow-up bersama tim sales terkait (${uniqueSalesmen.join(', ')}) untuk cek stok, frekuensi kunjungan, dan potensi aktivasi promo.`
      : 'segera jadwalkan follow-up kunjungan untuk cek stok dan potensi aktivasi promo.';

  const weakCountLabel =
    weakest.length === 5
      ? bold('5 outlet terlemah', format)
      : bold(`${weakest.length} outlet terlemah`, format);

  const avgOutlet = formatIdrCompact(metrics.totals.avgSalesPerOutletIdr);

  const sentences = [
    `${bold(`Update Penjualan ${periodLabel}`, format)} (${scopeLabel}): total net sales mencapai ${totalNet} (${totalQty}) dari ${outletCount} dengan rata-rata ${avgOutlet}/outlet.`,
    regionHighlight,
    brandHighlight,
    `Perlu perhatian khusus pada ${weakCountLabel}: ${weakestList} — ${followUpTarget}`,
  ].filter(Boolean);

  return sentences.join(' ');
}
