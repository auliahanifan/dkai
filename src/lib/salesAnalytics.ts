import { formatDateDayMonth, formatMonthKey } from './formatters';

export interface SalesRecord {
  date: string;
  invoiceNo: string;
  region: string;
  branch: string;
  outletId: string;
  outletName: string;
  outletType: string;
  salesman: string;
  brand: string;
  sku: string;
  qtyCarton: number;
  pricePerCartonIdr: number;
  grossSalesIdr: number;
  discountIdr: number;
  netSalesIdr: number;
  isReturn: boolean;
}

export interface RegionNormalizationItem {
  from: string;
  to: string;
  count: number;
}

export interface DuplicateRemovedItem {
  invoiceNo: string;
  sku: string;
  date: string;
  netSalesIdr: number;
}

export interface SharedOutletNameGroup {
  outletName: string;
  outletIds: string[];
}

export interface DataQualityReport {
  rawRowCount: number;
  cleanRowCount: number;
  regionNormalizedCount: number;
  regionNormalizations: RegionNormalizationItem[];
  trimmedFieldCount: number;
  trimmedRowsCount: number;
  duplicateRowsRemoved: number;
  duplicatesRemoved: DuplicateRemovedItem[];
  salesmanBackfilledCount: number;
  salesmanMissingCount: number;
  returnRowsCount: number;
  returnNetSalesIdr: number;
  sharedOutletNameGroups: SharedOutletNameGroup[];
  invalidRowsSkipped: number;
}

export interface ParsedSalesDataset {
  records: SalesRecord[];
  quality: DataQualityReport;
  availableRegions: string[];
  availableBrands: string[];
  availableOutletTypes: string[];
  minDate: string;
  maxDate: string;
}

export interface SalesFilters {
  startDate: string;
  endDate: string;
  region: string; // 'ALL' or specific region
  brand: string; // 'ALL' or specific brand
  outletType: string; // 'ALL' or specific outlet type
}

export interface DimensionSummary {
  name: string;
  netSalesIdr: number;
  grossSalesIdr: number;
  discountIdr: number;
  qtyCarton: number;
  sharePct: number;
  outletCount: number;
  invoiceCount: number;
  avgSalesPerOutletIdr: number;
}

export interface MatrixCell {
  netSalesIdr: number;
  qtyCarton: number;
  invoiceCount: number;
  shareOfRegionPct: number;
}

export interface RegionBrandMatrix {
  regions: string[];
  brands: string[];
  cells: Record<string, Record<string, MatrixCell>>;
  regionTotals: Record<string, MatrixCell>;
  brandTotals: Record<string, MatrixCell>;
  maxCellNetSalesIdr: number;
  maxCellQtyCarton: number;
  maxCellRegionSharePct: number;
}

export interface ChannelSummary {
  outletType: string;
  netSalesIdr: number;
  sharePct: number;
  outletCount: number;
  avgSalesPerOutletIdr: number;
  medianSalesPerOutletIdr: number;
  avgCartonsPerInvoice: number;
  discountRatePct: number;
}

export interface OutletPerformance {
  outletId: string;
  outletName: string;
  branch: string;
  region: string;
  outletType: string;
  primarySalesman: string;
  netSalesIdr: number;
  grossSalesIdr: number;
  discountIdr: number;
  discountRatePct: number;
  qtyCarton: number;
  invoiceCount: number;
  avgCartonsPerInvoice: number;
  lastOrderDate: string;
  gapVsAvgPct: number;
  peerAvgSalesIdr: number;
  peerAvgCartonsPerInvoice: number;
  gapVsPeerPct: number;
  brandsBought: string[];
  skuCount: number;
  missingCoreBrand: boolean;
  coreBrandName: string;
  diagnosticTags: string[];
  records: SalesRecord[];
}

export interface DormantOutlet {
  outletId: string;
  outletName: string;
  branch: string;
  region: string;
  outletType: string;
  primarySalesman: string;
  priorNetSalesIdr: number;
  priorInvoiceCount: number;
  lastOrderDate: string;
  priorPeriodLabel: string;
  silentPeriodLabel: string;
}

export interface DailyTrendPoint {
  date: string;
  monthKey: string;
  netSalesIdr: number;
  qtyCarton: number;
  invoiceCount: number;
  activeOutletCount: number;
}

export interface WeeklyTrendPoint {
  weekStart: string;
  weekEnd: string;
  label: string;
  monthKey: string;
  netSalesIdr: number;
  qtyCarton: number;
  invoiceCount: number;
  activeDays: number;
}

export interface MonthlySummary {
  monthKey: string;
  label: string;
  startDate: string;
  endDate: string;
  activeDays: number;
  daysInCalendarMonth: number;
  maxDayOfMonth: number;
  isPartial: boolean;
  netSalesIdr: number;
  qtyCarton: number;
  invoiceCount: number;
  activeOutletCount: number;
  dailyRunRateIdr: number;
}

export interface MonthlyRunRateComparison {
  months: MonthlySummary[];
  latestMonth: MonthlySummary | null;
  prevMonth: MonthlySummary | null;
  runRateDeltaPct: number | null;
}

export interface DashboardMetrics {
  totals: {
    netSalesIdr: number;
    grossSalesIdr: number;
    discountIdr: number;
    discountRatePct: number;
    qtyCarton: number;
    invoiceCount: number;
    returnCount: number;
    returnNetSalesIdr: number;
    activeOutletCount: number;
    avgSalesPerOutletIdr: number;
    avgCartonsPerInvoice: number;
    activeDays: number;
    dailyRunRateIdr: number;
    rowCount: number;
    dateMin: string;
    dateMax: string;
  };
  byRegion: DimensionSummary[];
  byBrand: DimensionSummary[];
  byChannel: ChannelSummary[];
  matrix: RegionBrandMatrix;
  weakestOutlets: OutletPerformance[];
  allOutlets: OutletPerformance[];
  allOutletsCount: number;
  dailyTrend: DailyTrendPoint[];
  weeklyTrend: WeeklyTrendPoint[];
  monthlyComparison: MonthlyRunRateComparison;
  dormantOutlets: DormantOutlet[];
}

export interface CrossFilterDashboard {
  metrics: DashboardMetrics;
  regionChartItems: DimensionSummary[];
  brandChartItems: DimensionSummary[];
  matrixData: RegionBrandMatrix;
}

const REQUIRED_COLUMNS = [
  'date',
  'invoice_no',
  'region',
  'branch',
  'outlet_id',
  'outlet_name',
  'outlet_type',
  'salesman',
  'brand',
  'sku',
  'qty_carton',
  'price_per_carton_idr',
  'gross_sales_idr',
  'discount_idr',
  'net_sales_idr',
] as const;

const REGION_ALIASES: Record<string, string> = {
  jabar: 'Jawa Barat',
  'jawa barat': 'Jawa Barat',
  'west java': 'Jawa Barat',
  jateng: 'Jawa Tengah',
  'jawa tengah': 'Jawa Tengah',
  'central java': 'Jawa Tengah',
  jatim: 'Jawa Timur',
  'jawa timur': 'Jawa Timur',
  'east java': 'Jawa Timur',
  jabodetabek: 'Jabodetabek',
  sumatera: 'Sumatera',
  sumatra: 'Sumatera',
  kalimantan: 'Kalimantan',
  sulawesi: 'Sulawesi',
  bali: 'Bali',
  'bali nusra': 'Bali Nusra',
  papua: 'Papua',
};

function toTitleCase(input: string): string {
  return input
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function normalizeRegion(raw: string): string {
  const trimmed = raw.trim().replace(/\s+/g, ' ');
  if (!trimmed) return 'Tidak Tercatat';
  const key = trimmed.toLowerCase();
  return REGION_ALIASES[key] ?? toTitleCase(trimmed);
}

/**
 * RFC-4180 CSV parser supporting quoted fields, escaped quotes, and CRLF/LF.
 */
export function parseCsvRows(csvText: string): string[][] {
  const cleanText = csvText.replace(/^\uFEFF/, '');
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < cleanText.length; i++) {
    const ch = cleanText[i];
    const next = cleanText[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\r' && next === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      i++;
    } else if (ch === '\n' || ch === '\r') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += ch;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((r) => !(r.length === 1 && r[0].trim() === ''));
}

function parseNumeric(raw: string): number {
  const cleaned = raw.trim().replace(/\s+/g, '');
  if (!cleaned) return Number.NaN;
  return Number(cleaned);
}

export function parseAndCleanSalesCsv(csvText: string): ParsedSalesDataset {
  const rawTable = parseCsvRows(csvText);
  if (rawTable.length < 2) {
    throw new Error('File CSV kosong atau tidak memiliki baris data.');
  }

  const headers = rawTable[0].map((h) => h.trim().toLowerCase());
  const colIndex = new Map<string, number>();
  headers.forEach((h, idx) => colIndex.set(h, idx));

  const missingCols = REQUIRED_COLUMNS.filter((c) => !colIndex.has(c));
  if (missingCols.length > 0) {
    throw new Error(`Kolom wajib tidak ditemukan di CSV: ${missingCols.join(', ')}`);
  }

  const dataRows = rawTable.slice(1);
  const getVal = (row: string[], col: (typeof REQUIRED_COLUMNS)[number]): string => {
    const idx = colIndex.get(col);
    return idx !== undefined && idx < row.length ? row[idx] : '';
  };

  // Pre-scan invoice -> salesman map so empty salesman cells can be backfilled from same invoice
  const invoiceSalesmanMap = new Map<string, string>();
  for (const row of dataRows) {
    const inv = getVal(row, 'invoice_no').trim();
    const sm = getVal(row, 'salesman').trim();
    if (inv && sm && !invoiceSalesmanMap.has(inv)) {
      invoiceSalesmanMap.set(inv, sm);
    }
  }

  let trimmedFieldCount = 0;
  let trimmedRowsCount = 0;
  let regionNormalizedCount = 0;
  const regionNormMap = new Map<string, RegionNormalizationItem>();
  let salesmanBackfilledCount = 0;
  let salesmanMissingCount = 0;
  let invalidRowsSkipped = 0;
  let returnRowsCount = 0;
  let returnNetSalesIdr = 0;
  const duplicatesRemoved: DuplicateRemovedItem[] = [];
  const seenRowKeys = new Set<string>();

  const records: SalesRecord[] = [];
  const outletIdsByName = new Map<string, Set<string>>();

  for (const row of dataRows) {
    if (row.length < REQUIRED_COLUMNS.length) {
      invalidRowsSkipped++;
      continue;
    }

    let rowHadTrim = false;
    const trimTrack = (col: (typeof REQUIRED_COLUMNS)[number]): string => {
      const original = getVal(row, col);
      const trimmed = original.trim();
      if (trimmed !== original) {
        trimmedFieldCount++;
        rowHadTrim = true;
      }
      return trimmed;
    };

    const date = trimTrack('date');
    const invoiceNo = trimTrack('invoice_no');
    const rawRegion = trimTrack('region');
    const branch = trimTrack('branch');
    const outletId = trimTrack('outlet_id');
    const outletName = trimTrack('outlet_name');
    const outletType = trimTrack('outlet_type');
    let salesman = trimTrack('salesman');
    const brand = trimTrack('brand');
    const sku = trimTrack('sku');

    const qtyCarton = parseNumeric(trimTrack('qty_carton'));
    const pricePerCartonIdr = parseNumeric(trimTrack('price_per_carton_idr'));
    const grossSalesIdr = parseNumeric(trimTrack('gross_sales_idr'));
    const discountIdr = parseNumeric(trimTrack('discount_idr'));
    const netSalesIdr = parseNumeric(trimTrack('net_sales_idr'));

    if (
      !date ||
      !invoiceNo ||
      !outletId ||
      Number.isNaN(qtyCarton) ||
      Number.isNaN(netSalesIdr) ||
      Number.isNaN(grossSalesIdr)
    ) {
      invalidRowsSkipped++;
      continue;
    }

    if (rowHadTrim) {
      trimmedRowsCount++;
    }

    const region = normalizeRegion(rawRegion);
    if (region !== rawRegion) {
      regionNormalizedCount++;
      const key = `${rawRegion}→${region}`;
      const existing = regionNormMap.get(key);
      if (existing) {
        existing.count++;
      } else {
        regionNormMap.set(key, { from: rawRegion, to: region, count: 1 });
      }
    }

    if (!salesman) {
      const fromInvoice = invoiceSalesmanMap.get(invoiceNo);
      if (fromInvoice) {
        salesman = fromInvoice;
        salesmanBackfilledCount++;
      } else {
        salesman = 'Tidak tercatat';
        salesmanMissingCount++;
      }
    }

    const dedupeKey = [
      date,
      invoiceNo,
      region,
      branch,
      outletId,
      outletName,
      outletType,
      salesman,
      brand,
      sku,
      qtyCarton,
      pricePerCartonIdr,
      grossSalesIdr,
      discountIdr,
      netSalesIdr,
    ].join('|');

    if (seenRowKeys.has(dedupeKey)) {
      duplicatesRemoved.push({
        invoiceNo,
        sku,
        date,
        netSalesIdr,
      });
      continue;
    }
    seenRowKeys.add(dedupeKey);

    const isReturn =
      qtyCarton < 0 || netSalesIdr < 0 || invoiceNo.toUpperCase().startsWith('RTR');
    if (isReturn) {
      returnRowsCount++;
      returnNetSalesIdr += netSalesIdr;
    }

    const idSet = outletIdsByName.get(outletName) ?? new Set<string>();
    idSet.add(outletId);
    outletIdsByName.set(outletName, idSet);

    records.push({
      date,
      invoiceNo,
      region,
      branch,
      outletId,
      outletName,
      outletType,
      salesman,
      brand,
      sku,
      qtyCarton,
      pricePerCartonIdr: Number.isNaN(pricePerCartonIdr) ? 0 : pricePerCartonIdr,
      grossSalesIdr,
      discountIdr: Number.isNaN(discountIdr) ? 0 : discountIdr,
      netSalesIdr,
      isReturn,
    });
  }

  const sharedOutletNameGroups: SharedOutletNameGroup[] = Array.from(outletIdsByName.entries())
    .filter(([, ids]) => ids.size > 1)
    .map(([outletName, ids]) => ({
      outletName,
      outletIds: Array.from(ids).sort(),
    }))
    .sort((a, b) => b.outletIds.length - a.outletIds.length || a.outletName.localeCompare(b.outletName));

  const dates = Array.from(new Set(records.map((r) => r.date))).sort();
  const availableRegions = Array.from(new Set(records.map((r) => r.region))).sort();
  const availableBrands = Array.from(new Set(records.map((r) => r.brand))).sort();
  const availableOutletTypes = Array.from(new Set(records.map((r) => r.outletType))).sort();

  return {
    records,
    quality: {
      rawRowCount: dataRows.length,
      cleanRowCount: records.length,
      regionNormalizedCount,
      regionNormalizations: Array.from(regionNormMap.values()).sort((a, b) => b.count - a.count),
      trimmedFieldCount,
      trimmedRowsCount,
      duplicateRowsRemoved: duplicatesRemoved.length,
      duplicatesRemoved,
      salesmanBackfilledCount,
      salesmanMissingCount,
      returnRowsCount,
      returnNetSalesIdr,
      sharedOutletNameGroups,
      invalidRowsSkipped,
    },
    availableRegions,
    availableBrands,
    availableOutletTypes,
    minDate: dates[0] ?? '',
    maxDate: dates[dates.length - 1] ?? '',
  };
}

export function filterSalesRecords(records: SalesRecord[], filters: SalesFilters): SalesRecord[] {
  return records.filter((r) => {
    if (filters.startDate && r.date < filters.startDate) return false;
    if (filters.endDate && r.date > filters.endDate) return false;
    if (filters.region !== 'ALL' && r.region !== filters.region) return false;
    if (filters.brand !== 'ALL' && r.brand !== filters.brand) return false;
    if (filters.outletType !== 'ALL' && r.outletType !== filters.outletType) return false;
    return true;
  });
}

function getMondayIso(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const day = dt.getUTCDay(); // 0=Sun, 1=Mon, ...
  const diff = day === 0 ? -6 : 1 - day;
  dt.setUTCDate(dt.getUTCDate() + diff);
  return dt.toISOString().slice(0, 10);
}

function getDaysInMonth(year: number, month1Based: number): number {
  return new Date(Date.UTC(year, month1Based, 0)).getUTCDate();
}

function medianOf(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

type DimAgg = {
  netSalesIdr: number;
  grossSalesIdr: number;
  discountIdr: number;
  qtyCarton: number;
  outlets: Set<string>;
  invoices: Set<string>;
};

function getOrCreateDim(map: Map<string, DimAgg>, key: string): DimAgg {
  let agg = map.get(key);
  if (!agg) {
    agg = {
      netSalesIdr: 0,
      grossSalesIdr: 0,
      discountIdr: 0,
      qtyCarton: 0,
      outlets: new Set<string>(),
      invoices: new Set<string>(),
    };
    map.set(key, agg);
  }
  return agg;
}

function buildDimensionSummaries(records: SalesRecord[], field: 'region' | 'brand'): DimensionSummary[] {
  let totalNet = 0;
  const map = new Map<string, DimAgg>();
  for (const r of records) {
    totalNet += r.netSalesIdr;
    const agg = getOrCreateDim(map, r[field]);
    agg.netSalesIdr += r.netSalesIdr;
    agg.grossSalesIdr += r.grossSalesIdr;
    agg.discountIdr += r.discountIdr;
    agg.qtyCarton += r.qtyCarton;
    agg.outlets.add(r.outletId);
    if (!r.isReturn) agg.invoices.add(r.invoiceNo);
  }
  const denom = totalNet !== 0 ? totalNet : 1;
  return Array.from(map.entries())
    .map(([name, agg]) => ({
      name,
      netSalesIdr: agg.netSalesIdr,
      grossSalesIdr: agg.grossSalesIdr,
      discountIdr: agg.discountIdr,
      qtyCarton: agg.qtyCarton,
      sharePct: (agg.netSalesIdr / denom) * 100,
      outletCount: agg.outlets.size,
      invoiceCount: agg.invoices.size,
      avgSalesPerOutletIdr: agg.outlets.size > 0 ? agg.netSalesIdr / agg.outlets.size : 0,
    }))
    .sort((a, b) => b.netSalesIdr - a.netSalesIdr || a.name.localeCompare(b.name));
}

function buildMatrixFromRecords(records: SalesRecord[]): RegionBrandMatrix {
  const byRegion = buildDimensionSummaries(records, 'region');
  const byBrand = buildDimensionSummaries(records, 'brand');
  const cellMap = new Map<string, { netSalesIdr: number; qtyCarton: number; invoices: Set<string> }>();

  for (const r of records) {
    const key = `${r.region}|||${r.brand}`;
    let cell = cellMap.get(key);
    if (!cell) {
      cell = { netSalesIdr: 0, qtyCarton: 0, invoices: new Set<string>() };
      cellMap.set(key, cell);
    }
    cell.netSalesIdr += r.netSalesIdr;
    cell.qtyCarton += r.qtyCarton;
    if (!r.isReturn) cell.invoices.add(r.invoiceNo);
  }

  const regions = byRegion.map((r) => r.name);
  const brands = byBrand.map((b) => b.name);
  const cells: Record<string, Record<string, MatrixCell>> = {};
  const regionTotals: Record<string, MatrixCell> = {};
  const brandTotals: Record<string, MatrixCell> = {};
  let maxCellNetSalesIdr = 0;
  let maxCellQtyCarton = 0;
  let maxCellRegionSharePct = 0;

  for (const r of byRegion) {
    const regDenom = r.netSalesIdr !== 0 ? r.netSalesIdr : 1;
    regionTotals[r.name] = {
      netSalesIdr: r.netSalesIdr,
      qtyCarton: r.qtyCarton,
      invoiceCount: r.invoiceCount,
      shareOfRegionPct: 100,
    };
    cells[r.name] = {};
    for (const b of brands) {
      const c = cellMap.get(`${r.name}|||${b}`);
      const net = c ? c.netSalesIdr : 0;
      const qty = c ? c.qtyCarton : 0;
      const invCount = c ? c.invoices.size : 0;
      const shareOfRegionPct = r.netSalesIdr > 0 ? (net / regDenom) * 100 : 0;
      const val: MatrixCell = {
        netSalesIdr: net,
        qtyCarton: qty,
        invoiceCount: invCount,
        shareOfRegionPct,
      };
      cells[r.name][b] = val;
      if (net > maxCellNetSalesIdr) maxCellNetSalesIdr = net;
      if (qty > maxCellQtyCarton) maxCellQtyCarton = qty;
      if (shareOfRegionPct > maxCellRegionSharePct) maxCellRegionSharePct = shareOfRegionPct;
    }
  }

  const totalNet = byRegion.reduce((s, r) => s + r.netSalesIdr, 0) || 1;
  for (const b of byBrand) {
    brandTotals[b.name] = {
      netSalesIdr: b.netSalesIdr,
      qtyCarton: b.qtyCarton,
      invoiceCount: b.invoiceCount,
      shareOfRegionPct: (b.netSalesIdr / totalNet) * 100,
    };
  }

  return {
    regions,
    brands,
    cells,
    regionTotals,
    brandTotals,
    maxCellNetSalesIdr,
    maxCellQtyCarton,
    maxCellRegionSharePct,
  };
}

/**
 * Detects outlets that ordered in an earlier period/month under the same region/brand/channel scope
 * but recorded 0 positive orders in the latest month or currently active date window.
 */
export function detectDormantOutlets(
  allRecords: SalesRecord[],
  filters?: Partial<SalesFilters>,
): DormantOutlet[] {
  const scoped = allRecords.filter((r) => {
    if (filters?.region && filters.region !== 'ALL' && r.region !== filters.region) return false;
    if (filters?.brand && filters.brand !== 'ALL' && r.brand !== filters.brand) return false;
    if (filters?.outletType && filters.outletType !== 'ALL' && r.outletType !== filters.outletType) {
      return false;
    }
    return true;
  });

  if (scoped.length === 0) return [];

  const allDates = Array.from(new Set(scoped.map((r) => r.date))).sort();
  const minAll = allDates[0];
  const months = Array.from(new Set(scoped.map((r) => r.date.slice(0, 7)))).sort();

  let priorRecords: SalesRecord[] = [];
  let currentRecords: SalesRecord[] = [];
  let priorPeriodLabel = '';
  let silentPeriodLabel = '';

  if (filters?.startDate && filters.startDate > minAll) {
    // User filtered to a later window (e.g. Oct 2026) -> compare vs records strictly before startDate
    priorRecords = scoped.filter((r) => r.date < filters.startDate!);
    currentRecords = scoped.filter(
      (r) =>
        r.date >= filters.startDate! && (!filters.endDate || r.date <= filters.endDate),
    );
    const priorMonths = Array.from(new Set(priorRecords.map((r) => r.date.slice(0, 7)))).sort();
    priorPeriodLabel =
      priorMonths.length === 1 ? formatMonthKey(priorMonths[0]) : 'Periode Sebelumnya';
    const currMonths = Array.from(new Set(currentRecords.map((r) => r.date.slice(0, 7)))).sort();
    silentPeriodLabel =
      currMonths.length === 1 ? formatMonthKey(currMonths[0]) : 'Periode Aktif';
  } else if (months.length >= 2) {
    const latestMonth = months[months.length - 1];
    const prevMonth = months[months.length - 2];
    priorRecords = scoped.filter((r) => r.date.slice(0, 7) === prevMonth);
    currentRecords = scoped.filter((r) => r.date.slice(0, 7) === latestMonth);
    priorPeriodLabel = formatMonthKey(prevMonth);
    silentPeriodLabel = formatMonthKey(latestMonth);
  } else {
    return [];
  }

  const activeCurrentOutlets = new Set<string>();
  for (const r of currentRecords) {
    if (!r.isReturn && r.netSalesIdr > 0) {
      activeCurrentOutlets.add(r.outletId);
    }
  }

  type PriorAgg = {
    outletId: string;
    outletName: string;
    branch: string;
    region: string;
    outletType: string;
    salesmanCounts: Map<string, number>;
    netSalesIdr: number;
    invoices: Set<string>;
    lastOrderDate: string;
  };
  const priorMap = new Map<string, PriorAgg>();

  for (const r of priorRecords) {
    if (activeCurrentOutlets.has(r.outletId)) continue;
    let agg = priorMap.get(r.outletId);
    if (!agg) {
      agg = {
        outletId: r.outletId,
        outletName: r.outletName,
        branch: r.branch,
        region: r.region,
        outletType: r.outletType,
        salesmanCounts: new Map<string, number>(),
        netSalesIdr: 0,
        invoices: new Set<string>(),
        lastOrderDate: '',
      };
      priorMap.set(r.outletId, agg);
    }
    agg.netSalesIdr += r.netSalesIdr;
    if (!r.isReturn) {
      agg.invoices.add(r.invoiceNo);
      if (!agg.lastOrderDate || r.date > agg.lastOrderDate) {
        agg.lastOrderDate = r.date;
      }
    }
    agg.salesmanCounts.set(r.salesman, (agg.salesmanCounts.get(r.salesman) ?? 0) + 1);
  }

  return Array.from(priorMap.values())
    .filter((o) => o.netSalesIdr > 0)
    .map((o) => ({
      outletId: o.outletId,
      outletName: o.outletName,
      branch: o.branch,
      region: o.region,
      outletType: o.outletType,
      primarySalesman:
        Array.from(o.salesmanCounts.entries()).sort(
          (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
        )[0]?.[0] ?? 'Tidak tercatat',
      priorNetSalesIdr: o.netSalesIdr,
      priorInvoiceCount: o.invoices.size,
      lastOrderDate: o.lastOrderDate,
      priorPeriodLabel,
      silentPeriodLabel,
    }))
    .sort((a, b) => b.priorNetSalesIdr - a.priorNetSalesIdr || a.outletId.localeCompare(b.outletId));
}

export function computeDashboardMetrics(
  records: SalesRecord[],
  options?: {
    allRecords?: SalesRecord[];
    filters?: Partial<SalesFilters>;
    coreBrandName?: string;
  },
): DashboardMetrics {
  let netSalesIdr = 0;
  let grossSalesIdr = 0;
  let discountIdr = 0;
  let qtyCarton = 0;
  let nonReturnQtyCarton = 0;
  let returnCount = 0;
  let returnNetSalesIdr = 0;
  let dateMin = '';
  let dateMax = '';

  const invoices = new Set<string>();
  const activeOutlets = new Set<string>();
  const activeDates = new Set<string>();

  type OutletAgg = {
    outletId: string;
    outletName: string;
    branch: string;
    region: string;
    outletType: string;
    salesmanCounts: Map<string, number>;
    netSalesIdr: number;
    grossSalesIdr: number;
    discountIdr: number;
    qtyCarton: number;
    nonReturnQtyCarton: number;
    invoices: Set<string>;
    brands: Set<string>;
    skus: Set<string>;
    lastOrderDate: string;
    records: SalesRecord[];
  };
  const outletMap = new Map<string, OutletAgg>();

  type DayAgg = {
    netSalesIdr: number;
    qtyCarton: number;
    invoices: Set<string>;
    outlets: Set<string>;
  };
  const dayMap = new Map<string, DayAgg>();

  type WeekAgg = {
    weekStart: string;
    weekEnd: string;
    monthKey: string;
    netSalesIdr: number;
    qtyCarton: number;
    invoices: Set<string>;
    dates: Set<string>;
  };
  const weekMap = new Map<string, WeekAgg>();

  type MonthAgg = {
    monthKey: string;
    startDate: string;
    endDate: string;
    dates: Set<string>;
    netSalesIdr: number;
    qtyCarton: number;
    invoices: Set<string>;
    outlets: Set<string>;
  };
  const monthMap = new Map<string, MonthAgg>();

  for (const r of records) {
    netSalesIdr += r.netSalesIdr;
    grossSalesIdr += r.grossSalesIdr;
    discountIdr += r.discountIdr;
    qtyCarton += r.qtyCarton;
    activeOutlets.add(r.outletId);
    activeDates.add(r.date);

    if (r.isReturn) {
      returnCount++;
      returnNetSalesIdr += r.netSalesIdr;
    } else {
      invoices.add(r.invoiceNo);
      nonReturnQtyCarton += r.qtyCarton;
    }

    if (!dateMin || r.date < dateMin) dateMin = r.date;
    if (!dateMax || r.date > dateMax) dateMax = r.date;

    // Daily trend
    let day = dayMap.get(r.date);
    if (!day) {
      day = { netSalesIdr: 0, qtyCarton: 0, invoices: new Set(), outlets: new Set() };
      dayMap.set(r.date, day);
    }
    day.netSalesIdr += r.netSalesIdr;
    day.qtyCarton += r.qtyCarton;
    day.outlets.add(r.outletId);
    if (!r.isReturn) day.invoices.add(r.invoiceNo);

    // Weekly trend
    const weekStart = getMondayIso(r.date);
    let week = weekMap.get(weekStart);
    if (!week) {
      week = {
        weekStart,
        weekEnd: r.date,
        monthKey: r.date.slice(0, 7),
        netSalesIdr: 0,
        qtyCarton: 0,
        invoices: new Set(),
        dates: new Set(),
      };
      weekMap.set(weekStart, week);
    }
    if (r.date > week.weekEnd) week.weekEnd = r.date;
    week.netSalesIdr += r.netSalesIdr;
    week.qtyCarton += r.qtyCarton;
    week.dates.add(r.date);
    if (!r.isReturn) week.invoices.add(r.invoiceNo);

    // Monthly comparison
    const monthKey = r.date.slice(0, 7);
    let month = monthMap.get(monthKey);
    if (!month) {
      month = {
        monthKey,
        startDate: r.date,
        endDate: r.date,
        dates: new Set(),
        netSalesIdr: 0,
        qtyCarton: 0,
        invoices: new Set(),
        outlets: new Set(),
      };
      monthMap.set(monthKey, month);
    }
    if (r.date < month.startDate) month.startDate = r.date;
    if (r.date > month.endDate) month.endDate = r.date;
    month.dates.add(r.date);
    month.netSalesIdr += r.netSalesIdr;
    month.qtyCarton += r.qtyCarton;
    month.outlets.add(r.outletId);
    if (!r.isReturn) month.invoices.add(r.invoiceNo);

    // Outlet agg
    let outAgg = outletMap.get(r.outletId);
    if (!outAgg) {
      outAgg = {
        outletId: r.outletId,
        outletName: r.outletName,
        branch: r.branch,
        region: r.region,
        outletType: r.outletType,
        salesmanCounts: new Map<string, number>(),
        netSalesIdr: 0,
        grossSalesIdr: 0,
        discountIdr: 0,
        qtyCarton: 0,
        nonReturnQtyCarton: 0,
        invoices: new Set<string>(),
        brands: new Set<string>(),
        skus: new Set<string>(),
        lastOrderDate: '',
        records: [],
      };
      outletMap.set(r.outletId, outAgg);
    }
    outAgg.netSalesIdr += r.netSalesIdr;
    outAgg.grossSalesIdr += r.grossSalesIdr;
    outAgg.discountIdr += r.discountIdr;
    outAgg.qtyCarton += r.qtyCarton;
    outAgg.records.push(r);
    if (!r.isReturn) {
      outAgg.invoices.add(r.invoiceNo);
      outAgg.nonReturnQtyCarton += r.qtyCarton;
      outAgg.brands.add(r.brand);
      outAgg.skus.add(r.sku);
      if (!outAgg.lastOrderDate || r.date > outAgg.lastOrderDate) {
        outAgg.lastOrderDate = r.date;
      }
    }
    outAgg.salesmanCounts.set(r.salesman, (outAgg.salesmanCounts.get(r.salesman) ?? 0) + 1);
  }

  const byRegion = buildDimensionSummaries(records, 'region');
  const byBrand = buildDimensionSummaries(records, 'brand');
  const matrix = buildMatrixFromRecords(records);

  // Determine core flagship brand (defaults to top brand in dataset or filtered records)
  const coreBrandName = options?.coreBrandName ?? byBrand[0]?.name ?? '';
  const isAllBrandScope = !options?.filters?.brand || options.filters.brand === 'ALL';

  // Channel summaries (peer-group benchmarks per outletType)
  const channelOutlets = new Map<string, OutletAgg[]>();
  for (const o of outletMap.values()) {
    const list = channelOutlets.get(o.outletType) ?? [];
    list.push(o);
    channelOutlets.set(o.outletType, list);
  }

  const totalForShare = netSalesIdr !== 0 ? netSalesIdr : 1;
  const channelBenchmarkMap = new Map<string, ChannelSummary>();
  const byChannel: ChannelSummary[] = Array.from(channelOutlets.entries())
    .map(([outletType, list]) => {
      const chNet = list.reduce((s, o) => s + o.netSalesIdr, 0);
      const chGross = list.reduce((s, o) => s + o.grossSalesIdr, 0);
      const chDisc = list.reduce((s, o) => s + o.discountIdr, 0);
      const chQty = list.reduce((s, o) => s + o.nonReturnQtyCarton, 0);
      const chInv = list.reduce((s, o) => s + o.invoices.size, 0);
      const summary: ChannelSummary = {
        outletType,
        netSalesIdr: chNet,
        sharePct: (chNet / totalForShare) * 100,
        outletCount: list.length,
        avgSalesPerOutletIdr: list.length > 0 ? chNet / list.length : 0,
        medianSalesPerOutletIdr: medianOf(list.map((o) => o.netSalesIdr)),
        avgCartonsPerInvoice: chInv > 0 ? chQty / chInv : 0,
        discountRatePct: chGross > 0 ? (chDisc / chGross) * 100 : 0,
      };
      channelBenchmarkMap.set(outletType, summary);
      return summary;
    })
    .sort((a, b) => b.netSalesIdr - a.netSalesIdr || a.outletType.localeCompare(b.outletType));

  const activeOutletCount = activeOutlets.size;
  const avgSalesPerOutletIdr = activeOutletCount > 0 ? netSalesIdr / activeOutletCount : 0;
  const avgCartonsPerInvoice = invoices.size > 0 ? nonReturnQtyCarton / invoices.size : 0;
  const activeDays = activeDates.size;
  const dailyRunRateIdr = activeDays > 0 ? netSalesIdr / activeDays : 0;

  const allOutlets: OutletPerformance[] = Array.from(outletMap.values()).map((o) => {
    const primarySalesman =
      Array.from(o.salesmanCounts.entries()).sort(
        (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
      )[0]?.[0] ?? 'Tidak tercatat';
    const gapVsAvgPct =
      avgSalesPerOutletIdr > 0
        ? ((o.netSalesIdr - avgSalesPerOutletIdr) / avgSalesPerOutletIdr) * 100
        : 0;
    const peer = channelBenchmarkMap.get(o.outletType);
    const peerAvgSalesIdr = peer?.avgSalesPerOutletIdr ?? avgSalesPerOutletIdr;
    const peerAvgCartonsPerInvoice = peer?.avgCartonsPerInvoice ?? avgCartonsPerInvoice;
    const gapVsPeerPct =
      peerAvgSalesIdr > 0 ? ((o.netSalesIdr - peerAvgSalesIdr) / peerAvgSalesIdr) * 100 : 0;

    const invCount = o.invoices.size;
    const outletDropSize = invCount > 0 ? o.nonReturnQtyCarton / invCount : 0;
    const outletDiscountRatePct = o.grossSalesIdr > 0 ? (o.discountIdr / o.grossSalesIdr) * 100 : 0;
    const brandsBought = Array.from(o.brands).sort();
    const missingCoreBrand =
      Boolean(coreBrandName) && isAllBrandScope && !o.brands.has(coreBrandName);

    const diagnosticTags: string[] = [];
    if (invCount > 0 && outletDropSize <= Math.max(1.5, peerAvgCartonsPerInvoice * 0.35)) {
      diagnosticTags.push(
        `Drop size ${outletDropSize.toLocaleString('id-ID', {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        })} ktn/inv`,
      );
    }
    if (missingCoreBrand) {
      const shortCore = coreBrandName === 'Kacang Dua Kelinci' ? 'Kacang DK' : coreBrandName;
      diagnosticTags.push(`Tanpa ${shortCore}`);
    }
    if (invCount <= 2) {
      diagnosticTags.push(`Frekuensi rendah (${invCount} inv)`);
    }
    if (o.discountIdr === 0 && o.grossSalesIdr > 0 && (peer?.discountRatePct ?? 0) >= 1) {
      diagnosticTags.push('0% diskon');
    }

    const sortedRecords = [...o.records].sort(
      (a, b) => b.date.localeCompare(a.date) || b.invoiceNo.localeCompare(a.invoiceNo),
    );

    return {
      outletId: o.outletId,
      outletName: o.outletName,
      branch: o.branch,
      region: o.region,
      outletType: o.outletType,
      primarySalesman,
      netSalesIdr: o.netSalesIdr,
      grossSalesIdr: o.grossSalesIdr,
      discountIdr: o.discountIdr,
      discountRatePct: outletDiscountRatePct,
      qtyCarton: o.qtyCarton,
      invoiceCount: invCount,
      avgCartonsPerInvoice: outletDropSize,
      lastOrderDate: o.lastOrderDate,
      gapVsAvgPct,
      peerAvgSalesIdr,
      peerAvgCartonsPerInvoice,
      gapVsPeerPct,
      brandsBought,
      skuCount: o.skus.size,
      missingCoreBrand,
      coreBrandName,
      diagnosticTags,
      records: sortedRecords,
    };
  });

  const weakestOutlets = [...allOutlets]
    .sort(
      (a, b) =>
        a.netSalesIdr - b.netSalesIdr ||
        a.qtyCarton - b.qtyCarton ||
        a.invoiceCount - b.invoiceCount ||
        a.outletId.localeCompare(b.outletId),
    )
    .slice(0, 5);

  const dailyTrend: DailyTrendPoint[] = Array.from(dayMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, agg]) => ({
      date,
      monthKey: date.slice(0, 7),
      netSalesIdr: agg.netSalesIdr,
      qtyCarton: agg.qtyCarton,
      invoiceCount: agg.invoices.size,
      activeOutletCount: agg.outlets.size,
    }));

  const weeklyTrend: WeeklyTrendPoint[] = Array.from(weekMap.values())
    .sort((a, b) => a.weekStart.localeCompare(b.weekStart))
    .map((w) => ({
      weekStart: w.weekStart,
      weekEnd: w.weekEnd,
      label:
        w.weekStart === w.weekEnd
          ? formatDateDayMonth(w.weekStart)
          : `${formatDateDayMonth(w.weekStart)}–${formatDateDayMonth(w.weekEnd)}`,
      monthKey: w.monthKey,
      netSalesIdr: w.netSalesIdr,
      qtyCarton: w.qtyCarton,
      invoiceCount: w.invoices.size,
      activeDays: w.dates.size,
    }));

  // Monthly comparison uses records within the same non-date filters if available (so Oct view still knows Sep run-rate!)
  const monthlySourceRecords = options?.allRecords
    ? options.allRecords.filter((r) => {
        if (options.filters?.region && options.filters.region !== 'ALL' && r.region !== options.filters.region) {
          return false;
        }
        if (options.filters?.brand && options.filters.brand !== 'ALL' && r.brand !== options.filters.brand) {
          return false;
        }
        if (
          options.filters?.outletType &&
          options.filters.outletType !== 'ALL' &&
          r.outletType !== options.filters.outletType
        ) {
          return false;
        }
        return true;
      })
    : records;

  const monthlyMapForComp = new Map<string, MonthAgg>();
  for (const r of monthlySourceRecords) {
    const mk = r.date.slice(0, 7);
    let m = monthlyMapForComp.get(mk);
    if (!m) {
      m = {
        monthKey: mk,
        startDate: r.date,
        endDate: r.date,
        dates: new Set(),
        netSalesIdr: 0,
        qtyCarton: 0,
        invoices: new Set(),
        outlets: new Set(),
      };
      monthlyMapForComp.set(mk, m);
    }
    if (r.date < m.startDate) m.startDate = r.date;
    if (r.date > m.endDate) m.endDate = r.date;
    m.dates.add(r.date);
    m.netSalesIdr += r.netSalesIdr;
    m.qtyCarton += r.qtyCarton;
    m.outlets.add(r.outletId);
    if (!r.isReturn) m.invoices.add(r.invoiceNo);
  }

  const monthsSummary: MonthlySummary[] = Array.from(monthlyMapForComp.values())
    .sort((a, b) => a.monthKey.localeCompare(b.monthKey))
    .map((m) => {
      const [y, mo] = m.monthKey.split('-').map(Number);
      const daysInCalendarMonth = getDaysInMonth(y, mo);
      const maxDayOfMonth = Number(m.endDate.slice(8, 10)) || 0;
      const isPartial = maxDayOfMonth < daysInCalendarMonth - 3;
      const activeDaysCount = m.dates.size;
      return {
        monthKey: m.monthKey,
        label: formatMonthKey(m.monthKey),
        startDate: m.startDate,
        endDate: m.endDate,
        activeDays: activeDaysCount,
        daysInCalendarMonth,
        maxDayOfMonth,
        isPartial,
        netSalesIdr: m.netSalesIdr,
        qtyCarton: m.qtyCarton,
        invoiceCount: m.invoices.size,
        activeOutletCount: m.outlets.size,
        dailyRunRateIdr: activeDaysCount > 0 ? m.netSalesIdr / activeDaysCount : 0,
      };
    });

  const latestMonth = monthsSummary.length > 0 ? monthsSummary[monthsSummary.length - 1] : null;
  const prevMonth = monthsSummary.length >= 2 ? monthsSummary[monthsSummary.length - 2] : null;
  const runRateDeltaPct =
    latestMonth && prevMonth && prevMonth.dailyRunRateIdr > 0
      ? ((latestMonth.dailyRunRateIdr - prevMonth.dailyRunRateIdr) / prevMonth.dailyRunRateIdr) *
        100
      : null;

  const dormantOutlets = options?.allRecords
    ? detectDormantOutlets(options.allRecords, options.filters)
    : detectDormantOutlets(records);

  const discountRatePct = grossSalesIdr > 0 ? (discountIdr / grossSalesIdr) * 100 : 0;

  return {
    totals: {
      netSalesIdr,
      grossSalesIdr,
      discountIdr,
      discountRatePct,
      qtyCarton,
      invoiceCount: invoices.size,
      returnCount,
      returnNetSalesIdr,
      activeOutletCount,
      avgSalesPerOutletIdr,
      avgCartonsPerInvoice,
      activeDays,
      dailyRunRateIdr,
      rowCount: records.length,
      dateMin,
      dateMax,
    },
    byRegion,
    byBrand,
    byChannel,
    matrix,
    weakestOutlets,
    allOutlets,
    allOutletsCount: activeOutletCount,
    dailyTrend,
    weeklyTrend,
    monthlyComparison: {
      months: monthsSummary,
      latestMonth,
      prevMonth,
      runRateDeltaPct,
    },
    dormantOutlets,
  };
}

/**
 * Computes dashboard metrics along with non-collapsing cross-filter views:
 * - Region chart ignores the region filter so peers remain visible & clickable.
 * - Brand chart ignores the brand filter so peers remain visible & clickable.
 * - Matrix ignores region & brand filters so clicking a cell highlights it instead of collapsing to 1x1.
 */
export function computeCrossFilterDashboard(
  allRecords: SalesRecord[],
  filters: SalesFilters,
): CrossFilterDashboard {
  const globalBrands = buildDimensionSummaries(allRecords, 'brand');
  const coreBrandName = globalBrands[0]?.name ?? '';

  const fullFiltered = filterSalesRecords(allRecords, filters);
  const metrics = computeDashboardMetrics(fullFiltered, {
    allRecords,
    filters,
    coreBrandName,
  });

  const regionChartRecords = filterSalesRecords(allRecords, { ...filters, region: 'ALL' });
  const brandChartRecords = filterSalesRecords(allRecords, { ...filters, brand: 'ALL' });
  const matrixRecords = filterSalesRecords(allRecords, {
    ...filters,
    region: 'ALL',
    brand: 'ALL',
  });

  return {
    metrics,
    regionChartItems: buildDimensionSummaries(regionChartRecords, 'region'),
    brandChartItems: buildDimensionSummaries(brandChartRecords, 'brand'),
    matrixData: buildMatrixFromRecords(matrixRecords),
  };
}
