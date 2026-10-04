# 校准批裁决清单（判 100 条，离线填写）

- 抽样：`data/adjud/calib-sample.json`（seed 20260927，实测 100 条 = 50 + 50）；指标：`data/adjud/metrics.json`（实测 3876 行）
- 覆盖 22 个领域
- 本清单的 100 个 id **预留给漏检验证**，后续各组不再重裁（契约 §7）
- 每条只答两问：**边界**（是否算科技，三态）与 **档位**（维持 / 改成 1-5 / 挂起）；改判或移出必须写一句理由

## 判据（裁之前先扫一眼）

**档位**（CONTRIBUTING §4，数字越小越重要）：1 基石＝后续一大片领域建立在它之上（火、轮、晶体管）｜2 领域支柱（蒸汽机、DNA 结构）｜3 领域内重要（感应电动机）｜4 改良与细分（超外差接收机）｜5 长尾补充（具体机型、单一工艺）。判据是**"抽掉它，后面有多少条科技站不住"**，不是"它出名不出名"。同一时代同领域里 1 档应当是少数。

**边界**（本库尚无书面定义，这 100 条的裁决就是它 v1 的来源）：三态 = `算` / `非科技保留`（不是科技，但作为对照或载体留在库里，另立标记）/ `移出`（不该在主库里）。判断时问的是"它是不是一条**被后续科技站在上面的**技术节点"，而不是"它重不重要"。

**本库结构信号的可信度（重要，避免被数字误导）**：
- 全库 2158 / 3876 条没有任何直接下游，"域内下游排名"这类数字衡量的是**接线完整度**，不全是重要度。
- 一个条目排名靠后（数字大）有两种病因：下游确实少 = 档位可能虚高；下游有但没把边指回来 = 接线欠账。卡上的 `直下` 为 0 而你觉得它显然有下游时，属于后者。

### 各域"零下游占比"（越高越说明该域的排名不可信）

| 领域 | 零下游占比 | 域条数 | | 领域 | 零下游占比 | 域条数 |
|---|---|---|---|---|---|---|
| daily_life | 76.0% | 129 | | culture_media | 69.8% | 149 |
| earth_space | 65.7% | 143 | | military | 65.5% | 113 |
| construction | 65.1% | 129 | | life_medicine | 64.1% | 323 |
| transport | 61.9% | 194 | | space_exploration | 61.5% | 52 |
| algorithms_cs | 61.4% | 127 | | agriculture_food | 58.2% | 146 |
| energy_power | 57.7% | 168 | | info_media | 57.5% | 292 |
| computing_systems | 56.9% | 276 | | education_knowledge | 55.3% | 94 |
| math_pure | 50.4% | 611 | | materials | 47.7% | 130 |
| chemistry | 47.3% | 91 | | manufacturing | 44.4% | 207 |
| physics | 42.9% | 226 | | economy | 41.1% | 124 |
| logic_foundations | 38.9% | 36 | | governance | 35.3% | 116 |

---

## 答题区（在这里打勾 / 填数字，其余部分只读）

填法：`边界` 列写 `算` / `留` / `移`；`档位` 列写 `=`（维持）/ `4`（改成该档）/ `?`（挂起）；`理由` 列在写 `留` `移` 或改档时必填。

| # | id | 名称 | 现档 | 边界 | 档位 | 理由 |
|---|---|---|---|---|---|---|
| 1 | golden_rice | 黄金大米 | 2 | | | |
| 2 | secondary_products_revolution | 次级产品革命 | 2 | | | |
| 3 | ox_yoke | 牛轭 | 4 | | | |
| 4 | rotary_quern | 旋转磨盘 | 4 | | | |
| 5 | microprocessor | 微处理器 | 1 | | | |
| 6 | moore_law | 摩尔定律 | 2 | | | |
| 7 | z3_computer | Z3 计算机 | 2 | | | |
| 8 | ipod | iPod | 3 | | | |
| 9 | smart_card | 智能卡 | 5 | | | |
| 10 | high_voltage_direct_current | 高压直流输电 | 2 | | | |
| 11 | pressurized_water_reactor | 压水反应堆 | 2 | | | |
| 12 | thyristor | 晶闸管 | 3 | | | |
| 13 | candu_reactor | CANDU重水堆 | 4 | | | |
| 14 | crank_connecting_rod | 曲柄连杆机构 | 4 | | | |
| 15 | integrated_circuit | 集成电路 | 1 | | | |
| 16 | lithography | 石版印刷 | 3 | | | |
| 17 | nsfnet | NSFNET | 3 | | | |
| 18 | crowdsourcing | 众包 | 4 | | | |
| 19 | stereotype_printing | 铅版印刷 | 4 | | | |
| 20 | esim | eSIM | 5 | | | |
| 21 | dna_double_helix | DNA双螺旋 | 1 | | | |
| 22 | measles_vaccine | 麻疹疫苗 | 3 | | | |
| 23 | ebers_papyrus | 埃伯斯纸草卷 | 4 | | | |
| 24 | halothane | 氟烷 | 4 | | | |
| 25 | operating_microscope | 手术显微镜 | 4 | | | |
| 26 | ophthalmoscope | 检眼镜 | 4 | | | |
| 27 | entscheidungsproblem | 判定问题 | 2 | | | |
| 28 | stone_tools | 打制石器 | 1 | | | |
| 29 | silicon_interposer_2p5d | 硅中介层互连 | 2 | | | |
| 30 | kraft_process | 硫酸盐法制浆 | 3 | | | |
| 31 | mosaic | 镶嵌工艺 | 4 | | | |
| 32 | scraper | 刮削器 | 4 | | | |
| 33 | calculus | 微积分学 | 1 | | | |
| 34 | erlang_queueing_theory | 厄尔朗排队论 | 2 | | | |
| 35 | hausdorff_space | 豪斯多夫空间 | 2 | | | |
| 36 | spectral_sequence | 谱序列 | 2 | | | |
| 37 | convex_combination | 凸组合 | 3 | | | |
| 38 | runge_theorem | 龙格逼近定理 | 3 | | | |
| 39 | achilles_number | 阿喀琉斯数 | 4 | | | |
| 40 | shulba_sutras | 《绳法经》 | 4 | | | |
| 41 | barometer | 气压计 | 2 | | | |
| 42 | oersted_electromagnetism | 奥斯特电流磁效应 | 2 | | | |
| 43 | yukawa_meson_theory | 汤川介子理论 | 2 | | | |
| 44 | wigner_random_matrices | 维格纳随机矩阵 | 3 | | | |
| 45 | classical_elements | 四元素说 | 4 | | | |
| 46 | autobahn | 高速公路 | 2 | | | |
| 47 | position_line_fix | 船位线定位法 | 2 | | | |
| 48 | junkers_ju52 | 容克斯Ju 52 | 3 | | | |
| 49 | cayley_glider | 载人滑翔机 | 4 | | | |
| 50 | traction_engine | 蒸汽牵引机 | 4 | | | |
| 51 | gmres | GMRES | 2 | | | |
| 52 | karmarkar_interior_point | 卡马卡尔内点法 | 2 | | | |
| 53 | pseudorandom_number_generator | 伪随机数生成器 | 2 | | | |
| 54 | schwarz_domain_decomposition | 施瓦茨交替法与区域分解 | 4 | | | |
| 55 | atomic_theory | 近代原子论 | 1 | | | |
| 56 | distillation | 蒸馏 | 2 | | | |
| 57 | hydrogen_bond | 氢键 | 2 | | | |
| 58 | friction_match | 摩擦火柴 | 5 | | | |
| 59 | extradosed_bridge | 矮塔斜拉桥 | 2 | | | |
| 60 | fire_brick | 耐火砖 | 2 | | | |
| 61 | moment_distribution_method | 弯矩分配法 | 2 | | | |
| 62 | obelisk | 方尖碑 | 4 | | | |
| 63 | language | 语言 | 1 | | | |
| 64 | commedia_dell_arte | 即兴喜剧 | 2 | | | |
| 65 | fairy_tale | 童话故事 | 2 | | | |
| 66 | snowboarding | 单板滑雪 | 4 | | | |
| 67 | pillow | 枕 | 2 | | | |
| 68 | tea_bag | 茶包 | 3 | | | |
| 69 | baby_monitor | 婴儿监护器 | 4 | | | |
| 70 | toilet_paper | 卫生纸 | 4 | | | |
| 71 | hadley_cell | 哈得来环流 | 2 | | | |
| 72 | hutton_uniformitarianism | 赫顿均变论 | 2 | | | |
| 73 | uranium_thorium_dating | 铀钍测年法 | 2 | | | |
| 74 | seawall | 海堤 | 4 | | | |
| 75 | bank | 近代银行 | 1 | | | |
| 76 | gold_standard | 金本位制 | 2 | | | |
| 77 | poverty_threshold | 贫困线测算 | 2 | | | |
| 78 | stablecoin | 稳定币 | 4 | | | |
| 79 | bowlby_attachment_theory | 鲍尔比依恋理论 | 2 | | | |
| 80 | montessori_education | 蒙特梭利教学法 | 2 | | | |
| 81 | taixue_han | 太学 | 2 | | | |
| 82 | library | 图书馆 | 4 | | | |
| 83 | sovereignty_principle | 主权原则 | 1 | | | |
| 84 | abolition_legislation | 废奴立法 | 2 | | | |
| 85 | convention_on_refugees_1951 | 难民地位公约 | 2 | | | |
| 86 | health_qr_code | 健康码 | 4 | | | |
| 87 | type_theory | 类型论 | 2 | | | |
| 88 | action_algebra | 作用代数 | 4 | | | |
| 89 | rebco_coated_conductor_tape | 稀土钡铜氧超导带材 | 2 | | | |
| 90 | fullerene | 富勒烯 | 3 | | | |
| 91 | cellophane | 玻璃纸 | 4 | | | |
| 92 | laminated_glass | 夹层玻璃 | 4 | | | |
| 93 | conscription | 征兵制 | 2 | | | |
| 94 | gas_mask | 防毒面具 | 2 | | | |
| 95 | guerrilla_warfare | 游击战 | 2 | | | |
| 96 | bolas | 投石绊索 | 5 | | | |
| 97 | space_shuttle | 航天飞机 | 1 | | | |
| 98 | starlink | 星链 | 2 | | | |
| 99 | blunt_body_heat_shield | 钝体防热罩 | 3 | | | |
| 100 | lunokhod | 月球车1号 | 4 | | | |

---

## 逐条证据

## 批 1（50 条）


### agriculture_food　（本域 146 条，零下游占 58.2%）

#### 1. 黄金大米｜Golden rice

- **golden_rice** ｜ 现档 2（支柱）｜ kind 工艺 ｜ intelligent ｜ 年份 2000（exact）
- 溯源 wikiEn：`Golden rice`
- 结构：前置引用 pf=0 ｜ 被引总数 rf=0 ｜ 传递下游=0 ｜ 域内下游排名 96/146（越靠前越像支柱，此处第 65.8% 位）｜ 直接下游 0 条
- 它的前置：重组DNA技术、作物育种
- desc：转入合成β-胡萝卜素途径的稻米，针对隐性饥饿。
- 裁决：边界 ☐算 ☐留 ☐移 ｜ 档位 ☐维持 ☐改＿ ☐挂起 ｜ 理由：＿＿＿＿＿＿

#### 2. 次级产品革命｜Secondary Products Revolution

- **secondary_products_revolution** ｜ 现档 2（支柱）｜ kind 原理 ｜ neolithic ｜ 年份 -4000（scholarly_disputed）
- 溯源 wikiEn：`Secondary products revolution`
- 结构：前置引用 pf=0 ｜ 被引总数 rf=0 ｜ 传递下游=0 ｜ 域内下游排名 130/146（越靠前越像支柱，此处第 89.0% 位）｜ 直接下游 0 条
- 它的前置：畜牧
- desc：从吃肉转向取奶役毛的畜利用法转变，重塑欧亚农业。
- 提名通道（规则也捞到了它）：原理零引用 ｜ [原理零引用] kind=原理；被引总数 rf=0
- 裁决：边界 ☐算 ☐留 ☐移 ｜ 档位 ☐维持 ☐改＿ ☐挂起 ｜ 理由：＿＿＿＿＿＿

#### 3. 牛轭｜Yoke

- **ox_yoke** ｜ 现档 4（改良细分）｜ kind 器物 ｜ bronze_age ｜ 年份 -3000（century）
- 溯源 wikiEn：`Yoke`
- 结构：前置引用 pf=0 ｜ 被引总数 rf=2 ｜ 传递下游=0 ｜ 域内下游排名 117/146（越靠前越像支柱，此处第 80.1% 位）｜ 直接下游 0 条
- 它的前置：（无）
- desc：木轭架于牛肩，把畜力用于拉犁与拖车。
- 裁决：边界 ☐算 ☐留 ☐移 ｜ 档位 ☐维持 ☐改＿ ☐挂起 ｜ 理由：＿＿＿＿＿＿

#### 4. 旋转磨盘｜Rotary quern

- **rotary_quern** ｜ 现档 4（改良细分）｜ kind 工艺 ｜ antiquity ｜ 年份 -600（century）
- 溯源 wikiEn：`Quern-stone`
- 结构：前置引用 pf=0 ｜ 被引总数 rf=0 ｜ 传递下游=0 ｜ 域内下游排名 125/146（越靠前越像支柱，此处第 85.6% 位）｜ 直接下游 0 条
- 它的前置：（无）
- desc：迦太基出现曲柄驱动的旋转谷物磨。
- 裁决：边界 ☐算 ☐留 ☐移 ｜ 档位 ☐维持 ☐改＿ ☐挂起 ｜ 理由：＿＿＿＿＿＿

### computing_systems　（本域 276 条，零下游占 56.9%）

#### 5. 微处理器｜Microprocessor

- **microprocessor** ｜ 现档 1（基石）｜ kind 器物 ｜ information ｜ 年份 1971（exact）
- 溯源 wikiEn：`Microprocessor`
- 结构：前置引用 pf=17 ｜ 被引总数 rf=26 ｜ 传递下游=103 ｜ 域内下游排名 5/276（越靠前越像支柱，此处第 1.8% 位）｜ 直接下游 5 条：单片机(P3)、个人电脑(P1)、雅达利2600(P3)、防抱死制动系统(P2)、自动体外除颤器(P3)
- 它的前置：集成电路
- desc：将整颗CPU集成于一块芯片，1971年Intel 4004首开先河。
- 裁决：边界 ☐算 ☐留 ☐移 ｜ 档位 ☐维持 ☐改＿ ☐挂起 ｜ 理由：＿＿＿＿＿＿

#### 6. 摩尔定律｜Moore's law

- **moore_law** ｜ 现档 2（支柱）｜ kind 原理 ｜ atomic_electronic ｜ 年份 1965（exact）
- 溯源 wikiEn：`Moore's law`
- 结构：前置引用 pf=1 ｜ 被引总数 rf=2 ｜ 传递下游=1 ｜ 域内下游排名 100/276（越靠前越像支柱，此处第 36.2% 位）｜ 直接下游 1 条：半导体老化与可靠性筛选(P2)
- 它的前置：集成电路、半导体器件制造工艺
- desc：单芯片晶体管数约每一到两年翻倍的经验规律，牵引半导体业的投资节奏与产品规划。
- 裁决：边界 ☐算 ☐留 ☐移 ｜ 档位 ☐维持 ☐改＿ ☐挂起 ｜ 理由：＿＿＿＿＿＿

#### 7. Z3 计算机｜Z3 (computer)

- **z3_computer** ｜ 现档 2（支柱）｜ kind 器物 ｜ second_industrial ｜ 年份 1941（exact）
- 溯源 wikiEn：`Z3 (computer)`
- 结构：前置引用 pf=0 ｜ 被引总数 rf=0 ｜ 传递下游=0 ｜ 域内下游排名 275/276（越靠前越像支柱，此处第 99.6% 位）｜ 直接下游 0 条
- 它的前置：电磁继电器、穿孔卡片
- desc：楚斯1941年建成的首台可编程计算机，以约两千六百个继电器做二进制浮点运算。
- 裁决：边界 ☐算 ☐留 ☐移 ｜ 档位 ☐维持 ☐改＿ ☐挂起 ｜ 理由：＿＿＿＿＿＿

#### 8. iPod｜iPod

- **ipod** ｜ 现档 3（域内重要）｜ kind 器物 ｜ intelligent ｜ 年份 2001（exact）
- 溯源 wikiEn：`IPod`
- 结构：前置引用 pf=0 ｜ 被引总数 rf=4 ｜ 传递下游=0 ｜ 域内下游排名 195/276（越靠前越像支柱，此处第 70.7% 位）｜ 直接下游 0 条
- 它的前置：个人电脑
- desc：2001年苹果硬盘式音乐播放器，重塑数字音乐购买与收听。
- 裁决：边界 ☐算 ☐留 ☐移 ｜ 档位 ☐维持 ☐改＿ ☐挂起 ｜ 理由：＿＿＿＿＿＿

#### 9. 智能卡｜Smart card

- **smart_card** ｜ 现档 5（长尾）｜ kind 制度 ｜ atomic_electronic ｜ 年份 1968（batch_asserted）
- 溯源 wikiEn：`Smart card`
- 结构：前置引用 pf=0 ｜ 被引总数 rf=2 ｜ 传递下游=0 ｜ 域内下游排名 246/276（越靠前越像支柱，此处第 89.1% 位）｜ 直接下游 0 条
- 它的前置：集成电路
- desc：1968年西德首提内嵌芯片的识别卡专利，现代IC卡的前身。
- 裁决：边界 ☐算 ☐留 ☐移 ｜ 档位 ☐维持 ☐改＿ ☐挂起 ｜ 理由：＿＿＿＿＿＿

### energy_power　（本域 168 条，零下游占 57.7%）

#### 10. 高压直流输电｜High-voltage direct current

- **high_voltage_direct_current** ｜ 现档 2（支柱）｜ kind 工艺 ｜ atomic_electronic ｜ 年份 1954（batch_asserted）
- 溯源 wikiEn：`High-voltage direct current`
- 结构：前置引用 pf=0 ｜ 被引总数 rf=1 ｜ 传递下游=0 ｜ 域内下游排名 114/168（越靠前越像支柱，此处第 67.9% 位）｜ 直接下游 0 条
- 它的前置：交流电、电网
- desc：以直流远距离输电并互联不同步电网，损耗低于交流。
- 裁决：边界 ☐算 ☐留 ☐移 ｜ 档位 ☐维持 ☐改＿ ☐挂起 ｜ 理由：＿＿＿＿＿＿

#### 11. 压水反应堆｜Pressurized water reactor

- **pressurized_water_reactor** ｜ 现档 2（支柱）｜ kind 工艺 ｜ atomic_electronic ｜ 年份 1954（batch_asserted）
- 溯源 wikiEn：`Pressurized water reactor`
- 结构：前置引用 pf=1 ｜ 被引总数 rf=5 ｜ 传递下游=1 ｜ 域内下游排名 64/168（越靠前越像支柱，此处第 38.1% 位）｜ 直接下游 1 条：镁诺克斯气冷堆(P2)
- 它的前置：核反应堆
- desc：1954年S1W核潜艇堆奠定，后成商用核电站主流堆型。
- 裁决：边界 ☐算 ☐留 ☐移 ｜ 档位 ☐维持 ☐改＿ ☐挂起 ｜ 理由：＿＿＿＿＿＿

#### 12. 晶闸管｜Thyristor

- **thyristor** ｜ 现档 3（域内重要）｜ kind 器物 ｜ atomic_electronic ｜ 年份 1957（batch_asserted）
- 溯源 wikiEn：`Thyristor`
- 结构：前置引用 pf=1 ｜ 被引总数 rf=1 ｜ 传递下游=1 ｜ 域内下游排名 68/168（越靠前越像支柱，此处第 40.5% 位）｜ 直接下游 1 条：变速风电机组(P2)
- 它的前置：硅晶体管
- desc：1957年通用电气推出可控硅整流器，大功率电力电子开关。
- 裁决：边界 ☐算 ☐留 ☐移 ｜ 档位 ☐维持 ☐改＿ ☐挂起 ｜ 理由：＿＿＿＿＿＿

#### 13. CANDU重水堆｜CANDU reactor

- **candu_reactor** ｜ 现档 4（改良细分）｜ kind 工艺 ｜ atomic_electronic ｜ 年份 1962（batch_asserted）
- 溯源 wikiEn：`CANDU reactor`
- 结构：前置引用 pf=0 ｜ 被引总数 rf=1 ｜ 传递下游=0 ｜ 域内下游排名 83/168（越靠前越像支柱，此处第 49.4% 位）｜ 直接下游 0 条
- 它的前置：核反应堆
- desc：加拿大重水天然铀堆，1962年NPD原型堆并网发电。
- 裁决：边界 ☐算 ☐留 ☐移 ｜ 档位 ☐维持 ☐改＿ ☐挂起 ｜ 理由：＿＿＿＿＿＿

#### 14. 曲柄连杆机构｜Crank and connecting rod

- **crank_connecting_rod** ｜ 现档 4（改良细分）｜ kind 器物 ｜ antiquity ｜ 年份 240（decade）
- 溯源 wikiEn：`Connecting rod`
- 结构：前置引用 pf=1 ｜ 被引总数 rf=2 ｜ 传递下游=1 ｜ 域内下游排名 57/168（越靠前越像支柱，此处第 33.9% 位）｜ 直接下游 1 条：希拉波利斯水力锯坊(P3)
- 它的前置：曲柄摇柄、水车
- desc：把旋转运动转为往复直线运动。
- 裁决：边界 ☐算 ☐留 ☐移 ｜ 档位 ☐维持 ☐改＿ ☐挂起 ｜ 理由：＿＿＿＿＿＿

### info_media　（本域 292 条，零下游占 57.5%）

#### 15. 集成电路｜Integrated circuit

- **integrated_circuit** ｜ 现档 1（基石）｜ kind 器物 ｜ atomic_electronic ｜ 年份 1958（batch_asserted）
- 溯源 wikiEn：`Integrated circuit`
- 结构：前置引用 pf=23 ｜ 被引总数 rf=36 ｜ 传递下游=207 ｜ 域内下游排名 5/292（越靠前越像支柱，此处第 1.7% 位）｜ 直接下游 5 条：半导体器件制造工艺(P1)、IBM System/360(P2)、倒装芯片(P2)、小型计算机(P2)、摩尔定律(P2)
- 它的前置：晶体管、硅晶体管
- desc：1958年基尔比发明，将多个器件集成于一块半导体晶片。
- 裁决：边界 ☐算 ☐留 ☐移 ｜ 档位 ☐维持 ☐改＿ ☐挂起 ｜ 理由：＿＿＿＿＿＿

#### 16. 石版印刷｜Lithography

- **lithography** ｜ 现档 3（域内重要）｜ kind 媒介 ｜ industrial ｜ 年份 1798（batch_asserted）
- 溯源 wikiEn：`Lithography`
- 结构：前置引用 pf=2 ｜ 被引总数 rf=5 ｜ 传递下游=2 ｜ 域内下游排名 76/292（越靠前越像支柱，此处第 26.0% 位）｜ 直接下游 2 条：海报(P2)、照相铜版(P2)
- 它的前置：（无）
- desc：塞尼费尔德发明油水相斥石印法，开启平版彩色印刷。
- 裁决：边界 ☐算 ☐留 ☐移 ｜ 档位 ☐维持 ☐改＿ ☐挂起 ｜ 理由：＿＿＿＿＿＿

#### 17. NSFNET｜NSFNET

- **nsfnet** ｜ 现档 3（域内重要）｜ kind 媒介 ｜ information ｜ 年份 1985（exact）
- 溯源 wikiEn：`NSFNET`
- 结构：前置引用 pf=0 ｜ 被引总数 rf=2 ｜ 传递下游=0 ｜ 域内下游排名 212/292（越靠前越像支柱，此处第 72.6% 位）｜ 直接下游 0 条
- 它的前置：互联网
- desc：1985年起步、1986年联网的美国科研骨干网，互联网民用化枢纽。
- 裁决：边界 ☐算 ☐留 ☐移 ｜ 档位 ☐维持 ☐改＿ ☐挂起 ｜ 理由：＿＿＿＿＿＿

#### 18. 众包｜Crowdsourcing

- **crowdsourcing** ｜ 现档 4（改良细分）｜ kind 工艺 ｜ intelligent ｜ 年份 2006（batch_asserted）
- 溯源 wikiEn：`Crowdsourcing`
- 结构：前置引用 pf=0 ｜ 被引总数 rf=2 ｜ 传递下游=0 ｜ 域内下游排名 147/292（越靠前越像支柱，此处第 50.3% 位）｜ 直接下游 0 条
- 它的前置：万维网
- desc：把任务开放给大规模网民协作完成的模式，2006年《连线》杂志正式定名。
- 裁决：边界 ☐算 ☐留 ☐移 ｜ 档位 ☐维持 ☐改＿ ☐挂起 ｜ 理由：＿＿＿＿＿＿

#### 19. 铅版印刷｜Stereotype printing

- **stereotype_printing** ｜ 现档 4（改良细分）｜ kind 媒介 ｜ renaissance ｜ 年份 1690（decade）
- 溯源 wikiEn：`Stereotype (printing)`
- 结构：前置引用 pf=0 ｜ 被引总数 rf=2 ｜ 传递下游=0 ｜ 域内下游排名 256/292（越靠前越像支柱，此处第 87.7% 位）｜ 直接下游 0 条
- 它的前置：金属活字印刷
- desc：德国出现以湿纸型翻铸整页铅版的工艺，便于保存版型与反复重印。
- 裁决：边界 ☐算 ☐留 ☐移 ｜ 档位 ☐维持 ☐改＿ ☐挂起 ｜ 理由：＿＿＿＿＿＿

#### 20. eSIM｜eSIM

- **esim** ｜ 现档 5（长尾）｜ kind 工艺 ｜ intelligent ｜ 年份 2016（batch_asserted）
- 溯源 wikiEn：`ESIM`
- 结构：前置引用 pf=0 ｜ 被引总数 rf=0 ｜ 传递下游=0 ｜ 域内下游排名 164/292（越靠前越像支柱，此处第 56.2% 位）｜ 直接下游 0 条
- 它的前置：智能手机
- desc：2016年起商用的嵌入式可编程SIM卡，便利可穿戴与物联网。
- 裁决：边界 ☐算 ☐留 ☐移 ｜ 档位 ☐维持 ☐改＿ ☐挂起 ｜ 理由：＿＿＿＿＿＿

### life_medicine　（本域 323 条，零下游占 64.1%）

#### 21. DNA双螺旋｜Nucleic acid double helix

- **dna_double_helix** ｜ 现档 1（基石）｜ kind 工艺 ｜ atomic_electronic ｜ 年份 1953（batch_asserted）
- 溯源 wikiEn：`Nucleic acid double helix`
- 结构：前置引用 pf=14 ｜ 被引总数 rf=20 ｜ 传递下游=31 ｜ 域内下游排名 5/323（越靠前越像支柱，此处第 1.6% 位）｜ 直接下游 5 条：分子生物学中心法则(P1)、梅塞尔森-斯塔尔实验(P2)、遗传密码(P3)、信使RNA(P3)、DNA测序早期(P4)
- 它的前置：X射线晶体学
- desc：沃森与克里克1953年提出双螺旋，分子生物学基石。
- 裁决：边界 ☐算 ☐留 ☐移 ｜ 档位 ☐维持 ☐改＿ ☐挂起 ｜ 理由：＿＿＿＿＿＿

#### 22. 麻疹疫苗｜Measles vaccine

- **measles_vaccine** ｜ 现档 3（域内重要）｜ kind 工艺 ｜ atomic_electronic ｜ 年份 1963（batch_asserted）
- 溯源 wikiEn：`Measles vaccine`
- 结构：前置引用 pf=1 ｜ 被引总数 rf=2 ｜ 传递下游=1 ｜ 域内下游排名 96/323（越靠前越像支柱，此处第 29.7% 位）｜ 直接下游 1 条：风疹疫苗(P3)
- 它的前置：细胞培养、冷冻干燥、玻璃、脊髓灰质炎疫苗
- desc：恩德斯等研制减毒活疫苗，1963年在美国获批。
- 裁决：边界 ☐算 ☐留 ☐移 ｜ 档位 ☐维持 ☐改＿ ☐挂起 ｜ 理由：＿＿＿＿＿＿

#### 23. 埃伯斯纸草卷｜Ebers Papyrus

- **ebers_papyrus** ｜ 现档 4（改良细分）｜ kind 媒介 ｜ bronze_age ｜ 年份 -1550（century）
- 溯源 wikiEn：`Ebers Papyrus`
- 结构：前置引用 pf=0 ｜ 被引总数 rf=0 ｜ 传递下游=0 ｜ 域内下游排名 173/323（越靠前越像支柱，此处第 53.6% 位）｜ 直接下游 0 条
- 它的前置：纸莎草
- desc：记载数百种草药方剂与病症，古埃及药物学集大成。
- 裁决：边界 ☐算 ☐留 ☐移 ｜ 档位 ☐维持 ☐改＿ ☐挂起 ｜ 理由：＿＿＿＿＿＿

#### 24. 氟烷｜Halothane

- **halothane** ｜ 现档 4（改良细分）｜ kind 工艺 ｜ atomic_electronic ｜ 年份 1956（batch_asserted）
- 溯源 wikiEn：`Halothane`
- 结构：前置引用 pf=0 ｜ 被引总数 rf=1 ｜ 传递下游=0 ｜ 域内下游排名 193/323（越靠前越像支柱，此处第 59.8% 位）｜ 直接下游 0 条
- 它的前置：麻醉术、氯碱法、聚四氟乙烯
- desc：不易燃强效吸入麻醉剂，取代乙醚成为主流。
- 裁决：边界 ☐算 ☐留 ☐移 ｜ 档位 ☐维持 ☐改＿ ☐挂起 ｜ 理由：＿＿＿＿＿＿

#### 25. 手术显微镜｜Operating microscope

- **operating_microscope** ｜ 现档 4（改良细分）｜ kind 工艺 ｜ atomic_electronic ｜ 年份 1953（batch_asserted）
- 溯源 wikiEn：`Operating microscope`
- 结构：前置引用 pf=1 ｜ 被引总数 rf=1 ｜ 传递下游=1 ｜ 域内下游排名 103/323（越靠前越像支柱，此处第 31.9% 位）｜ 直接下游 1 条：显微外科(P4)
- 它的前置：眼镜、放大镜
- desc：专用手术显微镜问世，使显微外科成为可能
- 裁决：边界 ☐算 ☐留 ☐移 ｜ 档位 ☐维持 ☐改＿ ☐挂起 ｜ 理由：＿＿＿＿＿＿

#### 26. 检眼镜｜Ophthalmoscope

- **ophthalmoscope** ｜ 现档 4（改良细分）｜ kind 器物 ｜ industrial ｜ 年份 1851（batch_asserted）
- 溯源 wikiEn：`Ophthalmoscopy`
- 结构：前置引用 pf=0 ｜ 被引总数 rf=0 ｜ 传递下游=0 ｜ 域内下游排名 249/323（越靠前越像支柱，此处第 77.1% 位）｜ 直接下游 0 条
- 它的前置：光学之书、眼镜
- desc：亥姆霍兹发明可窥视活体眼底的仪器，眼科诊断革命。
- 裁决：边界 ☐算 ☐留 ☐移 ｜ 档位 ☐维持 ☐改＿ ☐挂起 ｜ 理由：＿＿＿＿＿＿

### logic_foundations　（本域 36 条，零下游占 38.9%）

#### 27. 判定问题｜Entscheidungsproblem

- **entscheidungsproblem** ｜ 现档 2（支柱）｜ kind 原理 ｜ second_industrial ｜ 年份 1928（batch_asserted）
- 溯源 wikiEn：`Entscheidungsproblem`
- 结构：前置引用 pf=1 ｜ 被引总数 rf=1 ｜ 传递下游=1 ｜ 域内下游排名 16/36（越靠前越像支柱，此处第 44.4% 位）｜ 直接下游 1 条：停机问题(P1)
- 它的前置：希尔伯特公理化纲领
- desc：追问是否存在通用机械程序判定任意一阶公式是否可证，其否定答案催生计算机科学。
- 裁决：边界 ☐算 ☐留 ☐移 ｜ 档位 ☐维持 ☐改＿ ☐挂起 ｜ 理由：＿＿＿＿＿＿

### manufacturing　（本域 207 条，零下游占 44.4%）

#### 28. 打制石器｜Stone tools

- **stone_tools** ｜ 现档 1（基石）｜ kind 器物 ｜ prehistory ｜ 年份 -300000（convention_floor）
- 溯源 wikiEn：`Stone tool`
- 结构：前置引用 pf=15 ｜ 被引总数 rf=17 ｜ 传递下游=323 ｜ 域内下游排名 1/207（越靠前越像支柱，此处第 0.5% 位）｜ 直接下游 5 条：装柄术(P3)、木工(P2)、手斧(P2)、勒瓦娄哇技法(P3)、刮削器(P4)
- 它的前置：（无）
- desc：以敲击打制石片制成的最早工具，人类物质技术的开端。
- 裁决：边界 ☐算 ☐留 ☐移 ｜ 档位 ☐维持 ☐改＿ ☐挂起 ｜ 理由：＿＿＿＿＿＿

#### 29. 硅中介层互连｜Silicon interposer integration

- **silicon_interposer_2p5d** ｜ 现档 2（支柱）｜ kind 工艺 ｜ intelligent ｜ 年份 2011（circa）
- 溯源 wikiEn：`Interposer`
- 结构：前置引用 pf=0 ｜ 被引总数 rf=0 ｜ 传递下游=0 ｜ 域内下游排名 187/207（越靠前越像支柱，此处第 90.3% 位）｜ 直接下游 0 条
- 它的前置：硅通孔、倒装芯片
- desc：以带通孔与密集布线的硅插层把多颗裸片并排连成超高带宽的单一封装。
- 提名通道（规则也捞到了它）：支柱尾组 ｜ [支柱尾组] P2；域内(manufacturing)下游数 0 ≤ 本域 P2 档 20 分位 0 且 < 全域（本域全部条目）中位数 1（本域 P2 共 69 条）
- 裁决：边界 ☐算 ☐留 ☐移 ｜ 档位 ☐维持 ☐改＿ ☐挂起 ｜ 理由：＿＿＿＿＿＿

#### 30. 硫酸盐法制浆｜Kraft process

- **kraft_process** ｜ 现档 3（域内重要）｜ kind 媒介 ｜ second_industrial ｜ 年份 1879（batch_asserted）
- 溯源 wikiEn：`Kraft process`
- 结构：前置引用 pf=0 ｜ 被引总数 rf=1 ｜ 传递下游=0 ｜ 域内下游排名 159/207（越靠前越像支柱，此处第 76.8% 位）｜ 直接下游 0 条
- 它的前置：勒布朗制碱法、造纸术
- desc：达尔1879年发明硫酸盐木浆工艺，强韧牛皮纸与造纸大扩张。
- 裁决：边界 ☐算 ☐留 ☐移 ｜ 档位 ☐维持 ☐改＿ ☐挂起 ｜ 理由：＿＿＿＿＿＿

#### 31. 镶嵌工艺｜Mosaic

- **mosaic** ｜ 现档 4（改良细分）｜ kind 工艺 ｜ bronze_age ｜ 年份 -3400（century）
- 溯源 wikiEn：`Mosaic`
- 结构：前置引用 pf=4 ｜ 被引总数 rf=8 ｜ 传递下游=4 ｜ 域内下游排名 57/207（越靠前越像支柱，此处第 27.5% 位）｜ 直接下游 4 条：网景浏览器(P3)、Internet Explorer(P3)、Java小程序(P3)、Flash(P3)
- 它的前置：（无）
- desc：乌鲁克神庙以彩色陶锥嵌成几何图案，最早的马赛克。
- 裁决：边界 ☐算 ☐留 ☐移 ｜ 档位 ☐维持 ☐改＿ ☐挂起 ｜ 理由：＿＿＿＿＿＿

#### 32. 刮削器｜Scraper

- **scraper** ｜ 现档 4（改良细分）｜ kind 器物 ｜ prehistory ｜ 年份 -200000（century）
- 溯源 wikiEn：`Scraper (archaeology)`
- 结构：前置引用 pf=1 ｜ 被引总数 rf=1 ｜ 传递下游=14 ｜ 域内下游排名 31/207（越靠前越像支柱，此处第 15.0% 位）｜ 直接下游 1 条：皮革(P3)
- 它的前置：打制石器
- desc：用于刮削兽皮、木材的石制刮削器。
- 裁决：边界 ☐算 ☐留 ☐移 ｜ 档位 ☐维持 ☐改＿ ☐挂起 ｜ 理由：＿＿＿＿＿＿

### math_pure　（本域 611 条，零下游占 50.4%）

#### 33. 微积分学｜Calculus

- **calculus** ｜ 现档 1（基石）｜ kind 器物 ｜ renaissance ｜ 年份 1666（batch_asserted）
- 溯源 wikiEn：`Calculus`
- 结构：前置引用 pf=30 ｜ 被引总数 rf=37 ｜ 传递下游=452 ｜ 域内下游排名 3/611（越靠前越像支柱，此处第 0.5% 位）｜ 直接下游 5 条：微积分基本定理(P1)、莱布尼茨微分记号体系(P3)、牛顿迭代法(P3)、牛顿力学(P1)、伯努利微分方程(P4)
- 它的前置：解析几何
- desc：牛顿与莱布尼茨各自独立创立微积分，提供刻画运动变化的数学工具。
- 裁决：边界 ☐算 ☐留 ☐移 ｜ 档位 ☐维持 ☐改＿ ☐挂起 ｜ 理由：＿＿＿＿＿＿

#### 34. 厄尔朗排队论｜Queueing theory

- **erlang_queueing_theory** ｜ 现档 2（支柱）｜ kind 媒介 ｜ second_industrial ｜ 年份 1917（batch_asserted）
- 溯源 wikiEn：`Queueing theory`
- 结构：前置引用 pf=0 ｜ 被引总数 rf=2 ｜ 传递下游=0 ｜ 域内下游排名 427/611（越靠前越像支柱，此处第 69.9% 位）｜ 直接下游 0 条
- 它的前置：厄尔朗泊松过程
- desc：厄尔朗给出电话交换等待概率公式，M/M/1模型与1953年肯德尔记号成体系。
- 裁决：边界 ☐算 ☐留 ☐移 ｜ 档位 ☐维持 ☐改＿ ☐挂起 ｜ 理由：＿＿＿＿＿＿

#### 35. 豪斯多夫空间｜Hausdorff space

- **hausdorff_space** ｜ 现档 2（支柱）｜ kind 原理 ｜ second_industrial ｜ 年份 1914（exact）
- 溯源 wikiEn：`Hausdorff space`
- 结构：前置引用 pf=4 ｜ 被引总数 rf=8 ｜ 传递下游=5 ｜ 域内下游排名 105/611（越靠前越像支柱，此处第 17.2% 位）｜ 直接下游 4 条：网与滤子(P4)、商拓扑与商空间(P3)、乌雷松引理与度量化定理(P3)、蒂霍诺夫定理与乘积拓扑(P2)
- 它的前置：度量空间
- desc：豪斯多夫在《集论基础》中以邻域和分离公理定义拓扑空间，奠定点集拓扑语言。
- 裁决：边界 ☐算 ☐留 ☐移 ｜ 档位 ☐维持 ☐改＿ ☐挂起 ｜ 理由：＿＿＿＿＿＿

#### 36. 谱序列｜Spectral sequence

- **spectral_sequence** ｜ 现档 2（支柱）｜ kind 器物 ｜ atomic_electronic ｜ 年份 1946（exact）
- 溯源 wikiEn：`Spectral sequence`
- 结构：前置引用 pf=0 ｜ 被引总数 rf=1 ｜ 传递下游=0 ｜ 域内下游排名 577/611（越靠前越像支柱，此处第 94.4% 位）｜ 直接下游 0 条
- 它的前置：同调论
- desc：勒雷在战俘营中发明逐页逼近的代数计算机器，塞尔借它革新同伦群与纤维空间计算。
- 裁决：边界 ☐算 ☐留 ☐移 ｜ 档位 ☐维持 ☐改＿ ☐挂起 ｜ 理由：＿＿＿＿＿＿

#### 37. 凸组合｜Convex combination

- **convex_combination** ｜ 现档 3（域内重要）｜ kind 原理 ｜ second_industrial ｜ 年份 1896（batch_asserted）
- 溯源 wikiEn：`Convex combination`
- 结构：前置引用 pf=1 ｜ 被引总数 rf=2 ｜ 传递下游=1 ｜ 域内下游排名 229/611（越靠前越像支柱，此处第 37.5% 位）｜ 直接下游 1 条：绝对凸集(P3)
- 它的前置：（无）
- desc：系数非负且和为1的线性组合，是闵可夫斯基凸体理论中的基本运算。
- 裁决：边界 ☐算 ☐留 ☐移 ｜ 档位 ☐维持 ☐改＿ ☐挂起 ｜ 理由：＿＿＿＿＿＿

#### 38. 龙格逼近定理｜Runge's theorem

- **runge_theorem** ｜ 现档 3（域内重要）｜ kind 原理 ｜ second_industrial ｜ 年份 1885（exact）
- 溯源 wikiEn：`Runge's theorem`
- 结构：前置引用 pf=0 ｜ 被引总数 rf=4 ｜ 传递下游=0 ｜ 域内下游排名 565/611（越靠前越像支柱，此处第 92.5% 位）｜ 直接下游 0 条
- 它的前置：柯西积分公式
- desc：龙格给出全纯函数在紧集上被有理函数逼近的拓扑条件，是复分析版的逼近基本定理。
- 裁决：边界 ☐算 ☐留 ☐移 ｜ 档位 ☐维持 ☐改＿ ☐挂起 ｜ 理由：＿＿＿＿＿＿

#### 39. 阿喀琉斯数｜Achilles number

- **achilles_number** ｜ 现档 4（改良细分）｜ kind 工艺 ｜ intelligent ｜ 年份 2001（batch_asserted）
- 溯源 wikiEn：`Achilles number`
- 结构：前置引用 pf=0 ｜ 被引总数 rf=0 ｜ 传递下游=0 ｜ 域内下游排名 311/611（越靠前越像支柱，此处第 50.9% 位）｜ 直接下游 0 条
- 它的前置：（无）
- desc：强大（每个素因子至少平方）但不是完全幂的整数，博顿利以特洛伊英雄命名。
- 裁决：边界 ☐算 ☐留 ☐移 ｜ 档位 ☐维持 ☐改＿ ☐挂起 ｜ 理由：＿＿＿＿＿＿

#### 40. 《绳法经》｜Shulba Sutras

- **shulba_sutras** ｜ 现档 4（改良细分）｜ kind 工艺 ｜ antiquity ｜ 年份 -500（century）
- 溯源 wikiEn：`Shulba Sutras`
- 结构：前置引用 pf=0 ｜ 被引总数 rf=1 ｜ 传递下游=0 ｜ 域内下游排名 571/611（越靠前越像支柱，此处第 93.5% 位）｜ 直接下游 0 条
- 它的前置：早期数学
- desc：印度祭坛几何，含勾股数与面积变换。
- 裁决：边界 ☐算 ☐留 ☐移 ｜ 档位 ☐维持 ☐改＿ ☐挂起 ｜ 理由：＿＿＿＿＿＿

### physics　（本域 226 条，零下游占 42.9%）

#### 41. 气压计｜Barometer

- **barometer** ｜ 现档 2（支柱）｜ kind 器物 ｜ renaissance ｜ 年份 1643（batch_asserted）
- 溯源 wikiEn：`Barometer`
- 结构：前置引用 pf=2 ｜ 被引总数 rf=8 ｜ 传递下游=2 ｜ 域内下游排名 93/226（越靠前越像支柱，此处第 41.1% 位）｜ 直接下游 2 条：帕斯卡定律(P4)、血压计(P4)
- 它的前置：（无）
- desc：托里拆利以倒置水银柱实验测出大气压并制成首支气压计。
- 裁决：边界 ☐算 ☐留 ☐移 ｜ 档位 ☐维持 ☐改＿ ☐挂起 ｜ 理由：＿＿＿＿＿＿

#### 42. 奥斯特电流磁效应｜Oersted's law

- **oersted_electromagnetism** ｜ 现档 2（支柱）｜ kind 工艺 ｜ industrial ｜ 年份 1820（decade）
- 溯源 wikiEn：`Oersted's law`
- 结构：前置引用 pf=4 ｜ 被引总数 rf=5 ｜ 传递下游=266 ｜ 域内下游排名 2/226（越靠前越像支柱，此处第 0.9% 位）｜ 直接下游 4 条：安培力定律(P2)、毕奥-萨伐尔定律(P3)、法拉第电磁感应定律(P1)、心电图(P3)
- 它的前置：伏打电堆
- desc：奥斯特发现通电导线使磁针偏转，首次证明电与磁相联系。
- 裁决：边界 ☐算 ☐留 ☐移 ｜ 档位 ☐维持 ☐改＿ ☐挂起 ｜ 理由：＿＿＿＿＿＿

#### 43. 汤川介子理论｜Yukawa potential

- **yukawa_meson_theory** ｜ 现档 2（支柱）｜ kind 原理 ｜ second_industrial ｜ 年份 1935（batch_asserted）
- 溯源 wikiEn：`Yukawa potential`
- 结构：前置引用 pf=1 ｜ 被引总数 rf=1 ｜ 传递下游=4 ｜ 域内下游排名 80/226（越靠前越像支柱，此处第 35.4% 位）｜ 直接下游 1 条：盖尔曼夸克模型(P2)
- 它的前置：中子的发现
- desc：汤川秀树提出核力由介子传递，开创强相互作用场论。
- 裁决：边界 ☐算 ☐留 ☐移 ｜ 档位 ☐维持 ☐改＿ ☐挂起 ｜ 理由：＿＿＿＿＿＿

#### 44. 维格纳随机矩阵｜Random matrix

- **wigner_random_matrices** ｜ 现档 3（域内重要）｜ kind 原理 ｜ atomic_electronic ｜ 年份 1955（exact）
- 溯源 wikiEn：`Random matrix`
- 结构：前置引用 pf=0 ｜ 被引总数 rf=1 ｜ 传递下游=0 ｜ 域内下游排名 222/226（越靠前越像支柱，此处第 98.2% 位）｜ 直接下游 0 条
- 它的前置：凯莱矩阵代数、高斯正态分布误差理论
- desc：维格纳以随机对称矩阵的半圆谱律解释复杂核能级，催生随机矩阵理论。
- 裁决：边界 ☐算 ☐留 ☐移 ｜ 档位 ☐维持 ☐改＿ ☐挂起 ｜ 理由：＿＿＿＿＿＿

#### 45. 四元素说｜Classical element

- **classical_elements** ｜ 现档 4（改良细分）｜ kind 原理 ｜ antiquity ｜ 年份 -450（century）
- 溯源 wikiEn：`Classical element`
- 结构：前置引用 pf=3 ｜ 被引总数 rf=5 ｜ 传递下游=5 ｜ 域内下游排名 62/226（越靠前越像支柱，此处第 27.4% 位）｜ 直接下游 3 条：希波克拉底医学(P3)、四体液学说(P2)、《药物论》(P3)
- 它的前置：（无）
- desc：恩培多克勒提出水火土气四元素学说。
- 裁决：边界 ☐算 ☐留 ☐移 ｜ 档位 ☐维持 ☐改＿ ☐挂起 ｜ 理由：＿＿＿＿＿＿

### transport　（本域 194 条，零下游占 61.9%）

#### 46. 高速公路｜Controlled-access highway

- **autobahn** ｜ 现档 2（支柱）｜ kind 器物 ｜ second_industrial ｜ 年份 1932（exact）
- 溯源 wikiEn：`Controlled-access highway`
- 结构：前置引用 pf=0 ｜ 被引总数 rf=2 ｜ 传递下游=0 ｜ 域内下游排名 79/194（越靠前越像支柱，此处第 40.7% 位）｜ 直接下游 0 条
- 它的前置：汽车、柏油碎石路面
- desc：波恩至科隆全立交汽车专用公路通车，高速公路兴起。
- 裁决：边界 ☐算 ☐留 ☐移 ｜ 档位 ☐维持 ☐改＿ ☐挂起 ｜ 理由：＿＿＿＿＿＿

#### 47. 船位线定位法｜Line of Position

- **position_line_fix** ｜ 现档 2（支柱）｜ kind 原理 ｜ industrial ｜ 年份 1837（batch_asserted）
- 溯源 wikiEn：`Position line`
- 结构：前置引用 pf=0 ｜ 被引总数 rf=0 ｜ 传递下游=0 ｜ 域内下游排名 159/194（越靠前越像支柱，此处第 82.0% 位）｜ 直接下游 0 条
- 它的前置：航海钟、六分仪
- desc：由天体高度角反推一条船位线，两线相交即定船位，航海定位转为可算问题
- 提名通道（规则也捞到了它）：原理零引用 ｜ [原理零引用] kind=原理；被引总数 rf=0
- 裁决：边界 ☐算 ☐留 ☐移 ｜ 档位 ☐维持 ☐改＿ ☐挂起 ｜ 理由：＿＿＿＿＿＿

#### 48. 容克斯Ju 52｜Junkers Ju 52

- **junkers_ju52** ｜ 现档 3（域内重要）｜ kind 器物 ｜ second_industrial ｜ 年份 1932（exact）
- 溯源 wikiEn：`Junkers Ju 52`
- 结构：前置引用 pf=0 ｜ 被引总数 rf=2 ｜ 传递下游=0 ｜ 域内下游排名 141/194（越靠前越像支柱，此处第 72.7% 位）｜ 直接下游 0 条
- 它的前置：容克斯J 1
- desc：三发全金属波纹壳运输机，战间期欧洲民航主力。
- 裁决：边界 ☐算 ☐留 ☐移 ｜ 档位 ☐维持 ☐改＿ ☐挂起 ｜ 理由：＿＿＿＿＿＿

#### 49. 载人滑翔机｜George Cayley's glider

- **cayley_glider** ｜ 现档 4（改良细分）｜ kind 器物 ｜ industrial ｜ 年份 1853（batch_asserted）
- 溯源 wikiEn：`George Cayley`
- 结构：前置引用 pf=0 ｜ 被引总数 rf=2 ｜ 传递下游=0 ｜ 域内下游排名 93/194（越靠前越像支柱，此处第 47.9% 位）｜ 直接下游 0 条
- 它的前置：（无）
- desc：凯利的固定翼载人滑翔机完成短距飞行，航空之父。
- 裁决：边界 ☐算 ☐留 ☐移 ｜ 档位 ☐维持 ☐改＿ ☐挂起 ｜ 理由：＿＿＿＿＿＿

#### 50. 蒸汽牵引机｜Traction engine

- **traction_engine** ｜ 现档 4（改良细分）｜ kind 器物 ｜ industrial ｜ 年份 1859（batch_asserted）
- 溯源 wikiEn：`Traction engine`
- 结构：前置引用 pf=0 ｜ 被引总数 rf=1 ｜ 传递下游=0 ｜ 域内下游排名 179/194（越靠前越像支柱，此处第 92.3% 位）｜ 直接下游 0 条
- 它的前置：高压蒸汽机
- desc：高压蒸汽机自行上路牵引农机货车，机动动力下乡。
- 裁决：边界 ☐算 ☐留 ☐移 ｜ 档位 ☐维持 ☐改＿ ☐挂起 ｜ 理由：＿＿＿＿＿＿
## 批 2（50 条）


### algorithms_cs　（本域 127 条，零下游占 61.4%）

#### 51. GMRES｜Generalized minimal residual method

- **gmres** ｜ 现档 2（支柱）｜ kind 原理 ｜ information ｜ 年份 1986（exact）
- 溯源 wikiEn：`Generalized minimal residual method`
- 结构：前置引用 pf=0 ｜ 被引总数 rf=4 ｜ 传递下游=0 ｜ 域内下游排名 76/127（越靠前越像支柱，此处第 59.8% 位）｜ 直接下游 0 条
- 它的前置：阿诺尔迪迭代、基础线性代数子程序、克雷洛夫子空间
- desc：萨阿德与舒尔茨1986年的Krylov残差最小化法，解非对称方程组，重启稳健。
- 裁决：边界 ☐算 ☐留 ☐移 ｜ 档位 ☐维持 ☐改＿ ☐挂起 ｜ 理由：＿＿＿＿＿＿

#### 52. 卡马卡尔内点法｜Karmarkar's algorithm

- **karmarkar_interior_point** ｜ 现档 2（支柱）｜ kind 工艺 ｜ information ｜ 年份 1984（exact）
- 溯源 wikiEn：`Karmarkar's algorithm`
- 结构：前置引用 pf=0 ｜ 被引总数 rf=3 ｜ 传递下游=0 ｜ 域内下游排名 90/127（越靠前越像支柱，此处第 70.9% 位）｜ 直接下游 0 条
- 它的前置：哈奇扬椭球法、单纯形法
- desc：卡马卡尔给出实用的多项式时间内点算法，引爆线性与非线性规划变革。
- 裁决：边界 ☐算 ☐留 ☐移 ｜ 档位 ☐维持 ☐改＿ ☐挂起 ｜ 理由：＿＿＿＿＿＿

#### 53. 伪随机数生成器｜Pseudorandom number generator

- **pseudorandom_number_generator** ｜ 现档 2（支柱）｜ kind 工艺 ｜ atomic_electronic ｜ 年份 1949（batch_asserted）
- 溯源 wikiEn：`Pseudorandom number generator`
- 结构：前置引用 pf=1 ｜ 被引总数 rf=1 ｜ 传递下游=4 ｜ 域内下游排名 15/127（越靠前越像支柱，此处第 11.8% 位）｜ 直接下游 1 条：分组密码(P2)
- 它的前置：电子计算机
- desc：用确定性算法产出统计上近随机的数列，供蒙特卡洛模拟、抽样与加密使用。
- 裁决：边界 ☐算 ☐留 ☐移 ｜ 档位 ☐维持 ☐改＿ ☐挂起 ｜ 理由：＿＿＿＿＿＿

#### 54. 施瓦茨交替法与区域分解｜Domain decomposition methods

- **schwarz_domain_decomposition** ｜ 现档 4（改良细分）｜ kind 工艺 ｜ industrial ｜ 年份 1869（batch_asserted）
- 溯源 wikiEn：`Domain decomposition methods`
- 结构：前置引用 pf=0 ｜ 被引总数 rf=1 ｜ 传递下游=0 ｜ 域内下游排名 114/127（越靠前越像支柱，此处第 89.8% 位）｜ 直接下游 0 条
- 它的前置：拉普拉斯方程
- desc：施瓦茨1869年提出以重叠子区域交替求解，1980年代发展为并行区域分解方法族。
- 裁决：边界 ☐算 ☐留 ☐移 ｜ 档位 ☐维持 ☐改＿ ☐挂起 ｜ 理由：＿＿＿＿＿＿

### chemistry　（本域 91 条，零下游占 47.3%）

#### 55. 近代原子论｜Atomic theory

- **atomic_theory** ｜ 现档 1（基石）｜ kind 原理 ｜ industrial ｜ 年份 1803（batch_asserted）
- 溯源 wikiEn：`Atomic theory`
- 结构：前置引用 pf=8 ｜ 被引总数 rf=16 ｜ 传递下游=76 ｜ 域内下游排名 1/91（越靠前越像支柱，此处第 1.1% 位）｜ 直接下游 5 条：倍比定律(P3)、贝采里乌斯元素符号体系(P2)、杜隆-珀蒂定律(P4)、化合价理论(P2)、元素周期表(P1)
- 它的前置：（无）
- desc：道尔顿提出元素由定重比原子构成，奠定近代化学。
- 裁决：边界 ☐算 ☐留 ☐移 ｜ 档位 ☐维持 ☐改＿ ☐挂起 ｜ 理由：＿＿＿＿＿＿

#### 56. 蒸馏｜Distillation

- **distillation** ｜ 现档 2（支柱）｜ kind 工艺 ｜ antiquity ｜ 年份 -1200（convention_floor）
- 溯源 wikiEn：`Distillation`
- 结构：前置引用 pf=8 ｜ 被引总数 rf=10 ｜ 传递下游=10 ｜ 域内下游排名 14/91（越靠前越像支柱，此处第 15.4% 位）｜ 直接下游 5 条：药房(P4)、药物试验(P4)、催眠海绵(P4)、化学医学派(P3)、磷的发现(P4)
- 它的前置：（无）
- desc：阿卡德泥板记载以蒸馏法提炼香水香精的工序。
- 裁决：边界 ☐算 ☐留 ☐移 ｜ 档位 ☐维持 ☐改＿ ☐挂起 ｜ 理由：＿＿＿＿＿＿

#### 57. 氢键｜Hydrogen bond

- **hydrogen_bond** ｜ 现档 2（支柱）｜ kind 原理 ｜ second_industrial ｜ 年份 1920（batch_asserted）
- 溯源 wikiEn：`Hydrogen bond`
- 结构：前置引用 pf=1 ｜ 被引总数 rf=2 ｜ 传递下游=1 ｜ 域内下游排名 43/91（越靠前越像支柱，此处第 47.3% 位）｜ 直接下游 1 条：超分子化学(P2)
- 它的前置：共价键与八隅体规则
- desc：氢与强电负原子间的定向弱键，决定水的反常与碱基配对。
- 裁决：边界 ☐算 ☐留 ☐移 ｜ 档位 ☐维持 ☐改＿ ☐挂起 ｜ 理由：＿＿＿＿＿＿

#### 58. 摩擦火柴｜Friction match

- **friction_match** ｜ 现档 5（长尾）｜ kind 工艺 ｜ industrial ｜ 年份 1826（batch_asserted）
- 溯源 wikiEn：`（空）`
- 结构：前置引用 pf=0 ｜ 被引总数 rf=1 ｜ 传递下游=0 ｜ 域内下游排名 70/91（越靠前越像支柱，此处第 76.9% 位）｜ 直接下游 0 条
- 它的前置：火药、火柴
- desc：沃克发明摩擦起火的火柴，1844年安全火柴问世。
- 裁决：边界 ☐算 ☐留 ☐移 ｜ 档位 ☐维持 ☐改＿ ☐挂起 ｜ 理由：＿＿＿＿＿＿

### construction　（本域 129 条，零下游占 65.1%）

#### 59. 矮塔斜拉桥｜Extradosed bridge

- **extradosed_bridge** ｜ 现档 2（支柱）｜ kind 器物 ｜ information ｜ 年份 1992（circa）
- 溯源 wikiEn：`Extradosed bridge`
- 结构：前置引用 pf=0 ｜ 被引总数 rf=0 ｜ 传递下游=0 ｜ 域内下游排名 71/129（越靠前越像支柱，此处第 55.0% 位）｜ 直接下游 0 条
- 它的前置：斜拉桥、钢筋混凝土、贝塞麦炼钢法
- desc：低塔外置索与连续梁共同受力，填补中等跨径空档。
- 裁决：边界 ☐算 ☐留 ☐移 ｜ 档位 ☐维持 ☐改＿ ☐挂起 ｜ 理由：＿＿＿＿＿＿

#### 60. 耐火砖｜Fire brick

- **fire_brick** ｜ 现档 2（支柱）｜ kind 工艺 ｜ industrial ｜ 年份 1825（decade）
- 溯源 wikiEn：`Fire brick`
- 结构：前置引用 pf=0 ｜ 被引总数 rf=0 ｜ 传递下游=0 ｜ 域内下游排名 73/129（越靠前越像支柱，此处第 56.6% 位）｜ 直接下游 0 条
- 它的前置：烧结砖、高炉、铁器冶炼
- desc：高铝硅料成型高温烧成，砌炉衬而不软化坍落。
- 裁决：边界 ☐算 ☐留 ☐移 ｜ 档位 ☐维持 ☐改＿ ☐挂起 ｜ 理由：＿＿＿＿＿＿

#### 61. 弯矩分配法｜Moment distribution method

- **moment_distribution_method** ｜ 现档 2（支柱）｜ kind 原理 ｜ second_industrial ｜ 年份 1930（exact）
- 溯源 wikiEn：`Moment distribution method`
- 结构：前置引用 pf=0 ｜ 被引总数 rf=0 ｜ 传递下游=0 ｜ 域内下游排名 88/129（越靠前越像支柱，此处第 68.2% 位）｜ 直接下游 0 条
- 它的前置：微积分学、牛顿力学、线弹性理论
- desc：逐节点分配不平衡弯矩并迭代逼近，手算刚架内力。
- 提名通道（规则也捞到了它）：原理零引用 ｜ [原理零引用] kind=原理；被引总数 rf=0
- 裁决：边界 ☐算 ☐留 ☐移 ｜ 档位 ☐维持 ☐改＿ ☐挂起 ｜ 理由：＿＿＿＿＿＿

#### 62. 方尖碑｜Obelisk

- **obelisk** ｜ 现档 4（改良细分）｜ kind 工艺 ｜ bronze_age ｜ 年份 -1950（century）
- 溯源 wikiEn：`Obelisk`
- 结构：前置引用 pf=0 ｜ 被引总数 rf=1 ｜ 传递下游=0 ｜ 域内下游排名 91/129（越靠前越像支柱，此处第 70.5% 位）｜ 直接下游 0 条
- 它的前置：石柱、琢石砌体
- desc：塞努斯雷特一世在赫利奥波利斯立整块花岗岩方尖碑。
- 裁决：边界 ☐算 ☐留 ☐移 ｜ 档位 ☐维持 ☐改＿ ☐挂起 ｜ 理由：＿＿＿＿＿＿

### culture_media　（本域 149 条，零下游占 69.8%）

#### 63. 语言｜Language

- **language** ｜ 现档 1（基石）｜ kind 工艺 ｜ prehistory ｜ 年份 -100000（century）
- 溯源 wikiEn：`Language`
- 结构：前置引用 pf=1 ｜ 被引总数 rf=3 ｜ 传递下游=17 ｜ 域内下游排名 2/149（越靠前越像支柱，此处第 1.3% 位）｜ 直接下游 1 条：史诗(P2)
- 它的前置：（无）
- desc：有声语言形成，知识与文化得以代际传承。
- 裁决：边界 ☐算 ☐留 ☐移 ｜ 档位 ☐维持 ☐改＿ ☐挂起 ｜ 理由：＿＿＿＿＿＿

#### 64. 即兴喜剧｜Commedia dell'arte

- **commedia_dell_arte** ｜ 现档 2（支柱）｜ kind 媒介 ｜ renaissance ｜ 年份 1550（circa）
- 溯源 wikiEn：`Commedia dell'arte`
- 结构：前置引用 pf=0 ｜ 被引总数 rf=5 ｜ 传递下游=0 ｜ 域内下游排名 62/149（越靠前越像支柱，此处第 41.6% 位）｜ 直接下游 0 条
- 它的前置：古希腊戏剧
- desc：以定型角色、假面与提纲即兴演出的流动戏剧，是现代喜剧程式的源头。
- 裁决：边界 ☐算 ☐留 ☐移 ｜ 档位 ☐维持 ☐改＿ ☐挂起 ｜ 理由：＿＿＿＿＿＿

#### 65. 童话故事｜Fairy tale

- **fairy_tale** ｜ 现档 2（支柱）｜ kind 媒介 ｜ renaissance ｜ 年份 1697（batch_asserted）
- 溯源 wikiEn：`Fairy tale`
- 结构：前置引用 pf=0 ｜ 被引总数 rf=4 ｜ 传递下游=0 ｜ 域内下游排名 73/149（越靠前越像支柱，此处第 49.0% 位）｜ 直接下游 0 条
- 它的前置：史诗、金属活字印刷
- desc：把口头民间传说改写为固定文本的儿童叙事体裁，成为后世故事产业的素材库。
- 裁决：边界 ☐算 ☐留 ☐移 ｜ 档位 ☐维持 ☐改＿ ☐挂起 ｜ 理由：＿＿＿＿＿＿

#### 66. 单板滑雪｜Snowboarding

- **snowboarding** ｜ 现档 4（改良细分）｜ kind 制度 ｜ atomic_electronic ｜ 年份 1965（exact）
- 溯源 wikiEn：`Snowboarding`
- 结构：前置引用 pf=0 ｜ 被引总数 rf=0 ｜ 传递下游=0 ｜ 域内下游排名 129/149（越靠前越像支柱，此处第 86.6% 位）｜ 直接下游 0 条
- 它的前置：滑雪板
- desc：一块宽板双足横立滑下坡，从后院玩具长成冬奥正式项目。
- 裁决：边界 ☐算 ☐留 ☐移 ｜ 档位 ☐维持 ☐改＿ ☐挂起 ｜ 理由：＿＿＿＿＿＿

### daily_life　（本域 129 条，零下游占 76.0%）

#### 67. 枕｜Pillow

- **pillow** ｜ 现档 2（支柱）｜ kind 器物 ｜ neolithic ｜ 年份 -7000（circa）
- 溯源 wikiEn：`Pillow`
- 结构：前置引用 pf=0 ｜ 被引总数 rf=3 ｜ 传递下游=0 ｜ 域内下游排名 86/129（越靠前越像支柱，此处第 66.7% 位）｜ 直接下游 0 条
- 它的前置：寝具
- desc：睡眠时垫承头颈的软具，与席、褥共同构成卧具组合。
- 裁决：边界 ☐算 ☐留 ☐移 ｜ 档位 ☐维持 ☐改＿ ☐挂起 ｜ 理由：＿＿＿＿＿＿

#### 68. 茶包｜Tea bag

- **tea_bag** ｜ 现档 3（域内重要）｜ kind 器物 ｜ second_industrial ｜ 年份 1908（circa）
- 溯源 wikiEn：`Tea bag`
- 结构：前置引用 pf=0 ｜ 被引总数 rf=0 ｜ 传递下游=0 ｜ 域内下游排名 113/129（越靠前越像支柱，此处第 87.6% 位）｜ 直接下游 0 条
- 它的前置：茶
- desc：碎茶装小袋一泡即弃，省去茶具与称量，茶叶进入办公室与旅途。
- 裁决：边界 ☐算 ☐留 ☐移 ｜ 档位 ☐维持 ☐改＿ ☐挂起 ｜ 理由：＿＿＿＿＿＿

#### 69. 婴儿监护器｜Baby monitor

- **baby_monitor** ｜ 现档 4（改良细分）｜ kind 器物 ｜ second_industrial ｜ 年份 1937（batch_asserted）
- 溯源 wikiEn：`Baby monitor`
- 结构：前置引用 pf=0 ｜ 被引总数 rf=0 ｜ 传递下游=0 ｜ 域内下游排名 33/129（越靠前越像支柱，此处第 25.6% 位）｜ 直接下游 0 条
- 它的前置：无线电
- desc：婴儿室声音经无线电传到父母一端，隔房也能即时响应啼哭。
- 裁决：边界 ☐算 ☐留 ☐移 ｜ 档位 ☐维持 ☐改＿ ☐挂起 ｜ 理由：＿＿＿＿＿＿

#### 70. 卫生纸｜Toilet paper

- **toilet_paper** ｜ 现档 4（改良细分）｜ kind 媒介 ｜ middle_ages ｜ 年份 589（batch_asserted）
- 溯源 wikiEn：`Toilet paper`
- 结构：前置引用 pf=0 ｜ 被引总数 rf=3 ｜ 传递下游=0 ｜ 域内下游排名 118/129（越靠前越像支柱，此处第 91.5% 位）｜ 直接下游 0 条
- 它的前置：造纸术
- desc：隋代已有用纸拭秽的记载，后在宋元广泛使用。
- 裁决：边界 ☐算 ☐留 ☐移 ｜ 档位 ☐维持 ☐改＿ ☐挂起 ｜ 理由：＿＿＿＿＿＿

### earth_space　（本域 143 条，零下游占 65.7%）

#### 71. 哈得来环流｜Hadley cell

- **hadley_cell** ｜ 现档 2（支柱）｜ kind 原理 ｜ industrial ｜ 年份 1735（exact）
- 溯源 wikiEn：`Hadley cell`
- 结构：前置引用 pf=1 ｜ 被引总数 rf=2 ｜ 传递下游=1 ｜ 域内下游排名 38/143（越靠前越像支柱，此处第 26.6% 位）｜ 直接下游 1 条：急流(P2)
- 它的前置：牛顿力学
- desc：热带受热上升、高空回流的经向环流，塑造信风与沙漠带。
- 裁决：边界 ☐算 ☐留 ☐移 ｜ 档位 ☐维持 ☐改＿ ☐挂起 ｜ 理由：＿＿＿＿＿＿

#### 72. 赫顿均变论｜Hutton's uniformitarianism and plutonism

- **hutton_uniformitarianism** ｜ 现档 2（支柱）｜ kind 原理 ｜ industrial ｜ 年份 1785（exact）
- 溯源 wikiEn：`James Hutton`
- 结构：前置引用 pf=1 ｜ 被引总数 rf=2 ｜ 传递下游=3 ｜ 域内下游排名 20/143（越靠前越像支柱，此处第 14.0% 位）｜ 直接下游 1 条：赖尔《地质学原理》(P2)
- 它的前置：地层学原理
- desc：赫顿主张地球经缓慢作用长期演化，岩石主由火成。
- 裁决：边界 ☐算 ☐留 ☐移 ｜ 档位 ☐维持 ☐改＿ ☐挂起 ｜ 理由：＿＿＿＿＿＿

#### 73. 铀钍测年法｜Uranium-Thorium Dating

- **uranium_thorium_dating** ｜ 现档 2（支柱）｜ kind 工艺 ｜ atomic_electronic ｜ 年份 1963（batch_asserted）
- 溯源 wikiEn：`Uranium-thorium dating`
- 结构：前置引用 pf=0 ｜ 被引总数 rf=0 ｜ 传递下游=0 ｜ 域内下游排名 139/143（越靠前越像支柱，此处第 97.2% 位）｜ 直接下游 0 条
- 它的前置：放射性测年法
- desc：以铀234与钍230不平衡定珊瑚方解石年龄，核燃料处理亦依赖同一衰变链同位素数据
- 裁决：边界 ☐算 ☐留 ☐移 ｜ 档位 ☐维持 ☐改＿ ☐挂起 ｜ 理由：＿＿＿＿＿＿

#### 74. 海堤｜Seawall

- **seawall** ｜ 现档 4（改良细分）｜ kind 工艺 ｜ neolithic ｜ 年份 -5000（century）
- 溯源 wikiEn：`Seawall`
- 结构：前置引用 pf=0 ｜ 被引总数 rf=1 ｜ 传递下游=0 ｜ 域内下游排名 125/143（越靠前越像支柱，此处第 87.4% 位）｜ 直接下游 0 条
- 它的前置：磨制石器
- desc：沿岸砌筑海堤，保护聚落免受海潮侵袭。
- 裁决：边界 ☐算 ☐留 ☐移 ｜ 档位 ☐维持 ☐改＿ ☐挂起 ｜ 理由：＿＿＿＿＿＿

### economy　（本域 124 条，零下游占 41.1%）

#### 75. 近代银行｜Bank

- **bank** ｜ 现档 1（基石）｜ kind 制度 ｜ renaissance ｜ 年份 1407（circa）
- 溯源 wikiEn：`Bank`
- 结构：前置引用 pf=7 ｜ 被引总数 rf=12 ｜ 传递下游=40 ｜ 域内下游排名 3/124（越靠前越像支柱，此处第 2.4% 位）｜ 直接下游 5 条：重商主义(P2)、特许贸易公司(P2)、股份公司(P1)、阿姆斯特丹兑换银行(P2)、部分准备金银行(P1)
- 它的前置：汇票与可转让票据
- desc：吸收存款、转账记账并按期限放出贷款，把闲散资金转为可投资的资本。
- 裁决：边界 ☐算 ☐留 ☐移 ｜ 档位 ☐维持 ☐改＿ ☐挂起 ｜ 理由：＿＿＿＿＿＿

#### 76. 金本位制｜Gold standard

- **gold_standard** ｜ 现档 2（支柱）｜ kind 制度 ｜ industrial ｜ 年份 1821（batch_asserted）
- 溯源 wikiEn：`Gold standard`
- 结构：前置引用 pf=5 ｜ 被引总数 rf=9 ｜ 传递下游=8 ｜ 域内下游排名 15/124（越靠前越像支柱，此处第 12.1% 位）｜ 直接下游 5 条：金银复本位制(P2)、货币数量论(P2)、布雷顿森林体系(P2)、法定货币(P2)、浮动汇率制(P2)
- 它的前置：英格兰银行
- desc：货币按固定含金量互通，带来百年低汇率风险与跨境资本流动。
- 裁决：边界 ☐算 ☐留 ☐移 ｜ 档位 ☐维持 ☐改＿ ☐挂起 ｜ 理由：＿＿＿＿＿＿

#### 77. 贫困线测算｜Poverty threshold

- **poverty_threshold** ｜ 现档 2（支柱）｜ kind 原理 ｜ atomic_electronic ｜ 年份 1963（batch_asserted）
- 溯源 wikiEn：`Poverty threshold`
- 结构：前置引用 pf=0 ｜ 被引总数 rf=2 ｜ 传递下游=0 ｜ 域内下游排名 110/124（越靠前越像支柱，此处第 88.7% 位）｜ 直接下游 0 条
- 它的前置：消费价格指数、库兹涅茨国民收入核算
- desc：以家庭食品开支推算最低收入标准，贫困被量化成统计口径。
- 提名通道（规则也捞到了它）：支柱尾组 ｜ [支柱尾组] P2；域内(economy)下游数 0 ≤ 本域 P2 档 20 分位 0 且 < 全域（本域全部条目）中位数 1（本域 P2 共 104 条）
- 裁决：边界 ☐算 ☐留 ☐移 ｜ 档位 ☐维持 ☐改＿ ☐挂起 ｜ 理由：＿＿＿＿＿＿

#### 78. 稳定币｜Stablecoin

- **stablecoin** ｜ 现档 4（改良细分）｜ kind 工艺 ｜ intelligent ｜ 年份 2014（batch_asserted）
- 溯源 wikiEn：`Stablecoin`
- 结构：前置引用 pf=1 ｜ 被引总数 rf=3 ｜ 传递下游=1 ｜ 域内下游排名 67/124（越靠前越像支柱，此处第 54.0% 位）｜ 直接下游 1 条：去中心化金融(P4)
- 它的前置：比特币
- desc：锚定法币或资产以保持币值稳定的加密货币，2014年Tether率先推出。
- 裁决：边界 ☐算 ☐留 ☐移 ｜ 档位 ☐维持 ☐改＿ ☐挂起 ｜ 理由：＿＿＿＿＿＿

### education_knowledge　（本域 94 条，零下游占 55.3%）

#### 79. 鲍尔比依恋理论｜Attachment theory

- **bowlby_attachment_theory** ｜ 现档 2（支柱）｜ kind 原理 ｜ atomic_electronic ｜ 年份 1951（batch_asserted）
- 溯源 wikiEn：`Attachment theory`
- 结构：前置引用 pf=0 ｜ 被引总数 rf=0 ｜ 传递下游=0 ｜ 域内下游排名 47/94（越靠前越像支柱，此处第 50.0% 位）｜ 直接下游 0 条
- 它的前置：（无）
- desc：早期照料关系塑造内部工作模式，1969年系统化，影响深远。
- 提名通道（规则也捞到了它）：原理零引用 ｜ [原理零引用] kind=原理；被引总数 rf=0
- 裁决：边界 ☐算 ☐留 ☐移 ｜ 档位 ☐维持 ☐改＿ ☐挂起 ｜ 理由：＿＿＿＿＿＿

#### 80. 蒙特梭利教学法｜Montessori education

- **montessori_education** ｜ 现档 2（支柱）｜ kind 工艺 ｜ second_industrial ｜ 年份 1907（batch_asserted）
- 溯源 wikiEn：`Montessori education`
- 结构：前置引用 pf=0 ｜ 被引总数 rf=1 ｜ 传递下游=0 ｜ 域内下游排名 73/94（越靠前越像支柱，此处第 77.7% 位）｜ 直接下游 0 条
- 它的前置：幼儿园
- desc：让儿童以教具自主操作的感官教学法，始于罗马
- 裁决：边界 ☐算 ☐留 ☐移 ｜ 档位 ☐维持 ☐改＿ ☐挂起 ｜ 理由：＿＿＿＿＿＿

#### 81. 太学｜Taixue

- **taixue_han** ｜ 现档 2（支柱）｜ kind 制度 ｜ antiquity ｜ 年份 -124（batch_asserted）
- 溯源 wikiEn：`Taixue`
- 结构：前置引用 pf=1 ｜ 被引总数 rf=1 ｜ 传递下游=1 ｜ 域内下游排名 41/94（越靠前越像支柱，此处第 43.6% 位）｜ 直接下游 1 条：书院(P2)
- 它的前置：稷下学宫
- desc：汉武帝设五经博士置弟子的中央官学，儒学入仕开端
- 裁决：边界 ☐算 ☐留 ☐移 ｜ 档位 ☐维持 ☐改＿ ☐挂起 ｜ 理由：＿＿＿＿＿＿

#### 82. 图书馆｜Library

- **library** ｜ 现档 4（改良细分）｜ kind 媒介 ｜ bronze_age ｜ 年份 -2500（century）
- 溯源 wikiEn：`Library`
- 结构：前置引用 pf=3 ｜ 被引总数 rf=6 ｜ 传递下游=4 ｜ 域内下游排名 20/94（越靠前越像支柱，此处第 21.3% 位）｜ 直接下游 3 条：博物馆(P2)、公共博物馆(P2)、十进图书分类法(P2)
- 它的前置：文字泥板
- desc：苏美尔神庙与埃勃拉王宫系统收藏分类泥板文书。
- 裁决：边界 ☐算 ☐留 ☐移 ｜ 档位 ☐维持 ☐改＿ ☐挂起 ｜ 理由：＿＿＿＿＿＿

### governance　（本域 116 条，零下游占 35.3%）

#### 83. 主权原则｜Sovereignty

- **sovereignty_principle** ｜ 现档 1（基石）｜ kind 原理 ｜ renaissance ｜ 年份 1576（circa）
- 溯源 wikiEn：`Sovereignty`
- 结构：前置引用 pf=0 ｜ 被引总数 rf=1 ｜ 传递下游=0 ｜ 域内下游排名 105/116（越靠前越像支柱，此处第 90.5% 位）｜ 直接下游 0 条
- 它的前置：学说汇纂、公民权与身份制度
- desc：认定国内只有一个不受外来指令约束的最高决断点，为国家与条约给出可识别的单位。
- 提名通道（规则也捞到了它）：基石尾组 ｜ [基石尾组] P1；域内(governance)下游数 0 ≤ 本域 P1 档 20 分位 0（本域 P1 共 16 条），或 pf=0（直接前置引用为 0）
- 裁决：边界 ☐算 ☐留 ☐移 ｜ 档位 ☐维持 ☐改＿ ☐挂起 ｜ 理由：＿＿＿＿＿＿

#### 84. 废奴立法｜Abolition Legislation

- **abolition_legislation** ｜ 现档 2（支柱）｜ kind 制度 ｜ industrial ｜ 年份 1833（exact）
- 溯源 wikiEn：`Abolitionism`
- 结构：前置引用 pf=0 ｜ 被引总数 rf=1 ｜ 传递下游=0 ｜ 域内下游排名 76/116（越靠前越像支柱，此处第 65.5% 位）｜ 直接下游 0 条
- 它的前置：奴隶制、阿育王石刻敕令、委托监护制、金属活字印刷
- desc：以成文法废止人身所有权并向业主支付补偿，把劳动力从财产改写为受合同法约束的主体。
- 提名通道（规则也捞到了它）：支柱尾组 ｜ [支柱尾组] P2；域内(governance)下游数 0 ≤ 本域 P2 档 20 分位 0 且 < 全域（本域全部条目）中位数 2（本域 P2 共 96 条）
- 裁决：边界 ☐算 ☐留 ☐移 ｜ 档位 ☐维持 ☐改＿ ☐挂起 ｜ 理由：＿＿＿＿＿＿

#### 85. 难民地位公约｜Refugee Convention

- **convention_on_refugees_1951** ｜ 现档 2（支柱）｜ kind 制度 ｜ atomic_electronic ｜ 年份 1951（exact）
- 溯源 wikiEn：`Convention Relating to the Status of Refugees`
- 结构：前置引用 pf=0 ｜ 被引总数 rf=1 ｜ 传递下游=0 ｜ 域内下游排名 82/116（越靠前越像支柱，此处第 70.7% 位）｜ 直接下游 0 条
- 它的前置：世界人权宣言、民事登记制、联合国、摄影
- desc：确立不得遣返受迫害者并发给国际通行证件，使身份不再完全由单一国籍授予。
- 提名通道（规则也捞到了它）：支柱尾组 ｜ [支柱尾组] P2；域内(governance)下游数 0 ≤ 本域 P2 档 20 分位 0 且 < 全域（本域全部条目）中位数 2（本域 P2 共 96 条）
- 裁决：边界 ☐算 ☐留 ☐移 ｜ 档位 ☐维持 ☐改＿ ☐挂起 ｜ 理由：＿＿＿＿＿＿

#### 86. 健康码｜Health Codes (Chinese mobile app group)

- **health_qr_code** ｜ 现档 4（改良细分）｜ kind 器物 ｜ intelligent ｜ 年份 2020（decade）
- 溯源 wikiEn：`Health Codes (Chinese mobile app group)`
- 结构：前置引用 pf=0 ｜ 被引总数 rf=5 ｜ 传递下游=0 ｜ 域内下游排名 89/116（越靠前越像支柱，此处第 76.7% 位）｜ 直接下游 0 条
- 它的前置：智能手机
- desc：2020年中国疫情期间推出的手机健康状态二维码通行系统。
- 裁决：边界 ☐算 ☐留 ☐移 ｜ 档位 ☐维持 ☐改＿ ☐挂起 ｜ 理由：＿＿＿＿＿＿

### logic_foundations　（本域 36 条，零下游占 38.9%）

#### 87. 类型论｜Type theory

- **type_theory** ｜ 现档 2（支柱）｜ kind 原理 ｜ second_industrial ｜ 年份 1908（batch_asserted）
- 溯源 wikiEn：`Type theory`
- 结构：前置引用 pf=1 ｜ 被引总数 rf=3 ｜ 传递下游=1 ｜ 域内下游排名 21/36（越靠前越像支柱，此处第 58.3% 位）｜ 直接下游 1 条：柯里—霍华德对应(P2)
- 它的前置：罗素悖论
- desc：把对象按层级分类型以禁绝自指悖论，后成证明助手与函数式编程语言的语法底座。
- 裁决：边界 ☐算 ☐留 ☐移 ｜ 档位 ☐维持 ☐改＿ ☐挂起 ｜ 理由：＿＿＿＿＿＿

#### 88. 作用代数｜Action algebra

- **action_algebra** ｜ 现档 4（改良细分）｜ kind 原理 ｜ information ｜ 年份 1990（decade）
- 溯源 wikiEn：`Action algebra`
- 结构：前置引用 pf=0 ｜ 被引总数 rf=1 ｜ 传递下游=0 ｜ 域内下游排名 25/36（越靠前越像支柱，此处第 69.4% 位）｜ 直接下游 0 条
- 它的前置：布尔代数（结构）
- desc：兼具剩余半格与克林尼星号的代数结构，普拉特1990年提出，是程序逻辑代数模型。
- 裁决：边界 ☐算 ☐留 ☐移 ｜ 档位 ☐维持 ☐改＿ ☐挂起 ｜ 理由：＿＿＿＿＿＿

### materials　（本域 130 条，零下游占 47.7%）

#### 89. 稀土钡铜氧超导带材｜REBCO coated conductor

- **rebco_coated_conductor_tape** ｜ 现档 2（支柱）｜ kind 工艺 ｜ intelligent ｜ 年份 2006（circa）
- 溯源 wikiEn：`Rare-earth barium copper oxide`
- 结构：前置引用 pf=0 ｜ 被引总数 rf=0 ｜ 传递下游=0 ｜ 域内下游排名 115/130（越靠前越像支柱，此处第 88.5% 位）｜ 直接下游 0 条
- 它的前置：化学气相沉积、超导现象
- desc：在织构金属基带上外延稀土钡铜氧薄膜，做成可载大电流的柔性超导带。
- 提名通道（规则也捞到了它）：支柱尾组 ｜ [支柱尾组] P2；域内(materials)下游数 0 ≤ 本域 P2 档 20 分位 0 且 < 全域（本域全部条目）中位数 1（本域 P2 共 51 条）
- 裁决：边界 ☐算 ☐留 ☐移 ｜ 档位 ☐维持 ☐改＿ ☐挂起 ｜ 理由：＿＿＿＿＿＿

#### 90. 富勒烯｜Buckminsterfullerene

- **fullerene** ｜ 现档 3（域内重要）｜ kind 工艺 ｜ information ｜ 年份 1985（exact）
- 溯源 wikiEn：`Buckminsterfullerene`
- 结构：前置引用 pf=2 ｜ 被引总数 rf=4 ｜ 传递下游=6 ｜ 域内下游排名 24/130（越靠前越像支柱，此处第 18.5% 位）｜ 直接下游 2 条：碳纳米管(P3)、石墨烯(P2)
- 它的前置：（无）
- desc：克罗托等发现C60笼形分子，开启纳米碳材料领域。
- 裁决：边界 ☐算 ☐留 ☐移 ｜ 档位 ☐维持 ☐改＿ ☐挂起 ｜ 理由：＿＿＿＿＿＿

#### 91. 玻璃纸｜Cellophane

- **cellophane** ｜ 现档 4（改良细分）｜ kind 媒介 ｜ second_industrial ｜ 年份 1908（batch_asserted）
- 溯源 wikiEn：`Cellophane`
- 结构：前置引用 pf=1 ｜ 被引总数 rf=2 ｜ 传递下游=3 ｜ 域内下游排名 41/130（越靠前越像支柱，此处第 31.5% 位）｜ 直接下游 1 条：血液透析(P2)
- 它的前置：（无）
- desc：布兰登伯格1908年制玻璃纸，首种透明包装薄膜。
- 裁决：边界 ☐算 ☐留 ☐移 ｜ 档位 ☐维持 ☐改＿ ☐挂起 ｜ 理由：＿＿＿＿＿＿

#### 92. 夹层玻璃｜Laminated glass

- **laminated_glass** ｜ 现档 4（改良细分）｜ kind 工艺 ｜ second_industrial ｜ 年份 1909（batch_asserted）
- 溯源 wikiEn：`Laminated glass`
- 结构：前置引用 pf=0 ｜ 被引总数 rf=5 ｜ 传递下游=0 ｜ 域内下游排名 91/130（越靠前越像支柱，此处第 70.0% 位）｜ 直接下游 0 条
- 它的前置：（无）
- desc：本尼迪克图斯1909年发明夹胶安全玻璃，破碎不飞溅。
- 裁决：边界 ☐算 ☐留 ☐移 ｜ 档位 ☐维持 ☐改＿ ☐挂起 ｜ 理由：＿＿＿＿＿＿

### military　（本域 113 条，零下游占 65.5%）

#### 93. 征兵制｜Conscription

- **conscription** ｜ 现档 2（支柱）｜ kind 制度 ｜ industrial ｜ 年份 1793（batch_asserted）
- 溯源 wikiEn：`Conscription`
- 结构：前置引用 pf=0 ｜ 被引总数 rf=4 ｜ 传递下游=0 ｜ 域内下游排名 63/113（越靠前越像支柱，此处第 55.8% 位）｜ 直接下游 0 条
- 它的前置：民族国家
- desc：以公民义务为基础的普遍兵役制，决定近代动员规模。
- 裁决：边界 ☐算 ☐留 ☐移 ｜ 档位 ☐维持 ☐改＿ ☐挂起 ｜ 理由：＿＿＿＿＿＿

#### 94. 防毒面具｜Gas mask

- **gas_mask** ｜ 现档 2（支柱）｜ kind 器物 ｜ second_industrial ｜ 年份 1916（batch_asserted）
- 溯源 wikiEn：`Gas mask`
- 结构：前置引用 pf=0 ｜ 被引总数 rf=1 ｜ 传递下游=0 ｜ 域内下游排名 71/113（越靠前越像支柱，此处第 62.8% 位）｜ 直接下游 0 条
- 它的前置：化学武器
- desc：滤毒罐吸附或中和毒剂蒸气，化学战的标配防护。
- 裁决：边界 ☐算 ☐留 ☐移 ｜ 档位 ☐维持 ☐改＿ ☐挂起 ｜ 理由：＿＿＿＿＿＿

#### 95. 游击战｜Guerrilla warfare

- **guerrilla_warfare** ｜ 现档 2（支柱）｜ kind 原理 ｜ industrial ｜ 年份 1808（batch_asserted）
- 溯源 wikiEn：`Guerrilla warfare`
- 结构：前置引用 pf=0 ｜ 被引总数 rf=2 ｜ 传递下游=0 ｜ 域内下游排名 76/113（越靠前越像支柱，此处第 67.3% 位）｜ 直接下游 0 条
- 它的前置：（无）
- desc：弱势一方依托民众以袭扰消耗正规军的非对称战法。
- 裁决：边界 ☐算 ☐留 ☐移 ｜ 档位 ☐维持 ☐改＿ ☐挂起 ｜ 理由：＿＿＿＿＿＿

#### 96. 投石绊索｜Bolas

- **bolas** ｜ 现档 5（长尾）｜ kind 工艺 ｜ prehistory ｜ 年份 -15000（century）
- 溯源 wikiEn：`Bolas`
- 结构：前置引用 pf=0 ｜ 被引总数 rf=1 ｜ 传递下游=0 ｜ 域内下游排名 52/113（越靠前越像支柱，此处第 46.0% 位）｜ 直接下游 0 条
- 它的前置：绳索
- desc：系重球的绳索，掷出缠绕以绊捕猎物。
- 裁决：边界 ☐算 ☐留 ☐移 ｜ 档位 ☐维持 ☐改＿ ☐挂起 ｜ 理由：＿＿＿＿＿＿

### space_exploration　（本域 52 条，零下游占 61.5%）

#### 97. 航天飞机｜Space Shuttle

- **space_shuttle** ｜ 现档 1（基石）｜ kind 器物 ｜ information ｜ 年份 1981（exact）
- 溯源 wikiEn：`Space Shuttle`
- 结构：前置引用 pf=0 ｜ 被引总数 rf=2 ｜ 传递下游=0 ｜ 域内下游排名 45/52（越靠前越像支柱，此处第 86.5% 位）｜ 直接下游 0 条
- 它的前置：火箭发动机、钝体防热罩
- desc：哥伦比亚号首飞，可重复使用天地往返系统投入使用。
- 提名通道（规则也捞到了它）：基石尾组 ｜ [基石尾组] P1；域内(space_exploration)下游数 0 ≤ 本域 P1 档 20 分位 0（本域 P1 共 4 条），或 pf=0（直接前置引用为 0）
- 裁决：边界 ☐算 ☐留 ☐移 ｜ 档位 ☐维持 ☐改＿ ☐挂起 ｜ 理由：＿＿＿＿＿＿

#### 98. 星链｜Starlink

- **starlink** ｜ 现档 2（支柱）｜ kind 媒介 ｜ intelligent ｜ 年份 2019（exact）
- 溯源 wikiEn：`Starlink`
- 结构：前置引用 pf=0 ｜ 被引总数 rf=4 ｜ 传递下游=0 ｜ 域内下游排名 46/52（越靠前越像支柱，此处第 88.5% 位）｜ 直接下游 0 条
- 它的前置：可回收火箭、人造卫星
- desc：2019年首批组网，万颗级低轨卫星互联网全球服务。
- 裁决：边界 ☐算 ☐留 ☐移 ｜ 档位 ☐维持 ☐改＿ ☐挂起 ｜ 理由：＿＿＿＿＿＿

#### 99. 钝体防热罩｜Heat shield

- **blunt_body_heat_shield** ｜ 现档 3（域内重要）｜ kind 原理 ｜ atomic_electronic ｜ 年份 1951（batch_asserted）
- 溯源 wikiEn：`Heat shield`
- 结构：前置引用 pf=2 ｜ 被引总数 rf=2 ｜ 传递下游=2 ｜ 域内下游排名 10/52（越靠前越像支柱，此处第 19.2% 位）｜ 直接下游 2 条：科罗纳侦察卫星(P3)、航天飞机(P1)
- 它的前置：V-2火箭
- desc：艾伦钝体理论与烧蚀罩，让弹头与飞船安全再入。
- 裁决：边界 ☐算 ☐留 ☐移 ｜ 档位 ☐维持 ☐改＿ ☐挂起 ｜ 理由：＿＿＿＿＿＿

#### 100. 月球车1号｜Lunokhod 1

- **lunokhod** ｜ 现档 4（改良细分）｜ kind 器物 ｜ information ｜ 年份 1970（convention_floor）
- 溯源 wikiEn：`Lunokhod 1`
- 结构：前置引用 pf=0 ｜ 被引总数 rf=1 ｜ 传递下游=0 ｜ 域内下游排名 38/52（越靠前越像支柱，此处第 73.1% 位）｜ 直接下游 0 条
- 它的前置：月球探测器
- desc：1970年首辆地外遥控车在月面行驶逾十公里。
- 裁决：边界 ☐算 ☐留 ☐移 ｜ 档位 ☐维持 ☐改＿ ☐挂起 ｜ 理由：＿＿＿＿＿＿

---

生成：`node scripts/adjud_calib_doc.mjs` ｜ 数据快照 seed 20260927
