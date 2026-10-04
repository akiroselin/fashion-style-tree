// adjud_lib.mjs — 复查裁决指标计算（指标唯一权威实现；本文件 owner = agent-1）
//
// 契约（本文件的对外口径）：
//   docs/superpowers/specs/2026-09-27-adjud-tooling-contract.md  §2 MetricRow / §4 通道 / §10 --dump
//   docs/superpowers/specs/2026-09-27-importance-kind-review-design.md §2 域内相对 / §3.2 通道实测
// 兼容契约（同一批并行脚本在跑，勿删）：
//   docs/superpowers/specs/2026-09-27-adjudication-contract.md §3 camelCase 卡片字段 / §6 断言
//   —— 由 scripts/adjud_lib_check.mjs 消费，字段与行为保持原样。
// 逻辑来源：scripts/adjud_pool_calibration.py.mjs（探针，已实测复现 §4 数字）
//
// 关键口径（务必遵守）：
// - “域内相对”＝**比较与统计**限定在该条目的 category（百分位 / 中位数 / 分位数），
//   图本身仍是整库 prereq 图（不按域裁剪再遍历）。
// - 本文件**不提供任何按绝对阈值筛档位的便利函数**（spec §2：2158/3876 条零直接
//   下游、22 域中 15 个域内下游中位数为 0）。唯一的绝对阈值 `> 50` 只存在于
//   “疑被低估”通道内，且与“域内 75 分位”是 **与** 关系，不单独筛。
// - descendants 与旧 domainDownstreams/absDownstreams 同源：整库 prereq 传递闭包
//   大小（排除自身，遇环跳过）。故 descendants==0 ⟺ pf==0。
// - out_deg 采用 **prereq 出边** 口径（related 出边不计）。理由：契约 §4 的
//   “孤岛媒介制度 = rf==0 且 out_deg==0，实测 7”只在 prereq-only 下成立；
//   把 related 计入出边则该通道为 0。--selftest 两个口径都打，便于复核。
// - 数据加载走 readFileSync + JSON.parse（本包 "type": "module"，require 不可用）。
//
// CLI：
//   node scripts/adjud_lib.mjs --dump data/adjud/metrics.json   # 契约 §10
//   node scripts/adjud_lib.mjs --selftest                        # 验证 1/2/5 的真跑输出

import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** 默认数据源：../data/techs.json（只读，任何代理不得写） */
export const DEFAULT_TECHS_URL = new URL('../data/techs.json', import.meta.url);

/** 六个提名通道名（spec §3.2 顺序，契约 §3 channel 字段取值） */
export const CHANNEL_NAMES = Object.freeze([
  '基石尾组',
  '支柱尾组',
  '疑被低估',
  '原理零引用',
  '孤岛媒介制度',
  '高档无溯源',
]);

/** 读取并解析 techs.json，返回条目数组。 */
export function loadTechs(url = DEFAULT_TECHS_URL) {
  return JSON.parse(readFileSync(url, 'utf8'));
}

/**
 * 分位数（与探针完全一致的经验取法）：升序排序后取
 * index = min(len-1, floor(p*len))。空数组返回 undefined。
 */
export function quantile(values, p) {
  const a = values.slice().sort((x, y) => x - y);
  if (!a.length) return undefined;
  return a[Math.min(a.length - 1, Math.floor(p * a.length))];
}

/** prereq 直接下游（children）映射：id -> Set<下游 id>，保持文件序。 */
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

/**
 * prereq 图上传递闭包（后代集合，排除自身，遇环跳过）。
 * 返回 Map<id, Set<id>>，自底向上记忆化。
 */
export function descendantsMap(items) {
  const ch = buildChildren(items);
  const memo = new Map();
  function desc(id) {
    if (memo.has(id)) return memo.get(id);
    const s = new Set();
    const st = [...(ch.get(id) || [])];
    while (st.length) {
      const c = st.pop();
      if (s.has(c)) continue; // 排除自身 + 遇环跳过
      s.add(c);
      for (const d of (ch.get(c) || [])) if (!s.has(d)) st.push(d);
    }
    memo.set(id, s);
    return s;
  }
  const out = new Map();
  for (const t of items) out.set(t.id, desc(t.id));
  return out;
}

/**
 * 逐条指标（契约 §3 卡片 schema 的结构字段）。
 * @param {Array} items techs.json 解析出的条目数组
 * @returns {Map<string, {
 *   pf: number, rf: number,
 *   domainDownstreams: number, domainRankPct: number,
 *   absDownstreams: number, topDownstream: string[],
 *   zeroDownstreamShare: number
 * }>} id -> 指标
 */
export function computeMetrics(items) {
  // pf = 作为他人 prereq 终点的次数；rf = 被引总数（prereq + related）
  const pf = new Map();
  const rf = new Map();
  const bump = (m, k) => m.set(k, (m.get(k) || 0) + 1);
  for (const t of items) {
    for (const p of t.prereqs || []) { bump(pf, p); bump(rf, p); }
    for (const r of t.related || []) bump(rf, r);
  }

  const desc = descendantsMap(items);
  const ch = buildChildren(items);
  const dn = new Map(); // 闭包大小（domainDownstreams === absDownstreams，见文件头口径）
  for (const [id, s] of desc) dn.set(id, s.size);

  // 按 category 分组，算域内百分位与零下游占比
  const groups = new Map();
  for (const t of items) {
    if (!groups.has(t.category)) groups.set(t.category, []);
    groups.get(t.category).push(t);
  }

  const out = new Map();
  for (const t of items) {
    const v = dn.get(t.id) || 0;
    const group = groups.get(t.category);
    const n = group.length;
    // domainRankPct：升序 min-rank（严格小于 v 的条数 + 1），(rank-1)/n*100 取整
    const fewer = group.filter((g) => (dn.get(g.id) || 0) < v).length;
    const domainRankPct = Math.round((fewer / n) * 100);
    const zeroCount = group.filter((g) => (dn.get(g.id) || 0) === 0).length;
    out.set(t.id, {
      pf: pf.get(t.id) || 0,
      rf: rf.get(t.id) || 0,
      domainDownstreams: v,
      domainRankPct,
      absDownstreams: v,
      topDownstream: [...(ch.get(t.id) || [])].slice(0, 5),
      zeroDownstreamShare: n ? zeroCount / n : 0,
    });
  }
  return out;
}

/**
 * 分域统计（全部相对本域，不含绝对阈值）。
 * @param {Array} items
 * @param {Map<string, object>} metrics computeMetrics 的返回
 * @returns {Map<string, {
 *   category: string, count: number,
 *   median: number, p20: number, p75: number,        // 本域下游数分布
 *   p1ZeroPf: number,                                 // 本域 P1 中 pf==0 的条数
 *   p1P20: number|undefined, p2P20: number|undefined, // 本域 P1/P2 各自的 20 分位
 *   p1Count: number, p2Count: number
 * }>} category -> 统计
 */
export function computeDomainStats(items, metrics) {
  const groups = new Map();
  for (const t of items) {
    if (!groups.has(t.category)) groups.set(t.category, []);
    groups.get(t.category).push(t);
  }
  const dn = (t) => metrics.get(t.id).domainDownstreams;
  const out = new Map();
  for (const [cat, arr] of groups) {
    const p1 = arr.filter((t) => t.importance === 1);
    const p2 = arr.filter((t) => t.importance === 2);
    out.set(cat, {
      category: cat,
      count: arr.length,
      median: quantile(arr.map(dn), 0.5),
      p20: quantile(arr.map(dn), 0.2),
      p75: quantile(arr.map(dn), 0.75),
      p1ZeroPf: p1.filter((t) => metrics.get(t.id).pf === 0).length,
      p1P20: quantile(p1.map(dn), 0.2),
      p2P20: quantile(p2.map(dn), 0.2),
      p1Count: p1.length,
      p2Count: p2.length,
    });
  }
  return out;
}

const hasWiki = (t) => !!(t.wikiEn && String(t.wikiEn).trim());

/**
 * 六个规则通道的提名（spec §3.2，阈值全部相对本域）。
 * @param {Array} items
 * @param {Map<string, object>} metrics computeMetrics 的返回
 * @param {Map<string, object>} [domainStats] 可选，缺省自动调 computeDomainStats
 * @returns {{
 *   byId: Map<string, string[]>,          // id -> 命中的通道名数组（§3.2 顺序）
 *   channels: Record<string, string[]>,  // 通道名 -> 提名 id 数组（文件序）
 *   counts: Record<string, number>       // 通道名 -> 提名条数
 * }}
 */
export function nominateChannel(items, metrics, domainStats = computeDomainStats(items, metrics)) {
  const channels = Object.fromEntries(CHANNEL_NAMES.map((n) => [n, []]));
  const byId = new Map();
  const hit = (t, name) => {
    channels[name].push(t.id);
    if (!byId.has(t.id)) byId.set(t.id, []);
    byId.get(t.id).push(name);
  };
  for (const t of items) {
    const m = metrics.get(t.id);
    const st = domainStats.get(t.category);
    const dn = m.domainDownstreams;
    // 基石尾组：P1 且（域内下游数 ≤ 本域 P1 的 20 分位 或 直接前置引用为 0）
    if (t.importance === 1 && (dn <= (st.p1P20 ?? -1) || m.pf === 0)) hit(t, '基石尾组');
    // 支柱尾组：P2 且 域内下游数 ≤ 本域 P2 的 20 分位 且 < 本域中位数
    if (t.importance === 2 && dn <= (st.p2P20 ?? -1) && dn < st.median) hit(t, '支柱尾组');
    // 疑被低估：P3+ 且 域内下游数 ≥ 本域 75 分位 且绝对值 > 50
    if (t.importance >= 3 && dn >= st.p75 && dn > 50) hit(t, '疑被低估');
    // 原理零引用：kind=原理 且 被引总数 rf 为 0
    if (t.kind === '原理' && m.rf === 0) hit(t, '原理零引用');
    // 孤岛媒介制度：kind∈{媒介,制度} 且 零被引 且 零出边（prereq 出边）
    if ((t.kind === '媒介' || t.kind === '制度') && m.rf === 0 && !(t.prereqs || []).length)
      hit(t, '孤岛媒介制度');
    // 高档无溯源：P1/P2 且 wikiEn 为空
    if (t.importance <= 2 && !hasWiki(t)) hit(t, '高档无溯源');
  }
  const counts = Object.fromEntries(CHANNEL_NAMES.map((n) => [n, channels[n].length]));
  return { byId, channels, counts };
}

// ============================================================
// 契约 §2：MetricRow（对外唯一行形状，snake_case）
// ============================================================

/** MetricRow 字段清单（契约 §2 原文顺序；dump 与断言都以它为准）。 */
export const METRIC_ROW_FIELDS = Object.freeze([
  'id', 'name', 'nameEn', 'wikiEn', 'importance', 'kind', 'category', 'era',
  'year', 'year_basis', 'desc', 'out_deg',
  'pf', 'rf', 'descendants', 'desc_rank', 'desc_rank_pct', 'desc_zero_share',
  'tier_rank_pct', 'direct_downstream',
]);

const roundPct = (a, b) => (b ? Math.round((a / b) * 10000) / 10000 : 0);
const cmpId = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

/**
 * 契约 §2 全字段指标行（数组，文件序）。域内相对量一律按 category 分组计算。
 * 注意：本文件不提供任何“按绝对阈值筛档位”的便利函数（spec §2 硬约束：
 * 2158/3876 条零直接下游、22 域中 15 个域内下游中位数为 0，绝对阈值会把
 * 补边欠账误判成档位虚高）。
 * @param {Array} items techs.json 条目数组
 * @returns {Array<object>} MetricRow[]
 */
export function buildMetricRows(items) {
  const pf = new Map();
  const rf = new Map();
  const children = new Map(); // id -> Set<直接下游 id>（Set 去重，与探针一致）
  for (const t of items) {
    for (const p of t.prereqs || []) {
      pf.set(p, (pf.get(p) || 0) + 1);
      rf.set(p, (rf.get(p) || 0) + 1);
      if (!children.has(p)) children.set(p, new Set());
      children.get(p).add(t.id);
    }
    for (const r of t.related || []) rf.set(r, (rf.get(r) || 0) + 1);
  }
  const desc = descendantsMap(items);
  const byId = new Map(items.map((t) => [t.id, t]));
  const rec = new Map();
  for (const t of items) {
    const descendants = desc.get(t.id).size;
    const downstream = [...(children.get(t.id) || [])];
    rec.set(t.id, {
      id: t.id,
      name: t.name,
      nameEn: t.nameEn ?? '',
      wikiEn: t.wikiEn ?? '',
      importance: t.importance,
      kind: t.kind,
      category: t.category,
      era: t.era,
      year: t.year ?? null,
      year_basis: t.year_basis ?? null,
      desc: t.desc ?? '',
      out_deg: (t.prereqs || []).length, // prereq 出边；口径理由见文件头
      pf: pf.get(t.id) || 0,
      rf: rf.get(t.id) || 0,
      descendants,
      direct_downstream: downstream.slice(0, 5).map((id) => {
        const d = byId.get(id);
        return { id, name: d ? d.name : null, importance: d ? d.importance : null };
      }),
    });
  }

  // 域内：desc_zero_share / desc_rank / desc_rank_pct（(descendants, pf) 降序，id 破平）
  const domains = new Map();
  for (const t of items) {
    if (!domains.has(t.category)) domains.set(t.category, []);
    domains.get(t.category).push(rec.get(t.id));
  }
  for (const rows of domains.values()) {
    const n = rows.length;
    const share = roundPct(rows.filter((r) => r.descendants === 0).length, n);
    const ordered = rows.slice().sort((a, b) =>
      b.descendants - a.descendants || b.pf - a.pf || cmpId(a.id, b.id));
    ordered.forEach((r, i) => {
      r.desc_rank = i + 1;
      r.desc_rank_pct = roundPct(i + 1, n);
      r.desc_zero_share = share;
    });
  }
  // 同域同代（category 与 era 复合组）内 importance 升序位次 / 组内条数
  const tiers = new Map();
  for (const r of rec.values()) {
    const k = JSON.stringify([r.category, r.era]);
    if (!tiers.has(k)) tiers.set(k, []);
    tiers.get(k).push(r);
  }
  for (const rows of tiers.values()) {
    const n = rows.length;
    rows
      .slice()
      .sort((a, b) => a.importance - b.importance || cmpId(a.id, b.id))
      .forEach((r, i) => {
        r.tier_rank_pct = roundPct(i + 1, n);
      });
  }
  return items.map((t) => rec.get(t.id));
}

/**
 * 契约 §4 六个提名通道，全部在 MetricRow 上算（域内相对；阈值相对本域）。
 * 返回 { members: 通道 -> id 数组, counts, island_full_out_deg: 出边含 related 的对照口径 }
 */
export function channelMembers(rows, items) {
  const members = Object.fromEntries(CHANNEL_NAMES.map((n) => [n, []]));
  const byId = new Map(items.map((t) => [t.id, t]));
  let islandAlt = 0; // 孤岛媒介制度：出边含 related 的对照口径
  const groups = new Map();
  for (const r of rows) {
    if (!groups.has(r.category)) groups.set(r.category, []);
    groups.get(r.category).push(r);
  }
  for (const rs of groups.values()) {
    const ds = rs.map((r) => r.descendants);
    const med = quantile(ds, 0.5);
    const q75 = quantile(ds, 0.75);
    const p1 = rs.filter((r) => r.importance === 1);
    const p2 = rs.filter((r) => r.importance === 2);
    const p34 = rs.filter((r) => r.importance >= 3);
    const b1 = quantile(p1.map((r) => r.descendants), 0.2);
    const b2 = quantile(p2.map((r) => r.descendants), 0.2);
    for (const r of p1) if (r.descendants <= (b1 === undefined ? -1 : b1) || r.pf === 0) members['基石尾组'].push(r.id);
    for (const r of p2) if (r.descendants <= (b2 === undefined ? -1 : b2) && r.descendants < med) members['支柱尾组'].push(r.id);
    for (const r of p34) if (r.descendants >= q75 && r.descendants > 50) members['疑被低估'].push(r.id);
    for (const r of rs) {
      const t = byId.get(r.id) || {};
      // 原理零引用：kind=原理 且 rf==0
      if (r.kind === '原理' && r.rf === 0) members['原理零引用'].push(r.id);
      // 孤岛媒介制度：kind∈{媒介,制度} 且 rf==0 且 out_deg==0（prereq 出边口径）
      if ((r.kind === '媒介' || r.kind === '制度') && r.rf === 0 && r.out_deg === 0) {
        members['孤岛媒介制度'].push(r.id);
        if ((t.prereqs || []).length || (t.related || []).length) islandAlt++;
      }
      // 高档无溯源：importance<=2 且 wikiEn 为空
      if (r.importance <= 2 && !(r.wikiEn && String(r.wikiEn).trim())) members['高档无溯源'].push(r.id);
    }
  }
  for (const k of CHANNEL_NAMES) members[k].sort(cmpId);
  const counts = Object.fromEntries(CHANNEL_NAMES.map((n) => [n, members[n].length]));
  return { members, counts, island_full_out_deg: counts['孤岛媒介制度'] - islandAlt };
}

// ============================================================
// CLI：--dump <path>（契约 §10）/ --selftest（验证 1/2/5）
// ============================================================

let failures = 0;
function check(label, actual, expected) {
  const ok = actual === expected;
  if (!ok) failures++;
  console.log((ok ? 'PASS' : 'FAIL') + ' | ' + label + ' | actual=' + JSON.stringify(actual) + ' expected=' + JSON.stringify(expected));
}
function note(label, value) {
  console.log('NOTE | ' + label + ' | ' + JSON.stringify(value));
}

/** 契约 §4「spec 实测」列，作为口径一致性的硬期望（数字不许为了通过而改）。 */
export const CONTRACT_CHANNEL_BASELINE = Object.freeze({
  基石尾组: 64,
  支柱尾组: 208,
  疑被低估: 23,
  原理零引用: 100,
  孤岛媒介制度: 7,
  高档无溯源: 5,
});

/** 真跑一遍全部口径断言；返回失败条数。 */
export function runSelftest() {
  failures = 0;
  const items = loadTechs();
  const rows = buildMetricRows(items);
  const byId = new Map(items.map((t) => [t.id, t]));

  console.log('== 1. 规模与 spec §2 口径硬检查 ==');
  check('MetricRow 条数 == techs 条数', rows.length, items.length);
  check('条目总数', items.length, 3876);
  const descZero = rows.filter((r) => r.descendants === 0).length;
  const pfZero = rows.filter((r) => r.pf === 0).length;
  check('descendants == 0 的行数（spec §2 实测）', descZero, 2158);
  check('pf == 0 的行数（与上行应等价）', pfZero, 2158);
  check(
    'descendants==0 与 pf==0 集合是否等价（违例数）',
    rows.filter((r) => (r.descendants === 0) !== (r.pf === 0)).length,
    0
  );

  console.log('== 2. 与 scripts/adjud_pool_calibration.py.mjs 同口径的通道规模 ==');
  const { members, counts, island_full_out_deg } = channelMembers(rows, items);
  for (const name of CHANNEL_NAMES) {
    check('通道「' + name + '」命中数 vs 契约 §4 实测', counts[name], CONTRACT_CHANNEL_BASELINE[name]);
  }
  note('孤岛媒介制度的对照口径（出边含 related 时为 0，即契约 §4 的 7 要求 prereq-only 出边）', {
    out_deg_prereq_only: counts['孤岛媒介制度'],
    out_deg_incl_related: island_full_out_deg,
    全库无wikiEn: items.filter((t) => !t.wikiEn || !String(t.wikiEn).trim()).length,
  });

  console.log('== 3. 与探针函数的交叉一致性 ==');
  const legacy = computeMetrics(items);
  const dstats = computeDomainStats(items, legacy);
  check('闭包大小与旧 domainDownstreams 全等（违例数）',
    rows.filter((r) => r.descendants !== legacy.get(r.id).domainDownstreams).length, 0);
  check('pf/rf 与旧 computeMetrics 全等（违例数）',
    rows.filter((r) => r.pf !== legacy.get(r.id).pf || r.rf !== legacy.get(r.id).rf).length, 0);
  check('域数', dstats.size, 22);
  check('域内下游中位数 == 0 的域数（spec §2 实测 15/22）',
    [...dstats.values()].filter((s) => s.median === 0).length, 15);
  check('探针通道「基石尾组」与本实现同集（对称差）',
    (() => {
      const nom = nominateChannel(items, legacy, dstats);
      const a = new Set(nom.channels['基石尾组']); const b = new Set(members['基石尾组']);
      return [...a].filter((x) => !b.has(x)).length + [...b].filter((x) => !a.has(x)).length;
    })(), 0);

  console.log('== 4. MetricRow 形状与值域（契约 §2 全字段） ==');
  const miss = rows.filter((r) => METRIC_ROW_FIELDS.some((f) => r[f] === undefined)).length;
  check('缺字段的行数', miss, 0);
  const extra = rows.filter((r) => Object.keys(r).some((k) => !METRIC_ROW_FIELDS.includes(k))).length;
  check('多出（契约外自创）字段的行数', extra, 0);
  const domainSize = new Map();
  for (const r of rows) domainSize.set(r.category, (domainSize.get(r.category) || 0) + 1);
  check('desc_rank 越界或 pct 越界的行数',
    rows.filter((r) => r.desc_rank < 1 || r.desc_rank > domainSize.get(r.category) ||
      r.desc_rank_pct <= 0 || r.desc_rank_pct > 1 || r.tier_rank_pct <= 0 || r.tier_rank_pct > 1 ||
      r.desc_zero_share < 0 || r.desc_zero_share > 1).length, 0);
  check('direct_downstream 超 5 条的行数', rows.filter((r) => r.direct_downstream.length > 5).length, 0);
  check('direct_downstream 条数 > descendants 的行数',
    rows.filter((r) => r.direct_downstream.length > r.descendants).length, 0);
  check('desc_rank 在本域内唯一（重复计数）',
    (() => {
      const seen = new Set(); let dup = 0;
      for (const r of rows) { const k = r.category + '#' + r.desc_rank; if (seen.has(k)) dup++; seen.add(k); }
      return dup;
    })(), 0);
  check('闭包最大的两条（fire=317 / transistor=250，旧契约 §6 实测）',
    JSON.stringify([legacy.get('fire').absDownstreams, legacy.get('transistor').absDownstreams]),
    JSON.stringify([317, 250]));

  console.log('== 5. 边界用例（只报事实，不放宽判据） ==');
  const inCat = (c) => rows.filter((r) => r.category === c);
  const sp = inCat('space_exploration');
  check('space_exploration 的 P1 条数（任务点名的“只有 4 条 P1”）',
    sp.filter((r) => r.importance === 1).length, 4);
  check('space_exploration 域内中位数 == 0 时 P1 仍可按域内分位筛',
    sp.filter((r) => r.importance === 1 && r.descendants === 0).length,
    members['基石尾组'].filter((id) => byId.get(id).category === 'space_exploration' && byId.get(id).importance === 1).length);
  note('space_exploration 零下游占比 / 基石尾组命中数',
    { desc_zero_share: sp[0].desc_zero_share, 基石尾组: members['基石尾组'].filter((id) => byId.get(id).category === 'space_exploration').length });
  const media0 = rows.filter((r) => r.kind === '媒介' && r.rf === 0);
  check('kind=媒介 且 rf==0 的条目存在（抽样/通道都要能看见它）', media0.length > 0, true);
  note('其中 prereq 出边也为 0（即落进孤岛通道）的',
    media0.filter((r) => r.out_deg === 0).map((r) => r.id + '/related=' + (byId.get(r.id).related || []).length));
  const noHigh = [...domainSize.keys()].filter((c) => !inCat(c).some((r) => r.importance >= 4));
  const noMediaPrinciple = [...domainSize.keys()].filter(
    (c) => !inCat(c).some((r) => r.kind === '原理' || r.kind === '媒介'));
  note('无 importance>=4 条目的域（抽样必须写进 reason，不许静默放宽）', noHigh);
  note('无 原理/媒介 条目的域（同上；实测 energy_power）', noMediaPrinciple);
  const self = readFileSync(fileURLToPath(import.meta.url), 'utf8');
  const codeOnly = self.split('export function runSelftest')[0]; // 排除自检文本自身的字面量
  check('本文件不含 suggested_importance / suggested_kind（契约 §3 防锚定）',
    /suggested_(importance|kind)/.test(codeOnly), false);
  check('本文件唯一的绝对数值筛子 = 疑被低估通道的 descendants > 50（出现次数）',
    (codeOnly.match(/descendants > \d+/g) || []).length, 1);
  return failures;
}

async function main() {
  const argv = process.argv.slice(2);
  const flag = (name) => argv.indexOf(name);
  if (flag('--dump') >= 0) {
    const out = resolve(argv[flag('--dump') + 1] || 'data/adjud/metrics.json');
    const items = loadTechs();
    const rows = buildMetricRows(items);
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, JSON.stringify({ total: items.length, rows }, null, 0) + '\n', 'utf8');
    console.log('dumped total=' + items.length + ' rows=' + rows.length + ' -> ' + out);
    return 0;
  }
  if (flag('--selftest') >= 0) {
    const failed = runSelftest();
    console.log(failed ? '\n' + failed + ' 条断言失败' : '\n全部断言通过');
    return failed ? 1 : 0;
  }
  console.log('用法: node scripts/adjud_lib.mjs --dump <path> | --selftest');
  return 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().then((code) => process.exit(code));
}
