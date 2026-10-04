// gB shard 合并器：把 5 份域片段 + 漏检清单装配成契约 §3 的卡片文件
// 产出：data/adjud-cards.gB.json（提名卡）、data/adjud-miss-cards.gB.json（漏检补卡）
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';

const M = JSON.parse(readFileSync(new URL('../data/adjud-metrics.gB.json', import.meta.url), 'utf8'));
const byId = new Map(M.items.map(i => [i.id, i]));
const CARD_FIELDS = ['id', 'name', 'nameEn', 'wikiEn', 'tier', 'kind', 'category', 'era', 'year', 'yearBasis', 'yearNote', 'desc', 'pf', 'rf', 'domainRankPct', 'domainDownstreams', 'absDownstreams', 'topDownstream', 'zeroDownstreamShare', 'channel'];
const card = (src, extra) => {
  const c = {};
  for (const f of CARD_FIELDS) c[f] = src[f];
  return Object.assign(c, extra);
};

const doubts = new Map(), boundary = new Set();
for (const f of readdirSync('data').filter(x => x.startsWith('adjud-frag.gB.') && x.endsWith('.json'))) {
  const j = JSON.parse(readFileSync('data/' + f, 'utf8'));
  for (const it of j.items) {
    if (doubts.has(it.id)) throw new Error('id 跨片段重复: ' + it.id);
    doubts.set(it.id, it.doubt);
  }
  for (const b of (j.boundary || [])) boundary.add(b.id);
}
const nominated = M.items.filter(i => i.channel.length);
const missing = nominated.filter(i => !doubts.has(i.id)).map(i => i.id);
if (missing.length) throw new Error('提名条目缺疑点标注: ' + missing.join(','));

const cards = nominated.map(t => card(t, { doubt: doubts.get(t.id), boundary: boundary.has(t.id) }));
writeFileSync(new URL('../data/adjud-cards.gB.json', import.meta.url), JSON.stringify({ shard: 'gB', count: cards.length, items: cards }, null, 1));

const miss = JSON.parse(readFileSync(new URL('../data/adjud-miss.gB.json', import.meta.url), 'utf8'));
const unknown = miss.items.filter(x => !byId.has(x.id)).map(x => x.id);
if (unknown.length) throw new Error('漏检清单含未知 id: ' + unknown.join(','));
const already = miss.items.filter(x => byId.get(x.id).channel.length).map(x => x.id);
if (already.length) throw new Error('漏检清单与规则命中重叠: ' + already.join(','));
const missCards = miss.items.map(x => card(byId.get(x.id), { doubt: x.reason, kind_of_miss: x.kind_of_miss, channel: ['漏检补提名'], boundary: x.kind_of_miss === 'boundary' }));
writeFileSync(new URL('../data/adjud-miss-cards.gB.json', import.meta.url), JSON.stringify({ shard: 'gB', count: missCards.length, items: missCards }, null, 1));

const tally = {}, b = {};
for (const c of cards) { tally[c.category] = (tally[c.category] || 0) + 1; if (c.boundary) b[c.category] = (b[c.category] || 0) + 1; }
console.log('提名卡', cards.length, JSON.stringify(tally), '其中边界项', Object.values(b).reduce((s, x) => s + x, 0), JSON.stringify(b));
console.log('漏检补卡', missCards.length);
