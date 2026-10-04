// 校准批 100 条 → 可离线填写的 markdown 裁决文档
// 用法：node scripts/adjud_calib_doc.mjs [输出路径]
// 只读三个既有产物：data/adjud/calib-sample.json（§6 抽样）、data/adjud/metrics.json（§10 共享指标）、data/techs.json
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/(\w:)/, '$1');
const OUT = resolve(ROOT, process.argv[2] ?? 'docs/reviews/calib-adjudication-2026Q4.md');

const read = (p) => JSON.parse(readFileSync(resolve(ROOT, p), 'utf8'));
const techs = read('data/techs.json');
const sample = read('data/adjud/calib-sample.json');
const metricsFile = read('data/adjud/metrics.json');

const byId = new Map(techs.map((t) => [t.id, t]));
const M = new Map(metricsFile.rows.map((r) => [r.id, r]));
const NOM = new Map((read('data/adjud/nominations/channels.json').items || []).map((r) => [r.id, r]));
const pct = (v) => (v == null ? '—' : (v * 100).toFixed(1) + '%');
const batches = sample.batches;

const missing = batches.flat().filter((id) => !byId.has(id) || !M.has(id));
if (missing.length) {
  console.error('缺条目（拒绝出文档）：' + missing.slice(0, 10).join(', '));
  process.exit(1);
}
const overlap = batches[0].filter((id) => batches.slice(1).some((b) => b.includes(id)));
if (overlap.length) {
  console.error('批间重复 id：' + overlap.join(', '));
  process.exit(1);
}

// 阅读顺序 = 按批 → 域 → 档位升序 → id；编号在此顺序上连号，答题区与逐条证据共用
let seq = 0;
const VIEW = batches.map((batch) =>
  batch
    .map((id) => ({ id, t: byId.get(id), m: M.get(id) }))
    .sort((a, b) => a.t.category.localeCompare(b.t.category) || a.t.importance - b.t.importance || a.id.localeCompare(b.id))
    .map((e) => ({ ...e, n: ++seq }))
);

// 每域零下游占比（指标里的域级量，取该域任一条的 desc_zero_share）
const zeroShare = new Map();
for (const r of metricsFile.rows) if (!zeroShare.has(r.category)) zeroShare.set(r.category, r.desc_zero_share);
const domainSize = new Map();
for (const r of metricsFile.rows) domainSize.set(r.category, (domainSize.get(r.category) || 0) + 1);
const TIER_NAME = { 1: '基石', 2: '支柱', 3: '域内重要', 4: '改良细分', 5: '长尾' };

const lines = [];
const p = (s = '') => lines.push(s);

p('# 校准批裁决清单（判 100 条，离线填写）');
p();
p(`- 抽样：\`data/adjud/calib-sample.json\`（seed ${sample.seed}，实测 ${sample.total} 条 = ${batches.map((b) => b.length).join(' + ')}）；指标：\`data/adjud/metrics.json\`（实测 ${metricsFile.rows.length} 行）`);
p(`- 覆盖 ${Object.keys(sample.by_domain).length} 个领域`);
p(`- 本清单的 100 个 id **预留给漏检验证**，后续各组不再重裁（契约 §7）`);
p(`- 每条只答两问：**边界**（是否算科技，三态）与 **档位**（维持 / 改成 1-5 / 挂起）；改判或移出必须写一句理由`);
p();
p('## 判据（裁之前先扫一眼）');
p();
p('**档位**（CONTRIBUTING §4，数字越小越重要）：1 基石＝后续一大片领域建立在它之上（火、轮、晶体管）｜2 领域支柱（蒸汽机、DNA 结构）｜3 领域内重要（感应电动机）｜4 改良与细分（超外差接收机）｜5 长尾补充（具体机型、单一工艺）。判据是**"抽掉它，后面有多少条科技站不住"**，不是"它出名不出名"。同一时代同领域里 1 档应当是少数。');
p();
p('**边界**（本库尚无书面定义，这 100 条的裁决就是它 v1 的来源）：三态 = `算` / `非科技保留`（不是科技，但作为对照或载体留在库里，另立标记）/ `移出`（不该在主库里）。判断时问的是"它是不是一条**被后续科技站在上面的**技术节点"，而不是"它重不重要"。');
p();
p('**本库结构信号的可信度（重要，避免被数字误导）**：');
p(`- 全库 ${metricsFile.rows.filter((r) => r.pf === 0).length} / ${metricsFile.rows.length} 条没有任何直接下游，"域内下游排名"这类数字衡量的是**接线完整度**，不全是重要度。`);
p('- 一个条目排名靠后（数字大）有两种病因：下游确实少 = 档位可能虚高；下游有但没把边指回来 = 接线欠账。卡上的 `直下` 为 0 而你觉得它显然有下游时，属于后者。');
p();
p('### 各域"零下游占比"（越高越说明该域的排名不可信）');
p();
p('| 领域 | 零下游占比 | 域条数 | | 领域 | 零下游占比 | 域条数 |');
p('|---|---|---|---|---|---|---|');
const zs = [...zeroShare.entries()].sort((a, b) => b[1] - a[1]);
for (let i = 0; i < zs.length; i += 2) {
  const l = zs[i], r = zs[i + 1];
  p(`| ${l[0]} | ${pct(l[1])} | ${domainSize.get(l[0])} | | ${r ? r[0] : ''} | ${r ? pct(r[1]) : ''} | ${r ? domainSize.get(r[0]) : ''} |`);
}
p();
p('---');
p();
p('## 答题区（在这里打勾 / 填数字，其余部分只读）');
p();
p('填法：`边界` 列写 `算` / `留` / `移`；`档位` 列写 `=`（维持）/ `4`（改成该档）/ `?`（挂起）；`理由` 列在写 `留` `移` 或改档时必填。');
p();
p('| # | id | 名称 | 现档 | 边界 | 档位 | 理由 |');
p('|---|---|---|---|---|---|---|');
const all = VIEW.flat();
for (const { id, t, n } of all) p(`| ${n} | ${id} | ${t.name} | ${t.importance} | | | |`);
p();
p('---');
p();
p('## 逐条证据');
p();
VIEW.forEach((rows, bi) => {
  p(`## 批 ${bi + 1}（${rows.length} 条）`);
  p();
  let lastCat = null;
  for (const { id, t, m, n } of rows) {
    if (t.category !== lastCat) {
      p();
      p(`### ${t.category}　（本域 ${domainSize.get(t.category)} 条，零下游占 ${pct(zeroShare.get(t.category))}）`);
      lastCat = t.category;
    }
    p();
    p(`#### ${n}. ${t.name}｜${t.nameEn || '—'}`);
    p();
    p(`- **${id}** ｜ 现档 ${t.importance}（${TIER_NAME[t.importance]}）｜ kind ${t.kind} ｜ ${t.era} ｜ 年份 ${m.year ?? t.year ?? '—'}（${t.year_basis || '—'}）`);
    p(`- 溯源 wikiEn：\`${t.wikiEn || '（空）'}\``);
    p(`- 结构：前置引用 pf=${m.pf} ｜ 被引总数 rf=${m.rf} ｜ 传递下游=${m.descendants} ｜ 域内下游排名 ${m.desc_rank}/${domainSize.get(t.category)}（越靠前越像支柱，此处第 ${pct(m.desc_rank_pct)} 位）｜ 直接下游 ${m.direct_downstream.length} 条${m.direct_downstream.length ? '：' + m.direct_downstream.map((d) => `${d.name}(P${d.importance})`).join('、') : ''}`);
    p(`- 它的前置：${(t.prereqs || []).length ? t.prereqs.map((x) => byId.get(x)?.name || x).join('、') : '（无）'}`);
    p(`- desc：${t.desc || '（空）'}`);
    const nom = NOM.get(id);
    if (nom) p(`- 提名通道（规则也捞到了它）：${nom.channels.join(' / ')} ｜ ${nom.why}`);
    p(`- 裁决：边界 ☐算 ☐留 ☐移 ｜ 档位 ☐维持 ☐改＿ ☐挂起 ｜ 理由：＿＿＿＿＿＿`);
  }
});
p();
p('---');
p();
p(`生成：\`node scripts/adjud_calib_doc.mjs\` ｜ 数据快照 seed ${sample.seed}`);

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, lines.join('\n') + '\n', 'utf8');
console.log(`已写 ${OUT}`);
console.log(`条目 ${all.length}（批 ${batches.map((b) => b.length).join('/')}）、覆盖域 ${new Set(all.map((e) => byId.get(e.id).category)).size}、被规则提名 ${all.filter((e) => NOM.has(e.id)).length}`);
const tiers = {};
for (const e of all) { const t = byId.get(e.id); tiers['P' + t.importance] = (tiers['P' + t.importance] || 0) + 1; }
console.log('档位分布', JSON.stringify(tiers));
const kinds = {};
for (const e of all) { const t = byId.get(e.id); kinds[t.kind] = (kinds[t.kind] || 0) + 1; }
console.log('kind 分布', JSON.stringify(kinds));
