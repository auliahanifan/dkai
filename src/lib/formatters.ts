const MONTHS_ID = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

export function formatIdrFull(value: number): string {
  const abs = Math.abs(Math.round(value));
  const formatted = abs.toLocaleString('id-ID');
  return value < 0 ? `-Rp${formatted}` : `Rp${formatted}`;
}

export function formatIdrCompact(value: number): string {
  const sign = value < 0 ? '-' : '';
  const abs = Math.abs(value);

  if (abs >= 1_000_000_000) {
    const billions = abs / 1_000_000_000;
    return `${sign}Rp${billions.toLocaleString('id-ID', {
      minimumFractionDigits: billions >= 100 ? 0 : 2,
      maximumFractionDigits: 2,
    })} M`;
  }
  if (abs >= 1_000_000) {
    const millions = abs / 1_000_000;
    return `${sign}Rp${millions.toLocaleString('id-ID', {
      minimumFractionDigits: millions >= 100 ? 0 : 1,
      maximumFractionDigits: 1,
    })} jt`;
  }
  if (abs >= 1_000) {
    const thousands = abs / 1_000;
    return `${sign}Rp${thousands.toLocaleString('id-ID', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })} rb`;
  }
  return `${sign}Rp${Math.round(abs).toLocaleString('id-ID')}`;
}

export function formatNumber(value: number): string {
  return Math.round(value).toLocaleString('id-ID');
}

export function formatPct(value: number, digits = 1): string {
  return `${value.toLocaleString('id-ID', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}%`;
}

export function formatDateShort(isoDate: string): string {
  if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return isoDate || '-';
  const [y, m, d] = isoDate.split('-').map(Number);
  return `${d} ${MONTHS_ID[m - 1] ?? m} ${y}`;
}

export function formatDateRange(startIso: string, endIso: string): string {
  if (!startIso && !endIso) return '-';
  if (startIso === endIso) return formatDateShort(startIso);
  if (/^\d{4}-\d{2}-\d{2}$/.test(startIso) && /^\d{4}-\d{2}-\d{2}$/.test(endIso)) {
    const [sy, sm, sd] = startIso.split('-').map(Number);
    const [ey, em, ed] = endIso.split('-').map(Number);
    if (sy === ey && sm === em) {
      return `${sd}–${ed} ${MONTHS_ID[em - 1]} ${ey}`;
    }
    if (sy === ey) {
      return `${sd} ${MONTHS_ID[sm - 1]}–${ed} ${MONTHS_ID[em - 1]} ${ey}`;
    }
  }
  return `${formatDateShort(startIso)}–${formatDateShort(endIso)}`;
}
