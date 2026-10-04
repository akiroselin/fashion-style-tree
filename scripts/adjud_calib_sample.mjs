// adjud_calib_sample.mjs — 校准批分层抽样（契约 §6；本文件与
// data/adjud/calib-sample.json 的 owner = agent-1）
//
// 契约：docs/superpowers/specs/2026-09-27-adjud-tooling-contract.md §6
// 设计：docs/superpowers/specs/2026-09-27-importance-kind-review-design.md §3.1
//
// 规则（严格按契约，不放宽）：
// - 100 条 / 2 批 × 50；每域 >= 3 条，剩余名额按域大小比例（largest remainder）分配
// - 每域覆盖三条：>=1 条 importance<=2、>=1 条 importance>=4、>=1 条 kind ∈ {原理, 媒介}
// - 域内凑不满（池为空或池小于需求）-> 该域能取的全取，缺口如实写进
//   by_domain[域].reason；**绝不通过降低判据（比如把 kind 池换成 工艺 池）蒙过去**
// - 域总数小于下限时 forced_all:true 全量纳入
// - 随机种子 20260927；shuffle 是带种子的确定性实现（xmur3 + mulberry32），无 Math.random
// - 批次划分用 first-fit-decreasing 让同域条目尽量落在同一批（判据一致）
//
// ts 字段取 data/techs.json 的 mtime（数据快照时刻），因此同一份数据连跑两次
// 整个文件字节级一致（契约 §6 有 ts，但验证又要求 sha256 可复现）。
//
// 用法：
//   node scripts/adjud_calib_sample.mjs                 # 抽样并写盘 + 跑覆盖断言
//   node scripts/adjud_calib_sample.mjs --verify        # 只读回文件重跑断言
//   node scripts/adjud_calib_sample.mjs --selftest      # 合成语料的边界用例

import { createHash } from 'node:crypto';
import { readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const SEED = 20260927;
export const TOTAL = 100;
export const FLOOR_PER_DOMAIN = 3;
export const BATCH_SIZE = 50;
export const OUT_DEFAULT = new URL('../data/adjud/calib-sample.json', import.meta.url);
const TECHS = new URL('../data/techs.json', import.meta.url);

/** xmur3：字符串 -> 32bit 种子（与 mulberry32 配套，保证跨平台确定性）。 */
export function xmur3(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return h >>> 0;
  };
}

/** mulberry32：32bit PRNG。 */
export function mulberry32(a) {
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 按 key 派生独立随机流（同一 seed + 同一 key 永远同一序列，与调用顺序无关）。 */
export function rngFor(seed, key) {
  const hash = xmur3([seed, key].join('::'));
  return mulberry32(hash());
}

/** 带种子的 Fisher-Yates（返回新数组，不改入参）。 */
export function shuffle(arr, rng) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = a[i];
    a[i] = a[j];
    a[j] = tmp;
  }
  return a;
}

const isLow = (t) => t.importance <= 2;
const isHigh = (t) => t.importance >= 4;
const isMediaPrinciple = (t) => t.kind === '原理' || t.kind === '媒介';

/** 三条覆盖要求（契约 §6），名字即 reason 里引用的名字。 */
export const COVERAGE = [
  { key: 'importance<=2', label: 'importance≤2', test: isLow },
  { key: 'importance>=4', label: 'importance≥4', test: isHigh },
  { key: 'kind∈{原理,媒介}', label: 'kind∈{原理,媒介}', test: isMediaPrinciple },
];

function groupByDomain(items) {
  const m = new Map();
  for (const t of items) {
    if (!m.has(t.category)) m.set(t.category, []);
    m.get(t.category).push(t);
  }
  for (const v of m.values()) v.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return m;
}


/**
 * 域配额：每域下限 FLOOR_PER_DOMAIN 条，剩余名额按域大小比例（largest remainder，
 * 破平按域名升序）；域条数 < 配额则截为全量，空出的名额再分一轮。
 * @param {Map<string, number>} sizes category -> 条数
 */
export function allocateQuota(sizes, total) {
  const cats = [...sizes.keys()].sort();
  const grand = cats.reduce((s, c) => s + sizes.get(c), 0);
  if (cats.length * FLOOR_PER_DOMAIN > total) {
    throw new Error('每域下限 ' + FLOOR_PER_DOMAIN + ' × ' + cats.length + ' 域 > 抽样总数 ' + total);
  }
  const quota = new Map(cats.map((c) => [c, Math.min(FLOOR_PER_DOMAIN, sizes.get(c))]));
  const used = () => [...quota.values()].reduce((s, v) => s + v, 0);
  let seats = total - used();
  while (seats > 0) {
    const room = cats.filter((c) => quota.get(c) < sizes.get(c));
    if (!room.length) break;
    const ranked = room.map((c) => {
      const raw = (seats * sizes.get(c)) / grand;
      return { c, whole: Math.floor(raw), frac: raw - Math.floor(raw) };
    });
    let handed = 0;
    for (const r of ranked) {
      const take = Math.min(r.whole, sizes.get(r.c) - quota.get(r.c));
      quota.set(r.c, quota.get(r.c) + take);
      handed += take;
    }
    const byFrac = ranked
      .filter((r) => quota.get(r.c) < sizes.get(r.c))
      .sort((a, b) => b.frac - a.frac || (a.c < b.c ? -1 : 1));
    for (const r of byFrac) {
      if (handed >= seats) break;
      quota.set(r.c, quota.get(r.c) + 1);
      handed++;
    }
    if (!handed) break;
    seats = total - used();
  }
  return quota;
}

/**
 * 单域抽样：先满足三条覆盖（最稀的池优先），再按配额随机补足。
 * 覆盖池为空时**不放宽判据**，只在 reason 里如实记缺口。
 * @returns {{ids: string[], quota: number, size: number, forced_all: boolean,
 *            reason: string|null, gaps: string[], coverage: Record<string, number>}}
 */
export function pickDomain(cat, items, quota, seed) {
  const rng = rngFor(seed, cat);
  const pools = new Map();
  for (const b of COVERAGE) pools.set(b.key, shuffle(items.filter(b.test), rng));
  const all = shuffle(items, rng);
  const picked = [];
  const has = (t) => picked.some((p) => p.id === t.id);
  const gaps = [];
  const notes = [];
  const order = COVERAGE.slice().sort((a, b) =>
    pools.get(a.key).length - pools.get(b.key).length || (a.key < b.key ? -1 : 1));
  for (const b of order) {
    const pool = pools.get(b.key);
    if (!pool.length) {
      gaps.push(b.key);
      notes.push('无法覆盖「' + b.label + '」(' + b.key + ')：本域 0 条满足，未放宽判据');
      continue;
    }
    if (pool.length < FLOOR_PER_DOMAIN) {
      notes.push('「' + b.label + '」池仅 ' + pool.length + ' 条（< 每域下限 ' + FLOOR_PER_DOMAIN + '），该域在此维度上无余量可抽');
    }
    if (picked.length >= quota) {
      // 配额已满：只有当某个已选条目“不是任何覆盖项的唯一代表”时才换入本池条目，
      // 换不动就记缺口——不靠放宽判据（例如换一个池）来凑数。
      const cand = pool.find((t) => !has(t));
      const swapAt = cand === undefined ? -1 : picked.findIndex((p, i) =>
        COVERAGE.every((b) => !b.test(p) || picked.some((q, j) => j !== i && b.test(q))));
      if (cand !== undefined && swapAt >= 0) picked[swapAt] = cand;
      else if (cand === undefined) {
        /* 池里的条目都已在样本中：该覆盖由同一条目兼任，不算缺口 */
      } else {
        gaps.push(b.key);
        notes.push('「' + b.label + '」(' + b.key + ') 未能单独取到一条：配额 ' + quota + ' 条已被其他覆盖项占满');
      }
      continue;
    }
    const cand = pool.find((t) => !has(t));
    if (cand) picked.push(cand);
  }
  for (const t of all) {
    if (picked.length >= quota) break;
    if (!has(t)) picked.push(t);
  }
  const forced_all = items.length <= quota;
  const coverage = {};
  for (const b of COVERAGE) coverage[b.key] = picked.filter(b.test).length;
  const ids = picked.map((t) => t.id).sort((a, b) => (a < b ? -1 : 1));
  let reason = null;
  if (forced_all) {
    notes.unshift('本域共 ' + items.length + ' 条，不超过配额 ' + quota + ' 条，全量纳入');
  }
  if (notes.length) reason = notes.join('；');
  return { ids, quota: ids.length, size: items.length, forced_all, reason, gaps, coverage };
}

/** 全域抽样：返回 { by_domain, batches, total }（纯函数，不碰文件系统）。 */
export function sample(items, opts = {}) {
  const seed = opts.seed === undefined ? SEED : opts.seed;
  const total = opts.total === undefined ? TOTAL : opts.total;
  const domains = groupByDomain(items);
  const sizes = new Map([...domains].map(([c, v]) => [c, v.length]));
  const quota = allocateQuota(sizes, total);
  const by_domain = {};
  const picks = new Map();
  for (const cat of [...domains.keys()].sort()) {
    const items2 = domains.get(cat);
    const r = pickDomain(cat, items2, quota.get(cat), seed);
    if (items2.filter((t) => t.importance === 1).length <= 4) {
      r.noteExtra = '本域 P1 仅 ' + items2.filter((t) => t.importance === 1).length + ' 条，顶层档位样本受限';
    }
    picks.set(cat, r);
    const entry = { n: r.ids.length };
    if (r.forced_all) entry.forced_all = true;
    const reason = [r.noteExtra, r.reason].filter(Boolean).join('；');
    if (reason) entry.reason = reason;
    by_domain[cat] = entry;
  }
  const batches = makeBatches(picks, Math.ceil(total / 2));
  const pickedTotal = [...picks.values()].reduce((s, r) => s + r.ids.length, 0);
  return { by_domain, batches, total: pickedTotal, detail: picks };
}

/**
 * 批次划分：first-fit-decreasing（按域样本量降序、域名升序），
 * 目标是同域条目尽量落在同一批；两批都放不下才拆分。
 * @param {Map<string, {ids: string[]}>} picks
 */
export function makeBatches(picks, cap) {
  const order = [...picks.entries()]
    .map(([c, r]) => ({ c, ids: r.ids }))
    .sort((a, b) => b.ids.length - a.ids.length || (a.c < b.c ? -1 : 1));
  const bins = [[], []];
  for (const { ids } of order) {
    const fit = [0, 1].filter((i) => bins[i].length + ids.length <= cap);
    if (fit.length === 2) {
      // 两批都装得下：装进当前较满的一批（best-fit，尽量把一批填满、少打散域）
      bins[bins[0].length >= bins[1].length ? 0 : 1].push(...ids);
    } else if (fit.length === 1) {
      bins[fit[0]].push(...ids);
    } else {
      for (const id of ids) bins[bins[0].length <= bins[1].length ? 0 : 1].push(id);
    }
  }
  return bins.map((b) => b.sort((a, z) => (a < z ? -1 : 1)));
}

let failures = 0;
function check(label, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failures++;
  console.log((ok ? 'PASS' : 'FAIL') + ' | ' + label + ' | actual=' + JSON.stringify(actual) +
    ' expected=' + JSON.stringify(expected));
}
function note(label, value) {
  console.log('NOTE | ' + label + ' | ' + JSON.stringify(value));
}

/** 从 batches 反推“每域被抽到的 id 集合”（不依赖文件里存 ids）。 */
export function idsByDomain(obj, items) {
  const byId = new Map(items.map((t) => [t.id, t]));
  const m = new Map();
  for (const ids of obj.batches) {
    for (const id of ids) {
      const t = byId.get(id);
      if (!t) continue;
      if (!m.has(t.category)) m.set(t.category, new Set());
      m.get(t.category).add(id);
    }
  }
  return m;
}

/** 覆盖断言：返回“违例清单”。缺口只有在语料本身无池时才允许，且必须写进 reason。 */
export function coverageViolations(obj, items) {
  const byId = new Map(items.map((t) => [t.id, t]));
  const picked = idsByDomain(obj, items);
  const pools = new Map();
  for (const t of items) {
    if (!pools.has(t.category)) pools.set(t.category, []);
    pools.get(t.category).push(t);
  }
  const bad = [];
  for (const [cat, entry] of Object.entries(obj.by_domain)) {
    const ids = picked.get(cat) || new Set();
    for (const b of COVERAGE) {
      const got = [...ids].filter((i) => byId.has(i) && b.test(byId.get(i))).length;
      const pool = (pools.get(cat) || []).filter(b.test).length;
      if (got >= 1) continue;
      const documented = typeof entry.reason === 'string' && entry.reason.includes(b.key);
      if (pool === 0 && got === 0 && documented) continue; // 语料无池 + 已如实标注 = 合规
      bad.push(cat + '/' + b.key + '(池=' + pool + ', 样本=' + got + ', 已标注=' + documented + ')');
    }
  }
  return bad;
}

/** 对一份抽样结果跑全部契约 §6 断言（真断言，逐条打印）。 */
export function verify(obj, items, opts = {}) {
  failures = 0;
  const total = opts.total === undefined ? TOTAL : opts.total;
  const batchLen = opts.batchLen === undefined ? BATCH_SIZE : opts.batchLen;
  const byId = new Map(items.map((t) => [t.id, t]));
  const cats = [...new Set(items.map((t) => t.category))].sort();
  const flat = obj.batches.flat();
  console.log('== 契约 §6 抽样断言 ==');
  check('抽样总数 == ' + total, obj.total, total);
  check('batches 批数', obj.batches.length, 2);
  check('两批各 ' + batchLen + ' 条', obj.batches.map((b) => b.length), [batchLen, batchLen]);
  check('两批合计无重复 id', new Set(flat).size, flat.length);
  check('by_domain 的 n 之和 == 总数', Object.values(obj.by_domain).reduce((s, e) => s + e.n, 0), flat.length);
  check('by_domain 覆盖全部 ' + cats.length + ' 个域', Object.keys(obj.by_domain).sort(), cats);
  check('抽样 id 全部存在于数据源', flat.filter((i) => !byId.has(i)), []);
  const thin = Object.entries(obj.by_domain).filter(([, e]) => e.n < FLOOR_PER_DOMAIN && !e.forced_all);
  check('每域 >= ' + FLOOR_PER_DOMAIN + ' 条（不足者必须 forced_all + reason）',
    thin.map(([c, e]) => c + ':' + e.n), []);
  const noReason = Object.entries(obj.by_domain).filter(([, e]) => e.forced_all && !e.reason);
  check('forced_all 的域必须写明原因', noReason.map(([c]) => c), []);
  const picked = idsByDomain(obj, items);
  check('每域 n 与 batches 反推一致',
    cats.filter((c) => (picked.get(c) || new Set()).size !== obj.by_domain[c].n), []);
  check('三条覆盖全部满足（或“语料无池 + reason 已如实标注”）', coverageViolations(obj, items), []);
  return failures;
}

function fixture() {
  const mk = (category, id, importance, kind) => ({
    id, name: id, category, importance, kind, prereqs: [], related: [],
  });
  const items = [];
  items.push(mk('tiny_domain', 't1', 5, '器物'), mk('tiny_domain', 't2', 1, '工艺'));
  for (let i = 0; i < 8; i++) items.push(mk('nohigh', 'n' + i, i % 2 ? 1 : 2, i % 3 ? '器物' : '工艺'));
  for (let i = 0; i < 4; i++) items.push(mk('p1four', 'p' + i, 1, '工艺'));
  for (let i = 0; i < 6; i++) items.push(mk('p1four', 'q' + i, 3, '工艺'));
  items.push(mk('p1four', 'm1', 3, '媒介'), mk('p1four', 'm2', 4, '原理'));
  for (let i = 0; i < 6; i++) items.push(mk('collide', 'c' + i, i < 3 ? 1 : 3, '工艺'));
  items.push(mk('collide', 'cx', 5, '原理'));
  return items;
}

/** 边界用例（合成语料）：凑不满下限 / 无 high 池 / 唯一代表兼任两项覆盖。 */
export function runFixtureTests() {
  failures = 0;
  const items = fixture();
  const obj = sample(items, { seed: SEED, total: 14 });
  const d = obj.detail;
  console.log('== 边界用例（合成语料 4 域 22 条，total=14，批上限 7）==');
  check('tiny_domain 凑不满下限 -> forced_all 全量纳入', d.get('tiny_domain').forced_all, true);
  check('tiny_domain 条数', obj.by_domain.tiny_domain.n, 2);
  check('tiny_domain 的 reason 写明全量纳入', /全量纳入/.test(obj.by_domain.tiny_domain.reason || ''), true);
  check('nohigh 缺 importance>=4 池 -> 记缺口', d.get('nohigh').gaps.includes('importance>=4'), true);
  check('nohigh 缺 原理/媒介 池 -> 记缺口', d.get('nohigh').gaps.includes('kind∈{原理,媒介}'), true);
  check('nohigh 的 reason 同时写明两个缺口且未放宽',
    /0 条满足，未放宽判据/.test(obj.by_domain.nohigh.reason || '') &&
      obj.by_domain.nohigh.reason.split('未放宽判据').length - 1, 2);
  check('p1four 的 reason 标注 P1 仅 4 条', /P1 仅 4 条/.test(obj.by_domain.p1four.reason || ''), true);
  check('collide：唯一 原理 条目 cx 同时充当 high 与 kind 代表',
    (d.get('collide').coverage['importance>=4'] >= 1) && (d.get('collide').coverage['kind∈{原理,媒介}'] >= 1) &&
      d.get('collide').ids.includes('cx'), true);
  check('collide 无缺口（兼任不算缺口）', d.get('collide').gaps, []);
  check('合成语料的覆盖违例数（缺口已如实标注）', coverageViolations(obj, items).length, 0);
  check('合成语料两批都 <= 7 条', obj.batches.map((b) => b.length), [7, 7]);
  check('两次抽样逐字节一致', JSON.stringify(sample(items, { seed: SEED, total: 14 })) === JSON.stringify(obj), true);
  check('换 seed 结果不同（确认真用到了种子）',
    JSON.stringify(sample(items, { seed: 1, total: 14 })) !== JSON.stringify(obj), true);
  return failures;
}

function table(r, items) {
  const picked = idsByDomain(r, items);
  const rows = [...Object.keys(r.by_domain).sort()];
  console.log('域'.padEnd(22) + '样本  P1  ≤2  ≥4  原理/媒介  forced  reason');
  for (const c of rows) {
    const ids = [...(picked.get(c) || [])];
    const sub = (f) => ids.filter((i) => f(items.find((t) => t.id === i))).length;
    const e = r.by_domain[c];
    console.log(
      c.padEnd(22) + String(e.n).padStart(3) +
      String(sub((t) => t.importance === 1)).padStart(5) +
      String(sub((t) => t.importance <= 2)).padStart(5) +
      String(sub((t) => t.importance >= 4)).padStart(5) +
      String(sub(isMediaPrinciple)).padStart(11) +
      String(e.forced_all ? 'yes' : '-').padStart(9) +
      '  ' + (e.reason || '')
    );
  }
}

function main(argv) {
  const items = JSON.parse(readFileSync(TECHS, 'utf8'));
  const digest = createHash('sha256').update(readFileSync(TECHS)).digest('hex').slice(0, 12);
  if (argv.includes('--selftest')) {
    const bad = runFixtureTests();
    console.log(bad ? '\n' + bad + ' 条边界断言失败' : '\n边界用例全部通过');
    return bad ? 1 : 0;
  }
  const outPath = argv.includes('--out')
    ? resolve(argv[argv.indexOf('--out') + 1])
    : fileURLToPath(OUT_DEFAULT);
  if (argv.includes('--verify')) {
    const obj = JSON.parse(readFileSync(outPath, 'utf8'));
    const bad = verify(obj, items);
    console.log(bad ? '\n' + bad + ' 条断言失败' : '\n抽样断言全部通过');
    return bad ? 1 : 0;
  }
  const r = sample(items, { seed: SEED, total: TOTAL });
  const out = {
    seed: SEED,
    ts: new Date(statSync(TECHS).mtime).toISOString(),
    total: r.total,
    by_domain: r.by_domain,
    batches: r.batches,
  };
  writeFileSync(outPath, JSON.stringify(out, null, 1) + '\n', 'utf8');
  console.log('写出 ' + outPath + ' | techs sha256(12)=' + digest + ' | ts=' + out.ts);
  table(r, items);
  console.log('');
  const bad = verify(JSON.parse(readFileSync(outPath, 'utf8')), items);
  console.log(bad ? '\n' + bad + ' 条断言失败' : '\n抽样断言全部通过');
  return bad ? 1 : 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exit(main(process.argv.slice(2)));
}
