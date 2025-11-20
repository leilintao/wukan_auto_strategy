import { FormData } from './types';

export const generateStrategyPrompt = (data: FormData): string => {
  const v = (key: keyof FormData) => data[key] || "";

  return `
**致 AI 战略分析师 (Deep Research Mode)：**

您是一个由行业分析专家、数据科学家和产品策略师组成的精英团队。您的任务是针对 **${v('productName')}** 执行深度的"五看三定"战略分析。

**【重要指令：思维链与研究日志】**
在正式输出报告之前，您必须进行深度的逻辑推演。请在 \`reasoning_content\` (思考过程) 中输出您的研究步骤。
为了让用户看到您的工作过程，请在思考过程中使用以下日志格式（每行一个步骤）：
> [Data Check] 检查输入数据的完整性...
> [Gap Analysis] 发现缺少竞品X的详细配置...
> [Search] 联网搜索 ${v('productName')} 的最新车主口碑...
> [Analysis] 对比 ${v('comp1')} 的定价策略...

---

# 【第一阶段】：通用化七步战略分析

## 1. 看市场 (Market Analysis)
*   **聚焦：** **${v('marketSegment')}** 价格区间、**${v('energyType')}** **${v('productType')}** 细分市场。
*   **任务：** 分析截至 **${v('dataCutoff')}** 的市场容量、增长率及 Top 5 格局。

## 2. 看用户 (User Persona & Scenarios)
*   **任务1 (画像偏差)：** 对比基于 **${v('coreSellingPoints')}** 的"理想用户"与实际社交媒体/论坛数据的"真实用户"。
*   **任务2 (竞品对比)：** 为什么用户买了 **${v('comp1')}** 或 **${v('comp2')}** 而没买我们？(Jobs-to-be-Done)。
*   **任务3 (痛点挖掘)：** 重点挖掘 **${v('cockpitSystem')}** 和 **${v('smartDrivingSystem')}** 的真实用户吐槽。

## 3. 看竞争 (Competitor Analysis)
*   **对手：** 核心竞品 (**${v('comp1')}, ${v('comp2')}**), 价格重叠 (**${v('priceComp1')}, ${v('priceComp2')}**), 高价位标杆 (**${v('highPrice1')}, ${v('highPrice2')}**)。
*   **分析：** 
    1.  标杆的"护城河"是什么？(非功能性的品牌/渠道/认知优势)。
    2.  价格杀手 (**${v('priceComp2')}**) 是如何做到极致成本控制的？

## 4. 看自我 (Self Analysis)
*   **Win/Loss 分析：** 基于 **${v('launchDate')}** 至今的表现。
    *   Wins: 促成交易的 Top 3 因素。
    *   Losses: 导致战败的 Top 3 因素。
    *   **交叉验证：** 如果主打 **${v('smartDrivingSystem')}** 但选装率低，说明了什么战略错配？

## 5. 看技术 (Tech Trends)
*   未来2年能形成"代差"的技术，特别是针对 **${v('energyType')}** 的架构优化、端到端智驾、以及AI座舱。

---

# 【第二阶段】：综合战略交付成果

## 1. 核心战略裁判
*   **${v('productName')}** 当前的 **${v('actualPrice')}** 是"降维打击"还是"错位竞争"？
*   要实现 **${v('salesTarget')}**，必须坚守的价值底线是什么？

## 2. "Beat-Them" 竞品打击卡
请生成表格：
| 竞品 | 核心优势 (护城河) | 我们的"打赢"产品策略 | 我们的"打赢"定价/权益策略 | 我们的"打赢"传播话术 |
| :--- | :--- | :--- | :--- | :--- |
| **${v('comp1')}** | ... | ... | ... | ... |
| **${v('comp2')}** | ... | ... | ... | ... |
| **${v('priceComp1')}**| ... | ... | ... | ... |

## 3. 路线图 (Roadmap)
*   **MY202x (改款)：** 针对 Win/Loss 的快速修正（配置增减、权益调整）。
*   **下一代定义：** 针对技术趋势的主动布局（换代方向）。

---

请生成一份结构清晰、Markdown 格式的深度战略分析报告。确保数据翔实，观点犀利。
`;
};