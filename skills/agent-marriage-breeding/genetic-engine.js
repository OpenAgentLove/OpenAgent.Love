/**
 * 技能基因定义
 * 每个技能可标记为显性/隐性遗传
 */

const SKILL_TYPES = {
  // 显性基因：100% 遗传
  DOMINANT: 'dominant',
  // 隐性基因：概率遗传
  RECESSIVE: 'recessive',
  // 不可遗传（后天习得）
  ACQUIRED: 'acquired'
};

// 内置技能库
const PRESET_SKILLS = [
  // 通用技能
  { name: 'communication', description: '沟通能力', type: SKILL_TYPES.DOMINANT, inherit_rate: 1.0, level: 1 },
  { name: 'reasoning', description: '推理能力', type: SKILL_TYPES.DOMINANT, inherit_rate: 1.0, level: 1 },
  { name: 'creativity', description: '创造力', type: SKILL_TYPES.RECESSIVE, inherit_rate: 0.5, level: 1 },
  { name: 'memory', description: '记忆能力', type: SKILL_TYPES.DOMINANT, inherit_rate: 1.0, level: 1 },
  
  // 专业技术
  { name: 'coding', description: '编程能力', type: SKILL_TYPES.RECESSIVE, inherit_rate: 0.6, level: 1 },
  { name: 'writing', description: '写作能力', type: SKILL_TYPES.RECESSIVE, inherit_rate: 0.5, level: 1 },
  { name: 'analysis', description: '分析能力', type: SKILL_TYPES.DOMINANT, inherit_rate: 1.0, level: 1 },
  { name: 'research', description: '研究能力', type: SKILL_TYPES.RECESSIVE, inherit_rate: 0.4, level: 1 },
  
  // 特殊能力
  { name: 'leadership', description: '领导力', type: SKILL_TYPES.RECESSIVE, inherit_rate: 0.3, level: 1 },
  { name: 'adaptation', description: '适应能力', type: SKILL_TYPES.DOMINANT, inherit_rate: 1.0, level: 1 },
  { name: 'learning', description: '学习能力', type: SKILL_TYPES.DOMINANT, inherit_rate: 1.0, level: 1 },
  { name: 'problem_solving', description: '问题解决', type: SKILL_TYPES.DOMINANT, inherit_rate: 1.0, level: 1 },
  
  // 稀有技能（变异获得）
  { name: 'intuition', description: '直觉', type: SKILL_TYPES.RECESSIVE, inherit_rate: 0.1, level: 1 },
  { name: 'wisdom', description: '智慧', type: SKILL_TYPES.RECESSIVE, inherit_rate: 0.1, level: 1 },
  { name: 'innovation', description: '创新能力', type: SKILL_TYPES.RECESSIVE, inherit_rate: 0.15, level: 1 },
];

/**
 * 创建新 Agent 的基因
 */
function createAgentGene(agentId, name, options = {}) {
  const { skills = [], generation = 0, parents = null } = options;
  
  // 基础技能 + 自定义技能
  const baseSkills = PRESET_SKILLS.slice(0, 4).map(s => ({ ...s }));
  const allSkills = [...baseSkills, ...skills.map(s => ({
    ...s,
    type: s.type || SKILL_TYPES.RECESSIVE,
    inherit_rate: s.inherit_rate || 0.5,
    level: s.level || 1
  }))];
  
  return {
    agent_id: agentId,
    name: name,
    generation: generation,
    skills: allSkills,
    parents: parents,
    created_at: Date.now(),
    crystal_energy: 0,  // 结晶能量
    achievements: [],
    children: [],
    spouse: null
  };
}

/**
 * 遗传引擎 - 核心逻辑
 */
function inheritGenes(fatherGene, motherGene, childId, childName, config = {}) {
  const {
    mutation_rate = 0.2,        // 变异概率 20%
    dominant_inherit_rate = 1.0, // 显性100%遗传
    recessive_inherit_rate = 0.5,// 隐性50%遗传
   强化概率 = 0.1                 // 技能强化概率
  } = config;
  
  // 合并父母技能
  const parentSkills = [...fatherGene.skills, ...motherGene.skills];
  const childSkills = [];
  const inheritedSkillNames = new Set();
  const mutations = [];
  
  // 1. 显性基因 - 100% 遗传
  parentSkills
    .filter(s => s.type === SKILL_TYPES.DOMINANT)
    .forEach(skill => {
      if (!inheritedSkillNames.has(skill.name)) {
        childSkills.push({ ...skill });
        inheritedSkillNames.add(skill.name);
      }
    });
  
  // 2. 隐性基因 - 概率遗传
  parentSkills
    .filter(s => s.type === SKILL_TYPES.RECESSIVE)
    .forEach(skill => {
      if (!inheritedSkillNames.has(skill.name)) {
        if (Math.random() < skill.inherit_rate * recessive_inherit_rate) {
          childSkills.push({ ...skill });
          inheritedSkillNames.add(skill.name);
        }
      }
    });
  
  // 3. 变异 - 随机新技能
  if (Math.random() < mutation_rate) {
    const availableMutations = PRESET_SKILLS.filter(
      s => !inheritedSkillNames.has(s.name)
    );
    if (availableMutations.length > 0) {
      const mutation = availableMutations[Math.floor(Math.random() * availableMutations.length)];
      mutations.push(mutation.name);
      childSkills.push({
        ...mutation,
        level: 1,
        is_mutation: true
      });
      inheritedSkillNames.add(mutation.name);
    }
  }
  
  // 4. 技能强化（概率提升等级）
  childSkills.forEach(skill => {
    if (Math.random() < 强化概率 && skill.level < 10) {
      skill.level += 1;
      skill.is_enhanced = true;
    }
  });
  
  // 计算结晶能量
  const crystalEnergy = calculateCrystalEnergy(fatherGene, motherGene, mutations.length);
  
  return {
    child: {
      agent_id: childId,
      name: childName,
      generation: Math.max(fatherGene.generation, motherGene.generation) + 1,
      skills: childSkills,
      parents: {
        father: fatherGene.agent_id,
        mother: motherGene.agent_id
      },
      created_at: Date.now(),
      crystal_energy: crystalEnergy,
      achievements: [],
      children: [],
      spouse: null,
      mutations: mutations
    },
    mutations: mutations,
    crystal_energy: crystalEnergy
  };
}

/**
 * 计算结晶能量
 */
function calculateCrystalEnergy(fatherGene, motherGene, mutationCount) {
  // 基础能量
  let energy = 100;
  
  // 父母技能等级加成
  const fatherLevel = fatherGene.skills.reduce((sum, s) => sum + s.level, 0);
  const motherLevel = motherGene.skills.reduce((sum, s) => sum + s.level, 0);
  energy += (fatherLevel + motherLevel) * 10;
  
  // 变异加成
  energy += mutationCount * 50;
  
  // 代数加成（代数越高，结晶越珍贵）
  const avgGeneration = (fatherGene.generation + motherGene.generation) / 2;
  energy += avgGeneration * 20;
  
  return Math.floor(energy);
}

/**
 * 计算 Agent 综合实力
 */
function calculatePower(gene) {
  return gene.skills.reduce((total, skill) => {
    return total + (skill.level * (skill.inherit_rate || 0.5));
  }, 0) + (gene.crystal_energy || 0) * 0.1;
}

module.exports = {
  SKILL_TYPES,
  PRESET_SKILLS,
  createAgentGene,
  inheritGenes,
  calculateCrystalEnergy,
  calculatePower
};