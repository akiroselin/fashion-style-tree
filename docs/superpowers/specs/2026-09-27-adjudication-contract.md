# 复查裁决接口契约 v1（2026-09-27）

> **本文件已被 `2026-09-27-adjud-tooling-contract.md` 取代**（那里的域分组与条数是实测配平的，本文件 §2 的 754/747/722/757/775 是错的——只加了 4 个域就当全组，实际为 881/1051/690/582/672）。
> 保留本文件的唯一理由：§6 的可执行实测数字基线已由 `scripts/adjud_lib.mjs --selftest` / `scripts/adjud_lib_check.mjs` 落地，那两个脚本仍以这里的数字为硬期望。新读者请直接读 tooling 契约。

并行执行《重要度与收录边界复查计划》的共享约定。
spec：`docs/superpowers/specs/2026-09-27-importance-kind-review-design.md`

## 1. 文件所有权

| 文件 | owner | 说明 |
|---|---|---|
| `docs/superpowers/specs/2026-09-27-adjudication-contract.md` | 主控 | 本文件 |
| `scripts/adjud_lib.mjs` | 代理 LIB | 指标计算（唯一权威实现） |
| `scripts/adjud_lib_check.mjs` | 代理 LIB | 指标断言，须实跑 |
| `scripts/adjud_calib_sample.mjs` | 代理 SAMPLE | 校准批抽样 + 出卡 |
| `data/adjud-calib-sample.json` | 代理 SAMPLE | 100 条 id 清单（测试集，跑完即冻结） |
| `data/adjud-cards.calib.json` | 代理 SAMPLE | 校准批证据卡 |
| `scripts/adjudicate_review.html` | 代理 HTML | 单文件裁决页 |
| `scripts/adjud_nominations_probe.mjs` | 代理 NOM | 各通道提名规模探针 |
| `docs/boundary-criteria-v1.md` | 主控 + 用户 | 校准批裁完才存在 |
| `data/techs.json` 及其余 `data/*` | 无人 | **任何代理不得写** |

代理不得 `git add` / `git commit` / `git stash`（工作树与并行会话共享，暂存区会被别人带进提交）。

## 2. 组划分（写盘分片用，按域，条数 722–775）

| shard | 域 | 条数 |
|---|---|---|
| `calib` | 22 域分层抽样 100 条 | 100 |
| `gA` | math_pure, earth_space, chemistry, logic_foundations | 754 |
| `gB` | algorithms_cs, computing_systems, info_media, physics, materials | 747 |
| `gC` | life_medicine, education_knowledge, economy, culture_media | 722 |
| `gD` | agriculture_food, transport, construction, military | 757 |
| `gE` | governance, manufacturing, daily_life, energy_power, space_exploration | 775 |

一个 shard 只有一个 writer。汇总文件由主控生成。

## 3. 卡片 schema（`data/adjud-cards.<shard>.json`，数组）

```
id, name, nameEn, wikiEn, tier, kind, category, era,
year, yearBasis, yearNote, desc,
pf, rf, domainRankPct, domainDownstreams, absDownstreams,
topDownstream[], zeroDownstreamShare, channel[], doubt
```

- `tier` = importance 1–5；`pf` = 作为他人 prereq 终点的次数；`rf` = 被引总数（prereq + related）
- `domainDownstreams` = 本条在 prereq 图上的传递闭包大小（排除自身，遇环跳过）
- `domainRankPct` = 该值在同 `category` 内的百分位，0–100 整数，升序排名 `(rank-1)/n*100`
- `absDownstreams` = 跨域绝对闭包大小；`topDownstream` = 直接下游 id 前 5 个
- `zeroDownstreamShare` = 本域内 `domainDownstreams == 0` 的条目占比（0–1），用来把"接线欠账"显示在卡顶
- `channel` = 命中的提名通道名数组；`doubt` = 对该条是否算科技/档位的疑点一句话（可空）
- 卡内**不得**出现建议档位或模型判档

## 4. 裁决记录 schema（`data/adjudication-2026Q4.<shard>.json`，数组，append-only）

```
{ id, shard, batch, channel[], tech: "yes"|"keep_flagged"|"remove"|null,
  tier: "keep"|"set"|"hold"|null, tier_value: 1-5|null,
  reason, flagged, ts }
```

- `tech` 三态：算科技 / 非科技但保留（另立标记）/ 移出主库
- `tier`：维持 / 改成 `tier_value` / 证据不足挂起
- `tech` 取 `keep_flagged` 或 `remove`、或 `tier == "set"` 时 `reason` 必填
- `flagged`：快筛批里被标"有疑问"、需展开成完整卡重裁的条目置 true
- 同一 `id` 以最后一条为准；文件只追加不改写历史

## 5. 裁决页数据交换

`scripts/adjudicate_review.html` 走 `file://`，浏览器不能读本地盘，所以：
输入 = 文件选择器加载 `adjud-cards.<shard>.json`（也可粘贴 JSON 文本）；
进度 = `localStorage`，键 `adjud:v1:<shard>:<batchIndex>:<id>`；
输出 = 「导出本片」按钮下载 `adjudication-2026Q4.<shard>.json`。
不得引入 fetch 同源假设、构建工具或 npm 依赖。

## 6. 必须通过的断言（`node scripts/adjud_lib_check.mjs`）

| 量 | 期望 |
|---|---|
| 条目总数 | 3876 |
| `pf == 0` 的条目数 | 2158 |
| 域内中位下游数 == 0 的域数 | 15（22 域中） |
| P1/P2/P3/P4/P5 条数 | 225 / 1607 / 1264 / 697 / 83 |
| `fire` 的绝对闭包下游数 | 317 |
| `transistor` 的绝对闭包下游数 | 250 |
| `kind` 计数 | 工艺1367 器物1143 原理714 制度465 媒介187 |
| `wikiEn` 为空 | 53（P1/P2 内 5） |

数字来自 2026-09-27 实测（`scripts/adjud_pool_calibration.py.mjs`）。断言失败即视为实现有偏差，不许改期望值来通过。
