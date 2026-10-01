/**
 * Schema for a budget dataset.
 *
 * A dataset describes one budget (a country's central government, a state, a
 * single ministry or organisation…) for one period. Every amount is stored in
 * the dataset's own `unit` (for India: ₹ crore). The simulation engine in
 * `src/model/engine.ts` only depends on this schema, so onboarding a new
 * country, state or organisation means adding a new dataset file and
 * registering it in `src/data/registry.ts` — no engine or UI changes.
 */

export interface Source {
  id: string;
  title: string;
  publisher: string;
  url: string;
}

/** How a user may change a line item. */
export type Lever =
  /**
   * Change the effective tax rate by a percentage (e.g. +10 ⇒ rates 10% higher).
   * Revenue responds as base × (1 + r)^(1 − ε), where ε is the item's
   * behavioural `elasticity` scaled by the chosen behavioural-response setting.
   */
  | { kind: 'rate'; minPct: number; maxPct: number }
  /** Scale the amount by a percentage. */
  | { kind: 'percent'; minPct: number; maxPct: number }
  /** Set the amount directly (in dataset units). */
  | { kind: 'amount'; min: number; max: number; step: number };

interface LineItem {
  id: string;
  label: string;
  /** Plain-language explanation shown in the UI. */
  description?: string;
  /** Budgeted amount, in dataset units. */
  base: number;
  /** Key into `Dataset.groups` used by the part-to-whole charts. */
  group: string;
  /** Ids of `Dataset.sources` backing this number. */
  sources: string[];
  /** Set when the figure is derived (e.g. a residual) rather than read directly. */
  derivation?: string;
  lever?: Lever;
}

export interface TaxItem extends LineItem {
  /** Behavioural elasticity of the tax base to the rate (0 = purely static). */
  elasticity: number;
  /** Whether this tax responds to the macro growth assumption. */
  growsWithEconomy: boolean;
}

export interface ReceiptItem extends LineItem {
  /** Capital (non-debt) receipt such as asset sales, rather than revenue. */
  capital?: boolean;
}

export interface SpendItem extends LineItem {
  /** Contractual / committed spending (interest, pensions) — shown with a warning. */
  committed?: boolean;
}

/**
 * Taxes collected by this government but passed on to another tier
 * (e.g. India's Union → States devolution recommended by the Finance Commission).
 */
export interface TaxSharing {
  label: string;
  description: string;
  /** Amount devolved in the budget. */
  base: number;
  /** Other amounts deducted from gross tax before it reaches the government (e.g. NCCD). */
  otherDeductions: { label: string; base: number; derivation?: string };
  /** Label for the option of raising money through levies that are *not* shared. */
  unsharedChannelLabel: string;
  sources: string[];
}

export interface Group {
  id: string;
  label: string;
  /** Categorical palette slot (1-8), fixed per group so colour follows the entity. */
  slot: number;
}

export interface Macro {
  /** Nominal GDP assumed by the budget, in dataset units. */
  gdp: number;
  /** Nominal GDP growth assumed by the budget (e.g. 0.10). */
  nominalGrowth: number;
  /** Tax buoyancy: % change in tax for a 1% change in nominal GDP. */
  taxBuoyancy: number;
  /** Assumed average cost of new borrowing, used for the "future interest" indicator. */
  marginalBorrowingCost: number;
  sources: string[];
}

export interface Benchmark {
  id: string;
  label: string;
  /** Fiscal deficit as a share of GDP (e.g. 0.03). */
  fiscalDeficitPctGdp: number;
  source?: string;
}

export interface Preset {
  id: string;
  label: string;
  description: string;
  values: ScenarioValues;
}

export interface Dataset {
  id: string;
  /** e.g. "India" */
  jurisdiction: string;
  /** e.g. "Union (Central) Government" */
  entity: string;
  /** e.g. "2026-27" */
  period: string;
  /** e.g. "Budget Estimates" */
  stage: string;
  currency: { symbol: string; code: string };
  /** Unit every amount is stored in. */
  unit: { label: string; multiplier: number };
  /** Number formatting system used for large amounts. */
  numberSystem: 'indian' | 'international';
  summary: string;
  taxes: TaxItem[];
  taxSharing?: TaxSharing;
  otherReceipts: ReceiptItem[];
  spending: SpendItem[];
  /** Label for the balancing item (borrowing). */
  borrowingLabel: string;
  receiptGroups: Group[];
  spendGroups: Group[];
  macro: Macro;
  benchmarks: Benchmark[];
  presets: Preset[];
  sources: Source[];
  dataNotes: string[];
  /** Officially published totals used to check the dataset is internally consistent. */
  checks: {
    grossTaxRevenue: number;
    netTaxRevenue: number;
    receiptsExcludingBorrowing: number;
    totalExpenditure: number;
    fiscalDeficit: number;
  };
}

export type BehaviouralResponse = 'off' | 'moderate' | 'strong';

/** The user's choices. Missing keys mean "as budgeted". */
export interface ScenarioValues {
  /** Lever values keyed by item id (percent for rate/percent levers, amount for amount levers). */
  items?: Record<string, number>;
  /** Nominal GDP growth override (e.g. 0.08). */
  growth?: number;
  behaviour?: BehaviouralResponse;
  /** Raise/cut taxes through levies not shared with other tiers of government. */
  unshared?: boolean;
}
