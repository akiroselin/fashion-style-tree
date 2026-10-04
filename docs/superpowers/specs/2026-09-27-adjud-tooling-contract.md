# 复查工具链接口契约 v1

冻结 spec §3–§5 的数据形状与文件所有权。**改本文件需要单独批准**；并行会话只读它，各自只写自己 owner 的文件。
spec：`docs/superpowers/specs/2026-09-27-importance-kind-review-design.md`

## 1. 域分组（5 组）

**唯一真值**：`docs/superpowers/data/domain-groups.json`（脚本读它，不要在代码里抄一份）。
**历史教训**：v1"722–775"未核实（实际 582–1051）；v2 按主题聚组没算重量（512–1048）；v3 手编漏掉 2 个域（合计 3523/3876，被 verify 当场抓到）。
v4 由搜索求解 + 结构自检：极差 15、22 域全覆盖、无重复、合计 = 全库。

| 组 | 领域 | 条数 |
|---|---|---|
| A | chemistry, construction, daily_life, manufacturing, physics | 782 |
| B | computing_systems, earth_space, military, space_exploration, transport | 778 |
| C | culture_media, economy, education_knowledge, governance, info_media | 775 |
| D | algorithms_cs, logic_foundations, math_pure | 774 |
| E | agriculture_food, energy_power, life_medicine, materials | 767 |

执行脚本必须在运行时打印各组真实条数并断言：**并集 = 全库条数（运行时取）、两两不相交、无重复 id、每域恰好属于一组**。
上面条数仅供人看，**不许进断言**；数据变动导致极差 > 100 时重跑 `/tmp` 那类搜索（脚本 `scripts/adjud_domain_groups.mjs`）并如实报告，不要就地手改分组。


## 2. 指标行 MetricRow

从 `data/techs.json`（顶层为数组，3876 条）机械计算，不含任何观点：

```
id, name, nameEn, wikiEn, importance, kind, category, era,
year, year_basis, desc, out_deg,
pf      # 作为他人 prereq 终点的次数（直接前置引用）
rf      # prereq + related 被引总数
descendants      # prereq 传递闭包大小（去环，BFS）
desc_rank        # 域内 (descendants, pf) 降序排名，1 = 本域第一
desc_rank_pct    # desc_rank / 本域条数，越小越靠前
desc_zero_share  # 本域 descendants==0 的占比
tier_rank_pct    # 同域同代（category+era）内 importance 升序位次 / 组内条数
direct_downstream # 直接下游前 5 条 [{id, name, importance}]
```

## 3. 证据卡 card 形状

卡片 = item 全部原始字段 + 上面的 MetricRow + 两个通道字段：

```
channels: [channel_name]      # 命中的所有提名通道
why:      "人类可读的命中理由，含具体数字"
```

**禁止**：`suggested_importance` / `suggested_kind` / 任何模型建议档（spec §4，防锚定）。

## 4. 提名通道名（与 spec §3.2 一致，字符串必须精确）

| channel_name | 规则 | spec 实测 |
|---|---|---|
| 基石尾组 | P1 且（域内下游数 ≤ 本域 P1 的 20 分位 或 pf==0） | 64 |
| 支柱尾组 | P2 且 域内下游数 ≤ 本域 P2 的 20 分位 且 < **本域全档位中位数** | 208 |
| 疑被低估 | P3+ 且 域内下游数 ≥ 本域 75 分位 且 > 50 | 23 |
| 原理零引用 | kind=原理 且 rf==0 | 100 |
| 孤岛媒介制度 | kind∈{媒介,制度} 且 rf==0 且 **out_deg==0（口径 = 仅 prereq 出边，不含 related）** | 7 |
| 高档无溯源 | importance≤2 且 wikiEn 为空 | 5 |
| 判据专项 | 判据 v1 转写的规则（T1 段才存在） | 待定 |

通道命中数只做运行时计数，不写进断言当"预期值"（mark 可能是幂等空操作）。

**两条已被实测逼出来的口径**（改一个数就换一档结果，禁止各自发挥）：
- `支柱尾组` 的中位数 = **本域全档位中位数**；按全库口径中位数实测为 0，该通道命中会变成 0。
- `out_deg` = **仅 prereq 出边**。孤岛媒介制度那 7 条全部带 related 出边，按 prereqs+related 计出边则命中 0。
- `desc_rank` 的并列处理 = **标准竞赛排名**（并列取相同名次，如 1,2,2,4），tie-break 用 `(descendants, pf, id 字典序)`；`*_pct` 保留 4 位小数。此项只影响诊断字段，实测不改任何通道命中（3094/3876 行的 rank 数值会因 tie-break 不同而漂移，故必须统一写法，否则两份产物并排看会误以为指标变了）。
- `out_deg` 与 §2 的 `descendants`/`desc_rank` 一样是 snake_case；任何 camelCase 指标文件（如 `data/adjud-metrics.*.json`）不是本契约产物，不要当输入。

## 5. 文件所有权

| 文件 | 用途 | owner |
|---|---|---|
| `docs/superpowers/.../-design.md` | spec | 主线 |
| `docs/superpowers/specs/2026-09-27-adjud-tooling-contract.md` | 本契约 | 主线 |
| `scripts/adjud_contract_check.mjs` | §7 不变量检查 | 主线 |
| `scripts/adjud_lib.mjs` | §2 指标 | agent-1 |
| `scripts/adjud_calib_sample.mjs` `data/adjud/calib-sample.json` | §6 抽样 | agent-1 |
| `scripts/adjudicate_review.html` | §8 裁决页 | agent-2 |
| `scripts/adjud_cards.mjs` `data/adjud/cards/calib-batch-{1,2}.json` | 证据卡渲染 | agent-2 |
| `scripts/adjud_channels.mjs` `data/adjud/nominations/*.json` | §4 通道 + 漏检 | agent-3 |
| `scripts/adjud_batches.mjs` `data/adjud/batches/group-<组>.json` | §9 快筛分批 | agent-4 |

## 6. 校准批

- 100 条，2 批 × 50
- 每域 ≥3 条；域内不足下限则全量纳入并在 `notes` 里标原因
- 每域必须覆盖：≥1 条 importance≤2、≥1 条 importance≥4、≥1 条 kind∈{原理,媒介}
- 剩余名额按域大小比例分配
- 随机种子 `20260927`；`shuffle` 必须是带种子的确定性实现（mulberry32 + xmur3 之类），不许用 `Math.random`
- `data/adjud/calib-sample.json`：`{seed, ts, total, by_domain:{域:{n, forced_all?:true, reason?}}, batches:[[id×50],[id×50]]}`

## 7. 落盘（分片，永不合并写）

裁决页导出单个分片：

```
data/adjud/adjudication-2026Q4.calib.json
  {shard:"calib", owner:"calib", criteria_version:"v1",
   records:[{id, batch:"calib-1"|"calib-2", channels:[...],
             boundary:"科技"|"非科技保留"|"移出",
             importance:"维持"|1|2|3|4|5|"挂起",
             reason:string, ts:string}]}
```

规则：boundary 三态固定这三个字符串；`非科技保留`/`移出`/改档 必须 `reason.length>0`；一条 id 在一个分片里只能出现一次；calib 的 100 个 id **预留给漏检验证**，任何组不得再裁一遍。

**漏检率的唯一合法分母**（spec §6）：校准批里被用户判为"该动"（改判/移出/换档）的条目中，未被任何通道提名的比例。全样本命中率（12/100 那种）只是参考信息，**不许拿它去卡 1/3 门槛**——通道本来就是捞异常的不是盖均值的。

## 8. 裁决页

单文件 HTML，`file://` 直开，零服务器零依赖（不 import 任何东西，数据用内联 JSON 或页内"选择文件"载入）。进度存 `localStorage`（key 含 shard 名）。每条目两个控件按 §7 的取值；顶部固定显示判据全文（判据 v1 出来前显示 spec §1 的判据原文）。

## 9. 快筛分批（T2，门槛制）

每组 722–775 条按 80–100 条一批切，批内按 (era, importance) 排序，跨批不打散同代同域。
`data/adjud/batches/group-A.json`：`{group, domains:[...], total, batches:[{batch:"A-1", ids:[...], summary:[{id, name, importance, category, era, desc_rank_pct, pf, rf}]}]}`。
一行摘要只出这些字段；用户标"有疑问"才展开完整卡。

## 10. 共享指标产物（消重复实现）

`scripts/adjud_lib.mjs` 除函数外支持 `--dump <path>`，输出 `{seed无关, total, rows:[MetricRow]}` 到 `data/adjud/metrics.json`。
其余脚本一律加 `--metrics <path>`：给了就读它（首选路径，保证全组同一套数字），没给就自带 §2 的实现。**不要 import `adjud_lib.mjs`**——它是 agent-1 的在途文件，import 会让并行会话互相踩。

