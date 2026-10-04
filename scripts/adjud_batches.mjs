#!/usr/bin/env node
// scripts/adjud_batches.mjs — T2 全量快筛分批（契约 §9，owner: agent-4）
//
// 输入（一律只读）：
//   data/techs.json        顶层数组，全库条目
//   data/eras.json         era 顺序（order 字段）
//   data/categories.json   领域清单（用于一致性检查）
//   docs/superpowers/data/domain-groups.json
//                          契约 §1 唯一真值：5 组域划分（可 --groups 覆盖路径；禁止在代码里内联域清单）
//   data/adjud/metrics.json  可选（契约 §10）：给了就读它拿 desc_rank_pct/pf/rf，
//                            没给就自带契约 §2 的实现（不 import adjud_lib.mjs）
// 输出（本脚本 owned）：
//   data/adjud/batches/group-<A..E>.json
//   data/adjud/batches/manifest.json
//
// 用法：
//   node scripts/adjud_batches.mjs [--groups <path>] [--metrics <path>] [--out <dir>]
//   node scripts/adjud_batches.mjs --verify   # 结构性断言 + 运行时统计报告
//
// 输出是确定性的：无时间戳、键序固定、稳定排序；同输入连跑两次产物字节一致。

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (name, dflt) => {
  const i = process.argv.indexOf('--' + name);
  if (i === -1) return dflt;
  const v = process.argv[i + 1];
  return v && !v.startsWith('--') ? v : true;
};
const readJSON = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const r4 = (x) => Math.round(x * 10000) / 10000;

// ---------- 契约 §1：域分组唯一真值 = docs/superpowers/data/domain-groups.json ----------
// v4 起禁止在代码里内联域清单（v2/v3 手抄分别错在"没算重量"与"漏域"）。
// 本脚本只读该文件；manifest.groups_source 记录路径 + sha256，让批次可追溯到当时的分组。
const GROUPS_DEFAULT = 'docs/superpowers/data/domain-groups.json';
const groupsPath = path.resolve(ROOT, arg('groups', GROUPS_DEFAULT));
const groupsRaw = fs.readFileSync(groupsPath); // 原始字节：既算 sha256 也解析
const groupsSha256 = crypto.createHash('sha256').update(groupsRaw).digest('hex');
const GROUPS = JSON.parse(groupsRaw.toString('utf8'));
// 加载时只做结构校验（形状/重复），不做任何规模断言；断言全部在 --verify 运行时取数。
if (Array.isArray(GROUPS) || typeof GROUPS !== 'object' || GROUPS === null)
  throw new Error(`groups file ${groupsPath} must be an object of group -> domain list`);
{
  const seen = new Map();
  for (const [g, doms] of Object.entries(GROUPS)) {
    if (!Array.isArray(doms) || doms.some((d) => typeof d !== 'string'))
      throw new Error(`group ${g} in ${groupsPath} is not a string array`);
    for (const d of doms) {
      if (seen.has(d)) throw new Error(`domain ${d} appears in both group ${seen.get(d)} and ${g}`);
      seen.set(d, g);
    }
  }
}
const BATCH_MIN = 80;
const BATCH_MAX = 100;

// ---------- 加载数据 ----------
const techs = readJSON(path.join(ROOT, 'data/techs.json'));
const eras = readJSON(path.join(ROOT, 'data/eras.json'));
const categories = readJSON(path.join(ROOT, 'data/categories.json'));
const eraOrder = new Map(eras.map((e) => [e.id, e.order]));
const catIds = new Set(categories.map((c) => c.id));
const byId = new Map();
for (const t of techs) {
  if (byId.has(t.id)) throw new Error(`duplicate id in techs.json: ${t.id}`);
  byId.set(t.id, t);
}

// ---------- 契约 §2：MetricRow（仅当 metrics.json 缺失时本地计算） ----------
function computeRows() {
  const selfEdgeDedup = (list) => [...new Set(list)]; // 同一来源只算一次边
  const prereqRev = new Map(); // id -> Set(来源 id)
  const relRev = new Map();
  for (const t of techs) {
    for (const p of selfEdgeDedup(t.prereqs || [])) {
      if (p !== t.id && byId.has(p)) {
        if (!prereqRev.has(p)) prereqRev.set(p, new Set());
        prereqRev.get(p).add(t.id);
      }
    }
    for (const q of selfEdgeDedup(t.related || [])) {
      if (q !== t.id && byId.has(q)) {
        if (!relRev.has(q)) relRev.set(q, new Set());
        relRev.get(q).add(t.id);
      }
    }
  }
  const descendants = (start) => {
    // prereq 传递闭包（下游 = 传递地依赖 start 的条目），BFS 去环
    const seen = new Set([start]);
    const queue = [start];
    let n = 0;
    while (queue.length) {
      const cur = queue.shift();
      for (const nx of prereqRev.get(cur) || []) {
        if (!seen.has(nx)) {
          seen.add(nx);
          queue.push(nx);
          n++;
        }
      }
    }
    return n;
  };
  const domainOf = new Map();
  for (const t of techs) {
    if (!domainOf.has(t.category)) domainOf.set(t.category, []);
    domainOf.get(t.category).push(t);
  }
  const tierOf = new Map(); // category|era -> [items]
  const rows = new Map();
  for (const [cat, items] of domainOf) {
    const stat = items.map((t) => {
      const pf = (prereqRev.get(t.id) || new Set()).size;
      const rf = pf + (relRev.get(t.id) || new Set()).size;
      return { t, pf, rf, out_deg: (t.prereqs || []).length + (t.related || []).length };
    });
    const desc = new Map(stat.map((s) => [s.t.id, descendants(s.t.id)]));
    const zeroShare = stat.filter((s) => desc.get(s.t.id) === 0).length / items.length;
    // desc_rank：域内 (descendants, pf) 降序，1 = 本域第一；平手按 id 升序保证确定
    const dSorted = [...stat].sort(
      (a, b) => desc.get(b.t.id) - desc.get(a.t.id) || b.pf - a.pf || (a.t.id < b.t.id ? -1 : 1)
    );
    const descRank = new Map(dSorted.map((s, i) => [s.t.id, i + 1]));
    for (const s of stat) {
      (tierOf.get(cat + '|' + s.t.era) || tierOf.set(cat + '|' + s.t.era, []).get(cat + '|' + s.t.era)).push(s.t);
      rows.set(s.t.id, {
        id: s.t.id, name: s.t.name, nameEn: s.t.nameEn, wikiEn: s.t.wikiEn,
        importance: s.t.importance, kind: s.t.kind, category: cat, era: s.t.era,
        year: s.t.year, year_basis: s.t.year_basis, desc: s.t.desc, out_deg: s.out_deg,
        pf: s.pf, rf: s.rf,
        descendants: desc.get(s.t.id),
        desc_rank: descRank.get(s.t.id),
        desc_rank_pct: r4(descRank.get(s.t.id) / items.length),
        desc_zero_share: r4(zeroShare),
      });
    }
  }
  // tier_rank_pct：同域同代内 importance 升序位次 / 组内条数
  for (const [key, items] of tierOf) {
    const sorted = [...items].sort((a, b) => a.importance - b.importance || (a.id < b.id ? -1 : 1));
    sorted.forEach((t, i) => {
      rows.get(t.id).tier_rank_pct = r4((i + 1) / items.length);
    });
  }
  for (const [id, row] of rows) {
    const down = [...(prereqRev.get(id) || [])]
      .map((d) => byId.get(d))
      .sort((a, b) => a.importance - b.importance || (a.id < b.id ? -1 : 1))
      .slice(0, 5)
      .map((t) => ({ id: t.id, name: t.name, importance: t.importance }));
    row.direct_downstream = down;
  }
  return rows;
}

const metricsPath = path.resolve(ROOT, arg('metrics', 'data/adjud/metrics.json'));
let metricOf; // id -> {desc_rank_pct, pf, rf}
let metricsSource;
if (fs.existsSync(metricsPath)) {
  const m = readJSON(metricsPath);
  const rowsArr = Array.isArray(m) ? m : m.rows;
  if (!Array.isArray(rowsArr)) throw new Error(`metrics file ${metricsPath} has no rows array (contract §10)`);
  metricOf = new Map(rowsArr.map((r) => [r.id, r]));
  metricsSource = path.relative(ROOT, metricsPath).replace(/\\/g, '/') + ' (contract §10 shared metrics)';
} else {
  metricOf = computeRows();
  metricsSource = 'inline contract §2 implementation (metrics.json not found)';
}
const getMetric = (id, field) => {
  const row = metricOf.get(id);
  if (!row || row[field] === undefined) throw new Error(`metric ${field} missing for id ${id}`);
  return row[field];
};

// ---------- 分批：先按 域×代 分组，再装箱；同域同代不跨批打散 ----------
// 唯一例外：单块 > BATCH_MAX 时无法不打散，强制切成尽量均匀的 ≤BATCH_MAX 片并如实记入 manifest.forced_splits。
function packGroup(group, domainList) {
  const items = techs.filter((t) => domainList.includes(t.category));
  const chunks = new Map(); // cat|era -> items
  for (const t of items) {
    const k = t.category + '|' + t.era;
    if (!chunks.has(k)) chunks.set(k, []);
    chunks.get(k).push(t);
  }
  // 装箱顺序：按分组里领域列出顺序，再按 era 时间序 —— 确定性
  const ordered = [];
  for (const dom of domainList) {
    const domChunks = [...chunks.entries()]
      .filter(([k]) => k.split('|')[0] === dom)
      .sort((a, b) => (eraOrder.get(a[0].split('|')[1]) ?? 99) - (eraOrder.get(b[0].split('|')[1]) ?? 99) || (a[0] < b[0] ? -1 : 1));
    for (const [k, v] of domChunks) {
      v.sort((a, b) => a.importance - b.importance || (a.id < b.id ? -1 : 1));
      ordered.push({ key: k, items: v });
    }
  }
  const forcedSplits = [];
  const units = []; // 装箱单元（chunk 或超限 chunk 的强制切片）
  for (const { key, items: arr } of ordered) {
    if (arr.length <= BATCH_MAX) {
      units.push({ key, items: arr, splitOf: null });
    } else {
      const parts = Math.ceil(arr.length / BATCH_MAX);
      const base = Math.floor(arr.length / parts);
      const rem = arr.length % parts; // 前 rem 片各 base+1 条
      const names = [];
      let off = 0;
      for (let i = 0; i < parts; i++) {
        const size = base + (i < rem ? 1 : 0);
        units.push({ key: key + `#s${i}`, items: arr.slice(off, off + size), splitOf: key });
        names.push(null); // 批名装箱后回填
        off += size;
      }
      forcedSplits.push({ key, size: arr.length, parts });
    }
  }
  // 装箱：best-fit-decreasing + 搬移/交换修复，目标每批 80–100，chunk 原子不可切
  const binPack = (k) => {
    const sorted = units.map((u, i) => ({ u, i })).sort((a, b) => b.u.items.length - a.u.items.length || a.i - b.i);
    const bins = Array.from({ length: k }, () => []); // 每批 = unit 列表
    for (const { u } of sorted) {
      let bi = -1;
      let best = Infinity;
      for (let i = 0; i < bins.length; i++) {
        const s = bins[i].reduce((x, y) => x + y.items.length, 0);
        const slack = BATCH_MAX - (s + u.items.length);
        if (slack >= 0 && slack < best) { best = slack; bi = i; }
      }
      if (bi === -1) return null; // 放不下，需要更多批
      bins[bi].push(u);
    }
    return bins;
  };
  const sizeOf = (b) => b.reduce((x, y) => x + y.items.length, 0);
  const repair = (bins) => {
    for (let iter = 0; iter < 2000; iter++) {
      const sizes = bins.map(sizeOf);
      const deficits = sizes.map((s, i) => [s, i]).filter(([s]) => s < BATCH_MIN).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
      if (!deficits.length) return bins;
      let progressed = false;
      for (const [ds, di] of deficits) {
        for (const [os, oi] of sizes.map((s, i) => [s, i]).sort((a, b) => b[0] - a[0] || a[1] - b[1])) {
          if (oi === di || os <= BATCH_MIN) continue;
          // 1) 整块搬移：donor 保持 ≥80
          const mv = [...bins[oi]].sort((a, b) => b.items.length - a.items.length || (a.key < b.key ? -1 : 1))
            .find((u) => ds + u.items.length <= BATCH_MAX && os - u.items.length >= BATCH_MIN);
          if (mv) { bins[oi].splice(bins[oi].indexOf(mv), 1); bins[di].push(mv); progressed = true; break; }
          // 2) 双向交换
          for (const u of bins[oi]) {
            for (const v of bins[di]) {
              const nO = os - u.items.length + v.items.length;
              const nD = ds - v.items.length + u.items.length;
              if (nO >= BATCH_MIN && nO <= BATCH_MAX && nD >= BATCH_MIN && nD <= BATCH_MAX) {
                bins[oi].splice(bins[oi].indexOf(u), 1, v);
                bins[di].splice(bins[di].indexOf(v), 1, u);
                progressed = true; break;
              }
            }
            if (progressed) break;
          }
          if (progressed) break;
        }
        if (progressed) break;
      }
      if (!progressed) return bins;
    }
    return bins;
  };
  let bestBins = null;
  let bestScore = Infinity;
  const minK = Math.ceil(items.length / BATCH_MAX);
  const maxK = Math.min(Math.floor(items.length / BATCH_MIN), minK + 4);
  for (let k = minK; k <= maxK; k++) {
    const bins = binPack(k);
    if (!bins) continue;
    const fixed = repair(bins).filter((b) => b.length > 0);
    const deficits = fixed.filter((b) => sizeOf(b) < BATCH_MIN);
    const shortfall = deficits.reduce((s, b) => s + (BATCH_MIN - sizeOf(b)), 0);
    const score = deficits.length * 10000 + shortfall * 10 + fixed.length;
    if (score < bestScore) { bestScore = score; bestBins = fixed; }
    if (score === fixed.length) break; // 无缺额批
  }
  const batches = bestBins.map((b) => {
    const arr = [];
    for (const u of b) arr.push(...u.items);
    arr.sort((a, x) => (eraOrder.get(a.era) ?? 99) - (eraOrder.get(x.era) ?? 99) || a.importance - x.importance || (a.id < x.id ? -1 : 1));
    return arr;
  });
  // 批序确定性：按批内首条 (era, importance, id) 排序后编号
  batches.sort((a, b) =>
    (eraOrder.get(a[0].era) ?? 99) - (eraOrder.get(b[0].era) ?? 99) ||
    a[0].importance - b[0].importance || (a[0].id < b[0].id ? -1 : a[0].id > b[0].id ? 1 : 0));
  const out = batches.map((b, i) => ({
    batch: `${group}-${i + 1}`,
    ids: b.map((t) => t.id),
    summary: b.map((t) => ({
          id: t.id,
          name: t.name,
          importance: t.importance,
          category: t.category,
          era: t.era,
          desc_rank_pct: getMetric(t.id, 'desc_rank_pct'),
          pf: getMetric(t.id, 'pf'),
          rf: getMetric(t.id, 'rf'),
        })),
      }));
  return { items, out, forcedSplits };
}

const built = {};
for (const [g, doms] of Object.entries(GROUPS)) built[g] = packGroup(g, doms);

// ---------- 落盘 ----------
const outDir = path.resolve(ROOT, arg('out', 'data/adjud/batches'));
fs.mkdirSync(outDir, { recursive: true });
const writeStable = (p, obj) => fs.writeFileSync(p, JSON.stringify(obj, null, 2) + '\n', 'utf8');

for (const [g, doms] of Object.entries(GROUPS)) {
  const { items, out } = built[g];
  writeStable(path.join(outDir, `group-${g}.json`), {
    group: g,
    domains: doms,
    total: items.length,
    batches: out,
  });
}

const allIds = techs.map((t) => t.id);
const batchIds = Object.keys(GROUPS).flatMap((g) => built[g].out.flatMap((b) => b.ids));
const dupSet = new Set();
const dupIds = [];
for (const id of batchIds) { if (dupSet.has(id)) dupIds.push(id); dupSet.add(id); }
const unionSize = new Set(batchIds).size;
const perGroup = {};
for (const g of Object.keys(GROUPS)) {
  const bs = built[g].out;
  perGroup[g] = {
    domains: GROUPS[g],
    total: built[g].items.length,
    batches: bs.length,
    avg_batch_size: r4(built[g].items.length / bs.length),
    min_batch: Math.min(...bs.map((b) => b.ids.length)),
    max_batch: Math.max(...bs.map((b) => b.ids.length)),
    batch_sizes: bs.map((b) => b.ids.length),
  };
}
const techCatsNotInJSON = [...new Set(techs.map((t) => t.category))].filter((c) => !catIds.has(c));
const groupDomainsNotInJSON = Object.values(GROUPS).flat().filter((d) => !catIds.has(d));
const gsEntries = Object.entries(perGroup).map(([g, v]) => [g, v.total]);
const maxSize = Math.max(...gsEntries.map(([, n]) => n));
const minSize = Math.min(...gsEntries.map(([, n]) => n));
const maxGroup = gsEntries.filter(([, n]) => n === maxSize).map(([g]) => g).join(',');
const minGroup = gsEntries.filter(([, n]) => n === minSize).map(([g]) => g).join(',');
writeStable(path.join(outDir, 'manifest.json'), {
  contract: 'docs/superpowers/specs/2026-09-27-adjud-tooling-contract.md §1/§9',
  design: 'docs/superpowers/specs/2026-09-27-importance-kind-review-design.md §3.3',
  owner: 'agent-4 (scripts/adjud_batches.mjs)',
  kind: 'candidate_work_queue',
  status_note: '本清单是 T2 全量快筛的候选工作队列，不是“已复查”。条目未经任何裁决。',
  groups_source: {
    path: path.relative(ROOT, groupsPath).replace(/\\/g, '/'),
    sha256: groupsSha256,
    note: '契约 §1 唯一真值；批次产物由该分组文件生成，凭 sha256 可追溯到当时的分组内容',
  },
  t2_gate: {
    condition: '启动条件（spec §3.3）：校准批 100 条中用户“改判+移出”推翻率 > 20% 才启动全量快筛',
    if_not_met: '若 ≤ 20%：停在第二段，只裁决提名池（约 400–500 条），本清单不消费并显式标注全量未覆盖',
    default: '未启动',
  },
  metrics_source: metricsSource,
  batch_rule: `80–100 条/批，批内按 (era, importance) 排序，同域同代不跨批打散（BATCH_MIN=${BATCH_MIN}, BATCH_MAX=${BATCH_MAX}）`,
  forced_splits: Object.entries(built).flatMap(([g, b]) =>
    b.forcedSplits.map((s) => ({ group: g, domain_era: s.key, chunk_size: s.size, split_into_parts: s.parts, reason: '单域单时代块 >100 条，为满足 80–100/批不得不切，未做均衡性改动' }))
  ),
  groups: perGroup,
  totals: {
    techs_json_total: techs.length,
    batched_total: batchIds.length,
    unique_batched_ids: unionSize,
    duplicate_ids: dupIds.length,
    batches_total: Object.values(perGroup).reduce((s, g) => s + g.batches, 0),
    group_sizes: Object.fromEntries(gsEntries),
    group_size_range: maxSize - minSize,
    group_size_range_detail: `最大组 ${maxGroup}=${maxSize}, 最小组 ${minGroup}=${minSize}（运行时计算，非断言；契约 §1 改写版不含均衡规模承诺，极差如实报告）`,
  },
  consistency: {
    group_domains_not_in_categories_json: groupDomainsNotInJSON,
    techs_categories_not_in_categories_json: techCatsNotInJSON,
  },
});

// ---------- --verify 报告 ----------
// 断言（PASS/FAIL）只保留四条结构性不变量，且全部与运行时值比较，不写死任何规模数字：
//   1) 各批 id 并集 == data/techs.json 全库条数（运行时取）
//   2) 任意两组交集为空（两两不相交）
//   3) 无重复 id
//   4) techs.json 中出现的每个 domain 恰好属于一组（v3 漏域正是缺这条）
// 组大小、批数、极差等一律只打印，不断言。
if (arg('verify', false) === true) {
  const V = (label, ok, detail) => console.log(`${ok ? 'PASS' : 'FAIL'} ${label}${detail ? ': ' + detail : ''}`);
  console.log('=== 1. 覆盖断言（四条结构性不变量，全部运行时取数） ===');
  V('union(各组) == techs 总数（运行时）', unionSize === techs.length, `union=${unionSize}, techs=${techs.length}`);
  V('无重复 id', dupIds.length === 0, `重复=${dupIds.length}${dupIds.length ? ' -> ' + dupIds.slice(0, 10).join(',') : ''}`);
  let pairBad = [];
  const gs = Object.keys(GROUPS);
  for (let i = 0; i < gs.length; i++)
    for (let j = i + 1; j < gs.length; j++) {
      const a = new Set(built[gs[i]].out.flatMap((b) => b.ids));
      const inter = built[gs[j]].out.flatMap((b) => b.ids).filter((x) => a.has(x));
      if (inter.length) pairBad.push(`${gs[i]}∩${gs[j]}=${inter.length}`);
    }
  V('任意两组交集为空', pairBad.length === 0, pairBad.join(' ') || `${gs.length * (gs.length - 1) / 2} 对交集全部=0`);
  const domainMembership = new Map(); // domain -> Set(group)，运行时从分组文件取
  for (const [g, doms] of Object.entries(GROUPS)) for (const d of doms) {
    if (!domainMembership.has(d)) domainMembership.set(d, new Set());
    domainMembership.get(d).add(g);
  }
  const techDomains = [...new Set(techs.map((t) => t.category))].sort(); // 全库实际 domain（运行时）
  const domBad = [];
  for (const d of techDomains) {
    const m = domainMembership.get(d);
    if (!m || m.size === 0) domBad.push(`${d}: 不属于任何组`);
    else if (m.size > 1) domBad.push(`${d}: 属于 ${[...m].join(',')}`);
  }
  const domNotInTechs = [...domainMembership.keys()].filter((d) => !new Set(techDomains).has(d));
  V(`每个 domain 恰好属于一组（techs.json 实有 ${techDomains.length} 域，运行时）`,
    domBad.length === 0,
    domBad.join('; ') || `${techDomains.length} 域 × ${gs.length} 组逐域核验，均恰属一组${domNotInTechs.length ? `（分组含全库无条目的域: ${domNotInTechs.join(',')}）` : ''}`);
  console.log(`  分组文件: ${path.relative(ROOT, groupsPath).replace(/\\/g, '/')} sha256=${groupsSha256}`);
  console.log('  各组真实条数(运行时):', Object.entries(perGroup).map(([g, v]) => `${g}=${v.total}`).join(' '));

  console.log('=== 2. 组大小 / 批数 / 极差（运行时打印，非断言） ===');
  for (const [g, v] of Object.entries(perGroup))
    console.log(`  group-${g}: total=${v.total}, domains=${v.domains.length}, batches=${v.batches}, avg=${v.avg_batch_size}, sizes=${JSON.stringify(v.batch_sizes)}`);
  console.log(`  极差=${maxSize - minSize}（最大组 ${maxGroup}=${maxSize}, 最小组 ${minGroup}=${minSize}；契约 §1 v4 由 ${path.basename(groupsPath)} 求解，均衡性由生成端自检，此处只报观测值）`);

  console.log('=== 3. 一致性（运行时统计，非断言） ===');
  console.log(`  分组领域 ${Object.values(GROUPS).flat().length} 个；缺失于 categories.json: ${groupDomainsNotInJSON.length ? groupDomainsNotInJSON.join(',') : '无'}`);
  const covered = new Set(Object.values(GROUPS).flat());
  const catsNotCovered = [...catIds].filter((c) => !covered.has(c));
  console.log(`  categories.json 共 ${catIds.size} 个领域，未被分组覆盖: ${catsNotCovered.length ? catsNotCovered.join(',') : '无'}`);
  console.log(`  techs.json 中不在 categories.json 的 category: ${techCatsNotInJSON.length ? techCatsNotInJSON.join(',') : '无'}`);

  console.log('=== 4. 批内排序 & 同域同代不跨批（运行时统计，非断言） ===');
  const chunkToBatches = new Map();
  for (const g of gs)
    for (const b of built[g].out)
      for (const id of b.ids) {
        const t = byId.get(id);
        const k = t.category + '|' + t.era;
        if (!chunkToBatches.has(k)) chunkToBatches.set(k, new Set());
        chunkToBatches.get(k).add(b.batch);
      }
  const allowedSplits = new Set(Object.values(built).flatMap((b) => b.forcedSplits.map((s) => s.key)));
  const badSplits = [...chunkToBatches.entries()].filter(([k, bs]) => bs.size > 1 && !allowedSplits.has(k));
  console.log(`  跨批打散的同域同代块（除 >${BATCH_MAX} 强制切片外）: ${badSplits.length ? '违规 ' + badSplits.map(([k, bs]) => `${k}->${[...bs]}`).join(' ') : `0（强制切片仅限: ${[...allowedSplits].join(', ') || '无'}）`}`);
  const allBatches = gs.flatMap((g) => built[g].out);
  const samples = [allBatches[0], allBatches[Math.floor(allBatches.length / 2)], allBatches[allBatches.length - 1]];
  for (const b of samples) {
    let ok = true;
    for (let i = 1; i < b.summary.length; i++) {
      const p = b.summary[i - 1], c = b.summary[i];
      if ((eraOrder.get(p.era) ?? 99) > (eraOrder.get(c.era) ?? 99) ||
        (p.era === c.era && p.importance > c.importance)) ok = false;
    }
    console.log(`  抽查批 ${b.batch}: (era,importance) 有序=${ok ? '是' : '否'}, ${b.ids.length} 条`);
  }

  console.log('=== 5. 产物文件 ===');
  console.log('  产物:', fs.readdirSync(outDir).join(', '));
}
console.log(`done. metrics_source=${metricsSource}; out=${path.relative(ROOT, outDir)}`);
