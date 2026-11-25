import { Activity, ArrowDownRight, ArrowUpRight, Info } from 'lucide-react';
import { useState } from 'react';
import {
  formatDateDayMonth,
  formatDateShort,
  formatIdrCompact,
  formatIdrFull,
  formatNumber,
  formatPct,
  formatSignedPct,
} from '../lib/formatters';
import type { ChannelSummary, DashboardMetrics } from '../lib/salesAnalytics';

interface SalesTrendCardProps {
  metrics: DashboardMetrics;
  channelItems: ChannelSummary[];
  selectedChannel: string;
  onSelectChannel: (channel: string) => void;
  activeStartDate: string;
  activeEndDate: string;
  fullMinDate: string;
  fullMaxDate: string;
  onSelectDateRange: (startDate: string, endDate: string) => void;
}

type Granularity = 'daily' | 'weekly';

const CHANNEL_COLORS: Record<string, string> = {
  Grosir: 'bg-slate-800',
  'Toko Kelontong': 'bg-teal-600',
  Warung: 'bg-amber-500',
  Minimarket: 'bg-sky-500',
};

export function SalesTrendCard({
  metrics,
  channelItems,
  selectedChannel,
  onSelectChannel,
  activeStartDate,
  activeEndDate,
  fullMinDate,
  fullMaxDate,
  onSelectDateRange,
}: SalesTrendCardProps) {
  const [granularity, setGranularity] = useState<Granularity>('daily');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const { dailyTrend, weeklyTrend, monthlyComparison } = metrics;
  const items =
    granularity === 'daily'
      ? dailyTrend.map((d) => ({
          key: d.date,
          startDate: d.date,
          endDate: d.date,
          label: formatDateDayMonth(d.date),
          tooltipTitle: formatDateShort(d.date),
          monthKey: d.monthKey,
          netSalesIdr: d.netSalesIdr,
          qtyCarton: d.qtyCarton,
          invoiceCount: d.invoiceCount,
          subMeta: `${d.activeOutletCount} outlet`,
        }))
      : weeklyTrend.map((w) => ({
          key: w.weekStart,
          startDate: w.weekStart,
          endDate: w.weekEnd,
          label: w.label,
          tooltipTitle: `Minggu ${w.label}`,
          monthKey: w.monthKey,
          netSalesIdr: w.netSalesIdr,
          qtyCarton: w.qtyCarton,
          invoiceCount: w.invoiceCount,
          subMeta: `${w.activeDays} hari aktif`,
        }));

  const maxVal = items.reduce((m, item) => Math.max(m, item.netSalesIdr), 0);
  const avgVal =
    items.length > 0 ? items.reduce((s, item) => s + item.netSalesIdr, 0) / items.length : 0;

  // Detect index where month changes (e.g. Sep -> Oct)
  const monthKeys = Array.from(new Set(items.map((i) => i.monthKey)));
  const latestMonthKey = monthKeys[monthKeys.length - 1] ?? '';
  const hasMultiMonth = monthKeys.length >= 2;
  const splitIndex = hasMultiMonth
    ? items.findIndex((i) => i.monthKey === latestMonthKey)
    : -1;

  const hoveredItem = hoveredIdx !== null ? items[hoveredIdx] ?? null : null;

  const { latestMonth, prevMonth, runRateDeltaPct } = monthlyComparison;
  const isUp = runRateDeltaPct !== null && runRateDeltaPct >= 0;

  // SVG layout metrics
  const chartW = 860;
  const chartH = 190;
  const padTop = 18;
  const padBottom = 26;
  const plotH = chartH - padTop - padBottom;
  const yMax = maxVal > 0 ? maxVal * 1.12 : 1;
  const avgY = padTop + plotH - (avgVal / yMax) * plotH;

  return (
    <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
      {/* Header Row */}
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
            <Activity className="h-4 w-4" />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">
                Tren Penjualan &amp; Run-Rate Harian
              </h2>
              {latestMonth?.isPartial && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700">
                  <Info className="h-3.5 w-3.5" />
                  {latestMonth.label} parsial s.d. tgl {latestMonth.maxDayOfMonth}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Pola transaksi sepanjang periode beserta perbandingan kecepatan jual harian antar
              bulan · Klik batang untuk fokus periode.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-xl bg-slate-100 p-0.5 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => {
                setGranularity('daily');
                setHoveredIdx(null);
              }}
              className={`rounded-[10px] px-2.5 py-1 transition ${
                granularity === 'daily'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Harian ({dailyTrend.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setGranularity('weekly');
                setHoveredIdx(null);
              }}
              className={`rounded-[10px] px-2.5 py-1 transition ${
                granularity === 'weekly'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mingguan ({weeklyTrend.length})
            </button>
          </div>
        </div>
      </div>

      {/* Monthly Run-Rate Comparison Strip */}
      {prevMonth && latestMonth && (
        <div className="mb-4 grid grid-cols-1 gap-2.5 rounded-xl border border-slate-100 bg-slate-50/70 p-3 sm:grid-cols-3">
          <div className="flex items-center justify-between sm:block">
            <div className="text-[11px] font-semibold text-slate-500">
              {prevMonth.label} ({prevMonth.activeDays} hari aktif)
            </div>
            <div className="mt-0.5 flex items-baseline gap-2 tabular-nums">
              <span className="text-sm font-extrabold text-slate-900">
                {formatIdrCompact(prevMonth.dailyRunRateIdr)}/hari
              </span>
              <span className="text-[11px] text-slate-500">
                total {formatIdrCompact(prevMonth.netSalesIdr)}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-slate-200/70 pt-2 sm:block sm:border-t-0 sm:border-l sm:pt-0 sm:pl-3">
            <div className="text-[11px] font-semibold text-teal-800">
              {latestMonth.label}
              {latestMonth.isPartial ? ` (1–${latestMonth.maxDayOfMonth})` : ''} (
              {latestMonth.activeDays} hari aktif)
            </div>
            <div className="mt-0.5 flex items-baseline gap-2 tabular-nums">
              <span className="text-sm font-extrabold text-teal-900">
                {formatIdrCompact(latestMonth.dailyRunRateIdr)}/hari
              </span>
              <span className="text-[11px] text-slate-500">
                total {formatIdrCompact(latestMonth.netSalesIdr)}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-slate-200/70 pt-2 sm:justify-end sm:border-t-0 sm:border-l sm:pt-0 sm:pl-3">
            <div className="text-left sm:text-right">
              <div className="text-[11px] font-semibold text-slate-500">Momentum Run-Rate</div>
              {runRateDeltaPct !== null && (
                <div
                  className={`mt-0.5 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-extrabold tabular-nums ${
                    isUp ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {isUp ? (
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  ) : (
                    <ArrowDownRight className="h-3.5 w-3.5" />
                  )}
                  {formatSignedPct(runRateDeltaPct)} vs {prevMonth.label.split(' ')[0]}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Interactive Chart Area */}
      {items.length === 0 ? (
        <div className="py-12 text-center text-sm text-slate-400">
          Tidak ada transaksi pada filter aktif.
        </div>
      ) : (
        <div className="relative">
          {/* Dynamic Hover Readout Bar */}
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-3 text-[11px] text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-xs bg-slate-700" />
                {hasMultiMonth ? prevMonth?.label : 'Net Sales'}
              </span>
              {hasMultiMonth && latestMonth && (
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-xs bg-teal-600" />
                  {latestMonth.label}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block w-4 border-t border-dashed border-slate-400" />
                Rata-rata ({formatIdrCompact(avgVal)})
              </span>
            </div>

            <div className="min-h-[20px] text-[11px] font-semibold text-slate-700 tabular-nums">
              {hoveredItem ? (
                <span className="inline-flex flex-wrap items-center gap-2 rounded-lg bg-slate-900 px-2.5 py-1 text-white">
                  <span>{hoveredItem.tooltipTitle}</span>
                  <span className="text-teal-300">{formatIdrFull(hoveredItem.netSalesIdr)}</span>
                  <span className="text-slate-300">
                    {formatNumber(hoveredItem.qtyCarton)} ktn · {hoveredItem.invoiceCount} inv ·{' '}
                    {hoveredItem.subMeta}
                  </span>
                </span>
              ) : (
                <span className="text-slate-400">Arahkan kursor atau klik batang untuk filter</span>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <svg
              viewBox={`0 0 ${chartW} ${chartH}`}
              className="h-48 w-full min-w-[540px]"
              role="img"
              aria-label="Grafik tren penjualan"
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {/* Horizontal subtle grid lines */}
              {[0.25, 0.5, 0.75, 1].map((frac) => {
                const y = padTop + plotH * (1 - frac);
                return (
                  <g key={frac}>
                    <line
                      x1={0}
                      x2={chartW}
                      y1={y}
                      y2={y}
                      stroke="#E2E8F0"
                      strokeWidth="1"
                      strokeDasharray={frac === 1 ? undefined : '2 4'}
                    />
                  </g>
                );
              })}

              {/* Month split vertical divider */}
              {splitIndex > 0 && (
                <g>
                  <line
                    x1={(splitIndex / items.length) * chartW}
                    x2={(splitIndex / items.length) * chartW}
                    y1={padTop - 4}
                    y2={padTop + plotH}
                    stroke="#0F766E"
                    strokeWidth="1.25"
                    strokeDasharray="4 3"
                    opacity="0.55"
                  />
                </g>
              )}

              {/* Bars */}
              {items.map((item, idx) => {
                const slotW = chartW / items.length;
                const barW = Math.max(
                  granularity === 'weekly' ? Math.min(slotW * 0.52, 68) : slotW * 0.68,
                  4,
                );
                const x = idx * slotW + (slotW - barW) / 2;
                const h = Math.max((Math.max(item.netSalesIdr, 0) / yMax) * plotH, 2);
                const y = padTop + plotH - h;
                const isLatestMonth = hasMultiMonth && item.monthKey === latestMonthKey;
                const isHovered = hoveredIdx === idx;
                const fill = isHovered
                  ? '#C81E2B'
                  : isLatestMonth
                    ? '#0D9488'
                    : '#334155';

                // Show x-axis labels without crowding
                const labelStep = granularity === 'weekly' ? 1 : Math.max(1, Math.ceil(items.length / 8));
                const showLabel = idx % labelStep === 0 || idx === items.length - 1;

                const isExactSelected =
                  activeStartDate === item.startDate && activeEndDate === item.endDate;

                return (
                  <g
                    key={item.key}
                    role="button"
                    tabIndex={0}
                    aria-label={`Filter periode ${item.tooltipTitle}`}
                    className="cursor-pointer outline-none"
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onClick={() =>
                      isExactSelected
                        ? onSelectDateRange(fullMinDate, fullMaxDate)
                        : onSelectDateRange(item.startDate, item.endDate)
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        if (isExactSelected) {
                          onSelectDateRange(fullMinDate, fullMaxDate);
                        } else {
                          onSelectDateRange(item.startDate, item.endDate);
                        }
                      }
                    }}
                  >
                    {/* Invisible full-slot hover target */}
                    <rect
                      x={idx * slotW}
                      y={padTop}
                      width={slotW}
                      height={plotH}
                      fill="transparent"
                    />
                    <rect
                      x={x}
                      y={y}
                      width={barW}
                      height={h}
                      rx={granularity === 'weekly' ? 5 : 3}
                      fill={fill}
                      opacity={hoveredIdx !== null && !isHovered ? 0.5 : 0.92}
                    />
                    {granularity === 'weekly' && (
                      <text
                        x={x + barW / 2}
                        y={y - 5}
                        textAnchor="middle"
                        fontSize="10"
                        fontWeight="700"
                        fill="#334155"
                      >
                        {formatIdrCompact(item.netSalesIdr)}
                      </text>
                    )}
                    {showLabel && (
                      <text
                        x={x + barW / 2}
                        y={chartH - 7}
                        textAnchor="middle"
                        fontSize="10"
                        fontWeight="600"
                        fill="#64748B"
                      >
                        {item.label}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Average reference line */}
              {avgVal > 0 && (
                <line
                  x1={0}
                  x2={chartW}
                  y1={avgY}
                  y2={avgY}
                  stroke="#64748B"
                  strokeWidth="1.25"
                  strokeDasharray="5 4"
                />
              )}
            </svg>
          </div>
        </div>
      )}

      {/* Channel Concentration Strip (Explains Grosir Skew Directly) */}
      {channelItems.length > 0 && (
        <div className="mt-4 border-t border-slate-100 pt-3.5">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-[11px]">
            <span className="font-bold text-slate-700">
              Komposisi Kanal Outlet{' '}
              <span className="font-normal text-slate-400">(pilih kanal untuk filter)</span>
            </span>
            <span className="text-slate-500">
              Rata-rata per outlet sangat berbeda antar kanal — gunakan perbandingan peer di tabel
              outlet terlemah.
            </span>
          </div>

          <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
            {channelItems.map((ch) => (
              <button
                key={ch.outletType}
                type="button"
                onClick={() =>
                  onSelectChannel(selectedChannel === ch.outletType ? 'ALL' : ch.outletType)
                }
                title={`${ch.outletType}: ${formatIdrCompact(ch.netSalesIdr)} (${formatPct(ch.sharePct)}) · avg ${formatIdrCompact(ch.avgSalesPerOutletIdr)}/outlet`}
                style={{ width: `${Math.max(ch.sharePct, 1)}%` }}
                className={`${CHANNEL_COLORS[ch.outletType] ?? 'bg-slate-400'} h-full transition-opacity hover:opacity-80 ${
                  selectedChannel !== 'ALL' && selectedChannel !== ch.outletType ? 'opacity-30' : ''
                }`}
              />
            ))}
          </div>

          <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {channelItems.map((ch) => {
              const isSelected = selectedChannel === ch.outletType;
              const isDimmed = selectedChannel !== 'ALL' && !isSelected;
              return (
                <button
                  key={ch.outletType}
                  type="button"
                  onClick={() => onSelectChannel(isSelected ? 'ALL' : ch.outletType)}
                  className={`flex items-center justify-between rounded-xl border px-2.5 py-1.5 text-left text-[11px] transition tabular-nums ${
                    isSelected
                      ? 'border-slate-900 bg-slate-900/5'
                      : 'border-slate-200/70 bg-slate-50/50 hover:border-slate-300'
                  } ${isDimmed ? 'opacity-50 hover:opacity-90' : ''}`}
                >
                  <div className="flex min-w-0 items-center gap-1.5">
                    <span
                      className={`h-2 w-2 shrink-0 rounded-full ${
                        CHANNEL_COLORS[ch.outletType] ?? 'bg-slate-400'
                      }`}
                    />
                    <div className="min-w-0">
                      <div className="truncate font-bold text-slate-800">{ch.outletType}</div>
                      <div className="text-[10px] text-slate-500">
                        {ch.outletCount} out · avg {formatIdrCompact(ch.avgSalesPerOutletIdr)}
                      </div>
                    </div>
                  </div>
                  <span className="ml-1.5 shrink-0 font-extrabold text-slate-900">
                    {formatPct(ch.sharePct, 0)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
