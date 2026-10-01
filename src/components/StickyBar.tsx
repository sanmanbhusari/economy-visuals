import type { Dataset } from '../data/types';
import type { Result } from '../model/engine';
import { formatAmount, formatPct } from '../model/format';

/** Always-visible result on small screens, so users see the effect while scrolling through sliders. */
export function StickyBar({ ds, result, changed }: { ds: Dataset; result: Result; changed: boolean }) {
  const surplus = result.fiscalDeficit < 0;
  return (
    <div className="sticky-bar" aria-hidden="true">
      <div>
        <span className="sticky-label">{surplus ? 'Surplus' : 'Deficit'}</span>
        <span className="sticky-value">{formatPct(Math.abs(result.fiscalDeficitPctGdp), 2)} of GDP</span>
      </div>
      <div>
        <span className="sticky-label">{changed ? 'Borrowing vs budget' : 'Borrowing'}</span>
        <span className="sticky-value">
          {changed ? formatAmount(ds, result.deficitChange, { signed: true }) : formatAmount(ds, result.fiscalDeficit)}
        </span>
      </div>
    </div>
  );
}
