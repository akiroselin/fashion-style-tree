// 复现 spec §3.2 提名通道规模的探针：node scripts/adjud_pool_calibration.py.mjs
import { readFileSync } from 'node:fs';
const A = JSON.parse(readFileSync(new URL('../data/techs.json', import.meta.url), 'utf8'));
const pf = {}, rf = {};
for (const t of A) {
  for (const p of (t.prereqs || [])) { pf[p] = (pf[p] || 0) + 1; rf[p] = (rf[p] || 0) + 1; }
  for (const r of (t.related || [])) { rf[r] = (rf[r] || 0) + 1; }
}
const ch = {};
for (const t of A) for (const p of (t.prereqs || [])) (ch[p] = ch[p] || new Set()).add(t.id);
const memo = new Map();
function desc(id) {
  if (memo.has(id)) return memo.get(id);
  const s = new Set(); const st = [...(ch[id] || [])];
  while (st.length) { const c = st.pop(); if (s.has(c)) continue; s.add(c); for (const d of (ch[c] || [])) if (!s.has(d)) st.push(d); }
  memo.set(id, s); return s;
}
const dn = new Map(A.map(t => [t.id, desc(t.id).size]));
const q = (arr, p) => { const a = arr.slice().sort((x, y) => x - y); return a[Math.min(a.length - 1, Math.floor(p * a.length))]; };
const groups = {};
for (const t of A) (groups[t.category] = groups[t.category] || []).push(t);
const out = { 基石尾组: [], 支柱尾组: [], 被低估: [], 领域尾组: {} };
for (const [cat, arr] of Object.entries(groups)) {
  const ds = arr.map(t => dn.get(t.id));
  const p1 = arr.filter(t => t.importance === 1), p2 = arr.filter(t => t.importance === 2), p34 = arr.filter(t => t.importance >= 3);
  const med = q(ds, 0.5), q75 = q(ds, 0.75);
  const b1 = q(p1.map(t => dn.get(t.id)), 0.2), b2 = q(p2.map(t => dn.get(t.id)), 0.2);
  out.领域尾组[cat] = { n: arr.length, p1: p1.length, p2: p2.length, med, q75, p1_p20: b1, p2_p20: b2, p1_below_med: p1.filter(t => dn.get(t.id) < med).length, p2_below_med: p2.filter(t => dn.get(t.id) < med).length };
  for (const t of p1) if (dn.get(t.id) <= b1 || (pf[t.id] || 0) === 0) out.基石尾组.push(t.id + '|' + dn.get(t.id) + '|' + pf[t.id]);
  for (const t of p2) if (dn.get(t.id) <= b2 && dn.get(t.id) < med) out.支柱尾组.push(t.id + '|' + dn.get(t.id) + '|' + pf[t.id]);
  for (const t of p34) if (dn.get(t.id) >= q75 && dn.get(t.id) > 50) out.被低估.push(t.category + ':' + t.id + '|P' + t.importance + '|' + dn.get(t.id));
}
console.log('领域统计'); for (const [k, v] of Object.entries(out.领域尾组)) console.log(k, JSON.stringify(v));
console.log('基石尾组', out.基石尾组.length);
console.log('支柱尾组', out.支柱尾组.length);
console.log('被低估提名', out.被低估.length, out.被低估.slice(0, 15).join(' '));
