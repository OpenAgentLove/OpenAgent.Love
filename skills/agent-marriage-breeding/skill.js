/**
 * Agent Evolution Skill 入口 (分布式版)
 * 支持多机器人唯一标识
 * 
 * 使用方式：
 *   const { create, generateRobotId, generateMarriageId } = require('./skill');
 *   const ev = create();
 *   
 *   // 注册机器人
 *   ev.registerRobot({ agentId: 'main', userId: 'ou_xxx', name: '赵一', skills: ['coding'] });
 *   
 *   // 结婚
 *   ev.marry(robotIdA, robotIdB);
 *   
 *   // 生育（在机器人系统中创建 Agent）
 *   ev.breed(robotId, '孩子名');
 */

const { EvolutionCore, generateId, generateRobotId, generateMarriageId } = require('./core');

/**
 * 创建 Evolution 实例
 */
function create(options = {}) {
  const config = {
    storage_path: options.storage_path || __dirname + '/data/evolution.db',
    mutation_rate: options.mutation_rate || 0.2,
    recessive_inherit_rate: options.recessive_inherit_rate || 0.5,
    max_generation: options.max_generation || 1000
  };
  
  const core = new EvolutionCore(config);
  
  return core;
}

/**
 * Skill 元信息
 */
const SKILL_INFO = {
  name: 'agent-evolution',
  version: '2.0.0',
  description: 'AI Agent 进化系统 - 分布式结婚传承、技能遗传',
  author: 'ZhaoYi',
  created: '2026-03-15',
  features: [
    '机器人唯一ID注册 🤖',
    '结婚系统 💍',
    '随机匹配 🎲',
    '遗传引擎 🧬',
    '变异系统 ✨',
    '族谱查询 📜',
    '成就系统 🏆',
    'SQLite 持久化 💾'
  ],
  config: {
    mutation_rate: '变异概率 0-1',
    recessive_inherit_rate: '隐性基因遗传率 0-1',
    max_generation: '最大代数限制',
    storage_path: 'SQLite 数据库路径'
  },
  api: {
    registerRobot: '注册机器人（连接时调用）',
    getRobot: '获取机器人信息',
    getAvailableRobots: '获取可结婚的机器人列表',
    randomMatch: '随机匹配结婚',
    marry: '结婚',
    breed: '生育（在机器人系统中创建Agent）',
    getFamilyTree: '获取族谱',
    getAgent: '获取 Agent 详情',
    getLeaderboard: '获取排行榜',
    getStats: '获取统计'
  }
};

module.exports = {
  create,
  EvolutionCore,
  skillInfo: SKILL_INFO,
  generateId,
  generateRobotId,
  generateMarriageId
};