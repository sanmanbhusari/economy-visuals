import { useCallback, useMemo } from 'react';
import { defaultRef, findDataset } from './data/registry';
import type { ScenarioValues } from './data/types';
import { simulate } from './model/engine';
import { buildHash, parseHash } from './model/scenario-url';
import { useHash, useInstallPrompt, useTheme } from './hooks';
import { Header } from './components/Header';
import { Summary } from './components/Summary';
import { RupeeBars } from './components/RupeeBars';
import { Presets } from './components/Presets';
import { RevenuePanel, SpendingPanel } from './components/LeverPanels';
import { SourcesSection } from './components/SourcesSection';
import { StickyBar } from './components/StickyBar';
import { Roadmap } from './components/Roadmap';

export function App() {
  const [hash, setHash] = useHash();
  const route = parseHash(hash);
  const ref = (route && findDataset(route.jurisdiction, route.entity, route.period)) || defaultRef;
  const ds = ref.dataset;
  const scenario: ScenarioValues = route && findDataset(route.jurisdiction, route.entity, route.period) ? route.scenario : {};
  const scenarioKey = JSON.stringify(scenario);

  const baseline = useMemo(() => simulate(ds), [ds]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const result = useMemo(() => simulate(ds, scenario), [ds, scenarioKey]);

  const setScenario = useCallback(
    (next: ScenarioValues) => {
      setHash(
        buildHash({ jurisdiction: ref.jurisdiction.slug, entity: ref.entity.slug, period: ds.period, scenario: next }),
      );
    },
    [ref.jurisdiction.slug, ref.entity.slug, ds.period, setHash],
  );

  const setItem = useCallback(
    (id: string, value: number | undefined) => {
      const items = { ...(scenario.items ?? {}) };
      if (value === undefined) delete items[id];
      else items[id] = value;
      setScenario({ ...scenario, items });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [scenarioKey, setScenario],
  );

  const theme = useTheme();
  const install = useInstallPrompt();
  const changed = Object.keys(scenario.items ?? {}).length > 0 || scenario.growth !== undefined || !!scenario.unshared;

  return (
    <>
      <Header refInfo={ref} theme={theme} install={install} />
      <main className="page">
        <section className="intro">
          <p className="eyebrow">
            {ref.jurisdiction.flag} {ds.jurisdiction} · {ds.entity} · {ds.stage} {ds.period}
          </p>
          <h1>Balance India's budget your way</h1>
          <p className="lede">{ds.summary}</p>
        </section>

        <Presets ds={ds} scenario={scenario} onPick={setScenario} />

        <Summary ds={ds} result={result} baseline={baseline} changed={changed} onReset={() => setScenario({})} />

        <RupeeBars ds={ds} result={result} baseline={baseline} changed={changed} />

        <div className="levers">
          <RevenuePanel ds={ds} result={result} scenario={scenario} setItem={setItem} setScenario={setScenario} />
          <SpendingPanel ds={ds} result={result} scenario={scenario} setItem={setItem} />
        </div>

        <SourcesSection ds={ds} />
        <Roadmap />
        <footer className="footer">
          <p>
            Built on official public data. Figures are the government's Budget Estimates; your choices are run through
            a simple, transparent model — illustrations, not forecasts.{' '}
            <a href="https://github.com/sanmanbhusari/economy-visuals" target="_blank" rel="noreferrer">
              Source code
            </a>
          </p>
          <p>
            Idea and creator: Sanman Bhusari · Open source under the{' '}
            <a href="https://github.com/sanmanbhusari/economy-visuals/blob/main/LICENSE" target="_blank" rel="noreferrer">
              MIT licence
            </a>
            . Please keep this credit if you reuse or adapt the project.
          </p>
        </footer>
      </main>
      <StickyBar ds={ds} result={result} changed={changed} />
    </>
  );
}
