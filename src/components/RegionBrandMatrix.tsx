import { Compass } from 'lucide-react';
import { useState } from 'react';
import { formatIdrCompact, formatIdrFull, formatNumber, formatPct } from '../lib/formatters';
import type { RegionBrandMatrix as RegionBrandMatrixData } from '../lib/salesAnalytics';

interface RegionBrandMatrixProps {
  matrix: RegionBrandMatrixData;
  selectedRegion: string;
  selectedBrand: string;
  onSelectCell: (region: string, brand: string) => void;
  onSelectRegion: (region: string) => void;
  onSelectBrand: (brand: string) => void;
}

type MatrixMetric = 'netSales' | 'regionShare' | 'qtyCarton';

/**
 * Sequential teal-slate palette strictly for positive sales intensity,
 * avoiding any semantic collision with crimson/rose underperformance alerts.
 */
function getHeatStyle(value: number, maxVal: number): { backgroundColor: string; color: string } {
  if (value <= 0 || maxVal <= 0) {
    return { backgroundColor: '#F8FAFC', color: '#94A3B8' };
  }
  const ratio = Math.min(value / maxVal, 1);
  if (ratio >= 0.78) {
    return { backgroundColor: '#115E59', color: '#FFFFFF' };
  }
  if (ratio >= 0.52) {
    return { backgroundColor: '#0F766E', color: '#FFFFFF' };
  }
  if (ratio >= 0.30) {
    return { backgroundColor: '#5EEAD4', color: '#134E4A' };
  }
  if (ratio >= 0.14) {
    return { backgroundColor: '#CCFBF1', color: '#115E59' };
  }
  return { backgroundColor: '#F0FDFA', color: '#0F766E' };
}

export function RegionBrandMatrix({
  matrix,
  selectedRegion,
  selectedBrand,
  onSelectCell,
  onSelectRegion,
  onSelectBrand,
}: RegionBrandMatrixProps) {
  const [metric, setMetric] = useState<MatrixMetric>('netSales');

  if (matrix.regions.length === 0 || matrix.brands.length === 0) {
    return null;
  }

  // Find lowest non-zero / zero combination as white-space expansion callout
  let lowestCombo: { region: string; brand: string; netSalesIdr: number; sharePct: number } | null =
    null;
  for (const r of matrix.regions) {
    for (const b of matrix.brands) {
      const c = matrix.cells[r]?.[b];
      if (!c) continue;
      if (!lowestCombo || c.netSalesIdr < lowestCombo.netSalesIdr) {
        lowestCombo = {
          region: r,
          brand: b,
          netSalesIdr: c.netSalesIdr,
          sharePct: c.shareOfRegionPct,
        };
      }
    }
  }

  const hasSelection = selectedRegion !== 'ALL' || selectedBrand !== 'ALL';

  const getCellMetricValue = (region: string, brand: string) => {
    const cell = matrix.cells[region]?.[brand];
    if (!cell) return 0;
    if (metric === 'regionShare') return cell.shareOfRegionPct;
    if (metric === 'qtyCarton') return cell.qtyCarton;
    return cell.netSalesIdr;
  };

  const maxForMetric =
    metric === 'regionShare'
      ? matrix.maxCellRegionSharePct
      : metric === 'qtyCarton'
        ? matrix.maxCellQtyCarton
        : matrix.maxCellNetSalesIdr;

  const grandTotalNet = Object.values(matrix.regionTotals).reduce((s, r) => s + r.netSalesIdr, 0);
  const grandTotalQty = Object.values(matrix.regionTotals).reduce((s, r) => s + r.qtyCarton, 0);

  return (
    <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">Matriks Penjualan Region × Brand</h2>
          <p className="text-xs text-slate-500">
            Klik sel untuk memfilter kombinasi Region × Brand, atau ganti metrik ke{' '}
            <strong className="font-semibold text-slate-700">Share di Region (%)</strong> untuk
            membaca celah penetrasi brand.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Metric Mode Toggle */}
          <div className="inline-flex rounded-xl bg-slate-100 p-0.5 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setMetric('netSales')}
              className={`rounded-[10px] px-2.5 py-1 transition ${
                metric === 'netSales'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Net Sales (Rp)
            </button>
            <button
              type="button"
              onClick={() => setMetric('regionShare')}
              className={`rounded-[10px] px-2.5 py-1 transition ${
                metric === 'regionShare'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Share Region (%)
            </button>
            <button
              type="button"
              onClick={() => setMetric('qtyCarton')}
              className={`rounded-[10px] px-2.5 py-1 transition ${
                metric === 'qtyCarton'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Karton
            </button>
          </div>

          {/* Legend */}
          <div className="hidden items-center gap-1 text-[11px] text-slate-500 sm:flex">
            <span>Rendah</span>
            <span className="h-3 w-4 rounded bg-[#F0FDFA] ring-1 ring-inset ring-teal-200" />
            <span className="h-3 w-4 rounded bg-[#CCFBF1]" />
            <span className="h-3 w-4 rounded bg-[#5EEAD4]" />
            <span className="h-3 w-4 rounded bg-[#0F766E]" />
            <span className="h-3 w-4 rounded bg-[#115E59]" />
            <span>Tinggi</span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[780px] border-separate border-spacing-1 text-left">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 shadow-[2px_0_4px_-2px_rgba(15,23,42,0.08)]">
                Region
              </th>
              {matrix.brands.map((brand) => {
                const isBrandSelected = selectedBrand === brand;
                return (
                  <th
                    key={brand}
                    className={`rounded-lg px-2 py-2 text-right text-xs font-bold transition ${
                      isBrandSelected
                        ? 'bg-amber-100 text-amber-950'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => onSelectBrand(isBrandSelected ? 'ALL' : brand)}
                      title={`Filter brand ${brand}`}
                      className="block w-full truncate text-right"
                    >
                      {brand}
                    </button>
                  </th>
                );
              })}
              <th className="rounded-lg bg-slate-100 px-3 py-2 text-right text-xs font-bold text-slate-800">
                Total Region
              </th>
            </tr>
          </thead>
          <tbody>
            {matrix.regions.map((region) => {
              const rowTotal = matrix.regionTotals[region];
              const isRegionSelected = selectedRegion === region;
              return (
                <tr key={region}>
                  <td
                    className={`sticky left-0 z-10 rounded-lg px-3 py-2 text-xs font-bold whitespace-nowrap shadow-[2px_0_4px_-2px_rgba(15,23,42,0.08)] transition ${
                      isRegionSelected
                        ? 'bg-teal-700 text-white'
                        : 'bg-slate-50 text-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => onSelectRegion(isRegionSelected ? 'ALL' : region)}
                      className="w-full text-left"
                    >
                      {region}
                    </button>
                  </td>
                  {matrix.brands.map((brand) => {
                    const cell = matrix.cells[region]?.[brand] ?? {
                      netSalesIdr: 0,
                      qtyCarton: 0,
                      invoiceCount: 0,
                      shareOfRegionPct: 0,
                    };
                    const heatVal = getCellMetricValue(region, brand);
                    const heat = getHeatStyle(heatVal, maxForMetric);

                    const matchesSelection =
                      (selectedRegion === 'ALL' || selectedRegion === region) &&
                      (selectedBrand === 'ALL' || selectedBrand === brand);
                    const isExactActive = selectedRegion === region && selectedBrand === brand;

                    const primaryLabel =
                      metric === 'regionShare'
                        ? cell.netSalesIdr === 0
                          ? '—'
                          : formatPct(cell.shareOfRegionPct)
                        : metric === 'qtyCarton'
                          ? cell.qtyCarton === 0
                            ? '—'
                            : `${formatNumber(cell.qtyCarton)} ktn`
                          : cell.netSalesIdr === 0
                            ? '—'
                            : formatIdrCompact(cell.netSalesIdr);

                    const secondaryLabel =
                      metric === 'regionShare'
                        ? cell.netSalesIdr === 0
                          ? ''
                          : formatIdrCompact(cell.netSalesIdr)
                        : metric === 'qtyCarton'
                          ? cell.netSalesIdr === 0
                            ? ''
                            : formatIdrCompact(cell.netSalesIdr)
                          : cell.qtyCarton === 0
                            ? ''
                            : `${formatNumber(cell.qtyCarton)} ktn`;

                    return (
                      <td key={`${region}-${brand}`} className="p-0">
                        <button
                          type="button"
                          onClick={() => onSelectCell(region, brand)}
                          title={`${region} × ${brand}: ${formatIdrFull(cell.netSalesIdr)} (${formatPct(cell.shareOfRegionPct)} dari ${region}, ${formatNumber(cell.qtyCarton)} karton)`}
                          style={heat}
                          className={`flex w-full flex-col items-end rounded-lg px-2.5 py-2 text-right tabular-nums transition-all hover:scale-[1.02] ${
                            isExactActive ? 'ring-2 ring-slate-900 ring-offset-1' : ''
                          } ${hasSelection && !matchesSelection ? 'opacity-35 hover:opacity-80' : ''}`}
                        >
                          <span className="text-xs font-bold leading-tight">{primaryLabel}</span>
                          <span className="mt-0.5 text-[10px] opacity-80">{secondaryLabel}</span>
                        </button>
                      </td>
                    );
                  })}
                  <td className="rounded-lg bg-slate-100/90 px-3 py-2 text-right tabular-nums">
                    <div className="text-xs font-extrabold text-slate-900">
                      {metric === 'qtyCarton'
                        ? `${formatNumber(rowTotal.qtyCarton)} ktn`
                        : formatIdrCompact(rowTotal.netSalesIdr)}
                    </div>
                    <div className="text-[10px] font-medium text-slate-500">
                      {metric === 'qtyCarton'
                        ? formatIdrCompact(rowTotal.netSalesIdr)
                        : `${formatNumber(rowTotal.qtyCarton)} ktn`}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td className="sticky left-0 z-10 rounded-lg bg-slate-100 px-3 py-2 text-xs font-extrabold text-slate-800 shadow-[2px_0_4px_-2px_rgba(15,23,42,0.08)]">
                Total Brand
              </td>
              {matrix.brands.map((brand) => {
                const colTotal = matrix.brandTotals[brand];
                return (
                  <td
                    key={`total-${brand}`}
                    className="rounded-lg bg-slate-100/90 px-2.5 py-2 text-right tabular-nums"
                  >
                    <div className="text-xs font-extrabold text-slate-900">
                      {metric === 'regionShare'
                        ? formatPct(colTotal.shareOfRegionPct)
                        : metric === 'qtyCarton'
                          ? `${formatNumber(colTotal.qtyCarton)} ktn`
                          : formatIdrCompact(colTotal.netSalesIdr)}
                    </div>
                    <div className="text-[10px] font-medium text-slate-500">
                      {metric === 'qtyCarton'
                        ? formatIdrCompact(colTotal.netSalesIdr)
                        : `${formatNumber(colTotal.qtyCarton)} ktn`}
                    </div>
                  </td>
                );
              })}
              <td className="rounded-lg bg-slate-900 px-3 py-2 text-right tabular-nums text-white">
                <div className="text-xs font-extrabold">
                  {metric === 'qtyCarton'
                    ? `${formatNumber(grandTotalQty)} ktn`
                    : formatIdrCompact(grandTotalNet)}
                </div>
                <div className="text-[10px] text-slate-300">
                  {metric === 'qtyCarton'
                    ? formatIdrCompact(grandTotalNet)
                    : `${formatNumber(grandTotalQty)} ktn`}
                </div>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* White-space Opportunity Callout */}
      {lowestCombo && (
        <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-teal-200/60 bg-teal-50/50 px-3.5 py-2.5 text-xs text-teal-950">
          <div className="flex items-center gap-2">
            <Compass className="h-4 w-4 shrink-0 text-teal-700" />
            <span>
              <strong className="font-bold">White-space penetrasi terendah:</strong>{' '}
              {lowestCombo.region} × {lowestCombo.brand} ({formatIdrCompact(lowestCombo.netSalesIdr)}
              ; hanya {formatPct(lowestCombo.sharePct)} dari total {lowestCombo.region}).
            </span>
          </div>
          <button
            type="button"
            onClick={() => onSelectCell(lowestCombo.region, lowestCombo.brand)}
            className="shrink-0 font-bold text-teal-800 hover:underline"
          >
            Inspeksi kombinasi →
          </button>
        </div>
      )}
    </section>
  );
}
