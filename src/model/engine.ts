import type { BehaviouralResponse, Dataset, Group, Lever, ScenarioValues } from '../data/types';

/** Multiplier applied to each item's elasticity for each behavioural setting. */
export const BEHAVIOUR_SCALE: Record<BehaviouralResponse, number> = {
  off: 0,
  moderate: 1,
  strong: 1.5,
};

export interface ItemResult {
  id: string;
  label: string;
  group: string;
  base: number;
  value: number;
}

export interface GroupShare {
  id: string;
  label: string;
  slot: number | null;
  value: number;
  /** Share of the whole, 0–1. */
  share: number;
}

export interface Result {
  taxes: ItemResult[];
  grossTax: number;
  taxSharing: number;
  otherDeductions: number;
  netTax: number;
  otherReceipts: ItemResult[];
  revenueReceipts: number;
  receiptsExBorrowing: number;
  spending: ItemResult[];
  totalExpenditure: number;
  fiscalDeficit: number;
  primaryDeficit: number;
  gdp: number;
  fiscalDeficitPctGdp: number;
  interestToRevenueReceipts: number;
  /** Change in fiscal deficit vs. the budget as presented. */
  deficitChange: number;
  /** Extra (or saved) interest per year on the change in borrowing. */
  futureInterest: number;
  comesFrom: GroupShare[];
  goesTo: GroupShare[];
}

/** Default lever value meaning "as budgeted". */
export function neutralValue(lever: Lever, base: number): number {
  return lever.kind === 'amount' ? base : 0;
}

function applyLever(base: number, lever: Lever | undefined, value: number | undefined): number {
  if (!lever || value === undefined) return base;
  switch (lever.kind) {
    case 'amount':
      return value;
    case 'percent':
    case 'rate':
      return base * (1 + value / 100);
  }
}

function groupShares(groups: Group[], amounts: Map<string, number>, extra: Group[] = []): GroupShare[] {
  const all = [...groups, ...extra];
  const total = all.reduce((sum, g) => sum + Math.max(0, amounts.get(g.id) ?? 0), 0);
  return all
    .map((g) => {
      const value = Math.max(0, amounts.get(g.id) ?? 0);
      return { id: g.id, label: g.label, slot: g.slot || null, value, share: total > 0 ? value / total : 0 };
    })
    .filter((g) => g.value > 0);
}

function add(map: Map<string, number>, key: string, value: number) {
  map.set(key, (map.get(key) ?? 0) + value);
}

export function simulate(ds: Dataset, scenario: ScenarioValues = {}): Result {
  const items = scenario.items ?? {};
  const behaviour = BEHAVIOUR_SCALE[scenario.behaviour ?? 'moderate'];
  const growth = scenario.growth ?? ds.macro.nominalGrowth;
  const economyFactor = (1 + growth) / (1 + ds.macro.nominalGrowth);
  const taxGrowthFactor = Math.pow(economyFactor, ds.macro.taxBuoyancy);

  // --- Taxes -------------------------------------------------------------
  let grossBeforePolicy = 0;
  let policyChange = 0;
  const taxes: ItemResult[] = ds.taxes.map((t) => {
    const organic = t.growsWithEconomy ? t.base * taxGrowthFactor : t.base;
    let value = organic;
    const pct = items[t.id];
    if (t.lever?.kind === 'rate' && pct !== undefined && pct !== 0) {
      const r = pct / 100;
      value = organic * Math.pow(1 + r, 1 - t.elasticity * behaviour);
    } else if (t.lever) {
      value = applyLever(organic, t.lever, pct);
    }
    grossBeforePolicy += organic;
    policyChange += value - organic;
    return { id: t.id, label: t.label, group: t.group, base: t.base, value };
  });
  const grossTax = grossBeforePolicy + policyChange;

  // --- Sharing with other tiers of government ------------------------------
  let taxSharing = 0;
  let otherDeductions = 0;
  if (ds.taxSharing) {
    const grossBase = ds.taxes.reduce((s, t) => s + t.base, 0);
    const shareRate = ds.taxSharing.base / grossBase;
    taxSharing = shareRate * grossBeforePolicy + (scenario.unshared ? 0 : shareRate * policyChange);
    otherDeductions = ds.taxSharing.otherDeductions.base;
  }
  const netTax = grossTax - taxSharing - otherDeductions;

  // --- Other receipts -----------------------------------------------------
  const otherReceipts: ItemResult[] = ds.otherReceipts.map((r) => ({
    id: r.id,
    label: r.label,
    group: r.group,
    base: r.base,
    value: applyLever(r.base, r.lever, items[r.id]),
  }));
  const revenueReceipts =
    netTax + otherReceipts.filter((_, i) => !ds.otherReceipts[i].capital).reduce((s, r) => s + r.value, 0);
  const receiptsExBorrowing = netTax + otherReceipts.reduce((s, r) => s + r.value, 0);

  // --- Spending -----------------------------------------------------------
  const spending: ItemResult[] = ds.spending.map((x) => ({
    id: x.id,
    label: x.label,
    group: x.group,
    base: x.base,
    value: applyLever(x.base, x.lever, items[x.id]),
  }));
  const totalExpenditure = spending.reduce((s, x) => s + x.value, 0);

  // --- Balance ------------------------------------------------------------
  const fiscalDeficit = totalExpenditure - receiptsExBorrowing;
  const interest = spending.find((x) => x.group === 'interest')?.value ?? 0;
  const gdp = ds.macro.gdp * economyFactor;
  const deficitChange = fiscalDeficit - ds.checks.fiscalDeficit;

  // --- Part-to-whole views ------------------------------------------------
  const inflow = new Map<string, number>();
  taxes.forEach((t) => add(inflow, t.group, t.value));
  otherReceipts.forEach((r) => add(inflow, r.group, r.value));
  add(inflow, 'borrowing', Math.max(0, fiscalDeficit));

  const outflow = new Map<string, number>();
  if (ds.taxSharing) {
    add(outflow, 'states-share', taxSharing);
    add(outflow, 'other', otherDeductions);
  }
  spending.forEach((x) => add(outflow, x.group, x.value));
  const surplusGroup: Group[] = [];
  if (fiscalDeficit < 0) {
    add(outflow, 'surplus', -fiscalDeficit);
    surplusGroup.push({ id: 'surplus', label: 'Surplus (repays debt)', slot: 0 });
  }

  return {
    taxes,
    grossTax,
    taxSharing,
    otherDeductions,
    netTax,
    otherReceipts,
    revenueReceipts,
    receiptsExBorrowing,
    spending,
    totalExpenditure,
    fiscalDeficit,
    primaryDeficit: fiscalDeficit - interest,
    gdp,
    fiscalDeficitPctGdp: fiscalDeficit / gdp,
    interestToRevenueReceipts: interest / revenueReceipts,
    deficitChange,
    futureInterest: deficitChange * ds.macro.marginalBorrowingCost,
    comesFrom: groupShares(ds.receiptGroups, inflow),
    goesTo: groupShares(ds.spendGroups, outflow, surplusGroup),
  };
}
