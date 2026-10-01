import type { BehaviouralResponse, ScenarioValues } from '../data/types';

/**
 * Scenarios live in the URL hash so they can be bookmarked and shared:
 *   #/in/union/2026-27?v=income-tax:5,defence:30&g=11&b=strong&u=1
 */
export interface Route {
  jurisdiction: string;
  entity: string;
  period?: string;
  scenario: ScenarioValues;
}

const BEHAVIOURS: BehaviouralResponse[] = ['off', 'moderate', 'strong'];

export function parseHash(hash: string): Route | null {
  const clean = hash.replace(/^#\/?/, '');
  if (!clean) return null;
  const [path, query = ''] = clean.split('?');
  const [jurisdiction, entity, period] = path.split('/').filter(Boolean);
  if (!jurisdiction || !entity) return null;

  const params = new URLSearchParams(query);
  const scenario: ScenarioValues = {};
  const v = params.get('v');
  if (v) {
    const items: Record<string, number> = {};
    for (const pair of v.split(',')) {
      const [id, num] = pair.split(':');
      const n = Number(num);
      if (id && Number.isFinite(n)) items[id] = n;
    }
    scenario.items = items;
  }
  const g = Number(params.get('g'));
  if (params.has('g') && Number.isFinite(g)) scenario.growth = g / 100;
  const b = params.get('b') as BehaviouralResponse | null;
  if (b && BEHAVIOURS.includes(b)) scenario.behaviour = b;
  if (params.get('u') === '1') scenario.unshared = true;

  return { jurisdiction, entity, period, scenario };
}

export function buildHash(route: Route): string {
  const path = ['', route.jurisdiction, route.entity, route.period].filter((x) => x !== undefined).join('/');
  const params: string[] = [];
  const { items, growth, behaviour, unshared } = route.scenario;
  const entries = Object.entries(items ?? {});
  if (entries.length) params.push(`v=${entries.map(([k, n]) => `${k}:${+n.toFixed(2)}`).join(',')}`);
  if (growth !== undefined) params.push(`g=${+(growth * 100).toFixed(2)}`);
  if (behaviour && behaviour !== 'moderate') params.push(`b=${behaviour}`);
  if (unshared) params.push('u=1');
  return `#${path}${params.length ? `?${params.join('&')}` : ''}`;
}
