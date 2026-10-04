// adjud_cards.mjs — 证据卡渲染（契约 §3 card 形状 / §2 MetricRow / §4 通道 / §10 指标兜底）
//
// 契约：docs/superpowers/specs/2026-09-27-adjud-tooling-contract.md
// spec ：docs/superpowers/specs/2026-09-27-importance-kind-review-design.md §4（证据卡字段）
//
// 铁律：
// - 卡片只有「item 全部原始字段 + MetricRow + channels + why」，
//   绝不写 suggested_importance / suggested_kind 或任何建议档（spec §4 防锚定）。
// - why 只写机械事实与命中的通道规则（带具体数字），不含观点。
// - 数据源 data/techs.json 只读；本脚本只写 data/adjud/cards/*.json。
// - 不 import scripts/adjud_lib.mjs（agent-1 的在途文件，契约 §10）：
//   有 --metrics 指向的 data/adjud/metrics.json 就优先读它，没有就自带 §2 实现。
//
// 用法：
//   node scripts/adjud_cards.mjs --sample data/adjud/calib-sample.json
//   node scripts/adjud_cards.mjs --ids fire,concrete,hand_axe
//   node scripts/adjud_cards.mjs --channels "data/adjud/nominations/*.json"
//   可选：--techs data/techs.json --metrics data/adjud/metrics.json
//         --out-dir data/adjud/cards --batch-size 50 --shard calib --prefix calib-batch
//         --skip-missing

import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, statSync } from 'node:fs';
import { dirname, join, resolve, basename, relative as relative0 } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');

// ---------- CLI ----------

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) continue;
    const key = a.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) { out[key] = true; continue; }
    out[key] = next; i++;
  }
  return out;
}

const OPT = parseArgs(process.argv.slice(2));

if (OPT.help) {
  console.log(readFileSync(import.meta.filename, 'utf8').split('\n').slice(0, 26).map((l) => l.replace(/^\/\/ ?/, '')).join('\n'));
  process.exit(0);
}

const TECHS = resolve(ROOT, OPT.techs || 'data/techs.json');
const METRICS = resolve(ROOT, OPT.metrics || 'data/adjud/metrics.json');
const OUT_DIR = resolve(ROOT, OPT['out-dir'] || 'data/adjud/cards');
const BATCH_SIZE = Number(OPT['batch-size'] || 50);
const SHARD = String(OPT.shard || 'calib');
const SAMPLE = OPT.sample ? resolve(ROOT, OPT.sample) : null;
const ID_LIST = OPT.ids ? String(OPT.ids).split(',').map((s) => s.trim()).filter(Boolean) : null;
const CHANNEL_GLOBS = OPT.channels ? String(OPT.channels).split(',').map((s) => s.trim()).filter(Boolean) : null;
// 通道模式默认不覆盖校准批文件名（前缀 channel）
const PREFIX = String(OPT.prefix || (CHANNEL_GLOBS && !ID_LIST && !SAMPLE ? 'channel' : 'calib-batch'));

if (!SAMPLE && !ID_LIST && !CHANNEL_GLOBS) {
  console.error('需要 --sample / --ids / --channels 三者之一指定条目来源（见 --help）');
  process.exit(2);
}

// ---------- §2 指标（内置兜底实现）----------

/** 经验分位数：升序后 index = min(len-1, floor(p*len))；空数组返回 undefined。 */
function quantile(values, p) {
  const a = values.slice().sort((x, y) => x - y);
  if (!a.length) return undefined;
  return a[Math.min(a.length - 1, Math.floor(p * a.length))];
}

function r4(x) {
  return x == null ? null : Math.round(x * 10000) / 10000;
}

/**
 * 全量 MetricRow（契约 §2）。口径与 spec §2 / adjud_lib 的注释一致：
 * descendants 在整库 prereq 图上传递闭包（排除自身、遇环跳过），
 * 「域内」只指比较与统计限定在条目自己的 category 内。
 * out_deg = prereq 出边数（related 不计出边，与 §4 孤岛媒介制度规则同口径）。
 */
function computeMetricRows(items) {
  const byId = new Map(items.map((t) => [t.id, t]));
  const pf = new Map(); const rf = new Map();
  const bump = (m, k) => m.set(k, (m.get(k) || 0) + 1);
  for (const t of items) {
    for (const p of t.prereqs || []) { bump(pf, p); bump(rf, p); }
    for (const r of t.related || []) bump(rf, r);
  }
  // 直接下游（children）
  const children = new Map();
  for (const t of items) {
    for (const p of t.prereqs || []) {
      if (!children.has(p)) children.set(p, []);
      if (!children.get(p).includes(t.id)) children.get(p).push(t.id);
    }
  }
  // 传递闭包（后代集合）
  const memo = new Map();
  function descendantsOf(id) {
    if (memo.has(id)) return memo.get(id);
    const s = new Set();
    const stack = [...(children.get(id) || [])];
    while (stack.length) {
      const c = stack.pop();
      if (s.has(c)) continue;
      s.add(c);
      for (const d of children.get(c) || []) if (!s.has(d)) stack.push(d);
    }
    memo.set(id, s);
    return s;
  }
  const descCount = new Map(items.map((t) => [t.id, descendantsOf(t.id).size]));

  // 域（category）分组
  const domains = new Map();
  for (const t of items) {
    if (!domains.has(t.category)) domains.set(t.category, []);
    domains.get(t.category).push(t);
  }
  // 同域同代（category+era）分组
  const cohorts = new Map();
  for (const t of items) {
    const k = `${t.category}\u0000${t.era}`;
    if (!cohorts.has(k)) cohorts.set(k, []);
    cohorts.get(k).push(t);
  }

  const domStat = new Map();
  for (const [cat, arr] of domains) {
    const dn = arr.map((t) => descCount.get(t.id) || 0);
    domStat.set(cat, {
      count: arr.length,
      zeroShare: arr.length ? dn.filter((v) => v === 0).length / arr.length : 0,
    });
  }
  const cohortCount = new Map([...cohorts].map(([k, arr]) => [k, arr.length]));

  const rows = new Map();
  for (const t of items) {
    const st = domStat.get(t.category);
    const dn = descCount.get(t.id) || 0;
    const myPf = pf.get(t.id) || 0;
    // 域内 (descendants, pf) 降序排名，1 = 本域第一（并列取共同最好名次）
    let better = 0;
    for (const g of domains.get(t.category)) {
      const gd = descCount.get(g.id) || 0;
      const gp = pf.get(g.id) || 0;
      if (gd > dn || (gd === dn && gp > myPf)) better++;
    }
    const descRank = better + 1;
    // 同域同代（category+era）内 importance 升序位次，1 = 本组最低档
    const ck = `${t.category}\u0000${t.era}`;
    let lower = 0;
    for (const g of cohorts.get(ck)) if (g.importance < t.importance) lower++;
    const tierPos = lower + 1;
    const cohortN = cohortCount.get(ck);
    rows.set(t.id, {
      id: t.id,
      name: t.name,
      nameEn: t.nameEn,
      wikiEn: t.wikiEn,
      importance: t.importance,
      kind: t.kind,
      category: t.category,
      era: t.era,
      year: t.year,
      year_basis: t.year_basis,
      desc: t.desc,
      out_deg: (t.prereqs || []).length,
      pf: myPf,
      rf: rf.get(t.id) || 0,
      descendants: dn,
      desc_rank: descRank,
      desc_rank_pct: r4(descRank / st.count),
      desc_zero_share: r4(st.zeroShare),
      tier_rank_pct: r4(tierPos / cohortN),
      direct_downstream: (children.get(t.id) || []).slice(0, 5).map((id) => {
        const d = byId.get(id);
        return { id, name: d.name, importance: d.importance };
      }),
    });
  }
  return rows;
}

/**
 * 由 MetricRow 集合推导域内统计（§4 通道阈值 + 卡片上的分位数字）。
 * 只读 rows 的 descendants / pf / desc_zero_share，配合 items 的 importance，
 * 因此共享指标（契约 §10）与内置实现走同一条路，全组数字一致。
 */
function domainStatsFrom(rows, items) {
  const domains = new Map();
  for (const t of items) {
    if (!domains.has(t.category)) domains.set(t.category, []);
    domains.get(t.category).push(t);
  }
  const dnOf = (id) => (rows.get(id) || {}).descendants ?? 0;
  const pfOf = (id) => (rows.get(id) || {}).pf ?? 0;
  const zeroOf = (t) => {
    const r = rows.get(t.id) || {};
    return r.desc_zero_share != null ? r.desc_zero_share : (r.descendants ?? 0) === 0 ? 1 : 0;
  };
  const out = new Map();
  for (const [cat, arr] of domains) {
    const dn = arr.map((t) => dnOf(t.id));
    const p1 = arr.filter((t) => t.importance === 1).map((t) => dnOf(t.id));
    const p2 = arr.filter((t) => t.importance === 2).map((t) => dnOf(t.id));
    const zeroFromRows = arr.map(zeroOf);
    const fromField = arr.some((t) => (rows.get(t.id) || {}).desc_zero_share != null);
    out.set(cat, {
      count: arr.length,
      median: quantile(dn, 0.5),
      p20: quantile(dn, 0.2),
      p75: quantile(dn, 0.75),
      p1P20: quantile(p1, 0.2),
      p2P20: quantile(p2, 0.2),
      zeroShare: fromField
        ? zeroFromRows.reduce((s, v) => s + v, 0) / arr.length
        : arr.length
          ? arr.filter((t) => dnOf(t.id) === 0).length / arr.length
          : 0,
      pfZeroCount: arr.filter((t) => pfOf(t.id) === 0).length,
    });
  }
  return out;
}

// ---------- §4 通道 ----------

/** 通道名（契约 §4 顺序，含 T1 段才出现的判据专项）。 */
const CHANNEL_ORDER = ['基石尾组', '支柱尾组', '疑被低估', '原理零引用', '孤岛媒介制度', '高档无溯源', '判据专项'];

function hasWiki(item) {
  return !!(item.wikiEn && String(item.wikiEn).trim());
}

/**
 * 六个可机械判定的通道（判据专项在 T1 段才存在，只从提名文件透传）。
 *
 * 口径说明：契约 §4「支柱尾组」写的「< 全域中位数」实现为**本域全量条目的下游数中位数**
 * （spec §2/§3.2 的「域内相对」总口径，adjud_lib 同此）。实测本实现命中数复现 spec 的
 * 64 / 208 / 23 / 100 / 7 / 5；若按全库中位数（= 0）该通道会恒空，与 spec 不符。
 *
 * @returns {{names:string[], clauses:string[]}} 通道名严格按契约 §4 字符串，clauses 带具体数字
 */
function channelHits(item, row, st) {
  const names = []; const clauses = [];
  const dn = row.descendants;
  const p1P20 = st.p1P20 ?? -1;
  const p2P20 = st.p2P20 ?? -1;
  const med = st.median ?? 0;
  const p75 = st.p75 ?? Infinity;
  if (item.importance === 1 && (dn <= p1P20 || row.pf === 0)) {
    names.push('基石尾组');
    const whyCond = dn <= p1P20
      ? `域内下游 ${dn} ≤ 本域 P1 的 20 分位 ${p1P20}`
      : `直接前置引用 pf=0（域内下游 ${dn}，本域 P1 的 20 分位 ${p1P20}）`;
    clauses.push(`基石尾组：P1 且 ${whyCond}`);
  }
  if (item.importance === 2 && dn <= p2P20 && dn < med) {
    names.push('支柱尾组');
    clauses.push(`支柱尾组：P2 且域内下游 ${dn} ≤ 本域 P2 的 20 分位 ${p2P20} 且 < 本域中位数 ${med}`);
  }
  if (item.importance >= 3 && dn >= p75 && dn > 50) {
    names.push('疑被低估');
    clauses.push(`疑被低估：P${item.importance} 且域内下游 ${dn} ≥ 本域 75 分位 ${p75} 且绝对值 > 50`);
  }
  if (item.kind === '原理' && row.rf === 0) {
    names.push('原理零引用');
    clauses.push('原理零引用：kind=原理 且 prereq+related 被引总数 rf=0');
  }
  if ((item.kind === '媒介' || item.kind === '制度') && row.rf === 0 && row.out_deg === 0) {
    names.push('孤岛媒介制度');
    clauses.push(`孤岛媒介制度：kind=${item.kind} 且 rf=0 且 out_deg=0`);
  }
  if (item.importance <= 2 && !hasWiki(item)) {
    names.push('高档无溯源');
    clauses.push(`高档无溯源：importance=${item.importance} 且 wikiEn 为空`);
  }
  return { names, clauses };
}

// ---------- 输入源 ----------

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

/** §6 抽样文件：{seed, ts, total, by_domain, batches:[[id×50],[id×50]]} */
function idsFromSample(path) {
  const doc = readJson(path);
  const batches = Array.isArray(doc.batches) ? doc.batches : [];
  const pairs = [];
  batches.forEach((ids, i) => (ids || []).forEach((id) => pairs.push({ id, batch: `calib-${i + 1}` })));
  if (!pairs.length) throw new Error(`${path} 里没有 batches；请改用 --ids`);
  return { pairs, meta: { seed: doc.seed, sample_total: doc.total, by_domain: Object.keys(doc.by_domain || {}).length } };
}

/** 通道提名文件：容忍多种形状，返回 id -> Set(通道名) 与 id 顺序 */
function idsFromChannelFiles(globs) {
  const files = [];
  for (const g of globs) {
    const p = resolve(ROOT, g);
    if (!/[*?]/.test(g)) { if (existsSync(p)) files.push(p); else console.warn(`提名文件不存在，跳过：${g}`); continue; }
    const dir = dirname(p);
    if (!existsSync(dir)) { console.warn(`提名目录不存在，跳过：${dir}`); continue; }
    const rx = new RegExp('^' + basename(p).replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.') + '$');
    for (const f of readdirSync(dir)) if (rx.test(f)) files.push(join(dir, f));
  }
  if (!files.length) throw new Error(`--channels 没有匹配到任何文件：${globs.join(' , ')}`);
  const map = new Map(); const order = [];
  const note = (id, names) => {
    if (!map.has(id)) { map.set(id, new Set()); order.push(id); }
    for (const n of names) map.get(id).add(n);
  };
  for (const f of files) {
    const doc = readJson(f);
    const arr = Array.isArray(doc) ? doc : (doc.nominations || doc.items || doc.entries || null);
    if (Array.isArray(arr)) {
      for (const e of arr) {
        if (typeof e === 'string') { note(e, []); continue; }
        note(e.id, e.channels || (e.channel ? [e.channel] : []));
      }
    } else {
      const chan = doc.channels || doc.by_channel;
      if (chan && !Array.isArray(chan)) for (const [name, ids] of Object.entries(chan)) (ids || []).forEach((id) => note(id, [name]));
      const byId = doc.by_id || doc.byId;
      if (byId) for (const [id, names] of Object.entries(byId)) note(id, Array.isArray(names) ? names : [names]);
      if (Array.isArray(doc.ids)) doc.ids.forEach((id) => note(id, doc.channel ? [doc.channel] : []));
    }
  }
  return { pairs: order.map((id) => ({ id, batch: null })), perIdChannels: map, files: files.map((f) => relative(f)) };
}

function relative(p) {
  const r = relative0(ROOT, p);
  return r.startsWith('..') ? p : r;
}

// ---------- 卡片 ----------

function buildCard(item, row, st, fileChannels) {
  const hit = channelHits(item, row, st);
  const names = [...new Set([...hit.names, ...(fileChannels || [])])].sort(
    (a, b) => CHANNEL_ORDER.indexOf(a) - CHANNEL_ORDER.indexOf(b),
  );
  const clauses = hit.clauses.slice();
  const fromFile = (fileChannels || []).filter((c) => !hit.names.includes(c));
  for (const c of fromFile) clauses.push(`${c}：由提名文件带入（本脚本 §4 规则未复现，通道名以文件为准）`);

  const domN = st.count;
  const dd = row.direct_downstream;
  const why = [
    `机械事实：importance=${row.importance}、kind=${row.kind}、category=${row.category}、era=${row.era}、` +
    `year=${row.year}（year_basis=${row.year_basis || '空'}）。`,
    `引用侧：pf=${row.pf}（作为他人 prereq 终点次数）、rf=${row.rf}（prereq+related 被引总数）、out_deg=${row.out_deg}（prereq 出边）。`,
    `下游侧：descendants=${row.descendants}（prereq 传递闭包），域内排名 ${row.desc_rank}/${domN}（desc_rank_pct=${pct(row.desc_rank_pct)}）；` +
    `本域 ${domN} 条中 descendants==0 占 ${pct(row.desc_zero_share)}。`,
    `档位相对位置：tier_rank_pct=${pct(row.tier_rank_pct)}（同域同代 ${row.category}+${row.era} 内 importance 升序位次/组内条数）。`,
    `wikiEn ${hasWiki(item) ? '有' : '空'}；直接下游前 ${dd.length} 条：${dd.length ? dd.map((d) => `${d.name}(${d.id}, P${d.importance})`).join('、') : '无'}。`,
    names.length
      ? `命中通道：${clauses.map((c) => `【${c}】`).join(' ')}`
      : '命中通道：无（契约 §4 六条规则均未触发）。',
  ].join(' ');

  return { ...item, ...row, channels: names, why };
}

function pct(x) {
  return x == null ? '—' : `${(x * 100).toFixed(1)}%`;
}

// ---------- 主流程 ----------

const items = readJson(TECHS);
if (!Array.isArray(items)) { console.error(`${relative(TECHS)} 顶层不是数组`); process.exit(2); }
const byId = new Map(items.map((t) => [t.id, t]));

let rows = null; let metricsSource = '';
if (existsSync(METRICS) && statSync(METRICS).isFile()) {
  try {
    const doc = readJson(METRICS);
    const list = Array.isArray(doc) ? doc : (doc.rows || doc.metrics || null);
    const need = ['out_deg', 'pf', 'rf', 'descendants', 'desc_rank', 'desc_rank_pct', 'desc_zero_share', 'tier_rank_pct', 'direct_downstream'];
    const ok = Array.isArray(list) && list.length && list.every((r) => r && need.every((k) => k in r));
    if (!ok) throw new Error(`字段不合契约 §2（每行需含 ${need.join(', ')}）`);
    rows = new Map(list.map((r) => [r.id, r]));
    metricsSource = `${relative(METRICS)}（契约 §10 共享指标）`;
  } catch (e) {
    console.warn(`--metrics ${relative(METRICS)} 不可用（${e.message}），退回内置 §2 实现`);
    rows = null;
  }
}
if (!rows) { rows = computeMetricRows(items); metricsSource = '内置契约 §2 实现（data/adjud/metrics.json 不存在）'; }
else if (rows.size < items.length) {
  console.warn(`共享指标只覆盖 ${rows.size}/${items.length} 行，缺失行用内置 §2 实现补齐（通道阈值需要全库分布）`);
  for (const [id, r] of computeMetricRows(items)) if (!rows.has(id)) rows.set(id, r);
}
// §4 通道阈值（域内分位）不属于 §2，两条路径都从同一批 rows 推导，保证与卡片显示同源
const domainStats = domainStatsFrom(rows, items);

const src = SAMPLE ? idsFromSample(SAMPLE) : (ID_LIST ? { pairs: ID_LIST.map((id) => ({ id, batch: null })) } : idsFromChannelFiles(CHANNEL_GLOBS));
const fileChannels = src.perIdChannels || null;

const missing = src.pairs.filter((p) => !byId.has(p.id)).map((p) => p.id);
if (missing.length) {
  console.error(`techs.json 里没有这些 id：${missing.join(', ')}（需要就加 --skip-missing）`);
  if (!OPT['skip-missing']) process.exit(2);
}
const kept = src.pairs.filter((p) => byId.has(p.id));

// 分批：抽样文件已带 batch 名（契约 §7 的 calib-1 / calib-2），其余按 --batch-size 顺序切。
// 文件名与 batch 名是两套：契约 §5 要 calib-batch-{1,2}.json，§7 记录里写 calib-1/calib-2。
const batches = new Map();
const slugOf = (label) => {
  const m = /^calib-(\d+)$/.exec(label);
  return m ? `calib-batch-${m[1]}` : label;
};
kept.forEach((p, i) => {
  const label = p.batch || (PREFIX === 'calib-batch' ? `calib-${Math.floor(i / BATCH_SIZE) + 1}`
    : `${PREFIX}-${Math.floor(i / BATCH_SIZE) + 1}`);
  if (!batches.has(label)) batches.set(label, []);
  batches.get(label).push(p.id);
});

mkdirSync(OUT_DIR, { recursive: true });
const report = [];
const written = [];
for (const [label, ids] of batches) {
  const name = slugOf(label);
  const cards = [];
  for (const id of ids) {
    const item = byId.get(id);
    const row = rows.get(id);
    const st = domainStats.get(item.category);
    cards.push(buildCard(item, row, st, fileChannels ? [...(fileChannels.get(id) || [])] : null));
  }
  const file = join(OUT_DIR, `${name}.json`);
  const counts = {};
  for (const c of cards) for (const ch of c.channels) counts[ch] = (counts[ch] || 0) + 1;
  const doc = {
    shard: SHARD,
    batch: label,
    total: cards.length,
    metrics_source: metricsSource,
    id_source: SAMPLE ? relative(SAMPLE) : (ID_LIST ? '--ids' : src.files.map(relative).join(' , ')),
    channel_counts: counts,
    cards,
  };
  if (src.meta?.seed != null) doc.seed = src.meta.seed;
  if (/^calib-\d+$/.test(label) && !SAMPLE) doc.notes = 'id 来自 --ids（不是 §6 的 100 条抽样；data/adjud/calib-sample.json 落地后用 --sample 重跑覆盖）';
  writeFileSync(file, JSON.stringify(doc, null, 1), 'utf8');
  written.push(doc);
  report.push(`${relative(file)} · ${cards.length} 张卡 · 通道命中 ${Object.keys(counts).length ? JSON.stringify(counts) : '无'}`);
}

// --preview：把本次卡片内联进裁决页，产出可直接 file:// 打开的预览（验证「卡片 JSON 能被页面载入」用）
if (OPT.preview) {
  const pagePath = resolve(ROOT, typeof OPT.preview === 'string' ? OPT.preview : 'scripts/adjudicate_review.html');
  const page = readFileSync(pagePath, 'utf8');
  const json = JSON.stringify(written);
  if (/<\/script/i.test(json)) throw new Error('卡片 JSON 含 </script>，不能内联');
  const rx = /(<!-- INLINE_CARDS_MARKER[\s\S]*?-->\s*<script type="application\/json" id="inline-cards">)([\s\S]*?)(<\/script>)/;
  if (!rx.test(page)) throw new Error(`${relative(pagePath)} 里找不到 INLINE_CARDS_MARKER 锚定的内联卡片槽`);
  const previewPath = join(OUT_DIR, 'preview.html');
  writeFileSync(previewPath, page.replace(rx, (_m, a, _b, c) => `${a}\n${json}\n${c}`), 'utf8');
  report.push(`${relative(previewPath)} · 内联 ${written.length} 个批共 ${kept.length} 张卡（file:// 直开即自动载入）`);
}

console.log(`techs=${items.length} 条 · 指标来源：${metricsSource}`);
for (const r of report) console.log(r);
console.log(`合计 ${kept.length} 张卡写入 ${relative(OUT_DIR)}；卡片字段 = item 原始字段 + 契约 §2 MetricRow + channels + why，未写入任何建议档。`);
