import { describe, expect, it } from 'vitest';
import { registry } from '../data/registry';
import { indiaUnion202627 as ds } from '../data/india/union-2026-27';
import { simulate } from './engine';
import { buildHash, parseHash } from './scenario-url';

const allDatasets = registry.flatMap((j) => j.entities.flatMap((e) => e.datasets));

describe.each(allDatasets.map((d) => [d.id, d] as const))('dataset %s', (_id, d) => {
  it('adds up to the published totals', () => {
    const r = simulate(d);
    const c = d.checks;
    expect(r.grossTax).toBeCloseTo(c.grossTaxRevenue, 0);
    expect(r.netTax).toBeCloseTo(c.netTaxRevenue, 0);
    expect(r.receiptsExBorrowing).toBeCloseTo(c.receiptsExcludingBorrowing, 0);
    expect(r.totalExpenditure).toBeCloseTo(c.totalExpenditure, 0);
    expect(r.fiscalDeficit).toBeCloseTo(c.fiscalDeficit, 0);
    expect(r.deficitChange).toBeCloseTo(0, 6);
  });

  it('has unique ids, known groups and known sources', () => {
    const ids = [...d.taxes, ...d.otherReceipts, ...d.spending].map((x) => x.id);
    expect(new Set(ids).size).toBe(ids.length);
    const sourceIds = new Set(d.sources.map((s) => s.id));
    const receiptGroups = new Set(d.receiptGroups.map((g) => g.id));
    const spendGroups = new Set(d.spendGroups.map((g) => g.id));
    for (const x of [...d.taxes, ...d.otherReceipts]) expect(receiptGroups).toContain(x.group);
    for (const x of d.spending) expect(spendGroups).toContain(x.group);
    for (const x of [...d.taxes, ...d.otherReceipts, ...d.spending]) {
      expect(x.sources.length).toBeGreaterThan(0);
      for (const s of x.sources) expect(sourceIds).toContain(s);
    }
  });

  it('keeps part-to-whole views balanced', () => {
    const r = simulate(d);
    const inflow = r.comesFrom.reduce((s, g) => s + g.value, 0);
    const outflow = r.goesTo.reduce((s, g) => s + g.value, 0);
    expect(inflow).toBeCloseTo(outflow, 0);
    expect(r.comesFrom.reduce((s, g) => s + g.share, 0)).toBeCloseTo(1, 6);
  });
});

describe('India Union 2026-27', () => {
  it('matches the official 4.3% fiscal deficit', () => {
    expect(simulate(ds).fiscalDeficitPctGdp).toBeCloseTo(0.043, 3);
  });

  it('matches the official "rupee comes from / goes to" paise', () => {
    const r = simulate(ds);
    const p = (list: typeof r.comesFrom, id: string) => Math.round((list.find((g) => g.id === id)?.share ?? 0) * 100);
    expect(p(r.comesFrom, 'borrowing')).toBe(25); // official 24p (rounding of a 24.6 share)
    expect(p(r.comesFrom, 'income-tax')).toBe(21);
    expect(p(r.comesFrom, 'corporation-tax')).toBe(18);
    expect(p(r.comesFrom, 'gst')).toBe(15);
    expect(p(r.goesTo, 'states-share')).toBe(22);
    expect(p(r.goesTo, 'interest')).toBe(20);
  });

  it('shares statutory tax increases with States but not cess increases', () => {
    const shared = simulate(ds, { items: { 'income-tax': 10 }, behaviour: 'off' });
    const unshared = simulate(ds, { items: { 'income-tax': 10 }, behaviour: 'off', unshared: true });
    expect(shared.grossTax - ds.checks.grossTaxRevenue).toBeCloseTo(146600, 0);
    expect(unshared.netTax - ds.checks.netTaxRevenue).toBeCloseTo(146600, 0);
    expect(shared.netTax - ds.checks.netTaxRevenue).toBeLessThan(146600 * 0.7);
  });

  it('dampens tax gains with behavioural response', () => {
    const off = simulate(ds, { items: { 'corporation-tax': 20 }, behaviour: 'off' });
    const strong = simulate(ds, { items: { 'corporation-tax': 20 }, behaviour: 'strong' });
    expect(strong.grossTax).toBeLessThan(off.grossTax);
    expect(strong.grossTax).toBeGreaterThan(ds.checks.grossTaxRevenue);
  });

  it('turns extra spending into extra borrowing one-for-one', () => {
    const r = simulate(ds, { items: { defence: 10 } });
    expect(r.deficitChange).toBeCloseTo(59458.5, 1);
    expect(r.futureInterest).toBeCloseTo(59458.5 * 0.07, 1);
  });

  it('scales GDP and taxes with the growth assumption', () => {
    const r = simulate(ds, { growth: 0.12 });
    expect(r.gdp).toBeCloseTo((ds.macro.gdp * 1.12) / 1.1, 0);
    expect(r.grossTax).toBeGreaterThan(ds.checks.grossTaxRevenue);
  });

  it('shows a surplus instead of negative borrowing', () => {
    const r = simulate(ds, { items: { 'income-tax': 40, 'corporation-tax': 40, gst: 40, 'everything-else': -30, defence: -50 }, behaviour: 'off', unshared: true });
    expect(r.fiscalDeficit).toBeLessThan(0);
    expect(r.comesFrom.find((g) => g.id === 'borrowing')).toBeUndefined();
    expect(r.goesTo.find((g) => g.id === 'surplus')?.value).toBeCloseTo(-r.fiscalDeficit, 0);
  });

  it.each(ds.presets.map((p) => [p.id, p] as const))('preset %s only uses known lever ids', (_id, preset) => {
    const ids = new Set([...ds.taxes, ...ds.otherReceipts, ...ds.spending].filter((x) => x.lever).map((x) => x.id));
    for (const key of Object.keys(preset.values.items ?? {})) expect(ids).toContain(key);
  });
});

describe('scenario URL', () => {
  it('round-trips', () => {
    const route = {
      jurisdiction: 'in',
      entity: 'union',
      period: '2026-27',
      scenario: { items: { 'income-tax': 5, disinvestment: 150000 }, growth: 0.11, behaviour: 'strong' as const, unshared: true },
    };
    expect(parseHash(buildHash(route))).toEqual(route);
  });

  it('ignores junk', () => {
    expect(parseHash('')).toBeNull();
    expect(parseHash('#/in')).toBeNull();
    expect(parseHash('#/in/union?v=a:x,b:2&b=wild')?.scenario).toEqual({ items: { b: 2 } });
  });
});
