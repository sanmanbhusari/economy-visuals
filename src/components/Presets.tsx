import type { Dataset, ScenarioValues } from '../data/types';

export function Presets({
  ds,
  scenario,
  onPick,
}: {
  ds: Dataset;
  scenario: ScenarioValues;
  onPick: (s: ScenarioValues) => void;
}) {
  const current = JSON.stringify(normalise(scenario));
  const active = ds.presets.find((p) => JSON.stringify(normalise(p.values)) === current);
  return (
    <section className="presets" aria-labelledby="presets-title">
      <h2 id="presets-title" className="section-label">
        Start from a scenario
      </h2>
      <div className="chips" role="radiogroup" aria-labelledby="presets-title">
        {ds.presets.map((p) => (
          <button
            key={p.id}
            role="radio"
            aria-checked={active?.id === p.id}
            className="chip"
            onClick={() => onPick(p.values)}
            title={p.description}
          >
            {p.label}
          </button>
        ))}
      </div>
      <p className="hint">{active ? active.description : 'Your own scenario — share it with the link in your address bar.'}</p>
    </section>
  );
}

function normalise(s: ScenarioValues) {
  return {
    items: Object.fromEntries(Object.entries(s.items ?? {}).sort(([a], [b]) => a.localeCompare(b))),
    growth: s.growth,
    behaviour: s.behaviour ?? 'moderate',
    unshared: !!s.unshared,
  };
}
