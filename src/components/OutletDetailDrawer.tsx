import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  MapPin,
  Package,
  Store,
  UserCheck,
  X,
} from 'lucide-react';
import { useEffect } from 'react';
import {
  formatDateShort,
  formatDecimal,
  formatIdrCompact,
  formatIdrFull,
  formatNumber,
  formatPct,
  formatSignedPct,
} from '../lib/formatters';
import type { OutletPerformance } from '../lib/salesAnalytics';

interface OutletDetailDrawerProps {
  outlet: OutletPerformance | null;
  allBrands: string[];
  onClose: () => void;
}

export function OutletDetailDrawer({ outlet, allBrands, onClose }: OutletDetailDrawerProps) {
  useEffect(() => {
    if (!outlet) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [outlet, onClose]);

  if (!outlet) return null;

  const salesPctOfPeer =
    outlet.peerAvgSalesIdr > 0
      ? Math.max(2, Math.min((outlet.netSalesIdr / outlet.peerAvgSalesIdr) * 100, 100))
      : 0;
  const dropPctOfPeer =
    outlet.peerAvgCartonsPerInvoice > 0
      ? Math.max(
          2,
          Math.min((outlet.avgCartonsPerInvoice / outlet.peerAvgCartonsPerInvoice) * 100, 100),
        )
      : 0;

  const boughtSet = new Set(outlet.brandsBought);
  const missingBrands = allBrands.filter((b) => !boughtSet.has(b));

  const actionHeadline =
    outlet.avgCartonsPerInvoice <= 1.2 && outlet.missingCoreBrand
      ? `Dorong paket bundling min. 3 karton dengan memasukkan flagship ${outlet.coreBrandName} saat kunjungan ${outlet.primarySalesman}.`
      : outlet.avgCartonsPerInvoice <= 1.2
        ? `Fokus naikkan drop size dari ${formatDecimal(outlet.avgCartonsPerInvoice, 1)} ktn/inv mendekati rata-rata ${outlet.outletType} (${formatDecimal(outlet.peerAvgCartonsPerInvoice, 1)} ktn/inv) melalui tier diskon volume.`
        : `Evaluasi frekuensi kunjungan & cek ketersediaan display bersama salesman ${outlet.primarySalesman}.`;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="outlet-drawer-title"
      onClick={onClose}
    >
      <div
        className="flex h-full w-full max-w-xl flex-col bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Drawer Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 bg-slate-50/70 px-5 py-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-600 text-white shadow-xs">
              <Store className="h-5 w-5" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 id="outlet-drawer-title" className="text-base font-extrabold text-slate-900">
                  {outlet.outletName}
                </h3>
                <span className="rounded bg-slate-200/80 px-1.5 py-0.5 font-mono text-[11px] font-bold text-slate-800">
                  {outlet.outletId}
                </span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  {outlet.branch}, {outlet.region}
                </span>
                <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-700 ring-1 ring-inset ring-slate-200">
                  {outlet.outletType}
                </span>
                <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                  <UserCheck className="h-3.5 w-3.5 text-slate-400" />
                  {outlet.primarySalesman}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup panel diagnosis outlet"
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-200/60 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          {/* Commercial Action Recommendation */}
          <div className="rounded-2xl border border-rose-200/80 bg-rose-50/70 p-4">
            <div className="flex items-center gap-2 text-xs font-extrabold tracking-wide text-rose-900 uppercase">
              <AlertTriangle className="h-4 w-4 text-rose-600" />
              <span>Diagnosis &amp; Rekomendasi Tindak Lanjut</span>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-rose-950">{actionHeadline}</p>
            {outlet.diagnosticTags.length > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {outlet.diagnosticTags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-bold text-rose-800 ring-1 ring-inset ring-rose-200"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Peer Benchmark Comparison */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4">
            <h4 className="text-xs font-bold tracking-wide text-slate-500 uppercase">
              Perbandingan vs Peer ({outlet.outletType})
            </h4>

            <div className="mt-3 space-y-4 tabular-nums">
              {/* Net Sales vs Peer */}
              <div>
                <div className="flex items-baseline justify-between text-xs">
                  <span className="font-semibold text-slate-700">Net Sales</span>
                  <span>
                    <strong className="font-extrabold text-rose-700">
                      {formatIdrFull(outlet.netSalesIdr)}
                    </strong>{' '}
                    <span className="text-slate-400">
                      vs peer {formatIdrCompact(outlet.peerAvgSalesIdr)} (
                      {formatSignedPct(outlet.gapVsPeerPct)})
                    </span>
                  </span>
                </div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-rose-600"
                    style={{ width: `${salesPctOfPeer}%` }}
                  />
                </div>
              </div>

              {/* Drop Size vs Peer */}
              <div>
                <div className="flex items-baseline justify-between text-xs">
                  <span className="font-semibold text-slate-700">Drop Size (Karton / Invoice)</span>
                  <span>
                    <strong className="font-extrabold text-slate-900">
                      {formatDecimal(outlet.avgCartonsPerInvoice, 1)} ktn/inv
                    </strong>{' '}
                    <span className="text-slate-400">
                      vs peer {formatDecimal(outlet.peerAvgCartonsPerInvoice, 1)} ktn/inv
                    </span>
                  </span>
                </div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-amber-500"
                    style={{ width: `${dropPctOfPeer}%` }}
                  />
                </div>
              </div>

              {/* Quick KPI Mini-Grid */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                <div className="rounded-xl bg-slate-50 p-2.5">
                  <div className="text-[10px] font-semibold text-slate-500">Total Invoice</div>
                  <div className="mt-0.5 text-sm font-extrabold text-slate-900">
                    {formatNumber(outlet.invoiceCount)} inv
                  </div>
                </div>
                <div className="rounded-xl bg-slate-50 p-2.5">
                  <div className="text-[10px] font-semibold text-slate-500">Diskon Diterima</div>
                  <div className="mt-0.5 text-sm font-extrabold text-slate-900">
                    {formatPct(outlet.discountRatePct)}
                  </div>
                </div>
                <div className="rounded-xl bg-slate-50 p-2.5">
                  <div className="text-[10px] font-semibold text-slate-500">Order Terakhir</div>
                  <div className="mt-0.5 text-xs font-extrabold text-slate-900">
                    {outlet.lastOrderDate ? formatDateShort(outlet.lastOrderDate) : '—'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Brand Assortment Coverage */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold tracking-wide text-slate-500 uppercase">
                Cakupan Brand ({outlet.brandsBought.length}/{allBrands.length})
              </h4>
              <span className="text-[11px] font-medium text-slate-500">
                {outlet.skuCount} SKU aktif
              </span>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {outlet.brandsBought.map((b) => (
                <span
                  key={b}
                  className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-1 text-[11px] font-bold text-teal-800 ring-1 ring-inset ring-teal-200"
                >
                  <CheckCircle2 className="h-3 w-3 text-teal-600" />
                  {b}
                </span>
              ))}
              {missingBrands.map((b) => {
                const isCore = b === outlet.coreBrandName;
                return (
                  <span
                    key={b}
                    className={`inline-flex items-center gap-1 rounded-full border border-dashed px-2.5 py-1 text-[11px] font-semibold ${
                      isCore
                        ? 'border-rose-300 bg-rose-50/70 text-rose-800'
                        : 'border-slate-300 bg-slate-50 text-slate-500'
                    }`}
                  >
                    {isCore ? `Belum masuk: ${b} ★` : `Belum: ${b}`}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Transaction History */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-xs font-bold tracking-wide text-slate-500 uppercase">
                Riwayat Transaksi ({outlet.records.length} baris)
              </h4>
              <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                <Package className="h-3.5 w-3.5 text-slate-400" />
                {formatNumber(outlet.qtyCarton)} karton total
              </span>
            </div>

            <div className="space-y-2">
              {outlet.records.map((rec, i) => (
                <div
                  key={`${rec.invoiceNo}-${rec.sku}-${i}`}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2.5 text-xs tabular-nums"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900">{rec.sku}</div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-slate-400" />
                        {formatDateShort(rec.date)}
                      </span>
                      <span className="font-mono">{rec.invoiceNo}</span>
                      <span>· {rec.salesman}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`font-extrabold ${
                        rec.isReturn ? 'text-rose-700' : 'text-slate-900'
                      }`}
                    >
                      {formatIdrFull(rec.netSalesIdr)}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {formatNumber(rec.qtyCarton)} ktn
                      {rec.discountIdr > 0 ? ` · disc ${formatIdrCompact(rec.discountIdr)}` : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-5 py-3 text-[11px] text-slate-500">
          <span>
            Tekan{' '}
            <kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[10px]">
              Esc
            </kbd>{' '}
            untuk menutup
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-slate-800"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
