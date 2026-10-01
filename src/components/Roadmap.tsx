import { registry } from '../data/registry';

export function Roadmap() {
  const upcoming = registry.flatMap((j) =>
    j.entities.filter((e) => e.datasets.length === 0).map((e) => `${j.flag} ${j.name} — ${e.name}`),
  );
  return (
    <section className="card" aria-labelledby="roadmap-title">
      <h2 id="roadmap-title">Coming next</h2>
      <ul className="roadmap">
        {upcoming.map((u) => (
          <li key={u}>{u}</li>
        ))}
        <li>🌍 More countries</li>
      </ul>
    </section>
  );
}
