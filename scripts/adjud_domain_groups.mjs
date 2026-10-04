#!/usr/bin/env node
// 域分组求解器：按 data/techs.json 运行时条数，产出极差最小、主题尽量相邻的 5 组。
// 用法: node scripts/adjud_domain_groups.mjs [--write docs/superpowers/data/domain-groups.json]
// 契约 §1 的唯一真值由本脚本生成；手抄分组已连续三轮出错（漏域、重复、算错和）。
import { readFileSync, writeFileSync } from 'node:fs';

const c = {};
for (const t of JSON.parse(readFileSync('data/techs.json', 'utf8'))) c[t.category] = (c[t.category] || 0) + 1;
const doms = Object.keys(c);
const total = Object.values(c).reduce((a, b) => a + b, 0);
const K = 5;
const sum = s => s.reduce((a, d) => a + c[d], 0);

// 主题族：只用于在同等均衡度里挑人类可读的那个，不是硬约束
const fam = {
  formal: ['math_pure', 'logic_foundations', 'algorithms_cs'],
  phys: ['physics', 'chemistry', 'earth_space', 'space_exploration'],
  life: ['life_medicine', 'agriculture_food', 'materials', 'energy_power'],
  media: ['info_media', 'culture_media', 'education_knowledge', 'economy', 'governance'],
  eng: ['construction', 'transport', 'manufacturing', 'military', 'daily_life', 'computing_systems'],
};
const coh = g => g.reduce((acc, s) => {
  const f = {};
  for (const d of s) for (const [k, v] of Object.entries(fam)) if (v.includes(d)) f[k] = (f[k] || 0) + 1;
  return acc + Object.values(f).reduce((a, n) => a + Math.max(0, n - 1), 0);
}, 0);
const spread = g => { const w = g.map(sum); return Math.max(...w) - Math.min(...w); };
const cost = g => -coh(g) * 20 + Math.max(0, spread(g) - 120) * 5000 + spread(g);

let seed = 20260927;
const rnd = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };

let best = null, bestC = Infinity;
for (let restart = 0; restart < 12; restart++) {
  let cur = Array.from({ length: K }, () => []);
  for (const d of doms.slice().sort((a, b) => c[b] - c[a] || rnd() - .5)) {
    let bi = 0;
    for (let i = 1; i < K; i++) if (sum(cur[i]) < sum(cur[bi])) bi = i;
    cur[bi].push(d);
  }
  for (let it = 0; it < 120000; it++) {
    const i = Math.floor(rnd() * K); let j = Math.floor(rnd() * K);
    if (i === j) continue;
    const snap = cur.map(g => g.slice());
    if (rnd() < .4 && cur[i].length) cur[j].push(cur[i].splice(Math.floor(rnd() * cur[i].length), 1)[0]);
    else if (cur[i].length && cur[j].length) {
      const a = Math.floor(rnd() * cur[i].length), b = Math.floor(rnd() * cur[j].length);
      const t = cur[i][a]; cur[i][a] = cur[j][b]; cur[j][b] = t;
    }
    if (cost(cur) > cost(snap)) cur = snap;
    if (cost(cur) < bestC) { bestC = cost(cur); best = cur.map(g => g.slice()); }
  }
}

best.sort((a, b) => sum(b) - sum(a));
const flat = best.flat();
const dup = flat.filter((x, i) => flat.indexOf(x) !== i);
const unc = doms.filter(d => !flat.includes(d));
const bad = flat.filter(d => !(d in c));
if (dup.length || unc.length || bad.length || sum(flat) !== total) {
  console.error('结构校验失败: 重复=' + dup + ' 未覆盖=' + unc + ' 未知域=' + bad + ' 合计=' + sum(flat) + '/' + total);
  process.exit(1);
}
const out = Object.fromEntries(best.map((g, i) => [String.fromCharCode(65 + i), g.slice().sort()]));
console.log('极差', spread(best), '| 各大小', best.map(sum).join(','), '| 内聚分', coh(best), '| 域', flat.length + '/' + doms.length, '| 合计', sum(flat) + '/' + total);
best.forEach((g, i) => console.log(String.fromCharCode(65 + i), sum(g), '[' + g.slice().sort().join(', ') + ']'));
const wIdx = process.argv.indexOf('--write');
if (wIdx >= 0) { writeFileSync(process.argv[wIdx + 1], JSON.stringify(out, null, 2) + '\n'); console.log('written ->', process.argv[wIdx + 1]); }
