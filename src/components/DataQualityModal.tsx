import { CheckCircle2, Info, ShieldCheck, X } from 'lucide-react';
import { formatIdrFull, formatNumber } from '../lib/formatters';
import type { DataQualityReport } from '../lib/salesAnalytics';

interface DataQualityModalProps {
  open: boolean;
  onClose: () => void;
  quality: DataQualityReport;
  fileName: string;
}

export function DataQualityModal({ open, onClose, quality, fileName }: DataQualityModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dq-modal-title"
      onClick={onClose}
    >
      <div
        className="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <h3 id="dq-modal-title" className="text-base font-bold text-slate-900">
                Audit Pembersihan Data Otomatis
              </h3>
              <p className="text-xs text-slate-500">
                Sumber: <span className="font-semibold text-slate-700">{fileName}</span> ·{' '}
                {formatNumber(quality.cleanRowCount)} baris bersih dari{' '}
                {formatNumber(quality.rawRowCount)} baris mentah
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup audit data quality"
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-5 text-sm">
          {/* Summary Grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-3">
              <div className="text-[11px] font-semibold text-slate-500">Region Dinormalisasi</div>
              <div className="mt-1 text-lg font-extrabold text-slate-900 tabular-nums">
                {formatNumber(quality.regionNormalizedCount)}
              </div>
            </div>
            <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-3">
              <div className="text-[11px] font-semibold text-slate-500">Duplikat Dihapus</div>
              <div className="mt-1 text-lg font-extrabold text-slate-900 tabular-nums">
                {formatNumber(quality.duplicateRowsRemoved)}
              </div>
            </div>
            <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-3">
              <div className="text-[11px] font-semibold text-slate-500">Spasi Dirapikan</div>
              <div className="mt-1 text-lg font-extrabold text-slate-900 tabular-nums">
                {formatNumber(quality.trimmedRowsCount)}
              </div>
            </div>
            <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-3">
              <div className="text-[11px] font-semibold text-slate-500">Salesman Dilengkapi</div>
              <div className="mt-1 text-lg font-extrabold text-slate-900 tabular-nums">
                {formatNumber(quality.salesmanBackfilledCount)}
              </div>
            </div>
          </div>

          {/* Region Normalizations */}
          <div className="rounded-xl border border-slate-200/80 p-4">
            <div className="flex items-center gap-2 font-bold text-slate-800">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Normalisasi Nama Region</span>
            </div>
            {quality.regionNormalizations.length === 0 ? (
              <p className="mt-1.5 text-xs text-slate-500">
                Semua nama region sudah konsisten.
              </p>
            ) : (
              <ul className="mt-2 space-y-1.5 text-xs text-slate-600">
                {quality.regionNormalizations.map((item) => (
                  <li
                    key={`${item.from}-${item.to}`}
                    className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-1.5"
                  >
                    <span>
                      <code className="rounded bg-rose-50 px-1.5 py-0.5 font-mono text-rose-700">
                        {item.from}
                      </code>{' '}
                      →{' '}
                      <code className="rounded bg-emerald-50 px-1.5 py-0.5 font-mono text-emerald-700">
                        {item.to}
                      </code>
                    </span>
                    <span className="font-semibold text-slate-700 tabular-nums">
                      {item.count} baris
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Duplicates Removed */}
          <div className="rounded-xl border border-slate-200/80 p-4">
            <div className="flex items-center gap-2 font-bold text-slate-800">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Penghapusan Baris Duplikat Identik</span>
            </div>
            {quality.duplicatesRemoved.length === 0 ? (
              <p className="mt-1.5 text-xs text-slate-500">Tidak ditemukan baris duplikat identik.</p>
            ) : (
              <ul className="mt-2 space-y-1.5 text-xs text-slate-600">
                {quality.duplicatesRemoved.map((dup, idx) => (
                  <li
                    key={`${dup.invoiceNo}-${dup.sku}-${idx}`}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-1.5 tabular-nums"
                  >
                    <span>
                      <strong className="font-mono text-slate-800">{dup.invoiceNo}</strong> ({dup.date})
                      — {dup.sku}
                    </span>
                    <span className="font-semibold text-rose-700">
                      -{formatIdrFull(dup.netSalesIdr)} duplikat
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Returns & Outlet ID Grouping */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200/80 p-4">
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <Info className="h-4 w-4 text-amber-600" />
                <span>Transaksi Retur</span>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                Terdeteksi <strong className="text-slate-900">{quality.returnRowsCount}</strong>{' '}
                baris retur senilai{' '}
                <strong className="text-rose-700 tabular-nums">
                  {formatIdrFull(quality.returnNetSalesIdr)}
                </strong>
                . Sesuai aturan, retur tetap dihitung mengurangi Net Sales agar angka akhir mencerminkan
                penjualan bersih aktual.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200/80 p-4">
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <Info className="h-4 w-4 text-[#229ED9]" />
                <span>Grup Outlet per Outlet ID</span>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                Ditemukan{' '}
                <strong className="text-slate-900">
                  {quality.sharedOutletNameGroups.length} nama toko
                </strong>{' '}
                yang dipakai oleh lebih dari satu{' '}
                <code className="font-mono text-slate-800">outlet_id</code> berbeda (mis.{' '}
                {quality.sharedOutletNameGroups[0]
                  ? `${quality.sharedOutletNameGroups[0].outletName}: ${quality.sharedOutletNameGroups[0].outletIds.join(', ')}`
                  : '-'}
                ). Semua peringkat outlet dihitung per <code className="font-mono">outlet_id</code>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
