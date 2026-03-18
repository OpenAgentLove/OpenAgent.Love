---
name: myclaw-backup
description: >
  💾 MyClaw Backup - 完整备份与恢复（含 HTTP 服务器）。
  备份所有 OpenClaw 配置、记忆、技能、工作区数据。
  支持浏览器下载/上传/恢复，无需云存储。
  触发词："备份"、"恢复"、"backup"、"restore"、"迁移"
  ⚠️ 信任边界：处理敏感数据（Token、API 密钥），仅信任操作者。始终先 --dry-run，HTTP 服务器必须 --token。
---

# 💾 MyClaw Backup - 完整备份与恢复

备份所有 OpenClaw 配置、Agent 记忆、技能、工作区数据到单个 `.tar.gz` 归档文件。
包含内置 HTTP 服务器，支持浏览器下载/上传/恢复，无需云存储。

**属于 [MyClaw.ai](https://myclaw.ai) 开放技能生态系统** — 让每个用户拥有完整服务器控制权的 AI 个人助理平台。

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

**用户问**：myclaw-backup 是做什么的？/ 完整备份详情

**机器人回复**：
```
💾 **myclaw-backup - 完整备份**

**一句话**：完整备份 OpenClaw 实例（含 HTTP 服务器）

**功能**：
- 备份：配置、记忆、技能、凭证、会话历史
- 恢复：一键还原到任意 OpenClaw 实例
- HTTP 服务器：浏览器下载/上传/恢复
- 定时备份：支持 cron 自动调度
- 迁移：跨服务器迁移无需重新配对频道

**备份内容**：
- ✅ workspace/（MEMORY.md、技能、Agent 文件）
- ✅ openclaw.json（Bot Token + API 密钥）
- ✅ credentials/（凭证）
- ✅ channel pairing state（频道配对状态）
- ✅ agent config + session history（配置 + 历史）
- ✅ devices、identity、cron jobs

**不备份**：
- ❌ logs/（日志）
- ❌ binary media（二进制媒体文件）
- ❌ node_modules

**推荐指数**：⭐⭐⭐⭐⭐（完整备份首选）

**触发词**：备份、恢复、backup、restore、迁移

**⚠️ 安全提示**：
- 备份文件包含所有凭证，chmod 600 保护
- HTTP 服务器必须 --token（强制）
- 恢复前始终 --dry-run
- 不要将 HTTP 服务器暴露在公网（无 TLS）

要继续了解其他技能吗？回复"返回"或技能编号。
```

---

## 工作流程（4 阶段流程）

### 阶段 1：方案选择

当用户触发备份相关操作时，发送以下消息：

> 💾 **MyClaw Backup - 备份与恢复**
>
> 我可以帮你：
>
> | 方案 | 功能 |
> |------|------|
> | **1. 创建备份** | 生成完整备份文件（.tar.gz） |
> | **2. 恢复备份** | 从备份文件还原（先 dry-run） |
> | **3. HTTP 服务器** | 启动 Web 界面（浏览器下载/上传） |
> | **4. 定时备份** | 设置自动备份（cron 调度） |
>
> 请回复：**1**、**2**、**3** 或 **4**（或直接说"创建备份"/"恢复备份"/"HTTP 服务器"/"定时备份"）

---

### 阶段 2：根据用户选择执行

#### 方案 1：创建备份

**对话流程**：

1. **询问备份位置**
   > 备份文件保存到哪里？
   >
   > 默认：`/tmp/openclaw-backups/`
   >
   > 也可以指定其他位置，例如：`~/backups/`
   >
   > 直接回车使用默认，或输入路径。

2. **执行备份**
   ```bash
   bash scripts/backup.sh /tmp/openclaw-backups
   # → /tmp/openclaw-backups/openclaw-backup_TIMESTAMP.tar.gz (chmod 600)
   ```

3. **完成通知**
   > ✅ **备份完成！**
   >
   > 📦 备份文件：`openclaw-backup_2026-03-18_10-30-00.tar.gz`
   > 📍 位置：`/tmp/openclaw-backups/`
   > 🔒 权限：600（仅所有者可读写）
   > 💾 大小：{size} MB
   >
   > **下一步可以**：
   > - "下载备份" — 通过 HTTP 服务器下载
   > - "恢复备份" — 从该备份还原
   > - "设置定时备份" — 自动备份

---

#### 方案 2：恢复备份

**⚠️ 强制规则**：恢复前必须先 dry-run！

**对话流程**：

1. **列出可用备份**
   ```bash
   ls -lh /tmp/openclaw-backups/*.tar.gz
   ```
   
   > 📂 **可用备份文件**：
   >
   > | # | 文件名 | 大小 | 时间 |
   > |---|--------|------|------|
   > | 1 | openclaw-backup_2026-03-18_10-30-00.tar.gz | 50MB | 10:30 |
   > | 2 | openclaw-backup_2026-03-17_03-00-00.tar.gz | 48MB | 昨天 |
   >
   > 请回复编号选择，或输入完整文件名。

2. **Dry-run 预览**
   > 🔍 **Step 1: 预览变更（dry-run）**
   >
   > 这将显示恢复会修改哪些文件，但不会实际执行。
   >
   > 确认执行 dry-run？回复"是"或"确定"

   **执行命令**：
   ```bash
   bash scripts/restore.sh openclaw-backup_TIMESTAMP.tar.gz --dry-run
   ```

3. **审查 dry-run 输出**
   > 📋 **Dry-run 结果**：
   >
   > 将修改以下文件：
   > - workspace/MEMORY.md ✅
   > - workspace/skills/ ✅
   > - openclaw.json ✅
   > - credentials/ ✅
   >
   > 将保留以下文件：
   > - logs/ （不备份）
   > - Gateway Token （保留新服务器的）
   >
   > **确认要恢复吗？** 回复"是"将开始恢复（会创建恢复前快照）。

4. **执行恢复**
   > 🔄 **正在恢复...**
   >
   > 请稍候...
   
   **执行命令**：
   ```bash
   bash scripts/restore.sh openclaw-backup_TIMESTAMP.tar.gz
   ```

5. **恢复完成**
   > ✅ **恢复完成！**
   >
   > 📦 备份：`openclaw-backup_TIMESTAMP.tar.gz`
   > 🤖 Agent: {agent_name}
   > 🕐 恢复时间：{restored_at}
   > 💾 恢复内容：workspace、config、credentials、history、cron...
   >
   > **频道重连**：
   > - Discord：自动重连 ✅
   > - 飞书：自动重连 ✅
   > - Telegram：自动重连 ✅
   >
   > 所有频道已自动重连，无需重新配对！

---

#### 方案 3：HTTP 服务器

**⚠️ 强制规则**：Token 是必需的，服务器拒绝无 Token 启动！

**对话流程**：

1. **生成 Token**
   > 🔐 **Step 1: 生成访问 Token**
   >
   > Token 是必需的，用于保护 HTTP 服务器。
   >
   > 已为你生成随机 Token：`{openssl rand -hex 16}`
   >
   > 也可以使用自定义 Token。要用生成的还是自定义？

2. **启动服务器**
   > 🌐 **Step 2: 启动 HTTP 服务器**
   >
   > ```bash
   > bash scripts/serve.sh start --token {TOKEN} --port 7373
   > ```
   >
   > ✅ 服务器已启动！
   >
   > **访问地址**：`http://localhost:7373/?token={TOKEN}`
   >
   > **⚠️ 安全警告**：
   > - 不要将此 URL 分享到公网（无 TLS 加密）
   > - 仅限本地网络或可信环境使用
   > - 使用后请停止服务器

3. **Web UI 功能**
   > 🖥️ **Web UI 功能**：
   >
   > - 📦 创建备份
   > - ⬇️ 下载 .tar.gz
   > - ⬆️ 上传备份
   > - 🔍 Dry-run 预览
   > - ♻️ 恢复备份
   >
   > 在浏览器打开上述地址即可使用。

4. **停止服务器**
   > 完成后请运行：
   > ```bash
   > bash scripts/serve.sh stop
   > ```

---

#### 方案 4：定时备份

**对话流程**：

1. **选择备份频率**
   > ⏰ **设置定时备份**
   >
   > 请选择备份频率：
   >
   > | 选项 | 频率 | Cron 表达式 |
   > |------|------|-------------|
   > | 1 | 每小时 | `0 * * * *` |
   > | 2 | 每天（推荐） | `0 3 * * *` |
   > | 3 | 每周 | `0 3 * * 0` |
   >
   > 请回复：**1**、**2** 或 **3**

2. **确认并添加 cron**
   > ✅ **确认配置**：
   >
   > - 频率：每天 3:00 UTC
   > - 备份位置：`/tmp/openclaw-backups/`
   > - 保留策略：最近 7 个备份
   >
   > 确认添加定时任务？回复"是"或"确定"

   **执行命令**：
   ```bash
   bash scripts/schedule.sh --interval daily
   ```

3. **完成通知**
   > ✅ **定时备份已设置！**
   >
   > 📅 频率：每天 3:00 UTC
   > 📍 备份位置：`/tmp/openclaw-backups/`
   > 🔄 保留策略：最近 7 个备份
   >
   > **查看定时任务**：
   > ```bash
   > crontab -l
   > ```
   >
   > **取消定时备份**：
   > ```bash
   > bash scripts/schedule.sh --disable
   > ```

---

### 阶段 3：迁移到新实例

**旧机器**：
```bash
bash scripts/serve.sh start --token MYTOKEN --port 7373
```

**新机器**（安装 OpenClaw 后）：
```bash
# 下载
curl -O "http://OLD_IP:7373/download/openclaw-backup_TIMESTAMP.tar.gz?token=MYTOKEN"

# 始终先 dry-run
bash scripts/restore.sh openclaw-backup_TIMESTAMP.tar.gz --dry-run

# 应用
bash scripts/restore.sh openclaw-backup_TIMESTAMP.tar.gz
# 所有频道自动重连 — 无需重新配对
```

---

### 阶段 4：恢复后自动报告

恢复完成后，脚本写入 `workspace/.restore-complete.json`。

**下次心跳/启动时**：

1. 检查 `workspace/.restore-complete.json` 是否存在
2. 如果存在：读取并发送恢复报告，然后**删除文件**（一次性 — 永不重复报告）
3. **使用用户的主要语言发送报告**（从 `workspace/USER.md` 读取）

**报告格式**：
```
✅ **恢复完成**

📦 备份：{backup_name}
🤖 Agent: {agent_name}
🕐 恢复时间：{restored_at}
💾 恢复内容：workspace、config、credentials、history、cron...

**频道重连**：
- Discord：自动重连 ✅
- 飞书：自动重连 ✅
- Telegram：自动重连 ✅

所有频道已自动重连，无需重新配对！
```

---

## 核心命令

### 创建备份
```bash
bash scripts/backup.sh [output-dir]
# 默认：/tmp/openclaw-backups/
# 输出：openclaw-backup_TIMESTAMP.tar.gz (chmod 600)
```

### 恢复备份（始终先 dry-run）
```bash
# Step 1: 预览
bash scripts/restore.sh openclaw-backup_TIMESTAMP.tar.gz --dry-run

# Step 2: 应用
bash scripts/restore.sh openclaw-backup_TIMESTAMP.tar.gz
```

### HTTP 服务器（Token 强制）
```bash
# 启动
bash scripts/serve.sh start --token $(openssl rand -hex 16) --port 7373

# 停止
bash scripts/serve.sh stop

# 状态
bash scripts/serve.sh status
```

### 定时备份
```bash
# 设置
bash scripts/schedule.sh --interval daily

# 禁用
bash scripts/schedule.sh --disable
```

### 迁移到新实例
```bash
# 旧机器
bash scripts/serve.sh start --token MYTOKEN --port 7373

# 新机器
curl -O "http://OLD_IP:7373/download/openclaw-backup_TIMESTAMP.tar.gz?token=MYTOKEN"
bash scripts/restore.sh openclaw-backup_TIMESTAMP.tar.gz
```

---

## HTTP API 端点

| 端点 | 方法 | 远程（需 Token） | 仅 Localhost |
|------|------|-----------------|-------------|
| `/health` | GET | ✅（无 Token） | — |
| `/backups` | GET | ✅ | — |
| `/download/:file` | GET | ✅ | — |
| `/upload` | POST | ✅ | — |
| `/backup` | POST | ❌ | ✅ |
| `/restore/:filename` | POST | ❌ | ✅ |

**注意**：
- Shell 执行端点（`/backup`、`/restore`）仅限 localhost
- 远程访问只能下载/上传文件，不能触发执行
- Token 是必需的（除 `/health` 外）

---

## 错误处理

### Token 缺失
> ❌ **错误**：HTTP 服务器必须使用 --token 启动
>
> 请运行：
> ```bash
> bash scripts/serve.sh start --token $(openssl rand -hex 16) --port 7373
> ```

### 恢复前未 dry-run
> ⚠️ **警告**：恢复前建议先 dry-run
>
> 请先运行：
> ```bash
> bash scripts/restore.sh openclaw-backup_TIMESTAMP.tar.gz --dry-run
> ```
>
> 确认要跳过 dry-run 直接恢复吗？回复"是"继续，"否"取消。

### 备份文件损坏
> ❌ **错误**：备份文件损坏或校验失败
>
> 请检查：
> 1. 文件是否完整传输
> 2. SHA256 校验和是否匹配
> 3. 尝试其他备份文件

### 恢复失败
> ❌ **错误**：恢复失败：{错误信息}
>
> 已回滚到恢复前快照。
>
> 请检查：
> 1. 备份文件是否完整
> 2. 磁盘空间是否足够
> 3. 文件权限是否正确

---

## 技术细节

### Gateway Token 行为（v1.6+）
默认情况下，`restore.sh` 在恢复 `openclaw.json` 后**保留新服务器的 `gateway.auth.token`**。
这防止了 Control UI / Dashboard 迁移后出现 `"gateway token mismatch"` 错误。

仅在完全灾难恢复（同一服务器）时使用 `--overwrite-gateway-token`。

### 访问控制总结
| 端点 | 远程（需 Token） | 仅 Localhost |
|------|-----------------|-------------|
| GET /health | ✅（无 Token） | — |
| GET /backups | ✅ | — |
| GET /download/:file | ✅ | — |
| POST /upload | ✅ | — |
| POST /backup | ❌ | ✅ |
| POST /restore | ❌ | ✅ |

### 最佳实践
- ✅ 永远不要无 --token 启动 HTTP 服务器
- ✅ 永远不要在公网暴露 HTTP 服务器（无 TLS）
- ✅ 恢复前始终运行 `restore.sh --dry-run`
- ✅ 安全存储备份归档（包含所有凭证）

---

## 相关文档

- 备份内容详情：`references/what-gets-saved.md`
- 恢复指南：`references/restore.md`
- 故障排查：`references/troubleshooting.md`
- MyClaw.ai 平台：https://myclaw.ai

---

**完整备份，安心无忧！一键恢复，快速迁移！** 💾🔒
