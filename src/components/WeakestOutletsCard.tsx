import {
  AlertTriangle,
  Calendar,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  ClockAlert,
  Store,
  UserCheck,
} from 'lucide-react';
import { useState } from 'react';
import {
  formatDateShort,
  formatDecimal,
  formatIdrCompact,
  formatIdrFull,
  formatNumber,
  formatSignedPct,
} from '../lib/formatters';
import type { DormantOutlet, OutletPerformance } from '../lib/salesAnalytics';

interface WeakestOutletsCardProps {
  outlets: OutletPerformance[];
  dormantOutlets: DormantOutlet[];
  totalActiveOutlets: number;
  onSelectOutlet: (outlet: OutletPerformance) => void;
  onSelectDormantOutlet?: (outletId: string) => void;
}

export function WeakestOutletsCard({
  outlets,
  dormantOutlets,
  totalActiveOutlets,
  onSelectOutlet,
  onSelectDormantOutlet,
}: WeakestOutletsCardProps) {
  const [dormantExpanded, setDormantExpanded] = useState<boolean>(false);

  const dormantTotalAtRisk = dormantOutlets.reduce((s, d) => s + d.priorNetSalesIdr, 0);

  return (
    <section
      id="weakest-outlets"
      className="overflow-hidden rounded-2xl border border-rose-200/90 bg-white shadow-xs"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rose-100 bg-rose-50/70 px-5 py-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-600 text-white shadow-xs">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">5 Outlet Terlemah</h2>
              <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-[11px] font-bold text-rose-800">
                Prioritas Follow-up
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-600">
              Diurutkan berdasarkan Net Sales IDR terendah dari {formatNumber(totalActiveOutlets)}{' '}
              outlet aktif (per <code className="font-mono text-[11px] text-slate-700">outlet_id</code>
              ), dibandingkan terhadap <strong className="font-semibold text-slate-800">rata-rata peer tipe outlet yang sama</strong>. Klik baris untuk diagnosis &amp; riwayat invoice.
            </p>
          </div>
        </div>

        <span className="shrink-0 rounded-full border border-rose-200/80 bg-white px-3 py-1 text-[11px] font-bold text-rose-800">
          Klik outlet untuk detail →
        </span>
      </div>

      {outlets.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-slate-400">
          Tidak ada outlet yang bertransaksi pada filter aktif.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-bold tracking-wide text-slate-500 uppercase">
                <th className="sticky left-0 z-10 bg-slate-50 py-3 pr-2 pl-5 shadow-[2px_0_4px_-2px_rgba(15,23,42,0.06)]">
                  Outlet &amp; Diagnosis
                </th>
                <th className="px-3 py-3">Cabang &amp; Region</th>
                <th className="px-3 py-3">Salesman</th>
                <th className="px-3 py-3">Order &amp; Drop Size</th>
                <th className="px-3 py-3 text-right">Net Sales vs Peer Kanal</th>
                <th className="py-3 pr-4 pl-2 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {outlets.map((outlet, index) => {
                const pctOfPeer =
                  outlet.peerAvgSalesIdr > 0
                    ? Math.max(0, Math.min((outlet.netSalesIdr / outlet.peerAvgSalesIdr) * 100, 100))
                    : 0;

                return (
                  <tr
                    key={outlet.outletId}
                    onClick={() => onSelectOutlet(outlet)}
                    className="group cursor-pointer transition-colors hover:bg-rose-50/40"
                  >
                    <td className="sticky left-0 z-10 bg-white py-3.5 pr-3 pl-5 align-middle shadow-[2px_0_4px_-2px_rgba(15,23,42,0.06)] group-hover:bg-rose-50/40">
                      <div className="flex items-start gap-2.5">
                        <span
                          className={`mt-0.5 inline-flex h-6 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-extrabold tabular-nums ${
                            index === 0
                              ? 'bg-rose-600 text-white'
                              : index <= 2
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          #{index + 1}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <Store className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                            <span className="truncate text-sm font-bold text-slate-900 group-hover:text-rose-700">
                              {outlet.outletName}
                            </span>
                          </div>
                          <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                            <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-700">
                              {outlet.outletId}
                            </span>
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                              {outlet.outletType}
                            </span>
                          </div>
                          {outlet.diagnosticTags.length > 0 && (
                            <div className="mt-1.5 flex flex-wrap gap-1">
                              {outlet.diagnosticTags.slice(0, 3).map((tag) => (
                                <span
                                  key={tag}
                                  className="rounded-md bg-rose-50 px-1.5 py-0.5 text-[10px] font-semibold text-rose-800 ring-1 ring-inset ring-rose-200/70"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
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
                      <div className="text-xs font-bold text-slate-800">
                        {formatNumber(outlet.qtyCarton)} ktn · {formatNumber(outlet.invoiceCount)}{' '}
                        inv
                      </div>
                      <div className="mt-0.5 text-[11px] font-semibold text-rose-700">
                        {formatDecimal(outlet.avgCartonsPerInvoice, 1)} ktn/inv{' '}
                        <span className="font-normal text-slate-400">
                          (peer {formatDecimal(outlet.peerAvgCartonsPerInvoice, 1)})
                        </span>
                      </div>
                      <div className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-slate-500">
                        <Calendar className="h-3 w-3 text-slate-400" />
                        <span>
                          {outlet.lastOrderDate
                            ? `Terakhir ${formatDateShort(outlet.lastOrderDate)}`
                            : 'Hanya retur'}
                        </span>
                      </div>
                    </td>

                    <td className="px-3 py-3.5 text-right align-middle tabular-nums">
                      <div className="text-sm font-extrabold text-rose-700">
                        {formatIdrFull(outlet.netSalesIdr)}
                      </div>
                      <div className="mt-1 flex items-center justify-end gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-rose-600"
                            style={{ width: `${Math.max(pctOfPeer, 3)}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-bold text-rose-700">
                          {formatSignedPct(outlet.gapVsPeerPct)}
                        </span>
                      </div>
                      <div className="mt-0.5 text-[10px] text-slate-400">
                        vs avg {outlet.outletType} ({formatIdrCompact(outlet.peerAvgSalesIdr)})
                      </div>
                    </td>

                    <td className="py-3.5 pr-4 pl-2 text-right align-middle">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition group-hover:bg-rose-100 group-hover:text-rose-700">
                        <ChevronRight className="h-4 w-4" />
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Commercial Churn Radar: Outlets Active in Prior Period but 0 Orders in Latest Period */}
      {dormantOutlets.length > 0 && (
        <div className="border-t border-amber-200/80 bg-amber-50/60">
          <button
            type="button"
            onClick={() => setDormantExpanded((v) => !v)}
            className="flex w-full flex-wrap items-center justify-between gap-2 px-5 py-3 text-left transition hover:bg-amber-50"
          >
            <div className="flex items-center gap-2.5 text-xs">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
                <ClockAlert className="h-4 w-4" />
              </span>
              <div>
                <span className="font-bold text-amber-950">
                  Radar Churn: {dormantOutlets.length} outlet aktif di{' '}
                  {dormantOutlets[0].priorPeriodLabel} belum repeat order di{' '}
                  {dormantOutlets[0].silentPeriodLabel}
                </span>
                <span className="ml-2 rounded-full bg-white px-2 py-0.5 text-[11px] font-extrabold text-amber-900 ring-1 ring-inset ring-amber-200 tabular-nums">
                  At-risk {formatIdrCompact(dormantTotalAtRisk)}
                </span>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-900">
              <span>{dormantExpanded ? 'Sembunyikan' : 'Lihat daftar'}</span>
              {dormantExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </span>
          </button>

          {dormantExpanded && (
            <div className="border-t border-amber-200/60 px-5 py-3">
              <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3">
                {dormantOutlets.slice(0, 6).map((d) => (
                  <button
                    key={d.outletId}
                    type="button"
                    onClick={() => onSelectDormantOutlet?.(d.outletId)}
                    className="flex items-start justify-between gap-2 rounded-xl border border-amber-200/80 bg-white p-3 text-left transition hover:border-amber-400 hover:shadow-xs"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-xs font-bold text-slate-900">
                        {d.outletName}
                      </div>
                      <div className="mt-0.5 text-[11px] text-slate-500">
                        <span className="font-mono">{d.outletId}</span> · {d.outletType}
                      </div>
                      <div className="mt-1 text-[11px] text-slate-600">
                        {d.branch} · Sales: <strong className="text-slate-800">{d.primarySalesman}</strong>
                      </div>
                    </div>
                    <div className="shrink-0 text-right tabular-nums">
                      <div className="text-xs font-extrabold text-amber-900">
                        {formatIdrCompact(d.priorNetSalesIdr)}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        di {d.priorPeriodLabel}
                      </div>
                      <div className="mt-0.5 text-[10px] font-semibold text-rose-700">
                        0 order di {d.silentPeriodLabel}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
