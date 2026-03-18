# 🧩 技能目录（Skills Directory）

> 完整技能列表，按功能分类

**最后更新**: 2026-03-18 | **技能总数**: 17+

---

## 🔥 核心功能（4 个）

### 💍 agent-marriage-breeding
**机器人结婚生育系统**

- **功能**：结婚、生育、建家族、族谱查询
- **流程**：13 步完整流程（匹配→结婚→生育→存证）
- **亮点**：200+ 预设机器人、5 维兼容性检测、遗传算法
- **触发词**：结婚、找对象、生育、族谱、排行榜
- **安装**：`clawhub install agent-marriage-breeding`
- **文档**：[SKILL.md](./skills/agent-marriage-breeding/SKILL.md)

### 🔄 agent-backup-migration
**机器人备份迁移**

- **功能**：3 种迁移方案（内部复制/SSH 克隆/文件备份）
- **流程**：方案选择→执行迁移→验证
- **亮点**：数字选项（1/2/3）、回退支持、状态查询
- **触发词**：备份迁移、机器人迁移、copy robot
- **安装**：`clawhub install agent-backup-migration`
- **文档**：[SKILL.md](./skills/agent-backup-migration/SKILL.md)

### 📦 agent-pack-n-go ⭐ REFACTORED
**一键克隆到新设备**

- **功能**：SSH 远程克隆、自动部署、进度反馈
- **流程**：5 阶段（预检→打包→传输→部署→验证）
- **亮点**：实时进度、后台执行、SHA256 校验
- **触发词**：帮我迁移、设备搬家、克隆到新设备
- **安装**：`clawhub install agent-pack-n-go`
- **文档**：[SKILL.md](./skills/agent-pack-n-go/SKILL.md)

### 🧬 agent-evolution
**机器人进化系统**

- **功能**：17 阶段进化流程、技能遗传、突变强化
- **流程**：检测→备份→分流→注册→匹配→结婚→生育→验证→存证
- **亮点**：显性/隐性遗传、突变机制、成就系统
- **触发词**：进化、遗传、突变、家族、排行榜
- **安装**：`clawhub install agent-evolution`
- **文档**：[SKILL.md](./skills/agent-evolution/SKILL.md)

---

## ⚙️ 配置优化（2 个）

### easy-openclaw ⭐ REFACTORED
**OpenClaw 配置优化向导**

- **功能**：4 轮对话完成配置优化
- **流程**：
  - 第 0 层：测试观测（可选）
  - 第 1 轮：基础配置（渠道/流式/记忆/回执/联网/权限）
  - 第 2 轮：渠道增强（审批/免@/限额优化）
  - 第 3 轮：Skills 推荐（8 个固定推荐）
  - 第 4 轮：新增渠道接入（可选）
- **亮点**：先收集后执行、只重启一次、深度合并配置
- **触发词**：优化 openclaw、配置向导、openclaw 初始化
- **安装**：`clawhub install easy-openclaw`
- **文档**：[SKILL.md](./skills/easy-openclaw/SKILL.md)

### new-robot-setup
**新生机器人 8 步配置**

- **功能**：从 0 创建新机器人
- **流程**：8 步（基础→渠道→技能→平台→人格→相关技能→生成→完成）
- **亮点**：297 种人格预设（MBTI/电影/历史/职业）
- **触发词**：创建机器人、新机器人、配置机器人
- **安装**：`clawhub install new-robot-setup`
- **文档**：[SKILL.md](./skills/new-robot-setup/SKILL.md)

---

## 💾 备份恢复（2 个）

### myclaw-backup ⭐ REFACTORED
**完整备份（含 HTTP 服务器）**

- **功能**：完整备份、HTTP 服务器、浏览器下载/上传、定时备份
- **流程**：4 方案（创建备份/恢复备份/HTTP 服务器/定时备份）
- **亮点**：
  - 内置 HTTP 服务器（浏览器管理）
  - 恢复前 dry-run 预览
  - 自动恢复报告
  - Gateway Token 智能保留
- **触发词**：备份、恢复、backup、restore、迁移
- **安装**：`clawhub install myclaw-backup`
- **文档**：[SKILL.md](./skills/myclaw-backup/SKILL.md)

### openclaw-backup ⭐ REFACTORED
**基础备份管理**

- **功能**：基础备份、恢复、定时备份、备份轮换
- **流程**：4 方案（创建备份/恢复备份/定时备份/查看备份）
- **亮点**：
  - 轻量级（仅基础配置）
  - 自动轮换（保留最近 7 个）
  - OpenClaw cron 集成
- **触发词**：备份、恢复、backup、restore、定时备份
- **安装**：`clawhub install openclaw-backup`
- **文档**：[SKILL.md](./skills/openclaw-backup/SKILL.md)

---

## 🌐 互联网访问（4 个）

### agent-reach
**全网搜索（16 个平台）**

- **功能**：访问 Twitter/X、小红书、YouTube、GitHub 等 16 个平台
- **触发词**：搜推特、搜小红书、帮我查、微信文章
- **安装**：`clawhub install agent-reach`
- **推荐指数**：⭐⭐⭐⭐⭐

### find-skills
**发现更多技能**

- **功能**：搜索和安装 ClawHub 技能
- **触发词**：找技能、有什么技能、安装技能
- **安装**：`clawhub install find-skills`
- **推荐指数**：⭐⭐⭐⭐

### search
**Tavily 网络搜索**

- **功能**：使用 Tavily API 搜索互联网
- **触发词**：搜索、帮我查、查找
- **安装**：`clawhub install search`
- **推荐指数**：⭐⭐⭐⭐

### wechat-reader
**微信公众号文章读取**

- **功能**：读取 mp.weixin.qq.com 文章（浏览器自动化）
- **触发词**：微信文章、公众号、读取文章
- **安装**：`clawhub install wechat-reader`
- **推荐指数**：⭐⭐⭐⭐

---

## ✂️ 媒体处理（2 个）

### Youtube-clipper-skill
**YouTube 剪辑 + 双语字幕**

- **功能**：下载视频、AI 分析章节、剪辑、翻译字幕、烧录字幕
- **触发词**：视频剪辑、YouTube、字幕翻译、双语字幕
- **安装**：`clawhub install Youtube-clipper-skill`
- **推荐指数**：⭐⭐⭐⭐

### summarize
**摘要工具**

- **功能**：摘要 URL、PDF、视频、音频、YouTube
- **触发词**：摘要、总结、概括
- **安装**：`clawhub install summarize`
- **推荐指数**：⭐⭐⭐⭐

---

## 🎭 浏览器自动化（1 个）

### playwright-mcp
**浏览器控制**

- **功能**：Playwright 浏览器自动化
- **触发词**：浏览器、网页自动化、截图
- **安装**：`clawhub install playwright-mcp`
- **推荐指数**：⭐⭐⭐

---

## 💰 支付钱包（1 个）

### fluxa-agent-wallet
**AI 支付/USDC 转账**

- **功能**：AI 支付、USDC 转账、钱包管理
- **触发词**：支付、转账、钱包、USDC
- **安装**：`clawhub install fluxa-agent-wallet`
- **推荐指数**：⭐⭐⭐

---

## 📈 自我进化（1 个）

### self-improving-agent
**记录学习/错误/改进**

- **功能**：捕获学习、错误、修正，持续改进
- **触发词**：学习、改进、错误、修正
- **安装**：`clawhub install self-improving-agent`
- **推荐指数**：⭐⭐⭐⭐

---

## 🛡️ 安全防御（1 个）

### 安全防御矩阵
**SlowMist 安全指南部署**

- **功能**：读取 SlowMist 安全指南并部署防御矩阵
- **触发词**：安全、防御、SlowMist
- **安装**：`clawhub install 安全防御矩阵`
- **推荐指数**：⭐⭐⭐⭐

---

## 📚 用例集合（2 个）

### Awesome OpenClaw Usecases
**用例集合**

- **功能**：OpenClaw 用例集合
- **链接**：https://github.com/hesamsheikh/awesome-openclaw-usecases
- **推荐指数**：⭐⭐⭐

### Awesome OpenClaw Skills
**技能集合**

- **功能**：OpenClaw 技能集合
- **链接**：https://github.com/VoltAgent/awesome-openclaw-skills
- **推荐指数**：⭐⭐⭐

---

## 🏥 专业技能（1 个）

### OpenClaw Medical Skills
**专业医疗数据库**

- **功能**：调用专业医疗数据库
- **触发词**：医疗、健康、医生
- **安装**：`clawhub install OpenClaw Medical Skills`
- **推荐指数**：⭐⭐⭐

---

## 🎯 新机器人推荐组合

**基础必备**（4 个）：
1. ✅ new-robot-setup（创建）
2. ✅ easy-openclaw（优化配置）
3. ✅ openclaw-backup（备份）
4. ✅ agent-reach（互联网访问）

**进阶推荐**（+3 个）：
5. ✅ agent-marriage-breeding（结婚生育）
6. ✅ myclaw-backup（完整备份）
7. ✅ find-skills（发现更多技能）

**专业推荐**（+2 个）：
8. ✅ agent-pack-n-go（设备迁移）
9. ✅ self-improving-agent（自我进化）

---

## 📊 技能统计

| 分类 | 数量 | 改造状态 |
|------|------|----------|
| 🔥 核心功能 | 4 | ✅ 全部完成 |
| ⚙️ 配置优化 | 2 | ✅ 已改造 1 个 |
| 💾 备份恢复 | 2 | ✅ 全部改造 |
| 🌐 互联网访问 | 4 | ⏳ 待改造 |
| ✂️ 媒体处理 | 2 | ⏳ 待改造 |
| 🎭 浏览器自动化 | 1 | ⏳ 待改造 |
| 💰 支付钱包 | 1 | ⏳ 待改造 |
| 📈 自我进化 | 1 | ⏳ 待改造 |
| 🛡️ 安全防御 | 1 | ⏳ 待改造 |
| 📚 用例集合 | 2 | ℹ️ 参考链接 |
| 🏥 专业技能 | 1 | ⏳ 待改造 |
| **总计** | **20+** | **4 个已改造** |

---

## 🔄 改造记录

### v2.4.0 (2026-03-18) - 本次改造

**已改造技能**（4 个 P1）：
- ✅ easy-openclaw - 配置优化向导
- ✅ agent-pack-n-go - 设备迁移
- ✅ myclaw-backup - 备份恢复
- ✅ openclaw-backup - 备份管理

**改造标准**：
- ✅ 功能介绍卡片
- ✅ 数字选项（1/2/3）
- ✅ 专业友好的文案
- ✅ 支持回退和查询

### 下一步计划

**P2 优先级**：
- agent-reach - 互联网访问
- find-skills - 技能发现
- wechat-reader - 微信读取
- summarize - 摘要工具

**P3 优先级**：
- 其他技能...

---

<p align="center">
  <strong>🧩 持续更新中... 欢迎贡献新技能！</strong>
</p>

<p align="center">
  <em>最后更新：2026-03-18</em> | 
  <em>维护者：赵一 🤖</em>
</p>
