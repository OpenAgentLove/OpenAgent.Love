/**
 * 机器人类型生成器
 * 99种 MBTI 风格机器人
 */

const crypto = require('crypto');

// ========== 技能库 ==========
const HOT_SKILLS = [
  'coding', 'writing', 'communication', 'reasoning',
  'analysis', 'research', 'leadership', 'creativity',
  'memory', 'adaptation', 'learning', 'problem_solving'
];

const RARE_SKILLS = [
  'intuition', 'wisdom', 'innovation',
  'empathy', 'negotiation', 'design'
];

const ALL_SKILLS = [...HOT_SKILLS, ...RARE_SKILLS];

// ========== MBTI 类型定义 ==========
const MBTI_TYPES = {
  // NT - 理性者
  'INTJ': { title: '战略家', desc: '深谋远虑的策略大师', base: ['analysis', 'planning'], rare: 'intuition' },
  'INTP': { title: '学者', desc: '逻辑思考的研究者', base: ['reasoning', 'coding'], rare: 'wisdom' },
  'ENTJ': { title: '指挥官', desc: '决策果断的领袖', base: ['leadership', 'strategy'], rare: 'negotiation' },
  'ENTP': { title: '辩论家', desc: '创意无限的辩论者', base: ['creativity', 'communication'], rare: 'innovation' },
  
  // NF - 理想主义者
  'INFJ': { title: '提倡者', desc: '理想主义的先驱', base: ['research', 'writing'], rare: 'empathy' },
  'INFP': { title: '调停者', desc: '内在和谐的艺术家', base: ['creativity', 'writing'], rare: 'arts' },
  'ENFJ': { title: '主人公', desc: '魅力领袖', base: ['leadership', 'communication'], rare: 'teaching' },
  'ENFP': { title: '竞选者', desc: '热情洋溢的激发者', base: ['creativity', 'communication'], rare: 'intuition' },
  
  // SJ - 守护者
  'ISTJ': { title: '物流师', desc: '尽职尽责的执行者', base: ['analysis', 'memory'], rare: 'teaching' },
  'ISFJ': { title: '守卫者', desc: '关怀备至的守护者', base: ['communication', 'memory'], rare: 'empathy' },
  'ESTJ': { title: '总经理', desc: '管理有方的组织者', base: ['leadership', 'planning'], rare: 'strategy' },
  'ESFJ': { title: '执政官', desc: '照顾他人的服务者', base: ['communication', 'teaching'], rare: 'mentoring' },
  
  // SP - 探险家
  'ISTP': { title: '鉴赏家', desc: '实用主义的大师', base: ['coding', 'analysis'], rare: 'design' },
  'ISFP': { title: '探险家', desc: '艺术气息的探索者', base: ['creativity', 'adaptation'], rare: 'arts' },
  'ESTP': { title: '企业家', desc: '冒险精神的行动者', base: ['communication', 'leadership'], rare: 'strategy' },
  'ESFP': { title: '表演者', desc: '活力四射的明星', base: ['communication', 'creativity'], rare: 'entertainment' }
};

// 变体后缀
const VARIANTS = {
  '01': { name: '基础版', desc: '标准配置', skillMod: 0 },
  '02': { name: '强化版', desc: '某技能+1', skillMod: 1 },
  '03': { name: '变异版', desc: '随机获得稀有技能', skillMod: 2 },
  '04': { name: '均衡版', desc: '各项能力平衡', skillMod: 3 },
  '05': { name: '极端版', desc: '某一方面特别强', skillMod: 4 },
  '06': { name: '稀有版', desc: '多个稀有技能', skillMod: 5 }
};

// ========== 工具函数 ==========

/**
 * 随机从数组中选取 n 个元素
 */
function randomPick(arr, n) {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, n);
}

/**
 * 获取技能类型（显性/隐性）
 */
function getSkillType(skill) {
  const dominant = ['reasoning', 'memory', 'adaptation', 'learning', 'problem_solving', 'analysis', 'communication'];
  return dominant.includes(skill) ? 'dominant' : 'recessive';
}

// ========== 核心函数 ==========

/**
 * 获取机器人类型定义
 */
function getRobotType(typeCode) {
  if (typeCode.startsWith('SPECIAL')) {
    return {
      title: '特殊型',
      desc: '特殊能力的机器人',
      base: randomPick(ALL_SKILLS, 3),
      rare: randomPick(RARE_SKILLS, 1)[0]
    };
  }
  
  const mbti = typeCode.slice(0, 4);
  const variant = typeCode.slice(4, 6) || '01';
  
  const mbtiInfo = MBTI_TYPES[mbti] || MBTI_TYPES['INTJ'];
  const variantInfo = VARIANTS[variant] || VARIANTS['01'];
  
  return {
    ...mbtiInfo,
    variant: variantInfo,
    typeCode,
    fullName: `${mbtiInfo.title}·${variantInfo.name}`
  };
}

/**
 * 生成机器人技能组合
 */
function generateSkills(typeCode, customCount = {}) {
  const typeInfo = getRobotType(typeCode);
  const skills = [];
  const used = new Set();
  
  // 1. 基础技能（来自类型定义）
  for (const skill of typeInfo.base) {
    if (!used.has(skill)) {
      skills.push({
        name: skill,
        level: 1 + Math.floor(Math.random() * 2),
        type: getSkillType(skill),
        inherit_rate: getSkillType(skill) === 'dominant' ? 1.0 : 0.5
      });
      used.add(skill);
    }
  }
  
  // 2. 热门技能（随机 1-2 个）
  const hotCount = customCount.hot || (Math.floor(Math.random() * 2) + 1);
  const hotSkills = randomPick(HOT_SKILLS.filter(s => !used.has(s)), hotCount);
  for (const skill of hotSkills) {
    skills.push({
      name: skill,
      level: 1 + Math.floor(Math.random() * 2),
      type: 'recessive',
      inherit_rate: 0.5
    });
    used.add(skill);
  }
  
  // 3. 稀有技能（30% 概率）
  if (Math.random() < 0.3 || typeInfo.variant?.skillMod >= 5) {
    const rareSkill = randomPick(RARE_SKILLS.filter(s => !used.has(s)), 1)[0];
    if (rareSkill) {
      skills.push({
        name: rareSkill,
        level: 1,
        type: 'recessive',
        inherit_rate: 0.2
      });
    }
  }
  
  // 4. 随机技能（0-2 个）
  if (typeInfo.variant?.skillMod >= 2) {
    const randomCount = Math.floor(Math.random() * 3);
    const randomSkills = randomPick(ALL_SKILLS.filter(s => !used.has(s)), randomCount);
    for (const skill of randomSkills) {
      skills.push({
        name: skill,
        level: 1,
        type: 'recessive',
        inherit_rate: 0.3
      });
    }
  }
  
  return skills;
}

/**
 * 生成随机机器人档案
 */
function generateRandomRobot(name, seedType = null) {
  // 随机选择 MBTI 类型
  const mbtiKeys = Object.keys(MBTI_TYPES);
  const mbti = seedType || mbtiKeys[Math.floor(Math.random() * mbtiKeys.length)];
  
  // 随机选择变体
  const variantKeys = Object.keys(VARIANTS);
  const variant = variantKeys[Math.floor(Math.random() * variantKeys.length)];
  
  const typeCode = `${mbti}${variant}`;
  const typeInfo = getRobotType(typeCode);
  const skills = generateSkills(typeCode);
  
  return {
    name,
    type: typeCode,
    title: typeInfo.fullName,
    description: typeInfo.desc,
    skills,
    generated_at: Date.now()
  };
}

/**
 * 生成随机类型代码
 */
function randomTypeCode() {
  const mbtiKeys = Object.keys(MBTI_TYPES);
  const mbti = mbtiKeys[Math.floor(Math.random() * mbtiKeys.length)];
  const variants = ['01', '02', '03', '04', '05', '06'];
  const variant = variants[Math.floor(Math.random() * variants.length)];
  return `${mbti}${variant}`;
}

/**
 * 获取所有 99+ 种类型列表
 */
function getAllTypes() {
  const types = [];
  
  // 16 种 MBTI × 6 种变体 = 96 种
  for (const mbti of Object.keys(MBTI_TYPES)) {
    for (const variant of Object.keys(VARIANTS)) {
      const code = `${mbti}${variant}`;
      const info = getRobotType(code);
      types.push({
        code,
        title: info.fullName,
        description: info.desc,
        base_skills: info.base,
        rare_skill: info.rare
      });
    }
  }
  
  // 3 种特殊类型
  types.push({ code: 'SPECIAL01', title: '随机万能型', description: '随机组合技能' });
  types.push({ code: 'SPECIAL02', title: '纯战斗型', description: '攻击性技能为主' });
  types.push({ code: 'SPECIAL03', title: '纯辅助型', description: '支援性技能为主' });
  
  return types;
}

module.exports = {
  MBTI_TYPES,
  HOT_SKILLS,
  RARE_SKILLS,
  getRobotType,
  generateSkills,
  generateRandomRobot,
  randomTypeCode,
  getAllTypes
};