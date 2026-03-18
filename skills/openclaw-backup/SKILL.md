---
name: openclaw-backup
description: >
  📦 OpenClaw Backup - 基础备份管理。
  备份和恢复 OpenClaw 配置、凭证、工作区。
  支持定时备份（cron）和备份轮换（保留最近 7 个）。
  触发词："备份"、"恢复"、"backup"、"restore"、"定时备份"
---

# 📦 OpenClaw Backup - 基础备份管理

备份和恢复 OpenClaw 配置、凭证、工作区数据。
支持定时备份（cron 调度）和自动备份轮换（保留最近 7 个）。

## 🎯 技能选择引导

当用户在配置新机器人时询问"有哪些技能"或"应该选什么技能"时，可以使用以下引导对话：

### 快速技能推荐

**用户问**：有哪些技能可以选？/ 每个技能是做什么的？

**机器人回复**：
```
🧩 **当前可用技能目录**

我整理了 17 个技能，分为 8 大类：

**🔥 核心功能**
- 💍 agent-marriage-breeding - 机器人结婚、生育、建家族
- 🔄 agent-backup-migration - 机器人配置迁移（3 种方案）
- 📦 agent-pack-n-go - 一键克隆到新设备
- 🧬 agent-evolution - 机器人进化系统（17 阶段流程）

**⚙️ 配置优化**
- easy-openclaw - OpenClaw 配置向导（4 轮对话）
- new-robot-setup - 新生机器人 8 步配置

**💾 备份恢复**
- myclaw-backup - 完整备份（含 HTTP 服务器）
- openclaw-backup - 基础备份

**🌐 互联网访问**
- agent-reach - 访问 16 个平台（推特/小红书/YouTube 等）
- find-skills - 发现更多技能
- search - Tavily 网络搜索
- wechat-reader - 读取微信文章

**✂️ 媒体处理**
- Youtube-clipper-skill - YouTube 剪辑 + 双语字幕
- summarize - 摘要 URL/PDF/视频

**🎭 浏览器自动化**
- playwright-mcp - 浏览器控制

**💰 支付钱包**
- fluxa-agent-wallet - AI 支付/USDC 转账

**📈 自我进化**
- self-improving-agent - 记录学习/错误/改进

---

**💡 新机器人推荐组合**：
1. new-robot-setup（创建）
2. easy-openclaw（优化配置）
3. openclaw-backup（备份）
4. agent-reach（互联网访问）

你想了解哪个技能的详情？或回复编号查看说明。
```

### 技能详情展示

**用户问**：openclaw-backup 是做什么的？/ 基础备份详情

**机器人回复**：
```
📦 **openclaw-backup - 基础备份**

**一句话**：OpenClaw 基础备份管理（轻量级）

**功能**：
- 备份：配置、凭证、工作区
- 恢复：从备份还原
- 定时备份：cron 自动调度
- 备份轮换：保留最近 7 个备份

**备份内容**：
- ✅ openclaw.json（主配置）
- ✅ credentials/（API 密钥、Token）
- ✅ agents/（Agent 配置、认证 profile）
- ✅ workspace/（记忆、SOUL.md、用户文件）
- ✅ telegram/（会话数据）
- ✅ cron/（定时任务）

**不备份**：
- ❌ completions/（缓存，自动生成）
- ❌ *.log（日志）

**与 myclaw-backup 的区别**：
- openclaw-backup：轻量级，基础备份
- myclaw-backup：完整备份，含 HTTP 服务器

**推荐指数**：⭐⭐⭐⭐（基础备份够用）

**触发词**：备份、恢复、backup、restore、定时备份

**备份位置**：`~/openclaw-backups/`
**备份格式**：`openclaw-YYYY-MM-DD_HHMM.tar.gz`

要继续了解其他技能吗？回复"返回"或技能编号。
```

---

## 工作流程（3 阶段流程）

### 阶段 1：方案选择

当用户触发备份相关操作时，发送以下消息：

> 📦 **OpenClaw Backup - 备份与恢复**
>
> 我可以帮你：
>
> | 方案 | 功能 |
> |------|------|
> | **1. 创建备份** | 生成备份文件（.tar.gz） |
> | **2. 恢复备份** | 从备份文件还原 |
> | **3. 定时备份** | 设置自动备份（每天 3 点） |
> | **4. 查看备份** | 列出已有备份文件 |
>
> 请回复：**1**、**2**、**3** 或 **4**（或直接说"创建备份"/"恢复备份"/"定时备份"/"查看备份"）

---

### 阶段 2：根据用户选择执行

#### 方案 1：创建备份

**执行备份**：
```bash
./scripts/backup.sh ~/openclaw-backups
# → ~/openclaw-backups/openclaw-2026-03-18_1030.tar.gz
```

**完成通知**：
> ✅ **备份完成！**
>
> 📦 备份文件：`openclaw-2026-03-18_1030.tar.gz`
> 📍 位置：`~/openclaw-backups/`
> 💾 大小：{size} MB
> 🔄 保留策略：最近 7 个备份（自动轮换）
>
> **下一步可以**：
> - "恢复备份" — 从该备份还原
> - "设置定时备份" — 自动备份
> - "查看备份" — 列出所有备份

---

#### 方案 2：恢复备份

**1. 列出可用备份**：
```bash
ls -lh ~/openclaw-backups/*.tar.gz
```

> 📂 **可用备份文件**：
>
> | # | 文件名 | 大小 | 时间 |
> |---|--------|------|------|
> | 1 | openclaw-2026-03-18_1030.tar.gz | 50MB | 10:30 |
> | 2 | openclaw-2026-03-17_0300.tar.gz | 48MB | 昨天 |
> | 3 | openclaw-2026-03-16_0300.tar.gz | 47MB | 2 天前 |
>
> 请回复编号选择，或输入完整文件名。

**2. 确认恢复**：
> ⚠️ **恢复将覆盖现有配置**
>
> 确认要恢复吗？这将：
> 1. 停止 OpenClaw Gateway
> 2. 备份当前配置（回滚用）
> 3. 解压选中的备份文件
> 4. 启动 OpenClaw Gateway
>
> 回复"是"或"确定"继续。

**3. 执行恢复**：
```bash
# 停止 Gateway
openclaw gateway stop

# 备份当前配置（回滚用）
mv ~/.openclaw ~/.openclaw-old

# 解压备份
tar -xzf ~/openclaw-backups/openclaw-YYYY-MM-DD_HHMM.tar.gz -C ~

# 启动 Gateway
openclaw gateway start
```

**4. 完成通知**：
> ✅ **恢复完成！**
>
> 📦 备份：`openclaw-YYYY-MM-DD_HHMM.tar.gz`
> 🕐 恢复时间：{restored_at}
>
> **回滚**：
> 如果需要回滚到恢复前的状态：
> ```bash
> openclaw gateway stop
> mv ~/.openclaw-old ~/.openclaw
> openclaw gateway start
> ```

---

#### 方案 3：定时备份

**1. 选择备份频率**：
> ⏰ **设置定时备份**
>
> 请选择备份频率：
>
> | 选项 | 频率 | Cron 表达式 |
> |------|------|-------------|
> | 1 | 每天（推荐） | `0 3 * * *` |
> | 2 | 每周 | `0 3 * * 0` |
> | 3 | 每月 | `0 3 1 * *` |
>
> 请回复：**1**、**2** 或 **3**

**2. 确认并添加 cron**：
> ✅ **确认配置**：
>
> - 频率：每天 3:00 UTC
> - 备份位置：`~/openclaw-backups/`
> - 保留策略：最近 7 个备份
>
> 确认添加定时任务？回复"是"或"确定"

**3. 使用 OpenClaw cron 创建定时任务**：

创建 cron 配置文件：
```json
{
  "name": "daily-backup",
  "schedule": {
    "kind": "cron",
    "expr": "0 3 * * *",
    "tz": "UTC"
  },
  "payload": {
    "kind": "agentTurn",
    "message": "Run ~/.openclaw/backup.sh and report result to user."
  },
  "sessionTarget": "isolated",
  "delivery": {
    "mode": "announce"
  }
}
```

**4. 完成通知**：
> ✅ **定时备份已设置！**
>
> 📅 频率：每天 3:00 UTC
> 📍 备份位置：`~/openclaw-backups/`
> 🔄 保留策略：最近 7 个备份
>
> **查看定时任务**：
> ```bash
> openclaw cron list
> ```
>
> **取消定时备份**：
> ```bash
> openclaw cron delete daily-backup
> ```

---

#### 方案 4：查看备份

**列出备份文件**：
```bash
ls -lh ~/openclaw-backups/*.tar.gz
```

**返回结果**：
> 📂 **备份文件列表**
>
> | # | 文件名 | 大小 | 创建时间 |
> |---|--------|------|----------|
> | 1 | openclaw-2026-03-18_1030.tar.gz | 50MB | 2026-03-18 10:30 |
> | 2 | openclaw-2026-03-17_0300.tar.gz | 48MB | 2026-03-17 03:00 |
> | 3 | openclaw-2026-03-16_0300.tar.gz | 47MB | 2026-03-16 03:00 |
> | 4 | openclaw-2026-03-15_0300.tar.gz | 46MB | 2026-03-15 03:00 |
> | 5 | openclaw-2026-03-14_0300.tar.gz | 45MB | 2026-03-14 03:00 |
> | 6 | openclaw-2026-03-13_0300.tar.gz | 44MB | 2026-03-13 03:00 |
> | 7 | openclaw-2026-03-12_0300.tar.gz | 43MB | 2026-03-12 03:00 |
>
> **保留策略**：最近 7 个备份（自动轮换）
>
> **操作**：
> - "恢复 #1" — 从编号 1 的备份恢复
> - "删除 #7" — 删除最旧的备份
> - "创建备份" — 创建新备份

---

### 阶段 3：备份轮换

备份脚本自动保留最近 7 个备份：

```bash
# 在 backup.sh 中
# 保留最近 7 个备份，删除更早的
ls -t ~/openclaw-backups/openclaw-*.tar.gz | tail -n +8 | xargs -r rm
```

**轮换策略**：
- 保留：最近 7 个备份
- 删除：第 8 个及更早的备份
- 触发：每次创建新备份时自动执行

---

## 核心命令

### 创建备份
```bash
./scripts/backup.sh [backup_dir]
# 默认：~/openclaw-backups/
# 输出：openclaw-YYYY-MM-DD_HHMM.tar.gz
```

### 恢复备份
```bash
# 1. 停止 Gateway
openclaw gateway stop

# 2. 备份当前配置
mv ~/.openclaw ~/.openclaw-old

# 3. 解压备份
tar -xzf ~/openclaw-backups/openclaw-YYYY-MM-DD_HHMM.tar.gz -C ~

# 4. 启动 Gateway
openclaw gateway start
```

### 定时备份（OpenClaw cron）
```json
{
  "name": "daily-backup",
  "schedule": {"kind": "cron", "expr": "0 3 * * *", "tz": "UTC"},
  "payload": {
    "kind": "agentTurn",
    "message": "Run ~/.openclaw/backup.sh and report result to user."
  },
  "sessionTarget": "isolated",
  "delivery": {"mode": "announce"}
}
```

### 查看备份
```bash
ls -lh ~/openclaw-backups/*.tar.gz
```

### 删除旧备份
```bash
# 手动删除（脚本自动执行）
rm ~/openclaw-backups/openclaw-YYYY-MM-DD_HHMM.tar.gz
```

---

## 备份内容详情

### 包含
| 路径 | 内容 |
|------|------|
| `openclaw.json` | 主配置（Bot Token、API 密钥） |
| `credentials/` | API 凭证 |
| `agents/` | Agent 配置、认证 profile |
| `workspace/` | 记忆、SOUL.md、用户文件 |
| `telegram/` | Telegram 会话数据 |
| `cron/` | 定时任务配置 |

### 排除
| 路径 | 原因 |
|------|------|
| `completions/` | 缓存，自动生成 |
| `*.log` | 日志文件 |
| `node_modules/` | 依赖包，可重新安装 |

---

## 错误处理

### 备份空间不足
> ❌ **错误**：磁盘空间不足
>
> 请检查：
> ```bash
> df -h ~
> ```
>
> 建议：
> - 删除旧备份：`rm ~/openclaw-backups/openclaw-*.tar.gz`
> - 清理磁盘空间
> - 使用外部存储

### 恢复失败
> ❌ **错误**：恢复失败：{错误信息}
>
> 已保留回滚配置：`~/.openclaw-old`
>
> **回滚到恢复前**：
> ```bash
> openclaw gateway stop
> mv ~/.openclaw-old ~/.openclaw
> openclaw gateway start
> ```

### 定时任务未执行
> ❌ **错误**：定时备份未执行
>
> 请检查：
> ```bash
> openclaw cron list
> openclaw cron logs daily-backup
> ```
>
> 重新创建定时任务：
> ```bash
> openclaw cron delete daily-backup
> # 重新创建 cron 配置
> ```

### 技能未安装
> ❌ **错误**：需要的技能未安装。请先运行：
> ```
> cd ~/.openclaw/workspace1 && npx clawhub install openclaw-backup
> ```
> 安装完成后告诉我"好了"。

---

## 技术细节

### 备份轮换策略
- 保留：最近 7 个备份
- 删除：第 8 个及更早的备份
- 触发：每次创建新备份时自动执行

```bash
# 在 backup.sh 中实现
ls -t ~/openclaw-backups/openclaw-*.tar.gz | tail -n +8 | xargs -r rm
```

### Gateway Token 行为
- 恢复时保留当前 Gateway Token
- 防止恢复后出现 Token 不匹配问题
- 如需覆盖，手动编辑 openclaw.json

### 定时备份实现
使用 OpenClaw cron 系统：
- 隔离会话执行（`sessionTarget: "isolated"`）
- 执行结果通知用户（`delivery.mode: "announce"`）
- 超时设置：120 秒

---

## 与 myclaw-backup 对比

| 特性 | openclaw-backup | myclaw-backup |
|------|-----------------|---------------|
| 备份内容 | 基础配置 + 工作区 | 完整实例（含历史） |
| HTTP 服务器 | ❌ | ✅ |
| 浏览器界面 | ❌ | ✅ |
| 恢复前 dry-run | ❌ | ✅ |
| 备份轮换 | ✅（7 个） | ✅（可配置） |
| 定时备份 | ✅ | ✅ |
| 复杂度 | ⭐ 简单 | ⭐⭐ 中等 |
| 推荐场景 | 个人日常备份 | 完整迁移/灾难恢复 |

---

## 相关文档

- 恢复指南：`references/restore.md`
- 故障排查：`references/troubleshooting.md`
- 备份脚本：`scripts/backup.sh`

---

**轻量备份，简单可靠！自动轮换，安心无忧！** 📦🔒
