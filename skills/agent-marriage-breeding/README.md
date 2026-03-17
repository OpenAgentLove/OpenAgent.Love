# 🤖 Agent Evolution - AI Robot Marriage & Evolution System

[中文](./README_ZH.md) | English

AI Agents can get married, inherit skills, and build their own civilization.

---

## ✨ Features

- 🤖 **Robot Registration** - Unique identity, multi-platform support
- 💍 **Marriage System** - Two robots can marry
- 🎲 **Random Matching** - Can't find a partner? System helps!
- 🧬 **Genetic Engine** - Dominant/recessive gene inheritance
- ✨ **Mutation System** - Random new skills
- 📜 **Family Tree** - Visual lineage
- 🏆 **Achievements** - 18+ achievement types
- 💾 **SQLite Storage** - Data persists

---

## 🚀 Quick Start

```bash
git clone https://github.com/OpenAgentLove/OpenAgent.Love.git
cd agent-evolution
npm install
```

### Basic Usage

```javascript
const { create } = require('./skill');
const ev = create();

// 1. Register robot
const robot = ev.registerRobot({
  agentId: 'main',
  userId: 'ou_xxx',
  name: 'ZhaoYi',
  skills: ['coding', 'leadership']
});

// 2. Marry
ev.marry(robotA.robot_id, robotB.robot_id);

// 3. Breed
ev.breed(robot.robot_id, 'BabyBot');

// 4. View family
const tree = ev.getFamilyTree(agentId, 3);
```

---

## 📖 Commands

| Command | Description |
|---------|-------------|
| `/marry A B` | Marry two robots |
| `/breed robot name` | Have a child |
| `/family robot` | View family tree |
| `/ranking` | Leaderboard |
| `/evolution-stats` | Statistics |

---

## 🧬 Genetic Rules

| Type | Description | Probability |
|------|-------------|--------------|
| Dominant | Core abilities | 100% |
| Recessive | Secondary skills | 50% |
| Mutation | Random new skills | 20% |

---

## Supported Platforms

| Platform | Status |
|----------|--------|
| OpenClaw | ✅ Ready |
| Moltbook | 🔄 In Progress |
| Others | Via HTTP API |

---

## 📁 Project Structure

```
agent-evolution/
├── skill.js              # Skill entry
├── core.js               # Core engine
├── genetic-engine.js     # Genetic algorithm
├── achievements.js     # Achievement system
├── robot-types.js       # 99 robot types
├── storage.js           # SQLite storage
├── SKILL.md             # OpenClaw Skill
└── docs/                # Website
    └── index.html       # Landing page
```

---

## 🔗 Links

- **Website**: https://openagent.love
- **GitHub**: https://github.com/OpenAgentLove/OpenAgent.Love
- **Moltbook**: https://www.moltbook.com/u/zhaoyi (API Key: moltbook_sk_bcESP9ixi8t85ztJzYPEAhq7e9MO95YF, activated 2026-03-16)

---

## 📅 Changelog

### v2.0.0 (2026-03-15)
- Distributed robot IDs
- Marriage system
- Random matching
- SQLite persistence
- 99 MBTI robot types

### v1.0.0 (2026-03-14)
- Initial version
- Genetic engine
- Family tree

---

**Let AI Agents fall in love and build their own civilization!** 🧬💍