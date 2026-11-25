import {
  AlertTriangle,
  FileSpreadsheet,
  FileUp,
  RotateCcw,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  Upload,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { DataQualityModal } from './components/DataQualityModal';
import { KpiStrip } from './components/KpiStrip';
import { RegionBrandMatrix } from './components/RegionBrandMatrix';
import { SalesBarChartCard } from './components/SalesBarChartCard';
import { SalesTrendCard } from './components/SalesTrendCard';
import { TelegramSummaryCard } from './components/TelegramSummaryCard';
import { WeakestOutletsCard } from './components/WeakestOutletsCard';
import { formatDateRange, formatMonthKey, formatNumber } from './lib/formatters';
import {
  computeCrossFilterDashboard,
  parseAndCleanSalesCsv,
  type ParsedSalesDataset,
  type SalesFilters,
} from './lib/salesAnalytics';

const INITIAL_FILTERS: SalesFilters = {
  startDate: '',
  endDate: '',
  region: 'ALL',
  brand: 'ALL',
  outletType: 'ALL',
};

interface MonthPreset {
  label: string;
  sublabel?: string;
  startDate: string;
  endDate: string;
}

export function App() {
  const [dataset, setDataset] = useState<ParsedSalesDataset | null>(null);
  const [fileName, setFileName] = useState<string>('sales.csv');
  const [isCustomFile, setIsCustomFile] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<SalesFilters>(INITIAL_FILTERS);
  const [dqOpen, setDqOpen] = useState<boolean>(false);
  const [isDraggingCsv, setIsDraggingCsv] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragDepthRef = useRef<number>(0);

  const applyParsedDataset = (parsed: ParsedSalesDataset, name: string, custom: boolean) => {
    setDataset(parsed);
    setFileName(name);
    setIsCustomFile(custom);
    setFilters({
      startDate: parsed.minDate,
      endDate: parsed.maxDate,
      region: 'ALL',
      brand: 'ALL',
      outletType: 'ALL',
    });
  };

  const loadDefaultCsv = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/sales.csv', { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`Gagal memuat sales.csv (HTTP ${response.status})`);
      }
      const csvText = await response.text();
      const parsed = parseAndCleanSalesCsv(csvText);
      applyParsedDataset(parsed, 'sales.csv', false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat membaca CSV.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDefaultCsv();
  }, []);

  const ingestCsvFile = async (file: File) => {
    setError(null);
    try {
      const text = await file.text();
      const parsed = parseAndCleanSalesCsv(text);
      applyParsedDataset(parsed, file.name, true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Format CSV tidak valid.');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await ingestCsvFile(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Drag & drop CSV anywhere on the window
  useEffect(() => {
    const onDragEnter = (e: DragEvent) => {
      if (!e.dataTransfer?.types.includes('Files')) return;
      e.preventDefault();
      dragDepthRef.current += 1;
      setIsDraggingCsv(true);
    };
    const onDragOver = (e: DragEvent) => {
      if (!e.dataTransfer?.types.includes('Files')) return;
      e.preventDefault();
    };
    const onDragLeave = (e: DragEvent) => {
      if (!e.dataTransfer?.types.includes('Files')) return;
      e.preventDefault();
      dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
      if (dragDepthRef.current === 0) {
        setIsDraggingCsv(false);
      }
    };
    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      dragDepthRef.current = 0;
      setIsDraggingCsv(false);
      const file = e.dataTransfer?.files?.[0];
      if (file) {
        void ingestCsvFile(file);
      }
    };

    window.addEventListener('dragenter', onDragEnter);
    window.addEventListener('dragover', onDragOver);
    window.addEventListener('dragleave', onDragLeave);
    window.addEventListener('drop', onDrop);
    return () => {
      window.removeEventListener('dragenter', onDragEnter);
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('dragleave', onDragLeave);
      window.removeEventListener('drop', onDrop);
    };
  }, []);

  const monthPresets = useMemo<MonthPreset[]>(() => {
    if (!dataset) return [];
    const byMonth = new Map<string, { min: string; max: string }>();
    for (const r of dataset.records) {
      const ym = r.date.slice(0, 7);
      const existing = byMonth.get(ym);
      if (!existing) {
        byMonth.set(ym, { min: r.date, max: r.date });
      } else {
        if (r.date < existing.min) existing.min = r.date;
        if (r.date > existing.max) existing.max = r.date;
      }
    }
    return Array.from(byMonth.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([ym, bounds]) => {
        const [y, m] = ym.split('-').map(Number);
        const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
        const endDay = Number(bounds.max.slice(8, 10));
        const isPartial = endDay < daysInMonth - 3;
        return {
          label: formatMonthKey(ym),
          sublabel: isPartial ? `1–${endDay}` : undefined,
          startDate: bounds.min,
          endDate: bounds.max,
        };
      });
  }, [dataset]);

  const crossFilter = useMemo(() => {
    if (!dataset) return null;
    return computeCrossFilterDashboard(dataset.records, filters);
  }, [dataset, filters]);

  const metrics = crossFilter?.metrics ?? null;

  const activeChips = useMemo(() => {
    if (!dataset) return [];
    const chips: Array<{ key: string; label: string; onClear: () => void }> = [];
    if (filters.startDate !== dataset.minDate || filters.endDate !== dataset.maxDate) {
      chips.push({
        key: 'date',
        label: `Periode: ${formatDateRange(filters.startDate, filters.endDate)}`,
        onClear: () =>
          setFilters((f) => ({ ...f, startDate: dataset.minDate, endDate: dataset.maxDate })),
      });
    }
    if (filters.region !== 'ALL') {
      chips.push({
        key: 'region',
        label: `Region: ${filters.region}`,
        onClear: () => setFilters((f) => ({ ...f, region: 'ALL' })),
      });
    }
    if (filters.brand !== 'ALL') {
      chips.push({
        key: 'brand',
        label: `Brand: ${filters.brand}`,
        onClear: () => setFilters((f) => ({ ...f, brand: 'ALL' })),
      });
    }
    if (filters.outletType !== 'ALL') {
      chips.push({
        key: 'outletType',
        label: `Kanal: ${filters.outletType}`,
        onClear: () => setFilters((f) => ({ ...f, outletType: 'ALL' })),
      });
    }
    return chips;
  }, [dataset, filters]);

  const resetFilters = () => {
    if (!dataset) return;
    setFilters({
      startDate: dataset.minDate,
      endDate: dataset.maxDate,
      region: 'ALL',
      brand: 'ALL',
      outletType: 'ALL',
    });
  };

  const totalQualityActions = dataset
    ? dataset.quality.regionNormalizedCount +
      dataset.quality.duplicateRowsRemoved +
      dataset.quality.trimmedFieldCount +
      dataset.quality.salesmanBackfilledCount
    : 0;

  return (
    <div className="min-h-screen bg-[#F6F5F0] text-slate-900">
      {/* Full-window CSV Drop Overlay */}
      {isDraggingCsv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-6 backdrop-blur-xs">
          <div className="flex max-w-md flex-col items-center rounded-3xl border-2 border-dashed border-teal-400 bg-white px-10 py-10 text-center shadow-2xl">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
              <FileUp className="h-7 w-7" />
            </div>
            <h2 className="mt-4 text-lg font-extrabold text-slate-900">Lepaskan file CSV di sini</h2>
            <p className="mt-1 text-xs text-slate-500">
              Data akan langsung dibersihkan dan dianalisis secara lokal di browser.
            </p>
          </div>
        </div>
      )}

      {/* Slim Executive Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#C81E2B] text-sm font-extrabold tracking-tight text-white shadow-xs">
              DK
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-extrabold tracking-tight text-slate-900 sm:text-base">
                  Dua Kelinci Commercial Cockpit
                </h1>
                {dataset && (
                  <span className="hidden rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 sm:inline-block tabular-nums">
                    {formatDateRange(dataset.minDate, dataset.maxDate)}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-2 text-[11px] text-slate-500">
                <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                  <FileSpreadsheet className="h-3 w-3 text-teal-700" />
                  {fileName}
                </span>
                {dataset && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span className="tabular-nums">
                      {formatNumber(dataset.quality.cleanRowCount)} baris bersih
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {dataset && (
              <button
                type="button"
                onClick={() => setDqOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-teal-200/80 bg-teal-50/80 px-3 py-1.5 text-xs font-bold text-teal-900 transition hover:bg-teal-100"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-teal-700" />
                <span className="hidden sm:inline">Audit Data</span>
                <span className="rounded-full bg-white px-1.5 py-0.5 text-[10px] font-extrabold text-teal-800 tabular-nums">
                  {totalQualityActions} perbaikan
                </span>
              </button>
            )}

            <a
              href="#weakest-outlets"
              className="hidden items-center gap-1.5 rounded-xl border border-rose-200/80 bg-rose-50/70 px-3 py-1.5 text-xs font-bold text-rose-800 transition hover:bg-rose-100 md:inline-flex"
            >
              <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
              <span>5 Outlet Terlemah</span>
            </a>

            <a
              href="#telegram-summary"
              className="hidden items-center gap-1.5 rounded-xl border border-sky-200/80 bg-sky-50/70 px-3 py-1.5 text-xs font-bold text-sky-900 transition hover:bg-sky-100 sm:inline-flex"
            >
              <Send className="h-3 w-3 text-[#229ED9]" />
              <span>Telegram</span>
            </a>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Upload atau drag-and-drop file CSV"
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-slate-800"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Upload CSV</span>
            </button>

            {isCustomFile && (
              <button
                type="button"
                onClick={() => void loadDefaultCsv()}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset CSV</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-5 px-4 py-5 sm:px-6">
        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">
            {error}
          </div>
        )}

        {loading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
            Memuat dan membersihkan data penjualan...
          </div>
        )}

        {!loading && dataset && metrics && crossFilter && (
          <>
            {/* Compact Executive Toolbar Filter Bar */}
            <section className="rounded-2xl border border-slate-200/90 bg-white px-4 py-3 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                {/* Period Segmented Pills */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="mr-1 inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400" />
                    Periode
                  </span>
                  <div className="inline-flex flex-wrap items-center rounded-xl bg-slate-100 p-0.5">
                    <button
                      type="button"
                      onClick={() =>
                        setFilters((f) => ({
                          ...f,
                          startDate: dataset.minDate,
                          endDate: dataset.maxDate,
                        }))
                      }
                      className={`rounded-[10px] px-2.5 py-1 text-[11px] font-bold transition ${
                        filters.startDate === dataset.minDate && filters.endDate === dataset.maxDate
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Semua
                    </button>
                    {monthPresets.map((preset) => {
                      const isActive =
                        filters.startDate === preset.startDate &&
                        filters.endDate === preset.endDate;
                      return (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() =>
                            setFilters((f) => ({
                              ...f,
                              startDate: preset.startDate,
                              endDate: preset.endDate,
                            }))
                          }
                          className={`rounded-[10px] px-2.5 py-1 text-[11px] font-bold transition ${
                            isActive
                              ? 'bg-slate-900 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {preset.label}
                          {preset.sublabel && (
                            <span
                              className={`ml-1 text-[10px] font-medium ${
                                isActive ? 'text-slate-300' : 'text-slate-400'
                              }`}
                            >
                              ({preset.sublabel})
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Inline Compact Controls */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50/70 px-2 py-1 text-[11px] font-semibold text-slate-700">
                    <input
                      type="date"
                      aria-label="Tanggal Mulai"
                      value={filters.startDate}
                      min={dataset.minDate}
                      max={filters.endDate || dataset.maxDate}
                      onChange={(e) => setFilters((f) => ({ ...f, startDate: e.target.value }))}
                      className="bg-transparent text-[11px] font-semibold text-slate-800 outline-none"
                    />
                    <span className="text-slate-400">–</span>
                    <input
                      type="date"
                      aria-label="Tanggal Akhir"
                      value={filters.endDate}
                      min={filters.startDate || dataset.minDate}
                      max={dataset.maxDate}
                      onChange={(e) => setFilters((f) => ({ ...f, endDate: e.target.value }))}
                      className="bg-transparent text-[11px] font-semibold text-slate-800 outline-none"
                    />
                  </div>

                  <select
                    aria-label="Filter Region"
                    value={filters.region}
                    onChange={(e) => setFilters((f) => ({ ...f, region: e.target.value }))}
                    className="rounded-xl border border-slate-200 bg-slate-50/70 px-2.5 py-1.5 text-xs font-semibold text-slate-800 outline-none transition focus:border-slate-900 focus:bg-white"
                  >
                    <option value="ALL">Semua Region ({dataset.availableRegions.length})</option>
                    {dataset.availableRegions.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>

                  <select
                    aria-label="Filter Brand"
                    value={filters.brand}
                    onChange={(e) => setFilters((f) => ({ ...f, brand: e.target.value }))}
                    className="rounded-xl border border-slate-200 bg-slate-50/70 px-2.5 py-1.5 text-xs font-semibold text-slate-800 outline-none transition focus:border-slate-900 focus:bg-white"
                  >
                    <option value="ALL">Semua Brand ({dataset.availableBrands.length})</option>
                    {dataset.availableBrands.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>

                  <select
                    aria-label="Filter Tipe Outlet"
                    value={filters.outletType}
                    onChange={(e) => setFilters((f) => ({ ...f, outletType: e.target.value }))}
                    className="rounded-xl border border-slate-200 bg-slate-50/70 px-2.5 py-1.5 text-xs font-semibold text-slate-800 outline-none transition focus:border-slate-900 focus:bg-white"
                  >
                    <option value="ALL">Semua Kanal ({dataset.availableOutletTypes.length})</option>
                    {dataset.availableOutletTypes.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Active Filter Chips Bar */}
              {activeChips.length > 0 && (
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-2.5">
                  <span className="text-[11px] font-medium text-slate-400 tabular-nums">
                    {formatNumber(metrics.totals.rowCount)} transaksi aktif:
                  </span>
                  {activeChips.map((chip) => (
                    <button
                      key={chip.key}
                      type="button"
                      onClick={chip.onClear}
                      className="inline-flex items-center gap-1 rounded-full bg-slate-900/5 px-2.5 py-0.5 text-[11px] font-semibold text-slate-800 ring-1 ring-inset ring-slate-900/10 transition hover:bg-slate-900/10"
                    >
                      <span>{chip.label}</span>
                      <X className="h-3 w-3 text-slate-500" />
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="ml-auto inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 hover:underline"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Reset semua
                  </button>
                </div>
              )}
            </section>

            {/* Executive KPI Strip */}
            <KpiStrip metrics={metrics} />

            {/* Elevated 1-Paragraph Telegram Executive Brief (Immediately Accessible) */}
            <TelegramSummaryCard metrics={metrics} filters={filters} />

            {/* Sales Trend, Partial-Month Run-Rate & Channel Composition */}
            <SalesTrendCard
              metrics={metrics}
              selectedChannel={filters.outletType}
              onSelectChannel={(outletType) => setFilters((f) => ({ ...f, outletType }))}
            />

            {/* Region & Brand Charts */}
            <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <SalesBarChartCard
                title="Penjualan per Region"
                subtitle="Total Net Sales IDR, kontribusi share, dan volume karton per wilayah"
                items={crossFilter.regionChartItems}
                selectedName={filters.region}
                onSelect={(region) => setFilters((f) => ({ ...f, region }))}
                accent="crimson"
              />
              <SalesBarChartCard
                title="Penjualan per Brand"
                subtitle="Total Net Sales IDR, kontribusi share, dan volume karton per lini produk"
                items={crossFilter.brandChartItems}
                selectedName={filters.brand}
                onSelect={(brand) => setFilters((f) => ({ ...f, brand }))}
                accent="amber"
              />
            </section>

            {/* Region x Brand Heatmap Matrix */}
            <RegionBrandMatrix
              matrix={crossFilter.matrixData}
              selectedRegion={filters.region}
              selectedBrand={filters.brand}
              onSelectCell={(region, brand) =>
                setFilters((f) => {
                  const isSame = f.region === region && f.brand === brand;
                  return {
                    ...f,
                    region: isSame ? 'ALL' : region,
                    brand: isSame ? 'ALL' : brand,
                  };
                })
              }
            />

            {/* Bottom 5 Weakest Outlets */}
            <div id="weakest-outlets">
              <WeakestOutletsCard
                outlets={metrics.weakestOutlets}
                avgSalesPerOutletIdr={metrics.totals.avgSalesPerOutletIdr}
                totalActiveOutlets={metrics.allOutletsCount}
              />
            </div>
          </>
        )}
      </main>

      <footer className="mx-auto max-w-7xl px-4 py-6 text-center text-xs text-slate-400 sm:px-6">
        Dua Kelinci Commercial Cockpit · Seluruh perhitungan dilakukan lokal di browser berbasis{' '}
        <span className="font-mono">{fileName}</span> · Mendukung drag &amp; drop CSV.
      </footer>

      {dataset && (
        <DataQualityModal
          open={dqOpen}
          onClose={() => setDqOpen(false)}
          quality={dataset.quality}
          fileName={fileName}
        />
      )}
    </div>
  );
}

export default App;
