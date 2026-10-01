# Economy Visuals

An interactive, installable web app for exploring public budgets. See where a government's money comes from and where
it goes, then change tax rates and spending yourself and watch the borrowing (fiscal deficit) respond.

**First dataset:** India — Union (Central) Government, Budget Estimates 2026-27, with sources linked on every line.

Works on phones, tablets and laptops, and can be installed as an app (it's a Progressive Web App; once opened it also
works offline).

## What you can do

- Pick a ready-made scenario ("Hit the 3% target", "Defence first", …) or build your own with the sliders.
- Change tax **rates** (income tax, corporation tax, GST, excise, customs). Revenue responds using a simple
  behavioural-response assumption you can switch off or strengthen.
- See that States get a share of most Union taxes, and what changes if you raise money through cesses/surcharges instead.
- Cut or raise 17 spending areas; anything not covered by income becomes borrowing.
- See the fiscal deficit as a % of GDP, the extra interest the choices would cost every year, and "every rupee in and
  out" before vs. after.
- Share your scenario: the whole scenario is stored in the page link.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # data + model tests
npm run build && npm run preview   # production build (needed to test install / offline)
```

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for testing on a phone and publishing to GitHub Pages.

## Adding a country, state or organisation

Everything the app shows comes from a dataset file that follows [`src/data/types.ts`](src/data/types.ts).

1. Copy [`src/data/india/union-2026-27.ts`](src/data/india/union-2026-27.ts) and replace the numbers, groups, sources
   and `checks` (the officially published totals).
2. Register it in [`src/data/registry.ts`](src/data/registry.ts).
3. Run `npm test`. It fails if the line items don't add up to the published totals or a source reference is missing.

The simulation ([`src/model/engine.ts`](src/model/engine.ts)) and UI don't need to change.

## How the model works

Deliberately simple and transparent:

- Tax change: revenue = base × (1 + rate change)^(1 − e), where *e* is a per-tax behavioural elasticity (0 to 0.6).
- Growth: taxes scale with nominal GDP growth (buoyancy 1.0).
- States' share: a fixed share of changes in shared taxes goes to the States, unless raised via cesses/surcharges.
- Borrowing = total spending − all income. Future interest = change in borrowing × 7%.

These are illustrations, not forecasts.

## Data and credit

Figures are the Union Budget 2026-27 Budget Estimates, as published by the Ministry of Finance and summarised by PRS
Legislative Research; every line item lists its sources. Some lines are derived as the difference between published
totals and are marked as such. Tests check the dataset against the published totals. Government publications remain
subject to their own terms of use.

> **Verify before promoting widely:** the official budget website could not be reached while this was built, so the
> numbers were assembled from documents quoted by secondary sources. See "Data verification" in
> [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Licence

[MIT](LICENSE) © Sanman Bhusari. You are free to use, modify and redistribute this project, but the licence requires
that the copyright notice stays with copies. Please also credit the original idea and author, Sanman Bhusari, in
anything you build on it. A [CITATION.cff](CITATION.cff) is included for referencing.
