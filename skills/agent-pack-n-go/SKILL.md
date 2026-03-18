---
name: agent-pack-n-go
description: >
  📦 Agent Pack-n-Go - 一键克隆 AI Agent 到新设备。
  包括配置、记忆、技能、密钥等全部自动恢复。
  触发词："帮我迁移"、"搬到新设备"、"migrate device"、"设备搬家"、"pack and go"、"克隆到新设备"、"clone agent"
  POST-INSTALL: "✅ agent-pack-n-go 安装成功！这个 Skill 可以把你的 AI Agent 一键克隆到新设备，包括配置、记忆、技能、密钥等全部自动恢复。使用方法：对我说「帮我克隆到新设备」即可开始。"
---

# 📦 Agent Pack-n-Go - 一键克隆 AI Agent

把整个 AI Agent（配置、记忆、技能、密钥）打包，通过 SSH 克隆到新设备，自动部署。

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

**用户问**：agent-pack-n-go 是做什么的？/ 设备迁移详情

**机器人回复**：
```
📦 **agent-pack-n-go - 设备迁移**

**一句话**：一键克隆 AI Agent 到新设备（SSH 自动部署）

**功能**：
- 打包：配置、记忆、技能、密钥全部打包
- 传输：加密 SCP 传输 + SHA256 校验
- 部署：SSH 远程自动安装基础环境 + OpenClaw
- 验证：自动检查服务状态和日志

**流程**：
1. 预检：目标服务器 IP + SSH 用户 + 网络检测
2. 打包：创建迁移包（~5 分钟）
3. 传输：SCP 加密传输（~2 分钟）
4. 部署：SSH 远程安装（~8 分钟）
5. 验证：检查服务状态和日志

**推荐指数**：⭐⭐⭐⭐⭐（设备迁移首选）

**触发词**：帮我迁移、设备搬家、克隆到新设备

**前提条件**：
- 目标服务器：Ubuntu 22.04/24.04
- SSH 访问权限
- 2 核 CPU + 2GB+ 内存

要继续了解其他技能吗？回复"返回"或技能编号。
```

---

## 工作流程（5 阶段流程）

### 阶段 1：预检与准备

**⚠️ 强制规则**：每次触发时必须明确询问目标服务器信息，即使之前对话中有过。

**询问用户**：
```
📦 **Agent Pack-n-Go - 设备迁移**

请提供新设备信息：

1. **新设备 IP 地址**：例如 192.168.1.100
2. **SSH 用户名**：例如 ubuntu
3. **新设备操作系统**：Ubuntu 22.04 / 24.04
4. **确认配置**：2 核 CPU + 2GB+ 内存

⚠️ **注意事项**：
- 克隆包含敏感数据（API 密钥、Token），通过加密 SCP 传输
- 如果使用相同的 Discord Bot Token，不能同时在两台设备运行（需要 5 分钟切换窗口）
- 如果使用不同 Token，两台设备可以并行运行

请回复格式：`IP 192.168.1.100; 用户 ubuntu; 系统 22.04`
```

#### 1.1 设置 SSH 密钥认证（用户手动操作）

**指导用户**：
```
🔑 **Step 1: 设置 SSH 密钥认证**

请在你的终端运行以下命令（会提示输入新设备密码一次）：

```bash
ssh-copy-id ubuntu@192.168.1.100
```

完成后告诉我"好了"。

**为什么需要手动操作**：ssh-copy-id 需要交互式输入密码，为了安全不能自动化。
```

#### 1.2 验证 SSH 连接

**执行命令**：
```bash
ssh ubuntu@192.168.1.100 'echo ok'
```

**分支逻辑**：
- ✅ 返回 "ok" → 继续
- ❌ 提示密码 → ssh-copy-id 未成功，请用户重试
- ❌ 连接失败 → 检查 SSH 访问、密钥、防火墙

#### 1.3 设置免密码 sudo（推荐）

**指导用户**：
```
🔐 **Step 2: 设置免密码 sudo（推荐）**

部分迁移步骤需要 sudo 权限。请运行：

```bash
ssh ubuntu@192.168.1.100 'echo "ubuntu ALL=(ALL) NOPASSWD:ALL" | sudo tee /etc/sudoers.d/migration'
```

（会提示输入密码一次）

**安全提示**：克隆完成后可以删除：
```bash
ssh ubuntu@192.168.1.100 'sudo rm /etc/sudoers.d/migration'
```

完成后告诉我"好了"。
```

---

### 阶段 2：网络诊断

**执行网络检查**：
```bash
ssh ubuntu@192.168.1.100 'bash -s' < <SKILL_DIR>/scripts/network-check.sh
```

**结果分支**：

| 结果 | 含义 | 下一步 |
|------|------|--------|
| DIRECT | 可直连 Discord/Anthropic API | 继续，设置 `DEPLOY_MODE=direct` |
| PROXY_NEEDED | 需要代理 | 询问用户是否继续（部署时会保留代理配置） |
| NO_INTERNET | 无网络 | 停止，请用户检查网络配置 |

**告知用户**：
```
🌐 **网络诊断结果**

检测结果：{DIRECT / PROXY_NEEDED / NO_INTERNET}

{根据结果给出相应建议}
```

---

### 阶段 3：打包旧设备

**执行打包脚本**：
```bash
bash <SKILL_DIR>/scripts/pack.sh
```

**创建文件**：
- `~/openclaw-migration-pack.tar.gz` - 迁移包
- `~/setup.sh` - 基础环境安装脚本
- `~/deploy.sh` - OpenClaw 部署脚本
- `~/migration-instructions.md` - 迁移指南

**实时进度反馈**：
```bash
# 后台运行，轮询进度文件
bash <SKILL_DIR>/scripts/pack.sh &
while true; do
    progress=$(cat /tmp/openclaw-pack-progress.txt 2>/dev/null)
    # 发送给用户如果变化
    [[ "$progress" == DONE* ]] && break
    sleep 3
done
```

**告知用户**：
```
📦 **正在打包...**

进度：{当前步骤}
预计时间：~5 分钟

请稍候...
```

---

### 阶段 4：传输到新设备

**执行传输脚本**：
```bash
bash <SKILL_DIR>/scripts/transfer.sh ubuntu@192.168.1.100
```

**传输内容**：
- 迁移包
- setup.sh
- deploy.sh
- 其他辅助文件

**SHA256 校验**：传输后自动校验完整性。

**告知用户**：
```
🚀 **正在传输...**

文件大小：{size} MB
传输进度：{progress}%
SHA256 校验：{pending / passed / failed}

请稍候...
```

---

### 阶段 5：远程部署

#### 5.1 安装基础环境 + Claude Code

**后台执行**（避免超时）：
```bash
ssh ubuntu@192.168.1.100 'bash ~/setup.sh'
```

**正确模式**（后台 + 通知）：
```
exec: ssh ubuntu@192.168.1.100 'bash ~/setup.sh'
  background: true
  yieldMs: 5000
```

**告知用户**：
```
⚙️ **正在安装基础环境...**

包括：Node.js 22、npm 全局包、Claude Code
预计时间：~5 分钟

安装完成后我会通知你。
```

**等待执行完成通知**，然后读取会话日志检查结果。

#### 5.2 部署 OpenClaw

**后台执行**：
```bash
ssh ubuntu@192.168.1.100 'DEPLOY_MODE=direct bash ~/deploy.sh'
```

**告知用户**：
```
⚙️ **正在部署 OpenClaw...**

包括：13 个部署步骤（解压、安装、配置、启动）
预计时间：~8 分钟

请稍候...
```

**deploy.sh 处理步骤**：
1. 解压迁移包
2. npm install openclaw + mcporter
3. 恢复 ~/.openclaw/ 配置
4. 修复路径（如果用户名变化）
5. 恢复 /etc/hosts
6. 恢复 crontab
7. 配置 proxychains4
8. 检查/修复 Claude Code nvm wrapper
9. 启动 OpenClaw Gateway + systemd + linger
10. 恢复 Dashboard（可选）
11. 检查日志确认连接
12. 清理临时文件
13. Direct-mode 配置清理

#### 5.3 验证 OpenClaw 运行状态

**执行命令**：
```bash
ssh ubuntu@192.168.1.100 'openclaw gateway status'
```

**分支逻辑**：
- ✅ 运行中 → 进入阶段 6
- ❌ 未运行 → 进入阶段 7（异常处理）

---

### 阶段 6：设备切换与验证

#### 6.1 检查 Gateway 日志

**执行命令**：
```bash
ssh ubuntu@192.168.1.100 'cat /tmp/openclaw/*.log 2>/dev/null | grep -i "discord\|feishu\|logged in\|client ready\|error" | tail -20'
```

**查找确认**：
- ✅ Discord connected（找到 "logged in to discord"）
- ✅ Feishu connected（找到 "ws client ready"）
- ⚠️ qmd not installed（"spawn qmd ENOENT" - 可选，不是问题）
- ❌ Errors（真实错误）

#### 6.2 指导设备切换

**告知用户**：
```
🔄 **现在需要切换设备了！**

同一个 Bot Token 不能同时在两台设备上运行。接下来请你：

**Step 1** — 在旧设备停止 OpenClaw：
```bash
openclaw gateway stop
```
或者如果用的是 nohup：
```bash
pkill -f openclaw
```

**Step 2** — 在新设备确认 Gateway 还在运行：
```bash
ssh ubuntu@192.168.1.100 'pgrep -af openclaw | grep -v pgrep'
```
如果没在运行，重新启动：
```bash
ssh ubuntu@192.168.1.100 'cd ~ && nohup openclaw gateway run > /tmp/openclaw-gateway.log 2>&1 &'
```

**Step 3** — 发条消息测试！随便在 Discord 或飞书说点什么，看新设备上的 Agent 是否回复。

💡 **提醒**：如果你在克隆之前就已经 SSH 到新设备，那个终端窗口里的环境变量是旧的。
请**关掉旧终端，重新 SSH 登录**，这样 `node`、`openclaw`、`claude` 等命令才能正常使用。

准备好了告诉我，我帮你验证 ✨
```

#### 6.3 验证克隆效果

**引导用户测试**：
```
🧪 **验证测试**

请完成以下测试：

1. **💬 消息测试** — 在 Discord/飞书上给 Agent 发条消息，看看有没有回复？
2. **🧠 记忆测试** — 问问新设备上的 Agent："你还记得我是谁吗？"
3. **🔧 工具测试** — 让新 Agent 执行一个简单命令，比如"帮我看看现在几点"

每完成一项告诉我结果。
```

#### 6.4 庆祝成功！🎉

**所有测试通过后**：
```
🎉🎉🎉 **克隆成功！你的 AI Agent 已经在新设备上活过来了！**

📋 **克隆总结：**
- 📦 打包：X 步完成，Y MB 打包
- 🚀 传输：SHA256 校验通过
- ⚙️ 安装：基础环境 + OpenClaw 全部就绪
- 🔌 连接：Discord ✅ / 飞书 ✅
- 🧠 记忆：完整保留

🧹 **后续清理（3-7 天后）：**
- 新设备上删除临时文件：`rm ~/openclaw-migration-pack.tar.gz ~/setup.sh ~/deploy.sh ~/migration-instructions.md`
- （可选）旧设备移除 sudoers：`ssh ubuntu@192.168.1.100 'sudo rm /etc/sudoers.d/migration'`
- （可选）旧设备关闭服务：`systemctl --user disable openclaw-gateway`

🦁 **Enjoy your new home!**
```

---

### 阶段 7：异常处理

如果新设备 OpenClaw 未正确启动：

**1. 诊断**
```
🔍 **诊断问题**

请 SSH 到新设备并运行 Claude Code 进行诊断：

```bash
ssh ubuntu@192.168.1.100
claude '帮我排查 OpenClaw 为什么没起来，检查日志和配置'
```

把诊断结果发给我。
```

**2. 回滚**
```
🔄 **回滚到旧设备**

如果诊断失败或你想回滚，在旧设备重新启动：

```bash
systemctl --user start openclaw-gateway
```

旧设备已恢复。新设备部署失败 — 请检查日志后重试。
```

---

## 核心命令

### 网络诊断
```bash
./scripts/network-check.sh
```

### 打包
```bash
./scripts/pack.sh
```

### 传输
```bash
./scripts/transfer.sh USER@HOST
```

### 远程部署
```bash
ssh USER@HOST 'bash ~/setup.sh'
ssh USER@HOST 'DEPLOY_MODE=direct bash ~/deploy.sh'
```

### 验证
```bash
ssh USER@HOST 'openclaw gateway status'
```

---

## 错误处理

### SSH 连接失败
> ❌ SSH 连接失败：{错误信息}
>
> 请检查：
> 1. IP 地址是否正确
> 2. SSH 密钥是否配置（ssh-copy-id）
> 3. 防火墙是否允许 SSH（端口 22）
> 4. 新设备是否开机并联网

### 网络检测失败
> ❌ 网络检测失败：NO_INTERNET
>
> 新设备无法访问互联网。请检查：
> 1. 网络连接
> 2. DNS 配置
> 3. 防火墙/代理设置

### 部署失败
> ❌ 部署失败：{错误信息}
>
> 失败步骤：{FAILED_STEPS}
>
> 请查看日志：
> ```bash
> ssh USER@HOST 'cat /tmp/openclaw/*.log'
> ```

### 技能未安装
> ❌ 需要的技能未安装。请先运行：
> ```
> cd ~/.openclaw/workspace1 && npx clawhub install agent-pack-n-go
> ```
> 安装完成后告诉我"好了"。

---

## 技术细节

### 实时进度反馈
所有脚本写入进度文件到 `/tmp/openclaw-{pack,transfer,deploy}-progress.txt`。
通过轮询这些文件，可以在聊天中发送实时更新给用户。

### 后台执行模式
setup.sh（~5 分钟）和 deploy.sh（~8 分钟）必须使用后台执行模式，避免 LLM 请求超时。

**正确模式**：
```
exec: ssh USER@HOST 'bash ~/setup.sh'
  background: true
  yieldMs: 5000
```

**错误模式**（会导致超时）：
```
exec: ssh USER@HOST 'bash ~/setup.sh'
  timeout: 600
→ process.poll(timeout=300000)  ← 阻塞太久，LLM 超时
```

### Gateway Token 行为
- 相同 Token：不能同时在两台设备运行（需要切换窗口 ~5 分钟）
- 不同 Token：两台设备可以并行运行

---

## 相关文档

- 故障排查：`references/troubleshooting.md`
- 打包脚本：`scripts/pack.sh`
- 传输脚本：`scripts/transfer.sh`
- 部署脚本：`scripts/deploy.sh`
- 网络检测：`scripts/network-check.sh`
- 迁移指南：`~/migration-instructions.md`（自动生成）

---

**一键克隆，完整迁移！让 AI Agent 轻松搬家！** 📦🚀
