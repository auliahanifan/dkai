import {
  ArrowDownRight,
  ArrowUpRight,
  Award,
  Layers,
  MapPin,
  TrendingUp,
} from 'lucide-react';
import {
  formatDecimal,
  formatIdrCompact,
  formatIdrFull,
  formatNumber,
  formatPct,
  formatSignedPct,
} from '../lib/formatters';
import type { DashboardMetrics } from '../lib/salesAnalytics';

interface KpiStripProps {
  metrics: DashboardMetrics;
}

export function KpiStrip({ metrics }: KpiStripProps) {
  const { totals, byRegion, byBrand, byChannel, monthlyComparison } = metrics;
  const topRegion = byRegion[0];
  const topBrand = byBrand[0];
  const topChannel = byChannel[0];

  const { latestMonth, prevMonth, runRateDeltaPct } = monthlyComparison;
  const isRunRateUp = runRateDeltaPct !== null && runRateDeltaPct >= 0;

  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {/* Hero Dark Anchor Card: Net Sales & Run-Rate */}
      <div className="relative overflow-hidden rounded-2xl bg-slate-900 p-5 text-white shadow-sm">
        <div className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-teal-500/15 blur-2xl" />
        <div className="flex items-center justify-between text-[11px] font-bold tracking-wider text-slate-400 uppercase">
          <span>Total Net Sales</span>
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-teal-300">
            <TrendingUp className="h-3.5 w-3.5" />
          </span>
        </div>

        <div className="mt-2.5 flex flex-wrap items-baseline gap-2.5">
          <p className="text-3xl font-extrabold tracking-tight text-white tabular-nums">
            {formatIdrCompact(totals.netSalesIdr)}
          </p>
          {runRateDeltaPct !== null && latestMonth && prevMonth && (
            <span
              title={`Run-rate harian ${latestMonth.label} (${formatIdrCompact(latestMonth.dailyRunRateIdr)}/hari) vs ${prevMonth.label} (${formatIdrCompact(prevMonth.dailyRunRateIdr)}/hari)`}
              className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums ${
                isRunRateUp
                  ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-inset ring-emerald-400/30'
                  : 'bg-rose-500/20 text-rose-300 ring-1 ring-inset ring-rose-400/30'
              }`}
            >
              {isRunRateUp ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : (
                <ArrowDownRight className="h-3 w-3" />
              )}
              {formatSignedPct(runRateDeltaPct)}/hari
            </span>
          )}
        </div>

        <p className="mt-0.5 text-xs font-medium text-slate-400 tabular-nums">
          {formatIdrFull(totals.netSalesIdr)} · {formatIdrCompact(totals.dailyRunRateIdr)}/hari aktif
        </p>

        <div className="mt-3.5 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-white/10 pt-2.5 text-[11px] text-slate-300 tabular-nums">
          <span>Gross {formatIdrCompact(totals.grossSalesIdr)}</span>
          <span className="text-slate-600">•</span>
          <span>Diskon {formatPct(totals.discountRatePct)}</span>
          {totals.returnCount > 0 && (
            <>
              <span className="text-slate-600">•</span>
              <span className="font-semibold text-rose-300">
                {totals.returnCount} retur ({formatIdrCompact(totals.returnNetSalesIdr)})
              </span>
            </>
          )}
        </div>
      </div>

      {/* Volume, Drop Size & Channel Concentration */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between text-[11px] font-bold tracking-wider text-slate-500 uppercase">
          <span>Volume &amp; Kanal</span>
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
            <Layers className="h-3.5 w-3.5" />
          </span>
        </div>
        <p className="mt-2.5 text-2xl font-extrabold tracking-tight text-slate-900 tabular-nums">
          {formatNumber(totals.qtyCarton)}{' '}
          <span className="text-sm font-semibold text-slate-500">karton</span>
        </p>
        <p className="mt-0.5 text-xs font-medium text-slate-500 tabular-nums">
          {formatNumber(totals.activeOutletCount)} outlet · {formatNumber(totals.invoiceCount)} inv
          ({formatDecimal(totals.avgCartonsPerInvoice, 1)} ktn/inv)
        </p>
        <div className="mt-3.5 flex items-center justify-between border-t border-slate-100 pt-2.5 text-[11px] text-slate-600 tabular-nums">
          {topChannel ? (
            <>
              <span className="truncate font-medium text-slate-600">
                Dominan: <strong className="text-slate-900">{topChannel.outletType}</strong> (
                {topChannel.outletCount} outlet)
              </span>
              <span className="ml-2 shrink-0 rounded-full bg-slate-100 px-2 py-0.5 font-bold text-slate-800">
                {formatPct(topChannel.sharePct, 0)}
              </span>
            </>
          ) : (
            <span>Tidak ada data kanal</span>
          )}
        </div>
      </div>

      {/* Region Terkuat */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between text-[11px] font-bold tracking-wider text-slate-500 uppercase">
          <span>Region #1</span>
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
            <MapPin className="h-3.5 w-3.5" />
          </span>
        </div>
        <p className="mt-2.5 truncate text-xl font-extrabold tracking-tight text-slate-900">
          {topRegion ? topRegion.name : '-'}
        </p>
        <p className="mt-0.5 text-xs font-semibold text-slate-700 tabular-nums">
          {topRegion ? formatIdrCompact(topRegion.netSalesIdr) : 'Tidak ada data'}
        </p>
        <div className="mt-3.5 flex items-center justify-between border-t border-slate-100 pt-2.5 text-[11px] text-slate-600 tabular-nums">
          <span>{topRegion ? `${formatNumber(topRegion.qtyCarton)} ktn` : '-'}</span>
          {topRegion && (
            <span className="rounded-full bg-teal-50 px-2 py-0.5 font-bold text-teal-800">
              {formatPct(topRegion.sharePct)}
            </span>
          )}
        </div>
      </div>

      {/* Brand Terkuat */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between text-[11px] font-bold tracking-wider text-slate-500 uppercase">
          <span>Brand Terkuat</span>
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
            <Award className="h-3.5 w-3.5" />
          </span>
        </div>
        <p className="mt-2.5 truncate text-xl font-extrabold tracking-tight text-slate-900">
          {topBrand ? topBrand.name : '-'}
        </p>
        <p className="mt-0.5 text-xs font-semibold text-slate-700 tabular-nums">
          {topBrand ? formatIdrCompact(topBrand.netSalesIdr) : 'Tidak ada data'}
        </p>
        <div className="mt-3.5 flex items-center justify-between border-t border-slate-100 pt-2.5 text-[11px] text-slate-600 tabular-nums">
          <span>
            {topBrand
              ? `${formatNumber(topBrand.qtyCarton)} ktn · ${topBrand.outletCount} outlet`
              : '-'}
          </span>
          {topBrand && (
            <span className="rounded-full bg-amber-50 px-2 py-0.5 font-bold text-amber-800">
              {formatPct(topBrand.sharePct)}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
