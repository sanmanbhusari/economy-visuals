import type { Dataset } from './types';
import { indiaUnion202627 } from './india/union-2026-27';

/**
 * Everything the app can show. A jurisdiction (country) contains entities
 * (central government, states, organisations); each entity has one or more
 * budget periods. Entries without a dataset show as "coming soon".
 */
export interface EntityEntry {
  slug: string;
  name: string;
  kind: 'central' | 'state' | 'organisation';
  datasets: Dataset[];
}

export interface JurisdictionEntry {
  slug: string;
  name: string;
  flag: string;
  entities: EntityEntry[];
}

export const registry: JurisdictionEntry[] = [
  {
    slug: 'in',
    name: 'India',
    flag: '🇮🇳',
    entities: [
      { slug: 'union', name: 'Union Government', kind: 'central', datasets: [indiaUnion202627] },
      { slug: 'states', name: 'State budgets', kind: 'state', datasets: [] },
      { slug: 'defence', name: 'Ministry of Defence', kind: 'organisation', datasets: [] },
    ],
  },
];

export interface DatasetRef {
  jurisdiction: JurisdictionEntry;
  entity: EntityEntry;
  dataset: Dataset;
}

export function findDataset(jurisdiction: string, entity: string, period?: string): DatasetRef | undefined {
  const j = registry.find((x) => x.slug === jurisdiction);
  const e = j?.entities.find((x) => x.slug === entity);
  if (!j || !e || e.datasets.length === 0) return undefined;
  const dataset = (period && e.datasets.find((d) => d.period === period)) || e.datasets[0];
  return { jurisdiction: j, entity: e, dataset };
}

export const defaultRef: DatasetRef = findDataset('in', 'union')!;
