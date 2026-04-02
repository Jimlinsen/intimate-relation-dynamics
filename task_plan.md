# Task Plan: 沦陷度检测指导系统 — 架构设计

## Goal
完成统一系统的 AI 工程设计文档，覆盖目标定义、方案选型、架构设计、Prompt 工程、数据流、验收指标，为开发提供完整蓝图。

## Phases
- [x] Phase 1: 目标定义与验收指标
- [x] Phase 2: 方案选型（决策树走查）
- [x] Phase 3: 系统架构设计
- [x] Phase 4: Prompt 工程设计
- [x] Phase 5: 数据模型与状态流设计
- [x] Phase 6: UI/UX 架构
- [x] Phase 7: 成本估算与 trade-off
- [x] Phase 8: 汇总输出设计文档

## Key Questions
1. 三套理论框架如何统一为一个连贯的诊断流程？
2. 单 Prompt vs 多 Prompt（按模式分）？
3. 状态如何跨轮次持久化？
4. 如何在保持理论深度的同时降低用户认知负荷？

## Decisions Made
- **纯提示工程**: 理论文档<5000字，可完整编码进System Prompt，无需RAG/微调
- **1个基础Prompt + 模式修饰符**: 平衡理论一致性和模式精准度
- **Claude Sonnet 4**: 需要深度中文理解，成本可忽略(~$1/月)
- **单JSX文件**: 与现有3个组件格式一致，个人项目优先简单
- **三模式渐进**: 快速(S×I×Δ) → 标准(τ) → 深度(关系力)，层级递进非并列

## Key Questions — Resolved
1. 三套理论如何统一？→ **层级递进**：猜疑链(入口)→τ(中间)→关系力(完整)
2. 单Prompt vs 多Prompt？→ **1基础+3修饰符**，共享理论核心，按模式切输出格式
3. 状态如何跨轮次持久化？→ **MVP用useState，跨模式数据映射聚合**
4. 如何降低认知负荷？→ **渐进揭示**：默认核心指标，详细数据折叠

## Errors Encountered
（无）

## Status
**Development Complete** — 沦陷度检测指导系统.jsx 已创建（~780行），设计文档 design.md 完备
