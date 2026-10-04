// 点击聚焦的口径校验：改图数据或改 kHopDepth 后重跑
//   node scripts/focus_graph_check.mjs
// 断言的是"设计前提是否仍然成立"（聚焦不限流、名称钉住上限 40）；
// 具体分位数随数据复查批次变化，所以只打印不写死。
import { readFileSync } from 'node:fs'
import { buildGraph, kHopDepth, NOT_RELATED } from '../src/graph.ts'

const techs = JSON.parse(readFileSync('data/techs.json', 'utf8'))
const ids = techs.map(t => t.id)
const g = buildGraph(ids, techs.map(t => t.prereqs ?? []))

const q = v => {
  const s = [...v].sort((a, b) => a - b)
  const at = p => s[Math.floor(s.length * p)]
  return { p50: at(0.5), p90: at(0.9), p99: at(0.99), max: s[s.length - 1] }
}
const size = (i, hops) => {
  const d = kHopDepth(g, i, hops, new Int8Array(g.count))
  let n = 0
  for (let k = 0; k < d.length; k++) if (d[k] !== NOT_RELATED) n++
  return n - 1 // 不含自身
}
const one = ids.map((_, i) => size(i, 1))
const two = ids.map((_, i) => size(i, 2))
const q1 = q(one), q2 = q(two)
const isolated = one.filter(n => n === 0).length
const prereqEntries = techs.reduce((n, t) => n + (t.prereqs ?? []).length, 0)

const fail = []
const expect = (name, ok, detail) => { if (!ok) fail.push(`${name}：${detail}`) }

// 结构不变量：每条 prereq 都该有对应的弧（端点解析不上的会被丢掉）
expect('弧线数与 prereq 条目数守恒', g.edges.length === prereqEntries,
  `图上 ${g.edges.length} 条，数据 ${prereqEntries} 条 → 有悬空前置`)
// 不限流的依据：p90 一旦越过 60，"名称钉住 40 个"就不再够用，得回头限深或限流
expect('2 跳集 p90 仍在不限流的余量内', q2.p90 <= 60, `p90 = ${q2.p90}`)
expect('2 跳集 max 未爆到全塔', q2.max <= 400, `max = ${q2.max}，全库 ${g.count}`)
// 多数节点至少有一条连线，否则"点击看关联"对它们没有意义
expect('1 跳集中位数不为 0', q1.p50 >= 1, `p50 = ${q1.p50}`)
expect('零邻居节点占比不超过两成', isolated / g.count <= 0.2,
  `${isolated}/${g.count} = ${(isolated / g.count * 100).toFixed(1)}%`)
// 2 跳集必然包含 1 跳集
expect('2 跳集包含 1 跳集', two.every((n, i) => n >= one[i]), '存在 2 跳集反而更小的节点')
// 零邻居节点聚焦后只剩自己：界面表现是"整塔压暗、只留一个白点"
const iso = one.findIndex(n => n === 0)
const isoDepth = kHopDepth(g, iso, 2, new Int8Array(g.count))
let isoSet = 0
for (const v of isoDepth) if (v >= 0) isoSet++
expect('零邻居节点的聚焦集只剩自己', isoSet === 1 && isoDepth[iso] === 0, `集大小 ${isoSet}`)

console.log(`节点 ${g.count} · 弧线 ${g.edges.length} · 零邻居 ${isolated}`)
console.log(`1 跳集 ${JSON.stringify(q1)}`)
console.log(`2 跳集 ${JSON.stringify(q2)}`)
if (fail.length) {
  console.error('FAIL\n' + fail.join('\n'))
  process.exit(1)
}
console.log('OK：聚焦的设计前提仍然成立（不限流 + 名称钉住 40 个）')
