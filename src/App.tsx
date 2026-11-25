import {
  FileSpreadsheet,
  Filter,
  RotateCcw,
  Send,
  ShieldCheck,
  Upload,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { DataQualityModal } from './components/DataQualityModal';
import { KpiStrip } from './components/KpiStrip';
import { RegionBrandMatrix } from './components/RegionBrandMatrix';
import { SalesBarChartCard } from './components/SalesBarChartCard';
import { TelegramSummaryCard } from './components/TelegramSummaryCard';
import { WeakestOutletsCard } from './components/WeakestOutletsCard';
import { formatDateRange, formatNumber } from './lib/formatters';
import {
  computeDashboardMetrics,
  filterSalesRecords,
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

const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

interface MonthPreset {
  label: string;
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

  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setDataset(parsed);
      setFileName('sales.csv');
      setIsCustomFile(false);
      setFilters({
        startDate: parsed.minDate,
        endDate: parsed.maxDate,
        region: 'ALL',
        brand: 'ALL',
        outletType: 'ALL',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat membaca CSV.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDefaultCsv();
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(null);
    try {
      const text = await file.text();
      const parsed = parseAndCleanSalesCsv(text);
      setDataset(parsed);
      setFileName(file.name);
      setIsCustomFile(true);
      setFilters({
        startDate: parsed.minDate,
        endDate: parsed.maxDate,
        region: 'ALL',
        brand: 'ALL',
        outletType: 'ALL',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Format CSV tidak valid.');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

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
        return {
          label: `${MONTH_NAMES[m - 1] ?? m} ${y}`,
          startDate: bounds.min,
          endDate: bounds.max,
        };
      });
  }, [dataset]);

  const filteredRecords = useMemo(() => {
    if (!dataset) return [];
    return filterSalesRecords(dataset.records, filters);
  }, [dataset, filters]);

  const metrics = useMemo(() => computeDashboardMetrics(filteredRecords), [filteredRecords]);

  const hasActiveFilter = useMemo(() => {
    if (!dataset) return false;
    return (
      filters.startDate !== dataset.minDate ||
      filters.endDate !== dataset.maxDate ||
      filters.region !== 'ALL' ||
      filters.brand !== 'ALL' ||
      filters.outletType !== 'ALL'
    );
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

  const totalIssuesCleaned = dataset
    ? dataset.quality.regionNormalizedCount +
      dataset.quality.duplicateRowsRemoved +
      dataset.quality.trimmedRowsCount +
      dataset.quality.salesmanBackfilledCount
    : 0;

  return (
    <div className="min-h-screen bg-[#F8F7F4] text-slate-900">
      {/* Top Executive Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#C81E2B] font-extrabold text-white shadow-xs">
              DK
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-tight text-slate-900 sm:text-lg">
                Dua Kelinci Sales Monitor
              </h1>
              <div className="flex flex-wrap items-center gap-x-2 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                  <FileSpreadsheet className="h-3.5 w-3.5 text-[#C81E2B]" />
                  {fileName}
                </span>
                {dataset && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span>
                      Periode data: {formatDateRange(dataset.minDate, dataset.maxDate)} (
                      {formatNumber(dataset.quality.cleanRowCount)} baris)
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
                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100"
              >
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>Data Quality</span>
                <span className="rounded-full bg-white px-1.5 py-0.5 text-[10px] font-extrabold text-emerald-700 tabular-nums">
                  {totalIssuesCleaned} dirapikan
                </span>
              </button>
            )}

            <a
              href="#telegram-summary"
              className="inline-flex items-center gap-1.5 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-bold text-sky-800 transition hover:bg-sky-100"
            >
              <Send className="h-3.5 w-3.5 text-[#229ED9]" />
              <span>Ringkasan Telegram</span>
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
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-slate-800"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Upload CSV</span>
            </button>

            {isCustomFile && (
              <button
                type="button"
                onClick={() => void loadDefaultCsv()}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>sales.csv bawaan</span>
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

        {!loading && dataset && (
          <>
            {/* Interactive Filter Bar */}
            <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <Filter className="h-3.5 w-3.5 text-[#C81E2B]" />
                  <span>Filter Analisis</span>
                  <span className="font-normal text-slate-400">
                    ({formatNumber(filteredRecords.length)} transaksi ditampilkan)
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      setFilters((f) => ({
                        ...f,
                        startDate: dataset.minDate,
                        endDate: dataset.maxDate,
                      }))
                    }
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                      filters.startDate === dataset.minDate && filters.endDate === dataset.maxDate
                        ? 'bg-[#C81E2B] text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Semua Periode
                  </button>
                  {monthPresets.map((preset) => {
                    const isActive =
                      filters.startDate === preset.startDate && filters.endDate === preset.endDate;
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
                        className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                          isActive
                            ? 'bg-[#C81E2B] text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}

                  {hasActiveFilter && (
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="ml-1 inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-700 transition hover:bg-rose-100"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Reset
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <label className="flex flex-col gap-1 text-[11px] font-semibold text-slate-500">
                  <span>Tanggal Mulai</span>
                  <input
                    type="date"
                    value={filters.startDate}
                    min={dataset.minDate}
                    max={filters.endDate || dataset.maxDate}
                    onChange={(e) => setFilters((f) => ({ ...f, startDate: e.target.value }))}
                    className="rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-[#C81E2B] focus:bg-white"
                  />
                </label>

                <label className="flex flex-col gap-1 text-[11px] font-semibold text-slate-500">
                  <span>Tanggal Akhir</span>
                  <input
                    type="date"
                    value={filters.endDate}
                    min={filters.startDate || dataset.minDate}
                    max={dataset.maxDate}
                    onChange={(e) => setFilters((f) => ({ ...f, endDate: e.target.value }))}
                    className="rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-[#C81E2B] focus:bg-white"
                  />
                </label>

                <label className="flex flex-col gap-1 text-[11px] font-semibold text-slate-500">
                  <span>Region</span>
                  <select
                    value={filters.region}
                    onChange={(e) => setFilters((f) => ({ ...f, region: e.target.value }))}
                    className="rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-[#C81E2B] focus:bg-white"
                  >
                    <option value="ALL">Semua Region ({dataset.availableRegions.length})</option>
                    {dataset.availableRegions.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex flex-col gap-1 text-[11px] font-semibold text-slate-500">
                  <span>Brand</span>
                  <select
                    value={filters.brand}
                    onChange={(e) => setFilters((f) => ({ ...f, brand: e.target.value }))}
                    className="rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-[#C81E2B] focus:bg-white"
                  >
                    <option value="ALL">Semua Brand ({dataset.availableBrands.length})</option>
                    {dataset.availableBrands.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex flex-col gap-1 text-[11px] font-semibold text-slate-500">
                  <span>Tipe Outlet</span>
                  <select
                    value={filters.outletType}
                    onChange={(e) => setFilters((f) => ({ ...f, outletType: e.target.value }))}
                    className="rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-[#C81E2B] focus:bg-white"
                  >
                    <option value="ALL">Semua Tipe ({dataset.availableOutletTypes.length})</option>
                    {dataset.availableOutletTypes.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </section>

            {/* KPI Summary Strip */}
            <KpiStrip metrics={metrics} />

            {/* Region & Brand Charts */}
            <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <SalesBarChartCard
                title="Penjualan per Region"
                subtitle="Total Net Sales IDR, kontribusi share, dan volume karton per wilayah"
                items={metrics.byRegion}
                selectedName={filters.region}
                onSelect={(region) => setFilters((f) => ({ ...f, region }))}
                accent="crimson"
              />
              <SalesBarChartCard
                title="Penjualan per Brand"
                subtitle="Total Net Sales IDR, kontribusi share, dan volume karton per lini produk"
                items={metrics.byBrand}
                selectedName={filters.brand}
                onSelect={(brand) => setFilters((f) => ({ ...f, brand }))}
                accent="amber"
              />
            </section>

            {/* Region x Brand Heatmap Matrix */}
            <RegionBrandMatrix
              matrix={metrics.matrix}
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
            <WeakestOutletsCard
              outlets={metrics.weakestOutlets}
              avgSalesPerOutletIdr={metrics.totals.avgSalesPerOutletIdr}
              totalActiveOutlets={metrics.allOutletsCount}
            />

            {/* 1-Paragraph Telegram Summary */}
            <TelegramSummaryCard metrics={metrics} filters={filters} />
          </>
        )}
      </main>

      <footer className="mx-auto max-w-7xl px-4 py-6 text-center text-xs text-slate-400 sm:px-6">
        Dua Kelinci Sales Monitor · Seluruh perhitungan dilakukan lokal di browser berbasis data{' '}
        <span className="font-mono">{fileName}</span>.
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
