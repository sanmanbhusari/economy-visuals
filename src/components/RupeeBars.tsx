import { useState } from 'react';
import type { Dataset } from '../data/types';
import type { GroupShare, Result } from '../model/engine';
import { formatAmount, formatPaise, formatPct } from '../model/format';

/**
 * "Where each rupee comes from / goes to" — two 100% stacked bars, the budget
 * as presented and the user's plan, so the shift between them is visible.
 */
export function RupeeBars({
  ds,
  result,
  baseline,
  changed,
}: {
  ds: Dataset;
  result: Result;
  baseline: Result;
  changed: boolean;
}) {
  const [table, setTable] = useState(false);
  const unitWord = ds.currency.code === 'INR' ? 'rupee' : 'unit';
  return (
    <section className="card" aria-labelledby="rupee-title">
      <div className="card-head">
        <h2 id="rupee-title">Every {unitWord}, in and out</h2>
        <button className="btn btn-quiet" onClick={() => setTable((t) => !t)} aria-pressed={table}>
          {table ? 'Show chart' : 'Show table'}
        </button>
      </div>
      <Stack
        ds={ds}
        title={`Where each ${unitWord} comes from`}
        rows={changed ? [['Budget', baseline.comesFrom], ['Your plan', result.comesFrom]] : [['Budget', baseline.comesFrom]]}
        table={table}
      />
      <Stack
        ds={ds}
        title={`Where each ${unitWord} goes`}
        rows={changed ? [['Budget', baseline.goesTo], ['Your plan', result.goesTo]] : [['Budget', baseline.goesTo]]}
        table={table}
      />
    </section>
  );
}

function Stack({
  ds,
  title,
  rows,
  table,
}: {
  ds: Dataset;
  title: string;
  rows: [string, GroupShare[]][];
  table: boolean;
}) {
  const [hover, setHover] = useState<{ row: string; id: string } | null>(null);
  // Legend order and colours come from the first row so they never repaint.
  const legend = unionGroups(rows.map(([, g]) => g));

  if (table) {
    return (
      <figure className="stack">
        <figcaption>{title}</figcaption>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Category</th>
                {rows.map(([name]) => (
                  <th key={name} scope="col" className="num">
                    {name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {legend.map((g) => (
                <tr key={g.id}>
                  <th scope="row">{g.label}</th>
                  {rows.map(([name, groups]) => {
                    const x = groups.find((y) => y.id === g.id);
                    return (
                      <td key={name} className="num">
                        {x ? `${formatPaise(x.share)} · ${formatAmount(ds, x.value)}` : '—'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </figure>
    );
  }

  const hovered = hover && rows.find(([n]) => n === hover.row)?.[1].find((g) => g.id === hover.id);

  return (
    <figure className="stack">
      <figcaption>{title}</figcaption>
      {rows.map(([name, groups]) => (
        <div className="stack-row" key={name}>
          <span className="stack-name">{name}</span>
          <div className="stack-bar" role="list" aria-label={`${title} — ${name}`}>
            {groups.map((g) => (
              <div
                key={g.id}
                role="listitem"
                tabIndex={0}
                className={`stack-seg ${hover && hover.id !== g.id ? 'dim' : ''}`}
                style={{ flexGrow: g.share, background: g.slot ? `var(--series-${g.slot})` : 'var(--neutral-series)' }}
                aria-label={`${g.label}: ${formatPaise(g.share)}, ${formatAmount(ds, g.value)}`}
                onMouseEnter={() => setHover({ row: name, id: g.id })}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover({ row: name, id: g.id })}
                onBlur={() => setHover(null)}
              >
                {g.share >= 0.07 && <span className="seg-label">{formatPaise(g.share)}</span>}
              </div>
            ))}
          </div>
        </div>
      ))}
      <div className="stack-tooltip" aria-live="polite">
        {hovered ? (
          <>
            <strong>{hovered.label}</strong> · {hover!.row}: {formatPaise(hovered.share)} ({formatPct(hovered.share, 1)}) ·{' '}
            {formatAmount(ds, hovered.value)}
          </>
        ) : (
          <span className="muted">Hover or tap a segment for details.</span>
        )}
      </div>
      <ul className="legend">
        {legend.map((g) => (
          <li key={g.id}>
            <span className="swatch" style={{ background: g.slot ? `var(--series-${g.slot})` : 'var(--neutral-series)' }} />
            {g.label}
          </li>
        ))}
      </ul>
    </figure>
  );
}

function unionGroups(lists: GroupShare[][]): GroupShare[] {
  const seen = new Map<string, GroupShare>();
  for (const list of lists) for (const g of list) if (!seen.has(g.id)) seen.set(g.id, g);
  return [...seen.values()];
}
