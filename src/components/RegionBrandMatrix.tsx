import { formatIdrCompact, formatIdrFull, formatNumber } from '../lib/formatters';
import type { RegionBrandMatrix as RegionBrandMatrixData } from '../lib/salesAnalytics';

interface RegionBrandMatrixProps {
  matrix: RegionBrandMatrixData;
  selectedRegion: string;
  selectedBrand: string;
  onSelectCell: (region: string, brand: string) => void;
}

function getHeatStyle(value: number, maxVal: number): { backgroundColor: string; color: string } {
  if (value <= 0 || maxVal <= 0) {
    return { backgroundColor: '#F8FAFC', color: '#94A3B8' };
  }
  const ratio = Math.min(value / maxVal, 1);
  if (ratio >= 0.78) {
    return { backgroundColor: '#B91C1C', color: '#FFFFFF' };
  }
  if (ratio >= 0.55) {
    return { backgroundColor: '#E11D48', color: '#FFFFFF' };
  }
  if (ratio >= 0.35) {
    return { backgroundColor: '#FDA4AF', color: '#881337' };
  }
  if (ratio >= 0.18) {
    return { backgroundColor: '#FFE4E6', color: '#9F1239' };
  }
  return { backgroundColor: '#FFF1F2', color: '#9F1239' };
}

export function RegionBrandMatrix({
  matrix,
  selectedRegion,
  selectedBrand,
  onSelectCell,
}: RegionBrandMatrixProps) {
  if (matrix.regions.length === 0 || matrix.brands.length === 0) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">Matriks Penjualan Region × Brand</h2>
          <p className="text-xs text-slate-500">
            Intensitas warna menunjukkan besar Net Sales IDR per kombinasi wilayah dan brand. Klik sel
            untuk memfilter kombinasi tersebut.
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
          <span>Rendah</span>
          <span className="h-3 w-5 rounded bg-[#FFF1F2] ring-1 ring-inset ring-rose-200" />
          <span className="h-3 w-5 rounded bg-[#FFE4E6]" />
          <span className="h-3 w-5 rounded bg-[#FDA4AF]" />
          <span className="h-3 w-5 rounded bg-[#E11D48]" />
          <span className="h-3 w-5 rounded bg-[#B91C1C]" />
          <span>Tinggi</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[780px] border-separate border-spacing-1 text-left">
          <thead>
            <tr>
              <th className="rounded-lg bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600">
                Region
              </th>
              {matrix.brands.map((brand) => (
                <th
                  key={brand}
                  className="rounded-lg bg-slate-50 px-2.5 py-2 text-right text-xs font-bold text-slate-600"
                >
                  <span className="block truncate" title={brand}>
                    {brand}
                  </span>
                </th>
              ))}
              <th className="rounded-lg bg-slate-100 px-3 py-2 text-right text-xs font-bold text-slate-800">
                Total Region
              </th>
            </tr>
          </thead>
          <tbody>
            {matrix.regions.map((region) => {
              const rowTotal = matrix.regionTotals[region];
              return (
                <tr key={region}>
                  <td className="rounded-lg bg-slate-50/70 px-3 py-2 text-xs font-bold text-slate-800 whitespace-nowrap">
                    {region}
                  </td>
                  {matrix.brands.map((brand) => {
                    const cell = matrix.cells[region]?.[brand] ?? {
                      netSalesIdr: 0,
                      qtyCarton: 0,
                      invoiceCount: 0,
                    };
                    const heat = getHeatStyle(cell.netSalesIdr, matrix.maxCellNetSalesIdr);
                    const isActive = selectedRegion === region && selectedBrand === brand;

                    return (
                      <td key={`${region}-${brand}`} className="p-0">
                        <button
                          type="button"
                          onClick={() => onSelectCell(region, brand)}
                          title={`${region} × ${brand}: ${formatIdrFull(cell.netSalesIdr)} (${formatNumber(cell.qtyCarton)} karton)`}
                          style={heat}
                          className={`flex w-full flex-col items-end rounded-lg px-2.5 py-2 text-right tabular-nums transition-transform hover:scale-[1.02] ${
                            isActive ? 'ring-2 ring-slate-900 ring-offset-1' : ''
                          }`}
                        >
                          <span className="text-xs font-bold leading-tight">
                            {cell.netSalesIdr === 0 ? '—' : formatIdrCompact(cell.netSalesIdr)}
                          </span>
                          <span className="mt-0.5 text-[10px] opacity-80">
                            {cell.qtyCarton === 0 ? '' : `${formatNumber(cell.qtyCarton)} ktn`}
                          </span>
                        </button>
                      </td>
                    );
                  })}
                  <td className="rounded-lg bg-slate-100/90 px-3 py-2 text-right tabular-nums">
                    <div className="text-xs font-extrabold text-slate-900">
                      {formatIdrCompact(rowTotal.netSalesIdr)}
                    </div>
                    <div className="text-[10px] font-medium text-slate-500">
                      {formatNumber(rowTotal.qtyCarton)} ktn
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-extrabold text-slate-800">
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
                      {formatIdrCompact(colTotal.netSalesIdr)}
                    </div>
                    <div className="text-[10px] font-medium text-slate-500">
                      {formatNumber(colTotal.qtyCarton)} ktn
                    </div>
                  </td>
                );
              })}
              <td className="rounded-lg bg-slate-900 px-3 py-2 text-right tabular-nums text-white">
                <div className="text-xs font-extrabold">
                  {formatIdrCompact(
                    Object.values(matrix.regionTotals).reduce((s, r) => s + r.netSalesIdr, 0),
                  )}
                </div>
                <div className="text-[10px] text-slate-300">
                  {formatNumber(
                    Object.values(matrix.regionTotals).reduce((s, r) => s + r.qtyCarton, 0),
                  )}{' '}
                  ktn
                </div>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}
