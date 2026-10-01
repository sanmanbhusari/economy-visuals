import type { Dataset } from '../data/types';
import type { Result } from '../model/engine';
import { formatAmount, formatPct } from '../model/format';

const METER_MAX = 0.08;

export function Summary({
  ds,
  result,
  baseline,
  changed,
  onReset,
}: {
  ds: Dataset;
  result: Result;
  baseline: Result;
  changed: boolean;
  onReset: () => void;
}) {
  const fd = result.fiscalDeficitPctGdp;
  const fdDelta = fd - baseline.fiscalDeficitPctGdp;
  const surplus = result.fiscalDeficit < 0;
  const fill = Math.min(Math.max(fd, 0), METER_MAX) / METER_MAX;

  return (
    <section className="card summary" aria-labelledby="summary-title">
      <div className="summary-head">
        <h2 id="summary-title">Your budget</h2>
        {changed && (
          <button className="btn" onClick={onReset}>
            Reset to budget
          </button>
        )}
      </div>

      <div className="hero">
        <div>
          <p className="hero-label">{surplus ? 'Fiscal surplus' : 'Fiscal deficit'} (share of GDP)</p>
          <p className="hero-value" aria-live="polite">
            {formatPct(Math.abs(fd), 2)}
          </p>
          <p className="delta">
            {Math.abs(fdDelta) < 0.00005 ? (
              'Same as the budget'
            ) : (
              <>
                <span aria-hidden="true">{fdDelta > 0 ? '▲' : '▼'}</span> {formatPct(Math.abs(fdDelta), 2)} points{' '}
                {fdDelta > 0 ? 'more' : 'less'} than the budget's {formatPct(baseline.fiscalDeficitPctGdp, 1)}
              </>
            )}
          </p>
        </div>
        <div className="meter" role="img" aria-label={`Fiscal deficit ${formatPct(fd, 2)} of GDP on a scale of 0 to 8%`}>
          <div className="meter-track">
            <div className="meter-fill" style={{ width: `${fill * 100}%` }} />
            {ds.benchmarks.map((b) => (
              <div
                key={b.id}
                className="meter-mark"
                style={{ left: `${(b.fiscalDeficitPctGdp / METER_MAX) * 100}%` }}
                title={`${b.label}: ${formatPct(b.fiscalDeficitPctGdp, 1)}`}
              >
                <span className="meter-mark-label">
                  {b.label} {formatPct(b.fiscalDeficitPctGdp, 1)}
                </span>
              </div>
            ))}
          </div>
          <div className="meter-scale" aria-hidden="true">
            <span>0%</span>
            <span>4%</span>
            <span>8%</span>
          </div>
        </div>
      </div>

      <dl className="tiles">
        <Tile
          label={surplus ? 'Surplus (debt repaid)' : 'Borrowing needed'}
          value={formatAmount(ds, Math.abs(result.fiscalDeficit))}
          delta={result.deficitChange}
          ds={ds}
          goodWhen="down"
        />
        <Tile
          label="Total spending"
          value={formatAmount(ds, result.totalExpenditure)}
          delta={result.totalExpenditure - baseline.totalExpenditure}
          ds={ds}
        />
        <Tile
          label="Income (excl. borrowing)"
          value={formatAmount(ds, result.receiptsExBorrowing)}
          delta={result.receiptsExBorrowing - baseline.receiptsExBorrowing}
          ds={ds}
        />
        <Tile
          label="Interest as share of revenue"
          value={formatPct(result.interestToRevenueReceipts, 0)}
          note="of every rupee of revenue goes on interest"
        />
        <Tile
          label="Interest bill on the change, every year after"
          value={formatAmount(ds, result.futureInterest, { signed: true })}
          note={`at about ${formatPct(ds.macro.marginalBorrowingCost, 0)} a year`}
        />
      </dl>
    </section>
  );
}

function Tile({
  label,
  value,
  delta,
  ds,
  note,
  goodWhen,
}: {
  label: string;
  value: string;
  delta?: number;
  ds?: Dataset;
  note?: string;
  goodWhen?: 'up' | 'down';
}) {
  let deltaText: string | null = null;
  if (delta !== undefined && ds) {
    deltaText = Math.abs(delta) < 1 ? 'no change' : `${formatAmount(ds, delta, { signed: true })} vs budget`;
  }
  const tone =
    delta !== undefined && goodWhen && Math.abs(delta) >= 1
      ? (delta > 0) === (goodWhen === 'up')
        ? 'good'
        : 'bad'
      : undefined;
  return (
    <div className="tile">
      <dt>{label}</dt>
      <dd className="tile-value">{value}</dd>
      {deltaText && <dd className={`tile-delta ${tone ?? ''}`}>{deltaText}</dd>}
      {note && <dd className="tile-note">{note}</dd>}
    </div>
  );
}
