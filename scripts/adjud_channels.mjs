// adjud_channels.mjs — 契约 §4 提名通道 + §3.2 漏检验证（owner: agent-3）
//
// 契约：docs/superpowers/specs/2026-09-27-adjud-tooling-contract.md（§2/§4/§7/§10）
// 设计：docs/superpowers/specs/2026-09-27-importance-kind-review-design.md（§2/§3.2/§6）
//
// 所有权：本脚本与 data/adjud/nominations/*.json。其余文件一律只读。
// 不 import scripts/adjud_lib.mjs（agent-1 在途文件，契约 §10）：若
// `--metrics data/adjud/metrics.json` 存在（{total, rows:[MetricRow]}）就读它，
// 否则自带一份契约 §2 实现。
//
// 口径说明（全部相对位置、无绝对阈值筛档，spec §2）：
// - "域内下游数" = 全库 prereq 图传递闭包大小（去环、排除自身）；分位数/中位数
//   只在条目自己的 category 内比较（与探针 adjud_pool_calibration.py.mjs 同实现）。
// - 分位数取法（与探针/agent-1 记录 64/208/23/… 同一实现）：升序排序后取
//   index = min(len-1, floor(p*len)) 的样本值。
// - 契约 §4 支柱尾组的 "< 全域中位数"：实现为 **本域（该 category 全部条目、
//   不限 P2 档）下游数中位数**（--median-scope domain）。原因：全库 3876 条的
//   descendants 中位数运行时可见≈0（边稀疏，spec §2），若取全库中位数该通道
//   命中归零，与 spec §3.2 记录的 208 不可调和；且全库绝对中位数正是 spec §2
//   禁止的口径。保留 `--median-scope global` 开关如实复算对照，不改判据。
//   （2026-09-27：契约 §4 已把该中位数正式定为「本域全档位中位数」= 本实现 domain。）
// - `out_deg` = **仅 prereq 出边**（不含 related）。孤岛媒介制度那 7 条全部带
//   related 出边，若把 related 计入出边该通道命中归零；契约 §4 已定 prereq-only，
//   自带实现与 metrics.json 均按 prereqs.length，实测 7 条不变。
// - "判据专项" 本轮不存在：CHANNELS 注册表留可扩展占位（enabled:false）。
//
// 确定性：无时间戳、无 Math.random；同输入两次运行输出文件 sha256 一致。
//
// 用法：node scripts/adjud_channels.mjs [--techs <p>] [--metrics <p>] [--sample <p>]
//   [--out-dir <p>] [--median-scope domain|global] [--selftest] [--no-write]

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// ---------------------------------------------------------------- CLI ----
function parseArgs(argv) {
  const opts = {
    techs: resolve(ROOT, 'data/techs.json'),
    metrics: resolve(ROOT, 'data/adjud/metrics.json'),
    sample: resolve(ROOT, 'data/adjud/calib-sample.json'),
    outDir: resolve(ROOT, 'data/adjud/nominations'),
    medianScope: 'domain',
    selftest: false,
    noWrite: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];
    if (a === '--techs') opts.techs = resolve(next());
    else if (a === '--metrics') opts.metrics = resolve(next());
    else if (a === '--sample') opts.sample = resolve(next());
    else if (a === '--out-dir') opts.outDir = resolve(next());
    else if (a === '--median-scope') opts.medianScope = next();
    else if (a === '--selftest') opts.selftest = true;
    else if (a === '--no-write') opts.noWrite = true;
    else throw new Error(`未知参数: ${a}`);
  }
  if (!['domain', 'global'].includes(opts.medianScope))
    throw new Error('--median-scope 只能是 domain|global');
  return opts;
}

// ------------------------------------------------------- 契约 §2 指标 ----
/** 经验分位数（与探针一致）：升序后取 index=min(len-1, floor(p*len))。 */
export function quantile(values, p) {
  const a = values.slice().sort((x, y) => x - y);
  if (!a.length) return undefined;
  return a[Math.min(a.length - 1, Math.floor(p * a.length))];
}

function buildChildren(items) {
  const ch = new Map();
  for (const t of items) {
    for (const p of t.prereqs || []) {
      if (!ch.has(p)) ch.set(p, new Set());
      ch.get(p).add(t.id);
    }
  }
  return ch;
}

/** prereq 传递闭包（后代集合，排除自身、遇环跳过）。Map<id, Set<id>> */
function descendantsMap(items) {
  const ch = buildChildren(items);
  const memo = new Map();
  function desc(id) {
    if (memo.has(id)) return memo.get(id);
    const s = new Set();
    const st = [...(ch.get(id) || [])];
    while (st.length) {
      const c = st.pop();
      if (s.has(c)) continue;
      s.add(c);
      for (const d of ch.get(c) || []) if (!s.has(d)) st.push(d);
    }
    memo.set(id, s);
    return s;
  }
  const out = new Map();
  for (const t of items) out.set(t.id, desc(t.id));
  return out;
}

/** 契约 §2 MetricRow（自带实现；字段固定序，保证输出确定性）。 */
export function computeMetricRows(items) {
  const pf = new Map();
  const rf = new Map();
  const bump = (m, k) => m.set(k, (m.get(k) || 0) + 1);
  for (const t of items) {
    for (const p of t.prereqs || []) { bump(pf, p); bump(rf, p); }
    for (const r of t.related || []) bump(rf, r);
  }
  const desc = descendantsMap(items);
  const ch = buildChildren(items);
  const byId = new Map(items.map((t) => [t.id, t]));
  const groups = new Map();
  for (const t of items) {
    if (!groups.has(t.category)) groups.set(t.category, []);
    groups.get(t.category).push(t);
  }
  const eraGroups = new Map(); // category|era -> items
  for (const t of items) {
    const k = `${t.category}|${t.era}`;
    if (!eraGroups.has(k)) eraGroups.set(k, []);
    eraGroups.get(k).push(t);
  }
  return items.map((t) => {
    const descendants = desc.get(t.id).size;
    const tPf = pf.get(t.id) || 0;
    const group = groups.get(t.category);
    // desc_rank：域内按 (descendants, pf) 降序、并列取最小名次（1=本域第一）
    const better = group.filter((g) => {
      const gd = desc.get(g.id).size;
      const gp = pf.get(g.id) || 0;
      return gd > descendants || (gd === descendants && gp > tPf);
    }).length;
    const desc_rank = better + 1;
    const zeroCount = group.filter((g) => desc.get(g.id).size === 0).length;
    const era = eraGroups.get(`${t.category}|${t.era}`);
    const fewerImp = era.filter((g) => g.importance < t.importance).length;
    return {
      id: t.id,
      name: t.name,
      nameEn: t.nameEn ?? null,
      wikiEn: t.wikiEn ?? null,
      importance: t.importance,
      kind: t.kind,
      category: t.category,
      era: t.era,
      year: t.year ?? null,
      year_basis: t.year_basis ?? null,
      desc: t.desc,
      out_deg: (t.prereqs || []).length,
      pf: tPf,
      rf: rf.get(t.id) || 0,
      descendants,
      desc_rank,
      desc_rank_pct: desc_rank / group.length,
      desc_zero_share: group.length ? zeroCount / group.length : 0,
      tier_rank_pct: era.length ? (fewerImp + 1) / era.length : 1,
      direct_downstream: [...(ch.get(t.id) || [])]
        .slice(0, 5)
        .map((id) => ({ id, name: byId.get(id)?.name ?? id, importance: byId.get(id)?.importance ?? null })),
    };
  });
}

/** metrics 路径存在且合契约 §10 形状则读之，否则自带 §2 实现。 */
function loadRows(items, metricsPath) {
  if (existsSync(metricsPath)) {
    const m = JSON.parse(readFileSync(metricsPath, 'utf8'));
    const rows = Array.isArray(m) ? m : m.rows;
    if (!Array.isArray(rows) || !rows.length)
      throw new Error(`${metricsPath} 存在但不是契约 §10 形状 {total, rows:[MetricRow]}`);
    for (const k of ['id', 'importance', 'kind', 'category', 'pf', 'rf', 'descendants', 'out_deg']) {
      if (!(k in rows[0])) throw new Error(`${metricsPath} 的行缺少契约 §2 字段 ${k}`);
    }
    return { rows, source: metricsPath };
  }
  return { rows: computeMetricRows(items), source: 'self（metrics.json 不存在→契约 §2 自带实现）' };
}

// --------------------------------------------------- 域统计 / 通道注册 ----
function computeDomainStats(rows) {
  const groups = new Map();
  for (const r of rows) {
    if (!groups.has(r.category)) groups.set(r.category, []);
    groups.get(r.category).push(r);
  }
  const out = new Map();
  for (const [cat, arr] of groups) {
    const dn = (r) => r.descendants;
    const p1 = arr.filter((r) => r.importance === 1);
    const p2 = arr.filter((r) => r.importance === 2);
    out.set(cat, {
      category: cat,
      count: arr.length,
      median: quantile(arr.map(dn), 0.5),
      p75: quantile(arr.map(dn), 0.75),
      p1P20: quantile(p1.map(dn), 0.2),
      p2P20: quantile(p2.map(dn), 0.2),
      p1Count: p1.length,
      p2Count: p2.length,
    });
  }
  return out;
}

const hasWiki = (r) => !!(r.wikiEn && String(r.wikiEn).trim());

/**
 * 通道注册表（契约 §4：名字字符串必须精确一致）。判据专项本轮不存在，
 * T1 段判据 v1 转写后填入 rule 并置 enabled:true 即可（可扩展结构）。
 */
export const CHANNELS = [
  {
    name: '基石尾组',
    enabled: true,
    spec: 'P1 且（域内下游数 ≤ 本域 P1 的 20 分位 或 pf==0）',
    rule: (r, st) => {
      if (r.importance !== 1) return null;
      const byPos = dnLEQ(r, st.p1P20);
      const byPf = r.pf === 0;
      if (!byPos && !byPf) return null;
      const parts = [];
      if (byPos) parts.push(`域内(${r.category})下游数 ${r.descendants} ≤ 本域 P1 档 20 分位 ${st.p1P20}（本域 P1 共 ${st.p1Count} 条）`);
      if (byPf) parts.push(`pf=0（直接前置引用为 0）`);
      return `P1；${parts.join('，或 ')}`;
    },
  },
  {
    name: '支柱尾组',
    enabled: true,
    spec: 'P2 且 域内下游数 ≤ 本域 P2 的 20 分位 且 < 全域中位数（本实现=本域全档位中位数，见文件头）',
    rule: (r, st, ctx) => {
      if (r.importance !== 2) return null;
      const med = ctx.medianOf(st);
      if (!dnLEQ(r, st.p2P20) || !(r.descendants < med)) return null;
      return `P2；域内(${r.category})下游数 ${r.descendants} ≤ 本域 P2 档 20 分位 ${st.p2P20} 且 < ${ctx.medianLabel} ${med}（本域 P2 共 ${st.p2Count} 条）`;
    },
  },
  {
    name: '疑被低估',
    enabled: true,
    spec: 'P3+ 且 域内下游数 ≥ 本域 75 分位 且绝对值 > 50',
    rule: (r, st) =>
      r.importance >= 3 && r.descendants >= st.p75 && r.descendants > 50
        ? `P${r.importance}；域内(${r.category})下游数 ${r.descendants} ≥ 本域 75 分位 ${st.p75} 且绝对值 > 50`
        : null,
  },
  {
    name: '原理零引用',
    enabled: true,
    spec: 'kind=原理 且 rf==0',
    rule: (r) => (r.kind === '原理' && r.rf === 0 ? `kind=原理；被引总数 rf=0` : null),
  },
  {
    name: '孤岛媒介制度',
    enabled: true,
    spec: 'kind∈{媒介,制度} 且 rf==0 且 out_deg==0',
    rule: (r) =>
      (r.kind === '媒介' || r.kind === '制度') && r.rf === 0 && r.out_deg === 0
        ? `kind=${r.kind}；rf=0 且 out_deg=0（零被引、零出边）`
        : null,
  },
  {
    name: '高档无溯源',
    enabled: true,
    spec: 'importance≤2 且 wikiEn 为空',
    rule: (r) => (r.importance <= 2 && !hasWiki(r) ? `importance=${r.importance}（P1/P2 高档）；wikiEn 为空` : null),
  },
  {
    name: '判据专项',
    enabled: false, // T1 段（判据 v1 转写）才存在；先占位，保持注册结构可扩展
    spec: '判据 v1 转写的规则（本轮不存在）',
    rule: () => null,
  },
];

const dnLEQ = (r, q) => q !== undefined && q !== null && r.descendants <= q;

/** 逐条提名：Map<id, {channels:[...], why}>，通道按注册表序，条目按文件序。 */
export function nominate(rows, domainStats, medianScope) {
  const globalMedian = quantile(rows.map((r) => r.descendants), 0.5);
  const ctx = {
    medianScope,
    medianLabel: medianScope === 'domain' ? '全域（本域全部条目）中位数' : '全库中位数',
    medianOf: (st) => (medianScope === 'domain' ? st.median : globalMedian),
  };
  const byId = new Map();
  for (const r of rows) {
    const st = domainStats.get(r.category);
    const hits = [];
    const whys = [];
    for (const c of CHANNELS) {
      if (!c.enabled) continue;
      const why = c.rule(r, st, ctx);
      if (why !== null) { hits.push(c.name); whys.push(`[${c.name}] ${why}`); }
    }
    if (hits.length) byId.set(r.id, { channels: hits, why: whys.join('；') });
  }
  return { byId, globalMedian, ctx };
}

// ------------------------------------------------------- 校准批 / 抽样 ----
// 漏检测试集优先用 agent-1 的 data/adjud/calib-sample.json（契约 §6 形状
// {seed, ts, total, by_domain, batches:[[id×50],[id×50]]}）。
// 若尚未生成：在全库上跑自测版——契约 §6 口径的确定性分层抽样（每域 ≥3、
// 剩余名额按域大小比例、种子 20260927、mulberry32+xmur3，禁 Math.random）。

function xmur3(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
}
function mulberry32(a) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rngFor = (tag) => mulberry32(xmur3(tag)());

function seededShuffle(arr, rng) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** 最大余数法分配 seats（含 cap，tie-break：余数→基数→域名升序）。 */
function allocSeats(cats, weights, caps, seats) {
  const give = new Map(cats.map((c) => [c, 0]));
  let rem = seats;
  let active = cats.filter((c) => give.get(c) < caps[c]);
  while (rem > 0 && active.length) {
    const tot = active.reduce((s, c) => s + weights[c], 0);
    const fr = active.map((c) => {
      const exact = (weights[c] / tot) * rem;
      return { c, base: Math.floor(exact), r: exact - Math.floor(exact) };
    });
    let used = fr.reduce((s, x) => s + x.base, 0);
    fr.sort((a, b) => b.r - a.r || b.base - a.base || (a.c < b.c ? -1 : a.c > b.c ? 1 : 0));
    for (const x of fr) { if (used >= rem) break; x.base++; used++; }
    for (const x of fr) {
      const add = Math.min(x.base, caps[x.c] - give.get(x.c), rem);
      give.set(x.c, give.get(x.c) + add);
      rem -= add;
    }
    active = active.filter((c) => give.get(c) < caps[c]);
  }
  return give;
}

/** 自测版分层抽样：n=100，每域保底 3，剩余 34 按域大小比例分配。 */
export function selfTestSample(rows, seed = '20260927', targetN = 100) {
  const cats = [...new Set(rows.map((r) => r.category))].sort();
  const pool = new Map();
  for (const c of cats)
    pool.set(c, seededShuffle(rows.filter((r) => r.category === c), rngFor(`${seed}|${c}`)));
  const chosen = new Map();
  const notes = [];
  let used = 0;
  for (const c of cats) {
    const take = Math.min(3, pool.get(c).length);
    if (take < 3)
      notes.push({ category: c, forced_all: true, reason: `域内仅 ${pool.get(c).length} 条，不足每域下限 3，全量纳入` });
    chosen.set(c, pool.get(c).slice(0, take).map((r) => r.id));
    pool.get(c).splice(0, take);
    used += take;
  }
  const sizes = Object.fromEntries(cats.map((c) => [c, rows.filter((r) => r.category === c).length]));
  const caps = Object.fromEntries(cats.map((c) => [c, pool.get(c).length]));
  const extra = allocSeats(cats, sizes, caps, targetN - used);
  for (const c of cats) chosen.get(c).push(...pool.get(c).slice(0, extra.get(c)).map((r) => r.id));
  const ids = cats.flatMap((c) => chosen.get(c)).sort();
  return {
    seed, selftest: true, targetN, ids,
    by_domain: Object.fromEntries(cats.map((c) => [c, { n: chosen.get(c).length }])),
    notes,
  };
}

function loadSample(samplePath, rows) {
  if (existsSync(samplePath)) {
    const m = JSON.parse(readFileSync(samplePath, 'utf8'));
    const ids = Array.isArray(m) ? m.slice() : Array.isArray(m.ids) ? m.ids.slice() : (m.batches || []).flat();
    if (!ids.length) throw new Error(`${samplePath} 存在但取不到 id 列表（契约 §6 形状 batches:[[id×50],[id×50]]）`);
    return { sample_source: samplePath, selftest: false, ids: ids.slice().sort(), seed: m.seed ?? null };
  }
  const s = selfTestSample(rows);
  return {
    sample_source: `${samplePath}（尚不存在→自测版分层抽样）`,
    selftest: true, ids: s.ids, seed: s.seed, notes: s.notes, by_domain: s.by_domain,
  };
}

// -------------------------------------------------- 漏检覆盖 coverage ----
function diagnoseMiss(r, st, ctx) {
  const med = ctx.medianOf(st);
  const why = [];
  if (r.importance === 1)
    why.push(`基石尾组未中：域内下游 ${r.descendants} > 本域 P1 20 分位 ${st.p1P20 ?? '—'} 且 pf=${r.pf}>0`);
  else if (r.importance === 2)
    why.push(`支柱尾组未中：域内下游 ${r.descendants}（本域 P2 20 分位 ${st.p2P20 ?? '—'}，${ctx.medianLabel} ${med}，需 ≤分位 且 <中位）`);
  else
    why.push(`P${r.importance} 不在基石/支柱/高档射程；疑被低估未中：域内下游 ${r.descendants}（本域 75 分位 ${st.p75}，需 ≥ 且 >50）`);
  if (r.kind === '原理' && r.rf > 0) why.push(`原理但 rf=${r.rf}>0`);
  if ((r.kind === '媒介' || r.kind === '制度') && (r.rf > 0 || r.out_deg > 0))
    why.push(`${r.kind}但 rf=${r.rf}/out_deg=${r.out_deg}，非孤岛`);
  if (r.importance <= 2 && hasWiki(r)) why.push(`有 wikiEn 溯源，高档无溯源不捞`);
  return why.join('；');
}

function buildCoverage(rowsById, domainStats, ctx, sample, byId) {
  const missed = [];
  let nominated = 0;
  // 分档计数：按 importance 1..5 各记 {sample, nominated}（同一 id 只落自己档一次）。
  const tier = {
    1: { sample: 0, nominated: 0 }, 2: { sample: 0, nominated: 0 },
    3: { sample: 0, nominated: 0 }, 4: { sample: 0, nominated: 0 }, 5: { sample: 0, nominated: 0 },
  };
  for (const id of sample.ids) {
    const r = rowsById.get(id);
    if (!r) throw new Error(`测试集 id ${id} 不在 metrics 行中`);
    const t = tier[r.importance] || (tier[r.importance] = { sample: 0, nominated: 0 });
    t.sample++;
    if (byId.has(id)) { nominated++; t.nominated++; continue; }
    const st = domainStats.get(r.category);
    missed.push({
      id,
      metrics: {
        name: r.name, category: r.category, importance: r.importance, kind: r.kind,
        pf: r.pf, rf: r.rf, out_deg: r.out_deg, descendants: r.descendants,
        desc_rank_pct: Number(r.desc_rank_pct.toFixed(4)),
        desc_zero_share: Number(r.desc_zero_share.toFixed(4)),
        domain: {
          p1P20: st.p1P20, p2P20: st.p2P20, p75: st.p75,
          median_used: ctx.medianOf(st), median_scope: ctx.medianScope,
        },
        has_wikiEn: hasWiki(r),
      },
      why_missed: diagnoseMiss(r, st, ctx),
    });
  }
  const total = sample.ids.length;
  const sum = (ks) => ks.reduce((a, k) => a + tier[k].sample, 0);
  const sumN = (ks) => ks.reduce((a, k) => a + tier[k].nominated, 0);
  const HIGH = [1, 2], LOW = [3, 4, 5];
  return {
    // 契约 §7 / spec §6：漏检 1/3 卡点的唯一合法分母 = 校准批里「用户判改判/移出/换档」的条目。
    // 本轮 calib-sample 无任何裁决记录 → 卡点不可判定；下列全是名义覆盖/上界，不是卡点结论。
    spec6_gate: {
      denominator_def: 'calib 中「用户裁决为改判/移出/换档（即该动）」的条目里、未被任一通道提名的比例（契约 §7 写死为唯一合法分母）',
      adjudication_records_found: 0,
      decidable: false,
      verdict: 'N/A — 校准批裁决尚未产生，本轮任何数字都不构成 spec §6 的 1/3 卡点判定',
      note: '不为凑合格数字调阈值；nominal_coverage 与 nominal_unnominated 均为参考，不许拿全样本命中率卡 1/3。',
    },
    test_set: sample.selftest
      ? 'selftest-100（calib-sample.json 未就绪；契约 §6 口径的确定性分层抽样，非用户真实裁决批）'
      : 'calib-sample.json（契约 §6 校准批）',
    sample_source: sample.sample_source,
    sample_seed: sample.seed ?? null,
    test_total: total,
    // (a) 名义覆盖：100 条里被任一通道提名 X 条——不是卡点。
    nominal_coverage: {
      label: '名义覆盖：test_total 里被≥1 通道提名（通道捞异常用，契约 §7 禁止拿它卡 1/3）',
      nominated_any_channel: nominated,
      denominator: total,
      rate: Number((total ? nominated / total : 0).toFixed(4)),
    },
    // (b) 按档位拆开报样本数与被提名数。
    tier_breakdown: {
      note: '各 importance 档的样本数与被任一通道提名数；同一 id 只计自己档一次（P1+…+P5 的 nominated = nominal_coverage 值）',
      P1: tier[1], P2: tier[2], P3: tier[3], P4: tier[4], P5: tier[5],
      group_P1_P2: { sample: sum(HIGH), nominated: sumN(HIGH) },
      group_P3_P4_P5: { sample: sum(LOW), nominated: sumN(LOW) },
    },
    // (c) 未被提名条目：逐条 metrics + 为什么规则捞不到（见 missed[]）。此数为真实漏检上界。
    nominal_unnominated: {
      label: '名义未提名（全样本未被任一通道提名）——真实漏检的上界：含本就无需改动的条目',
      count: missed.length,
      rate: Number((total ? missed.length / total : 0).toFixed(4)),
    },
    missed,
    missed_ids: missed.map((m) => m.id),
  };
}

// ---------------------------------------------------------- selftest ----
function pick(rows, domainStats, byId, cond, expect) {
  for (const r of rows) {
    if (!cond(r, domainStats.get(r.category))) continue;
    if (byId.has(r.id) !== expect) continue; // 期望态与提名结果一致性过滤
    return r;
  }
  return null;
}

function selfTest(rows, domainStats, byId, ctx, log) {
  let pass = true;
  const show = (label, cond, expect, opts = {}) => {
    const r = pick(rows, domainStats, byId, cond, expect);
    if (!r) {
      if (opts.naturalOnly) { pass = false; log(`  [缺例] ${label}：全库无自然用例`); }
      else log(`  [INFO] ${label}：全库无自然用例（方向由合成例验证，见本段末）`);
      return null;
    }
    const st = domainStats.get(r.category);
    const got = byId.has(r.id);
    const okMark = got === expect ? 'OK ' : 'BAD';
    if (got !== expect) pass = false;
    log(`  ${okMark} ${label}\n       ${r.id}(${r.name}) cat=${r.category} P${r.importance} kind=${r.kind} dn=${r.descendants} pf=${r.pf} rf=${r.rf} out_deg=${r.out_deg} wikiEn=${hasWiki(r) ? '有' : '空'} | 域P1_20=${st.p1P20} 域P2_20=${st.p2P20} 域P75=${st.p75} ${ctx.medianLabel}=${ctx.medianOf(st)} → 提名: ${got ? byId.get(r.id).channels.join('+') : '（无）'}`);
    return r;
  };
  const ruleOf = (name) => CHANNELS.find((c) => c.name === name).rule;
  // 合成边界例：真实行/假想域统计 + 直接调规则谓词，只证方向，不进任何输出池
  const synth = (label, hit, expect) => {
    const ok = hit === expect;
    if (!ok) pass = false;
    log(`  ${ok ? 'OK ' : 'BAD'} [合成] ${label} → ${hit ? '提名' : '不提名'}（期望${expect ? '提名' : '不提名'}）`);
  };
  const impIs = (n) => (r) => r.importance === n;
  log('== 边界方向用例（阈值两侧各一例，证方向不反）==');
  log('-- 基石尾组：dn ≤ 本域P1 20分位 或 pf==0 --');
  show('恰等于 20 分位（应提名）', (r, st) => impIs(1)(r) && st.p1P20 != null && r.descendants === st.p1P20, true, { naturalOnly: true });
  const pfBase = show('20分位+1 且 pf>0（应不提名）', (r, st) => impIs(1)(r) && st.p1P20 != null && r.descendants === st.p1P20 + 1 && r.pf > 0, false, { naturalOnly: true });
  log('-- pf==0 与 pf==1 分界（dn>p1P20 一侧，pf 单独定胜负）--');
  const pfNat = (r, st) => impIs(1)(r) && st.p1P20 != null && r.descendants > st.p1P20 && r.pf === 0;
  const pfNatR = rows.find((r) => pfNat(r, domainStats.get(r.category)));
  if (!pfNatR)
    log('  [INFO] 实测：全库 P1 且 pf=0 的条目都同时满足 dn≤本域P1_20分位（两条件重叠），pf 支路无自然独占例 → 用合成例');
  show('pf=0 自然例（应提名）', pfNat, true);
  show('pf=1 自然例（应不提名）', (r, st) => impIs(1)(r) && st.p1P20 != null && r.descendants > st.p1P20 && r.pf === 1, false);
  if (pfBase) {
    const st = domainStats.get(pfBase.category);
    const base = { ...pfBase, importance: 1 };
    const onlyPf = (pf) => ruleOf('基石尾组')({ ...base, pf }, st, ctx) !== null;
    log(`       合成：取真实条目 ${pfBase.id}（dn=${pfBase.descendants} > 域P1_20=${st.p1P20}，pf 单独定胜负）`);
    synth('pf 改 0', onlyPf(0), true);
    synth('pf 改 1', onlyPf(1), false);
  }
  log('-- 支柱尾组：dn ≤ 本域P2 20分位 且 < 中位数 --');
  show('恰等于 20 分位（应提名）', (r, st) => impIs(2)(r) && st.p2P20 != null && r.descendants === st.p2P20 && r.descendants < ctx.medianOf(st), true);
  show('20分位+1（应不提名）', (r, st) => impIs(2)(r) && st.p2P20 != null && r.descendants === st.p2P20 + 1, false);
  show('dn=中位数-1 且 ≤P2_20（应提名）', (r, st) => impIs(2)(r) && st.p2P20 != null && r.descendants === ctx.medianOf(st) - 1 && r.descendants <= st.p2P20, true);
  show('dn=中位数（应不提名，方向为 <）', (r, st) => impIs(2)(r) && r.descendants === ctx.medianOf(st) && st.p2P20 != null && r.descendants <= st.p2P20, false);
  log('-- 疑被低估：dn ≥ 本域75分位 且 dn > 50 --');
  const eqP75 = show('恰等于 75 分位且>50 自然例（应提名）', (r, st) => r.importance >= 3 && r.descendants === st.p75 && r.descendants > 50, true);
  if (!eqP75) log(`       （实测无任何域 p75>50：等值边界无自然例，用合成例）`);
  show('75分位-1（应不提名）', (r, st) => r.importance >= 3 && r.descendants === st.p75 - 1, false, { naturalOnly: true });
  show('dn=51 且 ≥75分位 自然例（应提名，>50 边界）', (r, st) => r.importance >= 3 && r.descendants === 51 && 51 >= st.p75, true, { naturalOnly: true });
  const dn50 = show('dn=50 且 ≤75分位 自然例（应不提名，>50 严格）', (r, st) => r.importance >= 3 && r.descendants === 50 && st.p75 <= 50, false);
  if (!dn50) log('       （全库无 P3+ 且 dn 恰为 50 的条目 → 用合成例）');
  {
    const row = { importance: 3, descendants: 60, category: 'synth', kind: '工艺', pf: 1, rf: 1, wikiEn: 'x' };
    synth('域p75=60、dn=60（等号侧）', ruleOf('疑被低估')(row, { p75: 60 }, ctx) !== null, true);
    synth('域p75=60、dn=59', ruleOf('疑被低估')({ ...row, descendants: 59 }, { p75: 60 }, ctx) !== null, false);
    synth('域p75=10、dn=51（>50 边界内侧）', ruleOf('疑被低估')({ ...row, descendants: 51 }, { p75: 10 }, ctx) !== null, true);
    synth('域p75=10、dn=50（>50 严格）', ruleOf('疑被低估')({ ...row, descendants: 50 }, { p75: 10 }, ctx) !== null, false);
  }
  log('-- 原理零引用：rf==0 与 rf==1 分界 --');
  show('rf=0（应提名）', (r) => r.kind === '原理' && r.rf === 0, true);
  show('rf=1（应不提名）', (r) => r.kind === '原理' && r.rf === 1, false);
  log('-- 孤岛媒介制度：rf=0 且 out_deg=0 --');
  show('rf=0且out_deg=0（应提名）', (r) => (r.kind === '媒介' || r.kind === '制度') && r.rf === 0 && r.out_deg === 0, true);
  show('rf=1（应不提名）', (r) => (r.kind === '媒介' || r.kind === '制度') && r.rf === 1 && r.out_deg === 0, false);
  show('rf=0但out_deg=1（应不提名）', (r) => (r.kind === '媒介' || r.kind === '制度') && r.rf === 0 && r.out_deg === 1, false);
  log('-- 高档无溯源：importance≤2 且 wikiEn 空 --');
  show('P2 且 wikiEn 空（应提名）', (r) => r.importance === 2 && !hasWiki(r), true);
  show('P3 且 wikiEn 空（应不提名，档位分界≤2）', (r) => r.importance === 3 && !hasWiki(r) && r.kind !== '原理', false);
  log('-- 全通道负例 --');
  show('P3·域内下游=域中位·rf>0·有wikiEn·工艺/器物（应不提名）',
    (r, st) => r.importance === 3 && r.descendants === st.median && r.descendants <= 50 && r.rf > 0 && hasWiki(r) && (r.kind === '工艺' || r.kind === '器物'), false);
  log(`== selftest 结论: ${pass ? 'ALL PASS（边界方向一致）' : '存在 BAD/缺例'} ==`);
  return pass;
}

// ------------------------------------------------------------ main ----
// spec §3.2 记录的实测规模：仅作对照打印（契约 §4：命中数只做运行时计数，
// 不写进断言当"预期值"）。
const SPEC_MEASURED = { 基石尾组: 64, 支柱尾组: 208, 疑被低估: 23, 原理零引用: 100, 孤岛媒介制度: 7, 高档无溯源: 5, 判据专项: null };

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const log = (...a) => console.log(...a);
  const items = JSON.parse(readFileSync(opts.techs, 'utf8'));
  if (!Array.isArray(items)) throw new Error('techs.json 顶层必须是数组');
  const { rows, source } = loadRows(items, opts.metrics);
  const rowsById = new Map(rows.map((r) => [r.id, r]));
  const domainStats = computeDomainStats(rows);
  const { byId, globalMedian, ctx } = nominate(rows, domainStats, opts.medianScope);

  const counts = {};
  for (const c of CHANNELS) counts[c.name] = 0;
  for (const v of byId.values()) for (const ch of v.channels) counts[ch]++;

  log(`== 指标来源: ${source}；全库 ${rows.length} 条；descendants 全库中位数=${globalMedian}；支柱尾组中位数口径=${opts.medianScope}(${ctx.medianLabel}) ==`);
  log('逐通道命中（运行时计数）vs spec §3.2 实测记录（仅对照，不断言）:');
  for (const c of CHANNELS)
    log(`  ${c.name} 命中 ${String(counts[c.name]).padStart(4)}${c.enabled ? '' : '（注册未启用）'} | spec记录 ${SPEC_MEASURED[c.name] ?? '待定'}`);
  const ids = [...byId.keys()];
  log(`提名池总数（去重）: ${ids.length}`);
  const byCat = {};
  for (const id of ids) byCat[rowsById.get(id).category] = (byCat[rowsById.get(id).category] || 0) + 1;
  log('按域分布:', Object.entries(byCat).sort((a, b) => (a[0] < b[0] ? -1 : 1)).map(([k, v]) => `${k}=${v}`).join(' '));

  const channelsOut = {
    contract: 'docs/superpowers/specs/2026-09-27-adjud-tooling-contract.md §4',
    metrics_source: source,
    median_scope_for_pillar_channel: opts.medianScope,
    total: ids.length,
    counts,
    by_domain: Object.fromEntries(Object.entries(byCat).sort((a, b) => (a[0] < b[0] ? -1 : 1))),
    items: rows.filter((r) => byId.has(r.id)).map((r) => ({ id: r.id, channels: byId.get(r.id).channels, why: byId.get(r.id).why })),
  };

  const sample = loadSample(opts.sample, rows);
  const coverage = buildCoverage(rowsById, domainStats, ctx, sample, byId);
  log(`== 漏检覆盖（测试集 ${coverage.test_total} 条，${sample.selftest ? '自测版分层抽样（calib-sample.json 未就绪）' : 'calib-sample.json'}）==`);
  const tb = coverage.tier_breakdown;
  log(`  名义覆盖（非卡点）：${coverage.test_total} 条里被≥1 通道提名 ${coverage.nominal_coverage.nominated_any_channel} 条（rate ${coverage.nominal_coverage.rate}）`);
  log(`  分档被提名：P1 ${tb.P1.nominated}/${tb.P1.sample} P2 ${tb.P2.nominated}/${tb.P2.sample} | P3 ${tb.P3.nominated}/${tb.P3.sample} P4 ${tb.P4.nominated}/${tb.P4.sample} P5 ${tb.P5.nominated}/${tb.P5.sample}`);
  log(`  分档合并：高档 P1+P2 ${tb.group_P1_P2.nominated}/${tb.group_P1_P2.sample} | 低档 P3+P4+P5 ${tb.group_P3_P4_P5.nominated}/${tb.group_P3_P4_P5.sample}（未提名逐条见 coverage.missed）`);
  log(`  名义未提名（上界）：${coverage.nominal_unnominated.count} 条（rate ${coverage.nominal_unnominated.rate}）`);
  log(`  spec §6 1/3 卡点：${coverage.spec6_gate.verdict}`);

  if (!opts.noWrite) {
    mkdirSync(opts.outDir, { recursive: true });
    writeFileSync(resolve(opts.outDir, 'channels.json'), JSON.stringify(channelsOut, null, 1) + '\n');
    writeFileSync(resolve(opts.outDir, 'coverage.json'), JSON.stringify(coverage, null, 1) + '\n');
    log(`已写 ${resolve(opts.outDir, 'channels.json')}`);
    log(`已写 ${resolve(opts.outDir, 'coverage.json')}`);
  }
  if (opts.selftest) {
    log('');
    const ok = selfTest(rows, domainStats, byId, ctx, log);
    if (!ok) process.exitCode = 1;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) main();
