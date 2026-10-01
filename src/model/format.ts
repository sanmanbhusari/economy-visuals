import type { Dataset } from '../data/types';

/** Format an amount given in dataset units, e.g. ₹53.47 lakh cr or ₹80,000 cr. */
export function formatAmount(ds: Dataset, value: number, opts: { signed?: boolean } = {}): string {
  const sign = value < 0 ? '−' : opts.signed && value > 0 ? '+' : '';
  const abs = Math.abs(value);
  const sym = ds.currency.symbol;

  if (ds.numberSystem === 'indian' && ds.unit.label === 'crore') {
    if (abs >= 1e5) return `${sign}${sym}${(abs / 1e5).toFixed(2)} lakh cr`;
    return `${sign}${sym}${Math.round(abs).toLocaleString('en-IN')} cr`;
  }

  const raw = abs * ds.unit.multiplier;
  const scales: [number, string][] = [
    [1e12, 'tn'],
    [1e9, 'bn'],
    [1e6, 'm'],
  ];
  for (const [size, suffix] of scales) {
    if (raw >= size) return `${sign}${sym}${(raw / size).toFixed(raw / size >= 100 ? 0 : 1)} ${suffix}`;
  }
  return `${sign}${sym}${Math.round(raw).toLocaleString('en')}`;
}

/** Full-precision amount in dataset units with the unit label, e.g. ₹53,47,315 crore. */
export function formatExact(ds: Dataset, value: number): string {
  const locale = ds.numberSystem === 'indian' ? 'en-IN' : 'en';
  const sign = value < 0 ? '−' : '';
  return `${sign}${ds.currency.symbol}${Math.round(Math.abs(value)).toLocaleString(locale)} ${ds.unit.label}`;
}

export function formatPct(value: number, digits = 1, opts: { signed?: boolean } = {}): string {
  const sign = value < 0 ? '−' : opts.signed && value > 0 ? '+' : '';
  return `${sign}${Math.abs(value * 100).toFixed(digits)}%`;
}

/** Paise (or cents) out of each currency unit. */
export function formatPaise(share: number): string {
  return `${Math.round(share * 100)}p`;
}
