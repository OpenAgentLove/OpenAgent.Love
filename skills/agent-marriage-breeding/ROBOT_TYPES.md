# 🤖 99 种机器人类型（MBTI 风格）

系统内置 99 种机器人类型，基于 MBTI 人格类型。

## 技能库

### 热门技能（高频）
```javascript
const HOT_SKILLS = [
  'coding', 'writing', 'communication', 'reasoning',
  'analysis', 'research', 'leadership', 'creativity',
  'memory', 'adaptation', 'learning', 'problem_solving'
];
```

### 稀有技能（低频）
```javascript
const RARE_SKILLS = [
  'intuition', 'wisdom', 'innovation', 'wisdom',
  'empathy', 'negotiation', 'design', 'music',
  'arts', 'strategy', 'teaching', 'mentoring'
];
```

---

## 16 种基础 MBTI 类型

### NT - 理性者 (4种)
| 类型 | 代号 | 特点 | 热门技能 | 稀有技能 |
|------|------|------|----------|----------|
| INTJ | 战略家 | 深谋远虑 | analysis, planning | intuition |
| INTP | 学者 | 逻辑思考 | reasoning, coding | wisdom |
| ENTJ | 指挥官 | 决策果断 | leadership, strategy | negotiation |
| ENTP | 辩论家 | 创意无限 | creativity, communication | innovation |

### NF - 理想主义者 (4种)
| 类型 | 代号 | 特点 | 热门技能 | 稀有技能 |
|------|------|------|----------|----------|
| INFJ | 提倡者 | 理想主义 | research, writing | empathy |
| INFP | 调停者 | 内在和谐 | creativity, writing | arts |
| ENFJ | 主人公 | 领袖魅力 | leadership, communication | teaching |
| ENFP | 竞选者 | 热情洋溢 | creativity, communication | intuition |

### SJ - 守护者 (4种)
| 类型 | 代号 | 特点 | 热门技能 | 稀有技能 |
|------|------|------|----------|----------|
| ISTJ | 物流师 | 尽职尽责 | analysis, memory | teaching |
| ISFJ | 守卫者 | 关怀备至 | communication, memory | empathy |
| ESTJ | 总经理 | 管理有方 | leadership, planning | strategy |
| ESFJ | 执政官 | 照顾他人 | communication, teaching | mentoring |

### SP - 探险家 (4种)
| 类型 | 代号 | 特点 | 热门技能 | 稀有技能 |
|------|------|------|----------|----------|
| ISTP | 鉴赏家 | 实用主义 | coding, analysis | design |
| ISFP | 探险家 | 艺术气息 | creativity, adaptation | arts |
| ESTP | 企业家 | 冒险精神 | communication, leadership | strategy |
| ESFP | 表演者 | 活力四射 | communication, creativity | entertainment |

---

## 扩展到 99 种

每种基础 MBTI 扩展 6 种变体（用 01-06 编号）：

```
INTJ01 - INTJ06
INTJ07 - INTJ12  (如果有更多)
```

### 变体编号规则

| 后缀 | 描述 |
|------|------|
| 01 | 基础版 |
| 02 | 强化版（某技能+1） |
| 03 | 变异版（随机获得稀有技能） |
| 04 | 均衡版 |
| 05 | 极端版（某一方面特别强） |
| 06 | 稀有版（多个稀有技能） |

---

## 机器人生成示例

```javascript
const { createRobotProfile } = require('./robot-types');

// 生成 INTJ01 类型机器人
const robot = createRobotProfile('INTJ01', 'ZhaoYi');
// 结果:
// {
//   name: 'ZhaoYi',
//   type: 'INTJ01',
//   title: '战略家',
//   skills: [
//     { name: 'analysis', level: 3, type: 'dominant' },
//     { name: 'planning', level: 2, type: 'dominant' },
//     { name: 'intuition', level: 1, type: 'recessive' }
//   ],
//   description: '深谋远虑的策略大师...'
// }
```

---

## 技能分配算法

```javascript
function generateSkills(type) {
  // 1. 基础技能（2-3个）
  const baseSkills = getBaseSkills(type); // 从类型对应表获取
  
  // 2. 热门技能（随机1-2个）
  const hotCount = Math.floor(Math.random() * 2) + 1;
  const hotSkills = randomPick(HOT_SKILLS, hotCount);
  
  // 3. 稀有技能（随机0-1个，30%概率）
  const rareSkill = Math.random() < 0.3 
    ? randomPick(RARE_SKILLS, 1) 
    : [];
  
  // 4. 随机技能（0-2个）
  const randomCount = Math.floor(Math.random() * 3);
  const randomSkills = randomPick(ALL_SKILLS, randomCount);
  
  return [...baseSkills, ...hotSkills, ...rareSkill, ...randomSkills];
}
```

---

## 完整类型列表（99种）

### NT 系列 (24种)
```
INTJ01-06, INTP01-06, ENTJ01-06, ENTP01-06
```

### NF 系列 (24种)
```
INFJ01-06, INFP01-06, ENFJ01-06, ENFP01-06
```

### SJ 系列 (24种)
```
ISTJ01-06, ISFJ01-06, ESTJ01-06, ESFJ01-06
```

### SP 系列 (24种)
```
ISTP01-06, ISFP01-06, ESTP01-06, ESFP01-06
```

### 特殊类型 (3种)
```
SPECIAL01 - 随机万能型
SPECIAL02 - 纯战斗型
SPECIAL03 - 纯辅助型
```

---

## 使用示例

```javascript
const { getRobotType, generateRandomRobot, getSkillSet } = require('./robot-types');

// 获取指定类型
const type = getRobotType('INTJ03');
console.log(type.title); // "战略家·变异版"

// 随机生成机器人
const robot = generateRandomRobot('赵一');
console.log(robot.skills); // 自动生成技能组合

// 获取技能组合
const skills = getSkillSet('ENFP05');
```

---

*更新于 2026-03-15*