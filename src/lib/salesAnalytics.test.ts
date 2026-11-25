import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
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

  it('groups outlets strictly by outlet_id and finds the 5 weakest outlets accurately', () => {
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
    expect(metrics.weakestOutlets[0].netSalesIdr).toBe(378000);
    expect(metrics.byRegion[0].name).toBe('Jabodetabek');
    expect(metrics.byBrand[0].name).toBe('Kacang Dua Kelinci');
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

  it('generates a single-paragraph Telegram summary in both plain and markdown formats', () => {
    const filters = {
      startDate: dataset.minDate,
      endDate: dataset.maxDate,
      region: 'ALL',
      brand: 'ALL',
      outletType: 'ALL',
    };
    const metrics = computeDashboardMetrics(dataset.records);
    const plain = generateTelegramSummary(metrics, filters, 'plain');
    const md = generateTelegramSummary(metrics, filters, 'markdown');

    expect(plain).not.toContain('\n');
    expect(plain).toContain('Jabodetabek');
    expect(plain).toContain('Kacang Dua Kelinci');
    expect(plain).toContain('OUT1003');
    expect(plain).toContain('OUT1045');
    expect(md).toContain('*Jabodetabek*');
    expect(md).toContain('*5 outlet terlemah*');
  });
});
