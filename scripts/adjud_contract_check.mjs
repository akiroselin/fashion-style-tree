#!/usr/bin/env node
// 契约不变量检查：docs/superpowers/specs/2026-09-27-adjud-tooling-contract.md
// 用法: node scripts/adjud_contract_check.mjs [--root data/adjud]
// 规模数字一律运行时从 data/techs.json 推导，不写死。
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const argv = process.argv.slice(2);
const arg = (name, dflt) => {
  const i = argv.indexOf('--' + name);
  return i >= 0 ? argv[i + 1] : dflt;
};
const root = resolve(arg('root', 'data/adjud'));
const techs = JSON.parse(readFileSync(resolve('data/techs.json'), 'utf8'));
const byId = new Map(techs.map(t => [t.id, t]));

const fails = [];
const notes = [];
const missing = [];
const check = (ok, msg) => { (ok ? notes : fails).push((ok ? 'PASS ' : 'FAIL ') + msg); return ok; };

const load = rel => {
  const p = resolve(root, rel);
  if (!existsSync(p)) { missing.push(rel); return null; }
  return JSON.parse(readFileSync(p, 'utf8'));
};

// ---- metrics.json (契约 §2 / §10) ----
const METRIC_FIELDS = ['id', 'pf', 'rf', 'descendants', 'desc_rank', 'desc_rank_pct', 'desc_zero_share', 'tier_rank_pct', 'out_deg', 'direct_downstream'];
const m = load('metrics.json');
if (m) {
  check(Array.isArray(m.rows), `metrics.rows 是数组（实际 ${Array.isArray(m.rows) ? m.rows.length : typeof m.rows}）`);
  check(m.total === techs.length, `metrics.total(${m.total}) == techs 条数(${techs.length})`);
  check(m.rows.length === techs.length, `metrics.rows 条数(${m.rows.length}) == techs 条数(${techs.length})`);
  const ids = new Set(m.rows.map(r => r.id));
  check(ids.size === m.rows.length, `metrics.id 无重复（${m.rows.length} 行 / ${ids.size} 唯一）`);
  const lost = techs.filter(t => !ids.has(t.id)).map(t => t.id);
  check(lost.length === 0, `全库 id 都在 metrics 里（缺 ${lost.length}：${lost.slice(0, 5)}）`);
  const missField = m.rows.find(r => METRIC_FIELDS.some(f => r[f] === undefined));
  check(!missField, `每个 MetricRow 都带齐 ${METRIC_FIELDS.length} 个指标字段${missField ? '（首个缺项行: ' + missField.id + '）' : ''}`);
  const badPf = m.rows.filter(r => r.pf !== (techs.reduce((s, t) => s + ((t.prereqs || []).includes(r.id) ? 1 : 0), 0)));
  check(badPf.length === 0, `pf 与直接从 prereqs 引用本条的次数一致（不一致 ${badPf.length}：${badPf.slice(0, 3).map(r => r.id)}）`);
  const badZero = m.rows.filter(r => r.descendants === 0 && (r.desc_rank_pct === undefined || r.desc_rank_pct === null));
  check(badZero.length === 0, `零下游行也有域内排名字段（异常 ${badZero.length}）`);
}

// ---- calib-sample.json (契约 §6) ----
const s = load('calib-sample.json');
if (s) {
  const flat = (s.batches || []).flat();
  check(flat.length === new Set(flat).size, `校准批 id 无重复（${flat.length} 条 / ${new Set(flat).size} 唯一）`);
  check(s.total === flat.length, `sample.total(${s.total}) == batches 展平长度(${flat.length})`);
  const unknown = flat.filter(id => !byId.has(id));
  check(unknown.length === 0, `校准批 id 全在库里（未知 ${unknown.length}：${unknown.slice(0, 5)}）`);
  (s.batches || []).forEach((b, i) => check(Array.isArray(b) && b.length > 0, `batch ${i + 1} 非空（${b ? b.length : 'null'} 条）`));
  const dom = {};
  for (const id of flat) (dom[byId.get(id).category] = dom[byId.get(id).category] || []).push(id);
  const dcount = Object.keys(dom).length;
  const catAll = new Set(techs.map(t => t.category));
  check(dcount === catAll.size, `抽样覆盖全部领域（抽样 ${dcount} / 全库 ${catAll.size}）`);
  const sizes = Object.values(dom).map(x => x.length);
  notes.push(`INFO  抽样每域条数 min=${Math.min(...sizes)} max=${Math.max(...sizes)}`);
}

// ---- nominations/channels.json (契约 §4) ----
const CHANNELS = ['基石尾组', '支柱尾组', '疑被低估', '原理零引用', '孤岛媒介制度', '高档无溯源', '判据专项'];
const nom = load('nominations/channels.json');
if (nom) {
  const rows = nom.items || nom.nominations || nom.rows || (Array.isArray(nom) ? nom : null);
  check(Array.isArray(rows), `channels.json 是列表（${Array.isArray(rows) ? rows.length : typeof rows}）`);
  if (Array.isArray(rows)) {
    const bad = rows.filter(r => !Array.isArray(r.channels) || r.channels.length === 0 || r.channels.some(c => !CHANNELS.includes(c)));
    check(bad.length === 0, `每条提名的 channels 非空且只用契约 §4 通道名（违规 ${bad.length}：${bad.slice(0, 3).map(r => r.id)}）`);
    const noWhy = rows.filter(r => !r.why || !String(r.why).match(/\d/));
    check(noWhy.length === 0, `每条 why 含具体数字（不含数字 ${noWhy.length}：${noWhy.slice(0, 3).map(r => r.id)}）`);
    const dup = rows.length - new Set(rows.map(r => r.id)).size;
    check(dup === 0, `提名表内 id 不重复（重复 ${dup}）`);
    const unknown = rows.filter(r => !byId.has(r.id)).map(r => r.id);
    check(unknown.length === 0, `提名 id 全在库里（未知 ${unknown.length}）`);
  }
}

// ---- batches/*.json (契约 §1 / §9) ----
const groups = ['A', 'B', 'C', 'D', 'E'].map(g => [g, load(`batches/group-${g}.json`)]).filter(([, v]) => v);
if (groups.length) {
  const seen = new Map();
  let overlap = 0;
  for (const [g, v] of groups) for (const b of v.batches || []) for (const it of b.summary || []) {
    if (seen.has(it.id)) overlap++;
    seen.set(it.id, g);
  }
  check(overlap === 0, `五组批次之间无重复 id（重复 ${overlap}）`);
  check(seen.size === techs.length || groups.length < 5, `批次并集覆盖全库（${seen.size} / ${techs.length}，已就位 ${groups.length}/5 组）`);
  for (const [g, v] of groups) {
    const sizes = (v.batches || []).map(b => (b.summary || []).length);
    const off = sizes.filter(n => n < 80 || n > 100);
    check(off.length === 0, `组 ${g} 每批都在 80–100（越界批 ${off.length}：${off}）`);
    const unknown = [...seen.entries()].filter(([, gg]) => gg === g).filter(([id]) => !byId.has(id));
    check(unknown.length === 0, `组 ${g} 的 id 全在库里（未知 ${unknown.length}）`);
  }
  const mf = load('batches/manifest.json');
  if (mf) {
    check(typeof mf.t2_gate === 'string' || mf.t2_pending === true || /20%|推翻率/.test(JSON.stringify(mf)), `manifest 写明 T2 门槛/未启动（spec §3.3）`);
    const gs = mf.groups;
    const summary = Array.isArray(gs)
      ? gs.map(x => x.group + '=' + x.total).join(' ')
      : gs && typeof gs === 'object'
        ? Object.entries(gs).map(([k, v]) => k + '=' + (v.total ?? v.n ?? JSON.stringify(v))).join(' ')
        : '(无 groups 字段)';
    notes.push(`INFO  manifest 分组条数: ${summary || '(空)'}`);
    check(!!mf.t2_gate || /20%|推翻率/.test(mf.status_note || ''), `manifest.t2_gate 与 status_note 存在`);
  }
}

// ---- 裁决分片 (契约 §7) ----
const BOUNDARY = ['科技', '非科技保留', '移出'];
const IMP = ['维持', 1, 2, 3, 4, 5, '挂起'];
for (const rel of existsSync(root) ? (await import('node:fs')).readdirSync(root).filter(f => f.startsWith('adjudication-') && f.endsWith('.json')) : []) {
  const d = load(rel);
  if (!d || !Array.isArray(d.records)) continue;
  const shard = d.shard || rel;
  const bbad = d.records.filter(r => !BOUNDARY.includes(r.boundary));
  check(bbad.length === 0, `${shard}: boundary 只用三态（违规 ${bbad.length}：${bbad.slice(0, 3).map(r => r.id)}）`);
  const ibad = d.records.filter(r => !IMP.includes(r.importance));
  check(ibad.length === 0, `${shard}: importance 取值合法（违规 ${ibad.length}）`);
  const needReason = d.records.filter(r => (r.boundary !== '科技' || (r.importance !== '维持' && r.importance !== '挂起')) && !(r.reason && r.reason.trim().length > 0));
  check(needReason.length === 0, `${shard}: 改判/移出/换档都带理由（缺 ${needReason.length}：${needReason.slice(0, 3).map(r => r.id)}）`);
  const dup = d.records.length - new Set(d.records.map(r => r.id)).size;
  check(dup === 0, `${shard}: 分片内 id 不重复（重复 ${dup}）`);
  const calib = load('calib-sample.json');
  if (calib && shard !== 'calib') {
    const cs = new Set(calib.batches.flat());
    const crossed = d.records.filter(r => cs.has(r.id));
    check(crossed.length === 0, `${shard}: 未重裁 calib 预留的 100 条（违规 ${crossed.length}）`);
  }
}

console.log(notes.join('\n'));
if (missing.length) console.log('SKIP 尚未就位: ' + missing.join(', '));
if (fails.length) { console.log('\n' + fails.join('\n')); console.log(`\n${fails.length} 项不合格`); process.exit(1); }
console.log(`\n全部 ${notes.filter(n => n.startsWith('PASS')).length} 项通过${missing.length ? `，${missing.length} 项待补` : ''}`);
