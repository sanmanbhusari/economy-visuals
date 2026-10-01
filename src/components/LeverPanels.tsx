import { useId, useState } from 'react';
import type { BehaviouralResponse, Dataset, ScenarioValues, SpendItem, TaxItem, ReceiptItem } from '../data/types';
import type { ItemResult, Result } from '../model/engine';
import { formatAmount, formatPct } from '../model/format';

type SetItem = (id: string, value: number | undefined) => void;

export function RevenuePanel({
  ds,
  result,
  scenario,
  setItem,
  setScenario,
}: {
  ds: Dataset;
  result: Result;
  scenario: ScenarioValues;
  setItem: SetItem;
  setScenario: (s: ScenarioValues) => void;
}) {
  const growth = scenario.growth ?? ds.macro.nominalGrowth;
  const behaviour = scenario.behaviour ?? 'moderate';
  return (
    <section className="card panel" aria-labelledby="revenue-title">
      <h2 id="revenue-title">Money coming in</h2>
      <p className="hint">
        Move a tax slider to change its rates. Higher rates raise less than you might expect when people and firms
        respond — pick how strongly below.
      </p>

      <h3 className="panel-sub">Taxes</h3>
      {ds.taxes.map((t) => (
        <LeverRow key={t.id} ds={ds} item={t} result={find(result.taxes, t.id)} value={scenario.items?.[t.id]} setItem={setItem} />
      ))}

      {ds.taxSharing && (
        <div className="sharing">
          <div className="calc">
            <span>Gross tax collected</span>
            <span className="num">{formatAmount(ds, result.grossTax)}</span>
            <span>− {ds.taxSharing.label}</span>
            <span className="num">{formatAmount(ds, result.taxSharing)}</span>
            <span>− {ds.taxSharing.otherDeductions.label}</span>
            <span className="num">{formatAmount(ds, result.otherDeductions)}</span>
            <strong>Tax the Centre keeps</strong>
            <strong className="num">{formatAmount(ds, result.netTax)}</strong>
          </div>
          <p className="hint">{ds.taxSharing.description}</p>
          <label className="toggle">
            <input
              type="checkbox"
              checked={!!scenario.unshared}
              onChange={(e) => setScenario({ ...scenario, unshared: e.target.checked || undefined })}
            />
            <span>{ds.taxSharing.unsharedChannelLabel}</span>
          </label>
        </div>
      )}

      <h3 className="panel-sub">Other income</h3>
      {ds.otherReceipts.map((r) => (
        <LeverRow key={r.id} ds={ds} item={r} result={find(result.otherReceipts, r.id)} value={scenario.items?.[r.id]} setItem={setItem} />
      ))}

      <h3 className="panel-sub">Assumptions</h3>
      <div className="assumption">
        <label htmlFor="growth">
          Nominal GDP growth <span className="num">{formatPct(growth, 1)}</span>
        </label>
        <input
          id="growth"
          type="range"
          min={4}
          max={16}
          step={0.5}
          value={growth * 100}
          onChange={(e) => {
            const g = Number(e.target.value) / 100;
            setScenario({ ...scenario, growth: Math.abs(g - ds.macro.nominalGrowth) < 1e-9 ? undefined : g });
          }}
        />
        <p className="hint">
          Budget assumes {formatPct(ds.macro.nominalGrowth, 0)}. A faster-growing economy brings in more tax and makes
          the deficit a smaller share of GDP.
        </p>
      </div>
      <div className="assumption">
        <span id="behaviour-label">How much do people and firms react to tax changes?</span>
        <div className="segmented" role="radiogroup" aria-labelledby="behaviour-label">
          {(['off', 'moderate', 'strong'] as BehaviouralResponse[]).map((b) => (
            <button
              key={b}
              role="radio"
              aria-checked={behaviour === b}
              onClick={() => setScenario({ ...scenario, behaviour: b === 'moderate' ? undefined : b })}
            >
              {b === 'off' ? 'Not at all' : b === 'moderate' ? 'Moderately' : 'Strongly'}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

export function SpendingPanel({
  ds,
  result,
  scenario,
  setItem,
}: {
  ds: Dataset;
  result: Result;
  scenario: ScenarioValues;
  setItem: SetItem;
}) {
  const max = Math.max(...result.spending.map((x) => Math.max(x.value, x.base)));
  return (
    <section className="card panel" aria-labelledby="spending-title">
      <h2 id="spending-title">Money going out</h2>
      <p className="hint">
        Raise or cut each area. Anything not covered by income is borrowed — and borrowing adds to future interest.
      </p>
      {ds.spending.map((x) => (
        <LeverRow
          key={x.id}
          ds={ds}
          item={x}
          result={find(result.spending, x.id)}
          value={scenario.items?.[x.id]}
          setItem={setItem}
          barMax={max}
        />
      ))}
      <div className="calc total">
        <strong>Total spending</strong>
        <strong className="num">{formatAmount(ds, result.totalExpenditure)}</strong>
      </div>
    </section>
  );
}

function find(list: ItemResult[], id: string): ItemResult {
  return list.find((x) => x.id === id)!;
}

function LeverRow({
  ds,
  item,
  result,
  value,
  setItem,
  barMax,
}: {
  ds: Dataset;
  item: TaxItem | ReceiptItem | SpendItem;
  result: ItemResult;
  value: number | undefined;
  setItem: SetItem;
  barMax?: number;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const lever = item.lever;
  const delta = result.value - result.base;
  const committed = 'committed' in item && item.committed;

  let control = null;
  if (lever) {
    const isAmount = lever.kind === 'amount';
    const min = isAmount ? lever.min : lever.minPct;
    const max = isAmount ? lever.max : lever.maxPct;
    const step = isAmount ? lever.step : 1;
    const current = value ?? (isAmount ? item.base : 0);
    const shown = isAmount
      ? formatAmount(ds, current)
      : `${current > 0 ? '+' : current < 0 ? '−' : '±'}${Math.abs(current)}%`;
    control = (
      <div className="slider">
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={current}
          aria-valuetext={`${shown}${lever.kind === 'rate' ? ' tax rates' : ''}`}
          onChange={(e) => {
            const v = Number(e.target.value);
            const neutral = isAmount ? item.base : 0;
            setItem(item.id, v === neutral ? undefined : v);
          }}
        />
        <output htmlFor={id} className="slider-value num">
          {shown}
        </output>
      </div>
    );
  }

  return (
    <div className={`lever ${delta !== 0 ? 'is-changed' : ''}`}>
      <div className="lever-top">
        <label htmlFor={lever ? id : undefined} className="lever-label">
          {item.label}
          {lever?.kind === 'rate' && <span className="tag">rates</span>}
          {committed && <span className="tag">committed</span>}
          {!lever && <span className="tag">fixed</span>}
        </label>
        <button
          className="btn btn-quiet btn-small"
          aria-expanded={open}
          aria-label={`About ${item.label}`}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? 'Less' : 'About'}
        </button>
      </div>

      <div className="lever-amount">
        <span className="num">{formatAmount(ds, result.value)}</span>
        {Math.abs(delta) >= 1 && (
          <span className="lever-delta num">
            {formatAmount(ds, delta, { signed: true })} vs {formatAmount(ds, result.base)}
          </span>
        )}
      </div>

      {barMax !== undefined && (
        <div className="minibar" aria-hidden="true">
          <div className="minibar-fill" style={{ width: `${(result.value / barMax) * 100}%` }} />
          <div className="minibar-base" style={{ left: `${(result.base / barMax) * 100}%` }} />
        </div>
      )}

      {control}

      {open && (
        <div className="lever-info">
          {item.description && <p>{item.description}</p>}
          {lever?.kind === 'rate' && 'elasticity' in item && (
            <p className="muted">
              Assumed behavioural elasticity: {item.elasticity}. Revenue ≈ base × (1 + change)
              <sup>1 − elasticity</sup>.
            </p>
          )}
          {item.derivation && <p className="muted">Derived: {item.derivation}</p>}
          <p className="muted">
            Budget figure: {formatAmount(ds, item.base)} · Source:{' '}
            {item.sources.map((s, i) => {
              const src = ds.sources.find((x) => x.id === s);
              return (
                <span key={s}>
                  {i > 0 && ', '}
                  {src ? (
                    <a href={src.url} target="_blank" rel="noreferrer">
                      {src.title}
                    </a>
                  ) : (
                    s
                  )}
                </span>
              );
            })}
          </p>
          {Math.abs(delta) >= 1 && lever && (
            <button className="btn btn-small" onClick={() => setItem(item.id, undefined)}>
              Reset this item
            </button>
          )}
        </div>
      )}
    </div>
  );
}
