import { AlertTriangle, Calendar, Store, UserCheck } from 'lucide-react';
import {
  formatDateShort,
  formatIdrCompact,
  formatIdrFull,
  formatNumber,
  formatPct,
} from '../lib/formatters';
import type { OutletPerformance } from '../lib/salesAnalytics';

interface WeakestOutletsCardProps {
  outlets: OutletPerformance[];
  avgSalesPerOutletIdr: number;
  totalActiveOutlets: number;
}

export function WeakestOutletsCard({
  outlets,
  avgSalesPerOutletIdr,
  totalActiveOutlets,
}: WeakestOutletsCardProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-rose-200/80 bg-white shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rose-100 bg-rose-50/60 px-5 py-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#C81E2B] text-white shadow-xs">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">5 Outlet Terlemah</h2>
              <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-[11px] font-semibold text-rose-800">
                Prioritas Follow-up
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-600">
              Diurutkan berdasarkan Net Sales IDR terendah dari {formatNumber(totalActiveOutlets)}{' '}
              outlet aktif pada filter saat ini (dikelompokkan per{' '}
              <code className="rounded bg-white/80 px-1 py-0.5 font-mono text-[11px] text-slate-700">
                outlet_id
              </code>
              ).
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-rose-200/70 bg-white px-3.5 py-2 text-right tabular-nums">
          <div className="text-[11px] font-medium text-slate-500">Rata-rata / Outlet</div>
          <div className="text-sm font-extrabold text-slate-900">
            {formatIdrCompact(avgSalesPerOutletIdr)}
          </div>
        </div>
      </div>

      {outlets.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-slate-400">
          Tidak ada outlet yang bertransaksi pada filter aktif.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[740px] text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold tracking-wide text-slate-500 uppercase">
                <th className="py-3 pr-2 pl-5">Peringkat</th>
                <th className="px-3 py-3">Outlet</th>
                <th className="px-3 py-3">Cabang &amp; Region</th>
                <th className="px-3 py-3">Salesman</th>
                <th className="px-3 py-3">Aktivitas Order</th>
                <th className="px-3 py-3 text-right">Volume</th>
                <th className="py-3 pr-5 pl-3 text-right">Net Sales &amp; Gap</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {outlets.map((outlet, index) => {
                const pctOfAvg =
                  avgSalesPerOutletIdr > 0
                    ? Math.max(0, Math.min((outlet.netSalesIdr / avgSalesPerOutletIdr) * 100, 100))
                    : 0;

                return (
                  <tr
                    key={outlet.outletId}
                    className="transition-colors hover:bg-rose-50/30"
                  >
                    <td className="py-3.5 pr-2 pl-5 align-middle">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-extrabold tabular-nums ${
                          index === 0
                            ? 'bg-[#C81E2B] text-white'
                            : index <= 2
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        #{index + 1}
                      </span>
                    </td>

                    <td className="px-3 py-3.5 align-middle">
                      <div className="flex items-center gap-2">
                        <Store className="h-4 w-4 shrink-0 text-slate-400" />
                        <div>
                          <div className="text-sm font-bold text-slate-900">{outlet.outletName}</div>
                          <div className="mt-0.5 flex items-center gap-1.5">
                            <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-slate-700">
                              {outlet.outletId}
                            </span>
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                              {outlet.outletType}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-3 py-3.5 align-middle">
                      <div className="text-sm font-semibold text-slate-800">{outlet.branch}</div>
                      <div className="text-xs text-slate-500">{outlet.region}</div>
                    </td>

                    <td className="px-3 py-3.5 align-middle">
                      <div className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 ring-1 ring-inset ring-slate-200/70">
                        <UserCheck className="h-3.5 w-3.5 text-slate-400" />
                        <span>{outlet.primarySalesman}</span>
                      </div>
                    </td>

                    <td className="px-3 py-3.5 align-middle tabular-nums">
                      <div className="text-xs font-semibold text-slate-800">
                        {formatNumber(outlet.invoiceCount)} invoice
                      </div>
                      <div className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-slate-500">
                        <Calendar className="h-3 w-3 text-slate-400" />
                        <span>Terakhir {formatDateShort(outlet.lastOrderDate)}</span>
                      </div>
                    </td>

                    <td className="px-3 py-3.5 text-right align-middle tabular-nums">
                      <span className="text-sm font-bold text-slate-800">
                        {formatNumber(outlet.qtyCarton)}
                      </span>
                      <span className="ml-1 text-xs text-slate-500">ktn</span>
                    </td>

                    <td className="py-3.5 pr-5 pl-3 text-right align-middle tabular-nums">
                      <div className="text-sm font-extrabold text-[#C81E2B]">
                        {formatIdrFull(outlet.netSalesIdr)}
                      </div>
                      <div className="mt-1 flex items-center justify-end gap-2">
                        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-[#C81E2B]"
                            style={{ width: `${Math.max(pctOfAvg, 3)}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-semibold text-rose-700">
                          {outlet.gapVsAvgPct <= 0
                            ? `${formatPct(outlet.gapVsAvgPct)}`
                            : `+${formatPct(outlet.gapVsAvgPct)}`}{' '}
                          vs avg
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
