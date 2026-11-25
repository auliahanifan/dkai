import { RotateCcw } from 'lucide-react';
import { formatIdrCompact, formatIdrFull, formatNumber, formatPct } from '../lib/formatters';
import type { DimensionSummary } from '../lib/salesAnalytics';

interface SalesBarChartCardProps {
  title: string;
  subtitle: string;
  items: DimensionSummary[];
  selectedName: string; // 'ALL' or specific name
  onSelect: (name: string) => void;
  accent: 'teal' | 'amber';
}

export function SalesBarChartCard({
  title,
  subtitle,
  items,
  selectedName,
  onSelect,
  accent,
}: SalesBarChartCardProps) {
  const maxVal = items.reduce((max, item) => Math.max(max, item.netSalesIdr), 0);

  const barClass = accent === 'teal' ? 'bg-teal-700' : 'bg-amber-600';
  const barSoftClass = accent === 'teal' ? 'bg-teal-200/90' : 'bg-amber-200/90';
  const badgeClass = accent === 'teal' ? 'bg-teal-700 text-white' : 'bg-amber-600 text-white';
  const activeRingClass =
    accent === 'teal'
      ? 'border-teal-600/40 bg-teal-50/50'
      : 'border-amber-500/40 bg-amber-50/50';

  return (
    <div className="flex flex-col rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">{title}</h2>
          <p className="text-xs text-slate-500">{subtitle} · Pilih baris untuk memfilter.</p>
        </div>
        {selectedName !== 'ALL' && (
          <button
            type="button"
            onClick={() => onSelect('ALL')}
            className="inline-flex shrink-0 items-center gap-1 rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-bold text-white transition hover:bg-slate-700"
          >
            <RotateCcw className="h-3 w-3" />
            Semua
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="flex flex-1 items-center justify-center py-10 text-sm text-slate-400">
          Tidak ada data pada filter aktif.
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item, idx) => {
            const widthPct = maxVal > 0 ? Math.max((item.netSalesIdr / maxVal) * 100, 2) : 0;
            const isSelected = selectedName === item.name;
            const isDimmed = selectedName !== 'ALL' && !isSelected;

            return (
              <button
                key={item.name}
                type="button"
                onClick={() => onSelect(isSelected ? 'ALL' : item.name)}
                title={`${item.name}: ${formatIdrFull(item.netSalesIdr)} (${formatNumber(item.qtyCarton)} karton, ${item.outletCount} outlet, avg ${formatIdrCompact(item.avgSalesPerOutletIdr)}/outlet)`}
                className={`group w-full rounded-xl border p-2.5 text-left transition-all ${
                  isSelected
                    ? activeRingClass
                    : 'border-transparent hover:border-slate-200 hover:bg-slate-50/80'
                } ${isDimmed ? 'opacity-45 hover:opacity-85' : ''}`}
              >
                <div className="mb-1.5 flex items-baseline justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-slate-100 text-[11px] font-bold text-slate-600 tabular-nums">
                      {idx + 1}
                    </span>
                    <span className="truncate text-sm font-semibold text-slate-800 group-hover:text-slate-950">
                      {item.name}
                    </span>
                    {isSelected && (
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${badgeClass}`}>
                        Aktif
                      </span>
                    )}
                  </div>
                  <div className="flex shrink-0 items-baseline gap-2 tabular-nums">
                    <span className="text-sm font-bold text-slate-900">
                      {formatIdrCompact(item.netSalesIdr)}
                    </span>
                    <span className="w-12 text-right text-xs font-semibold text-slate-500">
                      {formatPct(item.sharePct)}
                    </span>
                  </div>
                </div>

                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      idx === 0 || isSelected ? barClass : barSoftClass
                    }`}
                    style={{ width: `${widthPct}%` }}
                  />
                </div>

                <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500 tabular-nums">
                  <span>
                    {formatNumber(item.qtyCarton)} ktn · {formatNumber(item.invoiceCount)} inv
                  </span>
                  <span>
                    {formatNumber(item.outletCount)} outlet · avg{' '}
                    {formatIdrCompact(item.avgSalesPerOutletIdr)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
