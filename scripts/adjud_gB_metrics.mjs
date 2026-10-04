// gB shard 指标快照生成器（本 shard 只读产出；A 的 scripts/adjud_lib.mjs 落地后以它为准替换）
// 契约: docs/superpowers/specs/2026-09-27-adjudication-contract.md §3
import { readFileSync, writeFileSync } from 'node:fs';

const GROUPS = {
  gA: ['math_pure', 'earth_space', 'chemistry', 'logic_foundations'],
  gB: ['algorithms_cs', 'computing_systems', 'info_media', 'physics', 'materials'],
  gC: ['life_medicine', 'education_knowledge', 'economy', 'culture_media'],
  gD: ['agriculture_food', 'transport', 'construction', 'military'],
  gE: ['governance', 'manufacturing', 'daily_life', 'energy_power', 'space_exploration'],
};
const SHARD = process.argv[2] || 'gB';
const cats = new Set(GROUPS[SHARD]);

const A = JSON.parse(readFileSync(new URL('../data/techs.json', import.meta.url), 'utf8'));
const byId = new Map(A.map(t => [t.id, t]));

const pf = {}, rf = {};
for (const t of A) {
  for (const p of (t.prereqs || [])) { pf[p] = (pf[p] || 0) + 1; rf[p] = (rf[p] || 0) + 1; }
  for (const r of (t.related || [])) { rf[r] = (rf[r] || 0) + 1; }
}
const children = {};
for (const t of A) for (const p of (t.prereqs || [])) (children[p] = children[p] || new Set()).add(t.id);
const memo = new Map();
function closure(id) {
  if (memo.has(id)) return memo.get(id);
  const s = new Set(); const st = [...(children[id] || [])];
  while (st.length) { const c = st.pop(); if (s.has(c)) continue; s.add(c); for (const d of (children[c] || [])) if (!s.has(d)) st.push(d); }
  memo.set(id, s); return s;
}
const down = new Map(A.map(t => [t.id, closure(t.id).size]));

// 域内相对量：按 category 分组算百分位与零下游占比
const domains = {};
for (const t of A) {
  if (!cats.has(t.category)) continue;
  (domains[t.category] = domains[t.category] || []).push(t);
}
const rel = {};
const zeroShare = {};
for (const [cat, arr] of Object.entries(domains)) {
  const vals = arr.map(t => down.get(t.id));
  const sorted = [...new Set(vals)].sort((x, y) => x - y);
  const n = arr.length;
  const zero = vals.filter(v => v === 0).length;
  zeroShare[cat] = +(zero / n).toFixed(4);
  for (const t of arr) {
    const v = down.get(t.id);
    const rank = sorted.indexOf(v) + 1; // 并列取最小名次
    rel[t.id] = { domainRankPct: Math.round((rank - 1) / n * 100), domainDownstreams: v };
  }
}
// 域内同档分位（通道判据用）
const tierRank = {};
for (const [cat, arr] of Object.entries(domains)) {
  for (const tier of [1, 2, 3, 4, 5]) {
    const sub = arr.filter(t => t.importance === tier);
    if (!sub.length) continue;
    const vals = sub.map(t => down.get(t.id)).sort((x, y) => x - y);
    const q = p => vals[Math.min(vals.length - 1, Math.floor(p * vals.length))];
    tierRank[cat + '|P' + tier] = { p20: q(0.2), p75: q(0.75), n: sub.length };
  }
}
const domMed = {};
for (const [cat, arr] of Object.entries(domains)) {
  const vals = arr.map(t => down.get(t.id)).sort((x, y) => x - y);
  domMed[cat] = vals[Math.floor(vals.length / 2)];
}

const items = [];
for (const t of A) {
  if (!cats.has(t.category)) continue;
  const d = down.get(t.id), r = rel[t.id];
  const tr = tierRank[t.category + '|P' + t.importance] || {};
  const channel = [];
  const pfN = pf[t.id] || 0, rfN = rf[t.id] || 0;
  if (t.importance === 1 && (pfN === 0 || (tr.p20 !== undefined && d <= tr.p20))) channel.push('基石存疑');
  // 域内 P2 的 20 分位常被"零下游"并列吃满（15/22 域下游中位数 = 0），此时 <=p20 恒真、无判别力，
  // 故中位数 > 0 时才用相对分位，否则退回"零接线"绝对条件。
  if (t.importance === 2 && (
    ((domMed[t.category] ?? 0) > 0 && tr.p20 !== undefined && d <= tr.p20 && d < domMed[t.category]) ||
    ((domMed[t.category] ?? 0) === 0 && pfN === 0 && d === 0)
  )) channel.push('支柱存疑');
  if (t.importance >= 3 && (pfN >= 6 || (tr.p75 !== undefined && d >= tr.p75 && d > 50))) channel.push('疑被低估');
  if (t.kind === '原理' && rfN === 0) channel.push('原理零引用');
  if ((t.kind === '媒介' || t.kind === '制度') && rfN === 0 && (t.prereqs || []).length === 0) channel.push('孤岛媒介制度');
  if (t.importance <= 2 && !t.wikiEn) channel.push('高档无溯源');
  items.push({
    id: t.id, name: t.name, nameEn: t.nameEn, wikiEn: t.wikiEn || '',
    tier: t.importance, kind: t.kind, category: t.category, era: t.era,
    year: t.year, yearBasis: t.year_basis, yearNote: t.year_note || '', desc: t.desc,
    pf: pfN, rf: rfN,
    domainRankPct: r.domainRankPct, domainDownstreams: d, absDownstreams: d,
    topDownstream: [...(children[t.id] || [])].slice(0, 5),
    zeroDownstreamShare: zeroShare[t.category],
    channel, doubt: '',
  });
}

const out = { shard: SHARD, generatedFrom: 'data/techs.json', domains: {}, items };
for (const [cat, arr] of Object.entries(domains)) {
  out.domains[cat] = { n: arr.length, zeroShare: zeroShare[cat], med: domMed[cat] };
}
const path = new URL(`../data/adjud-metrics.${SHARD}.json`, import.meta.url);
writeFileSync(path, JSON.stringify(out, null, 1));
const tally = {};
for (const it of items) for (const c of it.channel) tally[c] = (tally[c] || 0) + 1;
console.log('shard', SHARD, 'items', items.length, '→ data/adjud-metrics.' + SHARD + '.json');
console.log('每域', Object.entries(out.domains).map(([k, v]) => k + ':' + v.n + '(零下游' + (v.zeroShare * 100).toFixed(0) + '%)').join(' '));
console.log('通道命中', JSON.stringify(tally));
console.log('有通道命中的条目数', items.filter(i => i.channel.length).length);
