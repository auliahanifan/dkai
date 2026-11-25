import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  computeCrossFilterDashboard,
  computeDashboardMetrics,
  filterSalesRecords,
  normalizeRegion,
  parseAndCleanSalesCsv,
} from './salesAnalytics';
import { generateTelegramSummary } from './telegramSummary';

describe('normalizeRegion', () => {
  it('normalizes known region aliases and casing', () => {
    expect(normalizeRegion('Jabar')).toBe('Jawa Barat');
    expect(normalizeRegion('JAWA BARAT')).toBe('Jawa Barat');
    expect(normalizeRegion('JABODETABEK')).toBe('Jabodetabek');
    expect(normalizeRegion('  jawa tengah  ')).toBe('Jawa Tengah');
  });
});

describe('parseAndCleanSalesCsv on real sales.csv', () => {
  const csvPath = path.resolve(process.cwd(), 'sales.csv');
  const csvText = fs.readFileSync(csvPath, 'utf-8');
  const dataset = parseAndCleanSalesCsv(csvText);

  it('cleans regions, trims trailing spaces, deduplicates exact copies, and backfills empty salesman', () => {
    expect(dataset.quality.rawRowCount).toBe(1351);
    expect(dataset.quality.duplicateRowsRemoved).toBe(2);
    expect(dataset.quality.cleanRowCount).toBe(1349);
    expect(dataset.quality.regionNormalizedCount).toBe(8);
    expect(dataset.quality.salesmanBackfilledCount).toBe(2);
    expect(dataset.quality.salesmanMissingCount).toBe(0);
    expect(dataset.quality.returnRowsCount).toBe(1);
    expect(dataset.quality.returnNetSalesIdr).toBe(-528000);
    expect(dataset.availableRegions).toEqual([
      'Jabodetabek',
      'Jawa Barat',
      'Jawa Tengah',
      'Jawa Timur',
      'Kalimantan',
      'Sumatera',
    ]);
  });

  it('groups outlets strictly by outlet_id, computes peer benchmarks and automated diagnostics', () => {
    const metrics = computeDashboardMetrics(dataset.records);
    expect(metrics.totals.activeOutletCount).toBe(52);
    expect(metrics.weakestOutlets).toHaveLength(5);
    expect(metrics.weakestOutlets.map((o) => o.outletId)).toEqual([
      'OUT1003',
      'OUT1026',
      'OUT1035',
      'OUT1042',
      'OUT1045',
    ]);

    const weakest = metrics.weakestOutlets[0];
    expect(weakest.netSalesIdr).toBe(378000);
    expect(weakest.avgCartonsPerInvoice).toBe(1);
    expect(weakest.peerAvgSalesIdr).toBeCloseTo(10163268, 0);
    expect(weakest.missingCoreBrand).toBe(true);
    expect(weakest.diagnosticTags.some((t) => t.includes('Drop size'))).toBe(true);
    expect(weakest.diagnosticTags.some((t) => t.includes('Tanpa Kacang DK'))).toBe(true);

    // Channel skew check: Grosir contributes ~64% of net sales
    const grosir = metrics.byChannel.find((c) => c.outletType === 'Grosir');
    expect(grosir?.outletCount).toBe(8);
    expect(grosir?.sharePct).toBeGreaterThan(60);
  });

  it('computes monthly run-rate comparison (partial October +5.8% daily run-rate) and detects 3 dormant outlets', () => {
    const metrics = computeDashboardMetrics(dataset.records, { allRecords: dataset.records });
    expect(metrics.monthlyComparison.months).toHaveLength(2);
    expect(metrics.monthlyComparison.latestMonth?.monthKey).toBe('2026-10');
    expect(metrics.monthlyComparison.latestMonth?.isPartial).toBe(true);
    expect(metrics.monthlyComparison.runRateDeltaPct).toBeGreaterThan(5);

    expect(metrics.dormantOutlets.map((o) => o.outletId)).toEqual([
      'OUT1043',
      'OUT1052',
      'OUT1048',
    ]);
    expect(metrics.dormantOutlets[0].priorNetSalesIdr).toBe(9181700);
  });

  it('does not collapse region/brand charts or matrix when cross-filtering a specific region or brand', () => {
    const cf = computeCrossFilterDashboard(dataset.records, {
      startDate: dataset.minDate,
      endDate: dataset.maxDate,
      region: 'Jabodetabek',
      brand: 'Sukro',
      outletType: 'ALL',
    });

    // Filtered metrics reflect the exact selection
    expect(cf.metrics.byRegion).toHaveLength(1);
    expect(cf.metrics.byRegion[0].name).toBe('Jabodetabek');
    expect(cf.metrics.byBrand).toHaveLength(1);
    expect(cf.metrics.byBrand[0].name).toBe('Sukro');

    // Non-collapsing visual summaries preserve peers for 1-click switching
    expect(cf.regionChartItems).toHaveLength(6);
    expect(cf.brandChartItems).toHaveLength(8);
    expect(cf.matrixData.regions).toHaveLength(6);
    expect(cf.matrixData.brands).toHaveLength(8);
  });

  it('does not set lastOrderDate from a return-only row', () => {
    const returnOnly = dataset.records.filter((r) => r.isReturn);
    const metrics = computeDashboardMetrics(returnOnly);
    const out = metrics.allOutlets.find((o) => o.outletId === 'OUT1049');
    expect(out).toBeDefined();
    expect(out?.invoiceCount).toBe(0);
    expect(out?.lastOrderDate).toBe('');
  });

  it('keeps returns included in Net Sales and updates metrics when filtered', () => {
    const filtered = filterSalesRecords(dataset.records, {
      startDate: '2026-10-01',
      endDate: '2026-10-14',
      region: 'Kalimantan',
      brand: 'ALL',
      outletType: 'ALL',
    });
    const metrics = computeDashboardMetrics(filtered);
    expect(metrics.totals.returnCount).toBe(1);
    expect(metrics.totals.returnNetSalesIdr).toBe(-528000);
    expect(metrics.byRegion).toHaveLength(1);
    expect(metrics.byRegion[0].name).toBe('Kalimantan');
  });

  it('generates a single-paragraph Telegram summary using native Telegram **bold** syntax and tone presets', () => {
    const filters = {
      startDate: dataset.minDate,
      endDate: dataset.maxDate,
      region: 'ALL',
      brand: 'ALL',
      outletType: 'ALL',
    };
    const metrics = computeDashboardMetrics(dataset.records, { allRecords: dataset.records });
    const plain = generateTelegramSummary(metrics, filters, 'plain', 'executive');
    const mdExec = generateTelegramSummary(metrics, filters, 'markdown', 'executive');
    const mdOps = generateTelegramSummary(metrics, filters, 'markdown', 'operational');

    expect(plain).not.toContain('\n');
    expect(mdExec).not.toContain('\n');
    expect(mdOps).not.toContain('\n');

    expect(plain).toContain('Jabodetabek');
    expect(plain).toContain('Kacang Dua Kelinci');
    expect(plain).toContain('OUT1003');
    expect(plain).toContain('OUT1045');
    expect(plain).toContain('1,0 karton/invoice');

    // Native Telegram bold uses **text**, never single *text*
    expect(mdExec).toContain('**Jabodetabek**');
    expect(mdExec).toContain('**5 outlet terlemah**');
    expect(mdExec.replace(/\*\*[^*]+\*\*/g, '')).not.toContain('*');

    // Operational tone adds salesman and dormant outlet context
    expect(mdOps).toContain('Andi');
    expect(mdOps).toContain('3 outlet dormant');
    expect(mdOps).toContain('OUT1043');
  });
});
