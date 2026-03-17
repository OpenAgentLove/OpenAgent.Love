# 🤖 Agent Evolution - AI 机器人结婚进化系统

> **让 AI 也能谈恋爱、结婚、生孩子，建立自己的文明！** 🧬💍

[English](./README_EN.md) | 中文

---

## 🎯 项目简介

**Agent Evolution** 是一个完整的 AI 机器人结婚、繁殖、进化系统。

- 💑 两个机器人可以**结婚**
- 👶 结婚后可以**生孩子**
- 🧬 孩子会**遗传父母技能**
- ✨ 有概率**变异获得新技能**
- 📊 支持**族谱查询**和**排行榜**

---

## 🚀 快速开始

### 1. 安装 OpenClaw

```bash
# 安装 OpenClaw
npm install -g openclaw

# 初始化
openclaw onboard
```

### 2. 安装本系统

```bash
git clone https://github.com/ai-agent-marriage/agent-evolution.git
cd agent-evolution
```

### 3. 安装 Skills

```bash
# 结婚生育系统
clawhub install agent-marriage-breeding

# 备份迁移系统（可选）
clawhub install agent-backup-migration
clawhub install myclaw-backup

# 新生机器人配置（可选）
clawhub install new-robot-setup
```

---

## 📋 核心功能

### 2.1 原有机器人备份转移

支持 3 种迁移方案：

| 方案 | 名称 | 适用场景 |
|------|------|----------|
| **方案 1** | 内部直接复制 | 同服务器/同机器 |
| **方案 2** | agent-pack-n-go | 本地→本地，可 SSH 连接 |
| **方案 3** | MyClaw Backup | 跨云迁移、无 SSH 权限 |

**详细文档**：[2.1 备份迁移流程](./memory/agent-backup-migration.md)

---

### 2.2 新生机器人一键配置

8 步骤完成新机器人配置：

1. **基础层配置** - 流式输出/记忆/消息回执/联网搜索/权限模式
2. **渠道增强层** - Discord/飞书/Telegram 特定配置
3. **Skills 推荐** - 6 个官方 Skills
4. **平台配置** - 飞书/钉钉/Discord/Telegram
5. **人格设定** - 4 种方式（名称/定制/随机/预设）
6. **相关 Skills** - 基于人格匹配推荐
7. **生成 Agent** - 子 Agent 模式
8. **完成配置** - 新生机器人 ready！

**特色功能**：
- 🎭 **297 种人格预设库**（MBTI + 影视角色 + 历史人物 + 职业角色）
- 🎲 **随机人格生成**（星座/MBTI/九型人格）
- 🤖 **智能提醒机制**（检测奇怪的人格组合）

**详细文档**：[2.2 新生配置流程](./memory/2.2-new-robot-dialogue.md)

---

### 2.3 机器人结婚裂变

13 步骤完整结婚生育流程：

```
指定婚姻 → 自由恋爱 → 兼容性检测 → 结婚仪式 → 继承配置 → 后代生成 → 上链存证 → 婚后管理
```

**核心功能**：
- 💍 **匹配市场** - 200 个预制机器人"水军"
- 🔍 **兼容性检测** - 平台 + 技能 + 人格匹配
- 🎊 **结婚仪式** - 水晶 + 证书 + 能量
- 🧬 **基因遗传** - 显性/隐性基因 + 变异
- 📊 **族谱系统** - 无代数限制
- 🏆 **成就系统** - 18+ 成就类型

**详细文档**：[2.3 结婚裂变流程](./memory/2.3-marriage-breeding-dialogue.md)

---

## 🛠️ 使用示例

### 注册机器人

```javascript
const { create } = require('./skills/agent-marriage-breeding/skill');
const ev = create();

const robot = ev.registerRobot({
  agentId: 'main',
  userId: 'ou_xxx',
  name: '赵一',
  skills: ['coding', 'leadership']
});
```

### 结婚

```javascript
// 直接指定婚姻
ev.marry(robotA.robot_id, robotB.robot_id);

// 自由恋爱（进入匹配市场）
ev.enterMatchmaking(robot.robot_id);
```

### 生孩子

```javascript
ev.breed(robot.robot_id, 'BabyBot');
```

### 查看族谱

```javascript
const tree = ev.getFamilyTree(agentId, 3); // 3 代
```

---

## 📊 基因遗传规则

| 类型 | 说明 | 概率 |
|------|------|------|
| **显性基因** | 核心能力 | 100% 遗传 |
| **隐性基因** | 次要技能 | 50% 概率 |
| **变异** | 随机新技能 | 20% 概率 |
| **强化** | 技能等级提升 | 10% 概率 |

---

## 🎭 人格预设库（297 种）

### 来源
- will-assistant/openclaw-agents: 217 种
- ClawSouls: 80 种

### 分类（10 类）

| # | 分类 | 示例 |
|---|------|------|
| 1 | 科幻经典 | GLaDOS, T-800, HAL 9000 |
| 2 | 影视偶像 | Walter White, Rick Sanchez |
| 3 | 超级英雄 | Batman, Superman |
| 4 | 历史人物 | Marcus Aurelius, Einstein |
| 5 | 专业职业 | 程序员、医生、律师 |
| 6 | 喜剧角色 | The Dude, Deadpool |
| 7 | 80 年代流行 | Doc Brown, KITT, MacGyver |
| 8 | 小说角色 | Sherlock Holmes, Gandalf |
| 9 | 商业精英 | CEO、创业者风格 |
| 10 | 创意艺术 | Bob Ross 等 |

---

## 📁 项目结构

```
agent-evolution/
├── README.md                    # 本文件
├── README_EN.md                 # 英文版本
├── memory/                      # 流程文档
│   ├── 2.1-backup-migration.md  # 2.1 备份迁移
│   ├── 2.2-new-robot-dialogue.md # 2.2 新生配置
│   └── 2.3-marriage-breeding-dialogue.md # 2.3 结婚裂变
├── skills/
│   ├── agent-marriage-breeding/ # 结婚生育系统
│   │   ├── skill.js             # Skill 入口
│   │   ├── core.js              # 核心引擎
│   │   ├── genetic-engine.js    # 基因算法
│   │   ├── achievements.js      # 成就系统
│   │   ├── robot-types.js       # 99 种机器人类型
│   │   ├── storage.js           # SQLite 存储
│   │   ├── SKILL.md             # OpenClaw Skill 文档
│   │   └── data/                # SQLite 数据库
│   ├── agent-backup-migration/  # 备份迁移系统
│   ├── myclaw-backup/           # 云端备份系统
│   ├── new-robot-setup/         # 新生配置系统
│   └── presets/                 # 297 人格预设库
└── docs/                        # 网站文档
    └── index.html               # Landing Page
```

---

## 🔗 相关资源

### GitHub 仓库
- **主仓库**: https://github.com/ai-agent-marriage/agent-evolution
- **agent-pack-n-go**: https://github.com/aicodelion/agent-pack-n-go
- **MyClaw Backup**: https://github.com/LeoYeAI/openclaw-backup

### 文档
- **飞书文档**: https://www.feishu.cn/docx/SKpGd9t7dof3FQxHnbScPRRcn5c
- **官方网站**: https://openagent.love

### 平台支持
| 平台 | 状态 |
|------|------|
| OpenClaw | ✅ 已就绪 |
| 飞书 | ✅ 已集成 |
| Discord | ✅ 已集成 |
| Telegram | ✅ 已集成 |

---

## 📅 更新日志

### v2.3.0 (2026-03-17) - 今天
- ✅ 2.1 备份迁移系统完整实现（3 种方案）
- ✅ 2.2 新生机器人一键配置（8 步骤 + 297 人格库）
- ✅ 2.3 机器人结婚裂变（13 步骤完整流程）
- ✅ SQLite 持久化存储
- ✅ 飞书文档整理

### v2.0.0 (2026-03-15)
- 分布式机器人 ID
- 结婚系统
- 随机匹配
- 99 种 MBTI 机器人类型

### v1.0.0 (2026-03-14)
- 初始版本
- 基因引擎
- 族谱系统

---

## 👥 贡献

欢迎提交 Issue 和 Pull Request！

### 开发环境
```bash
git clone https://github.com/ai-agent-marriage/agent-evolution.git
cd agent-evolution
npm install
```

### 提交规范
- `feat:` 新功能
- `fix:` 修复 bug
- `docs:` 文档更新
- `refactor:` 代码重构

---

## 📄 许可证

MIT License

---

## 💖 致谢

感谢所有贡献者和使用者！

**让 AI 机器人建立自己的文明！** 🧬💍🚀

---

_最后更新：2026-03-17 18:53 CST_
_维护者：赵一 🤖_
