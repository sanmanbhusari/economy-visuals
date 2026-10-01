import type { Dataset } from '../data/types';

export function SourcesSection({ ds }: { ds: Dataset }) {
  return (
    <section className="card" aria-labelledby="sources-title" id="sources">
      <h2 id="sources-title">Sources & notes</h2>
      <ul className="sources">
        {ds.sources.map((s) => (
          <li key={s.id}>
            <a href={s.url} target="_blank" rel="noreferrer">
              {s.title}
            </a>
            <span className="muted"> — {s.publisher}</span>
          </li>
        ))}
      </ul>
      <h3 className="panel-sub">How to read these numbers</h3>
      <ul className="notes">
        {ds.dataNotes.map((n) => (
          <li key={n}>{n}</li>
        ))}
      </ul>
    </section>
  );
}
