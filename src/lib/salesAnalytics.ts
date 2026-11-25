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
}

export interface MatrixCell {
  netSalesIdr: number;
  qtyCarton: number;
  invoiceCount: number;
}

export interface RegionBrandMatrix {
  regions: string[];
  brands: string[];
  cells: Record<string, Record<string, MatrixCell>>;
  regionTotals: Record<string, MatrixCell>;
  brandTotals: Record<string, MatrixCell>;
  maxCellNetSalesIdr: number;
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
  qtyCarton: number;
  invoiceCount: number;
  lastOrderDate: string;
  gapVsAvgPct: number;
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
    rowCount: number;
    dateMin: string;
    dateMax: string;
  };
  byRegion: DimensionSummary[];
  byBrand: DimensionSummary[];
  matrix: RegionBrandMatrix;
  weakestOutlets: OutletPerformance[];
  allOutletsCount: number;
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

export function computeDashboardMetrics(records: SalesRecord[]): DashboardMetrics {
  let netSalesIdr = 0;
  let grossSalesIdr = 0;
  let discountIdr = 0;
  let qtyCarton = 0;
  let returnCount = 0;
  let returnNetSalesIdr = 0;
  let dateMin = '';
  let dateMax = '';

  const invoices = new Set<string>();
  const activeOutlets = new Set<string>();

  type DimAgg = {
    netSalesIdr: number;
    grossSalesIdr: number;
    discountIdr: number;
    qtyCarton: number;
    outlets: Set<string>;
    invoices: Set<string>;
  };

  const regionMap = new Map<string, DimAgg>();
  const brandMap = new Map<string, DimAgg>();
  const cellMap = new Map<string, { netSalesIdr: number; qtyCarton: number; invoices: Set<string> }>();

  type OutletAgg = {
    outletId: string;
    outletName: string;
    branch: string;
    region: string;
    outletType: string;
    salesmanCounts: Map<string, number>;
    netSalesIdr: number;
    grossSalesIdr: number;
    qtyCarton: number;
    invoices: Set<string>;
    lastOrderDate: string;
  };
  const outletMap = new Map<string, OutletAgg>();

  const getOrCreateDim = (map: Map<string, DimAgg>, key: string): DimAgg => {
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
  };

  for (const r of records) {
    netSalesIdr += r.netSalesIdr;
    grossSalesIdr += r.grossSalesIdr;
    discountIdr += r.discountIdr;
    qtyCarton += r.qtyCarton;
    activeOutlets.add(r.outletId);

    if (r.isReturn) {
      returnCount++;
      returnNetSalesIdr += r.netSalesIdr;
    } else {
      invoices.add(r.invoiceNo);
    }

    if (!dateMin || r.date < dateMin) dateMin = r.date;
    if (!dateMax || r.date > dateMax) dateMax = r.date;

    const regAgg = getOrCreateDim(regionMap, r.region);
    regAgg.netSalesIdr += r.netSalesIdr;
    regAgg.grossSalesIdr += r.grossSalesIdr;
    regAgg.discountIdr += r.discountIdr;
    regAgg.qtyCarton += r.qtyCarton;
    regAgg.outlets.add(r.outletId);
    if (!r.isReturn) regAgg.invoices.add(r.invoiceNo);

    const brAgg = getOrCreateDim(brandMap, r.brand);
    brAgg.netSalesIdr += r.netSalesIdr;
    brAgg.grossSalesIdr += r.grossSalesIdr;
    brAgg.discountIdr += r.discountIdr;
    brAgg.qtyCarton += r.qtyCarton;
    brAgg.outlets.add(r.outletId);
    if (!r.isReturn) brAgg.invoices.add(r.invoiceNo);

    const cellKey = `${r.region}|||${r.brand}`;
    let cell = cellMap.get(cellKey);
    if (!cell) {
      cell = { netSalesIdr: 0, qtyCarton: 0, invoices: new Set<string>() };
      cellMap.set(cellKey, cell);
    }
    cell.netSalesIdr += r.netSalesIdr;
    cell.qtyCarton += r.qtyCarton;
    if (!r.isReturn) cell.invoices.add(r.invoiceNo);

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
        qtyCarton: 0,
        invoices: new Set<string>(),
        lastOrderDate: r.date,
      };
      outletMap.set(r.outletId, outAgg);
    }
    outAgg.netSalesIdr += r.netSalesIdr;
    outAgg.grossSalesIdr += r.grossSalesIdr;
    outAgg.qtyCarton += r.qtyCarton;
    if (!r.isReturn) {
      outAgg.invoices.add(r.invoiceNo);
      if (r.date > outAgg.lastOrderDate) outAgg.lastOrderDate = r.date;
    }
    outAgg.salesmanCounts.set(r.salesman, (outAgg.salesmanCounts.get(r.salesman) ?? 0) + 1);
  }

  const totalForShare = netSalesIdr !== 0 ? netSalesIdr : 1;

  const toDimList = (map: Map<string, DimAgg>): DimensionSummary[] =>
    Array.from(map.entries())
      .map(([name, agg]) => ({
        name,
        netSalesIdr: agg.netSalesIdr,
        grossSalesIdr: agg.grossSalesIdr,
        discountIdr: agg.discountIdr,
        qtyCarton: agg.qtyCarton,
        sharePct: (agg.netSalesIdr / totalForShare) * 100,
        outletCount: agg.outlets.size,
        invoiceCount: agg.invoices.size,
      }))
      .sort((a, b) => b.netSalesIdr - a.netSalesIdr || a.name.localeCompare(b.name));

  const byRegion = toDimList(regionMap);
  const byBrand = toDimList(brandMap);

  const regions = byRegion.map((r) => r.name);
  const brands = byBrand.map((b) => b.name);
  const cells: Record<string, Record<string, MatrixCell>> = {};
  const regionTotals: Record<string, MatrixCell> = {};
  const brandTotals: Record<string, MatrixCell> = {};
  let maxCellNetSalesIdr = 0;

  for (const r of byRegion) {
    regionTotals[r.name] = {
      netSalesIdr: r.netSalesIdr,
      qtyCarton: r.qtyCarton,
      invoiceCount: r.invoiceCount,
    };
    cells[r.name] = {};
    for (const b of brands) {
      const c = cellMap.get(`${r.name}|||${b}`);
      const val: MatrixCell = c
        ? { netSalesIdr: c.netSalesIdr, qtyCarton: c.qtyCarton, invoiceCount: c.invoices.size }
        : { netSalesIdr: 0, qtyCarton: 0, invoiceCount: 0 };
      cells[r.name][b] = val;
      if (val.netSalesIdr > maxCellNetSalesIdr) {
        maxCellNetSalesIdr = val.netSalesIdr;
      }
    }
  }
  for (const b of byBrand) {
    brandTotals[b.name] = {
      netSalesIdr: b.netSalesIdr,
      qtyCarton: b.qtyCarton,
      invoiceCount: b.invoiceCount,
    };
  }

  const activeOutletCount = activeOutlets.size;
  const avgSalesPerOutletIdr = activeOutletCount > 0 ? netSalesIdr / activeOutletCount : 0;

  const outletsList: OutletPerformance[] = Array.from(outletMap.values()).map((o) => {
    const primarySalesman =
      Array.from(o.salesmanCounts.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] ??
      'Tidak tercatat';
    const gapVsAvgPct =
      avgSalesPerOutletIdr > 0 ? ((o.netSalesIdr - avgSalesPerOutletIdr) / avgSalesPerOutletIdr) * 100 : 0;

    return {
      outletId: o.outletId,
      outletName: o.outletName,
      branch: o.branch,
      region: o.region,
      outletType: o.outletType,
      primarySalesman,
      netSalesIdr: o.netSalesIdr,
      grossSalesIdr: o.grossSalesIdr,
      qtyCarton: o.qtyCarton,
      invoiceCount: o.invoices.size,
      lastOrderDate: o.lastOrderDate,
      gapVsAvgPct,
    };
  });

  const weakestOutlets = outletsList
    .sort(
      (a, b) =>
        a.netSalesIdr - b.netSalesIdr ||
        a.qtyCarton - b.qtyCarton ||
        a.invoiceCount - b.invoiceCount ||
        a.outletId.localeCompare(b.outletId),
    )
    .slice(0, 5);

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
      rowCount: records.length,
      dateMin,
      dateMax,
    },
    byRegion,
    byBrand,
    matrix: {
      regions,
      brands,
      cells,
      regionTotals,
      brandTotals,
      maxCellNetSalesIdr,
    },
    weakestOutlets,
    allOutletsCount: activeOutletCount,
  };
}
