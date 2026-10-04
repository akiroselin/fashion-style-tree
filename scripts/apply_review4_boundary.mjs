// 应用 docs/reviews/review4/{A,C,D}-needs-user.md 的收录边界裁决
// 用法：node scripts/apply_review4_boundary.mjs [--dry]
// 三态：算=保持原样（只记裁决）；留=加 boundary:"非科技保留"；移=从主库删除 + 存档 + 清掉指向它的引用
import { readFileSync, writeFileSync, renameSync, copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const TECHS = resolve(ROOT, 'data/techs.json');
const DRY = process.argv.includes('--dry');
const SOURCES = ['A', 'C', 'D'].map((g) => ({ g, path: resolve(ROOT, `docs/reviews/review4/${g}-needs-user.md`) }));
const REMOVED_ARCHIVE = resolve(ROOT, 'data/research/boundary-removed-2026Q4.json');
const SHARD = resolve(ROOT, 'data/adjud/adjudication-2026Q4.review4-ACD.json');
const BOUNDARY_VALUE = '非科技保留';

const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));

// ── 1. 解析裁决 ──
const verdicts = [];
for (const { g, path } of SOURCES) {
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    if (!line.trim().startsWith('|')) continue;
    const cells = line.split('|').slice(1, -1).map((s) => s.trim());
    if (cells.length < 4 || cells[0] === 'id' || !/^[a-z0-9_]+$/.test(cells[0])) continue;
    const mark = cells[3][0];
    if (!'算留移'.includes(mark)) throw new Error(`${g}-needs-user 第4列取值无法识别：[${cells[3]}] (${cells[0]})`);
    verdicts.push({ group: g, id: cells[0], name: cells[1], reason: cells[2], mark, advice: cells[3] });
  }
}
const byId = new Map();
for (const v of verdicts) {
  if (byId.has(v.id)) throw new Error(`裁决表内重复 id：${v.id}`);
  byId.set(v.id, v);
}

const techsBefore = readJson(TECHS);
const idsBefore = new Set(techsBefore.map((t) => t.id));
const unknown = verdicts.filter((v) => !idsBefore.has(v.id)).map((v) => v.id);
if (unknown.length) throw new Error(`裁决表里有 ${unknown.length} 个 id 不在主库：${unknown.join(', ')}`);

const toRemove = verdicts.filter((v) => v.mark === '移');
const toKeep = verdicts.filter((v) => v.mark === '留');
const asTech = verdicts.filter((v) => v.mark === '算');
const removeSet = new Set(toRemove.map((v) => v.id));

// ── 2. 构造新库 ──
const removedItems = techsBefore.filter((t) => removeSet.has(t.id));
let prunedEdgeCount = 0;
const edgePrunedFrom = new Map();
const next = techsBefore
  .filter((t) => !removeSet.has(t.id))
  .map((t) => {
    const before = (t.prereqs || []).length + (t.related || []).length;
    const prereqs = (t.prereqs || []).filter((x) => !removeSet.has(x));
    const related = (t.related || []).filter((x) => !removeSet.has(x));
    const dropped = before - prereqs.length - related.length;
    if (dropped) {
      prunedEdgeCount += dropped;
      edgePrunedFrom.set(t.id, dropped);
    }
    const keepVerdict = byId.get(t.id);
    const out = { ...t, prereqs, related };
    if (keepVerdict && keepVerdict.mark === '留') out.boundary = BOUNDARY_VALUE;
    return out;
  });

// ── 3. 不变量（全部运行时推导，不写死条数）──
const problems = [];
const afterIds = new Set(next.map((t) => t.id));
if (next.length !== techsBefore.length - removedItems.length) problems.push('条数不守恒');
for (const t of next) {
  for (const x of [...t.prereqs, ...t.related]) {
    if (!afterIds.has(x)) problems.push(`${t.id} 悬空引用 ${x}`);
    if (removeSet.has(x)) problems.push(`${t.id} 仍引用被移条目 ${x}`);
  }
}
for (const v of toKeep) {
  const t = next.find((x) => x.id === v.id);
  if (t.boundary !== BOUNDARY_VALUE) problems.push(`${v.id} 未带上 boundary 标记`);
}
for (const v of asTech) {
  const t = next.find((x) => x.id === v.id);
  if ('boundary' in t) problems.push(`${v.id} 判"算"却带了 boundary`);
}
for (const it of removedItems) if (!it.name || !byId.get(it.id).reason) problems.push(`${it.id} 存档缺名称或理由`);
if (new Set(removedItems.map((i) => i.id)).size !== toRemove.length) problems.push('存档条数与裁决条数不符');

console.log(`裁决 ${verdicts.length} 条（移 ${toRemove.length}／留 ${toKeep.length}／算 ${asTech.length}）`);
console.log(`主库 ${techsBefore.length} → ${next.length}（实删 ${removedItems.length}）`);
console.log(`清掉的引用位 ${prunedEdgeCount}，来自 ${edgePrunedFrom.size} 个条目`);
console.log(`带上 boundary 标记的条目 ${next.filter((t) => t.boundary).length}`);
if (problems.length) {
  console.log('不变量不通过：\n  ' + [...new Set(problems)].join('\n  '));
  process.exit(1);
}
console.log('不变量全部通过');

if (DRY) {
  console.log('--dry：未写盘');
  const byDomain = {};
  for (const it of removedItems) byDomain[it.category] = (byDomain[it.category] || 0) + 1;
  console.log('被移条目按域', JSON.stringify(byDomain));
  process.exit(0);
}

// ── 4. 落盘（备份 → 原子写 → 存档 → 裁决分片）──
copyFileSync(TECHS, TECHS + '.bak-20260927r4');

const archive = existsSync(REMOVED_ARCHIVE) ? readJson(REMOVED_ARCHIVE) : { date: '2026-09-27', source: 'review4 A/C/D', removed: [] };
const already = new Set(archive.removed.map((r) => r.item.id));
for (const it of removedItems) {
  if (already.has(it.id)) continue;
  archive.removed.push({ id: it.id, verdict: '移出主库', reason: byId.get(it.id).reason, from: byId.get(it.id).group, ts: new Date().toISOString(), item: it });
}
archive.count = archive.removed.length;
mkdirSync(resolve(ROOT, 'data/research'), { recursive: true });
writeFileSync(REMOVED_ARCHIVE + '.tmp', JSON.stringify(archive, null, 2), 'utf8');
renameSync(REMOVED_ARCHIVE + '.tmp', REMOVED_ARCHIVE);

const shard = { shard: 'review4-ACD', owner: 'mainline', criteria_version: 'v1', records: [] };
if (existsSync(SHARD)) shard.records = readJson(SHARD).records || [];
const seen = new Set(shard.records.map((r) => r.id));
for (const v of verdicts) {
  if (seen.has(v.id)) continue;
  shard.records.push({
    id: v.id,
    batch: 'review4-' + v.group,
    channels: [],
    boundary: v.mark === '移' ? '移出' : v.mark === '留' ? '非科技保留' : '科技',
    importance: '维持',
    reason: v.reason,
    ts: new Date().toISOString(),
  });
}
writeFileSync(SHARD + '.tmp', JSON.stringify(shard, null, 2), 'utf8');
renameSync(SHARD + '.tmp', SHARD);

writeFileSync(TECHS + '.tmp', JSON.stringify(next, null, 2) + '\n', 'utf8');
renameSync(TECHS + '.tmp', TECHS);

console.log(`已写 ${TECHS}`);
console.log(`备份 ${TECHS}.bak-20260927r4`);
console.log(`存档 ${REMOVED_ARCHIVE}（累计 ${archive.count} 条）`);
console.log(`裁决分片 ${SHARD}（累计 ${shard.records.length} 条）`);
console.log('改动最大的引用者：' + [...edgePrunedFrom.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, n]) => `${k}(-${n})`).join(' '));
console.log('提醒：scripts/merge_research.py 仍写死了部分被移 id，重跑合并会复活它们。');
