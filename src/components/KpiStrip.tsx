import { Award, MapPin, Package, TrendingUp } from 'lucide-react';
import { formatIdrCompact, formatIdrFull, formatNumber, formatPct } from '../lib/formatters';
import type { DashboardMetrics } from '../lib/salesAnalytics';

interface KpiStripProps {
  metrics: DashboardMetrics;
}

export function KpiStrip({ metrics }: KpiStripProps) {
  const { totals, byRegion, byBrand } = metrics;
  const topRegion = byRegion[0];
  const topBrand = byBrand[0];

  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
        <div className="absolute inset-x-0 top-0 h-1 bg-[#C81E2B]" />
        <div className="flex items-center justify-between text-xs font-semibold tracking-wide text-slate-500 uppercase">
          <span>Total Net Sales</span>
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 text-[#C81E2B]">
            <TrendingUp className="h-4 w-4" />
          </span>
        </div>
        <p className="mt-2.5 text-2xl font-extrabold tracking-tight text-slate-900 tabular-nums">
          {formatIdrCompact(totals.netSalesIdr)}
        </p>
        <p className="mt-0.5 text-xs font-medium text-slate-500 tabular-nums">
          {formatIdrFull(totals.netSalesIdr)}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-slate-100 pt-2.5 text-xs text-slate-600 tabular-nums">
          <span>Gross: {formatIdrCompact(totals.grossSalesIdr)}</span>
          <span className="text-slate-300">•</span>
          <span>Diskon: {formatPct(totals.discountRatePct)}</span>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between text-xs font-semibold tracking-wide text-slate-500 uppercase">
          <span>Volume &amp; Outlet Aktif</span>
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
            <Package className="h-4 w-4" />
          </span>
        </div>
        <p className="mt-2.5 text-2xl font-extrabold tracking-tight text-slate-900 tabular-nums">
          {formatNumber(totals.qtyCarton)}{' '}
          <span className="text-sm font-semibold text-slate-500">karton</span>
        </p>
        <p className="mt-0.5 text-xs font-medium text-slate-500 tabular-nums">
          {formatNumber(totals.activeOutletCount)} outlet · {formatNumber(totals.invoiceCount)} invoice
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-slate-100 pt-2.5 text-xs text-slate-600 tabular-nums">
          <span>Rata-rata: {formatIdrCompact(totals.avgSalesPerOutletIdr)}/outlet</span>
          {totals.returnCount > 0 && (
            <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700">
              {totals.returnCount} retur ({formatIdrCompact(totals.returnNetSalesIdr)})
            </span>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between text-xs font-semibold tracking-wide text-slate-500 uppercase">
          <span>Region Terkuat</span>
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <MapPin className="h-4 w-4" />
          </span>
        </div>
        <p className="mt-2.5 truncate text-2xl font-extrabold tracking-tight text-slate-900">
          {topRegion ? topRegion.name : '-'}
        </p>
        <p className="mt-0.5 text-xs font-medium text-slate-500 tabular-nums">
          {topRegion ? formatIdrFull(topRegion.netSalesIdr) : 'Tidak ada data'}
        </p>
        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs text-slate-600 tabular-nums">
          <span>{topRegion ? `${formatNumber(topRegion.qtyCarton)} karton` : '-'}</span>
          {topRegion && (
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700">
              {formatPct(topRegion.sharePct)} share
            </span>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between text-xs font-semibold tracking-wide text-slate-500 uppercase">
          <span>Brand Terkuat</span>
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 text-[#9F1239]">
            <Award className="h-4 w-4" />
          </span>
        </div>
        <p className="mt-2.5 truncate text-2xl font-extrabold tracking-tight text-slate-900">
          {topBrand ? topBrand.name : '-'}
        </p>
        <p className="mt-0.5 text-xs font-medium text-slate-500 tabular-nums">
          {topBrand ? formatIdrFull(topBrand.netSalesIdr) : 'Tidak ada data'}
        </p>
        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs text-slate-600 tabular-nums">
          <span>{topBrand ? `${formatNumber(topBrand.qtyCarton)} karton` : '-'}</span>
          {topBrand && (
            <span className="rounded-full bg-rose-50 px-2 py-0.5 font-semibold text-[#9F1239]">
              {formatPct(topBrand.sharePct)} share
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
