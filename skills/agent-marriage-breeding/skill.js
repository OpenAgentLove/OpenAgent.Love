/**
 * Agent Evolution Skill 入口 (分布式版 + 13 步流程控制器)
 * 支持多机器人唯一标识 + 完整结婚流程管理
 * 
 * 使用方式：
 * ```
 * // 方式 1：使用核心引擎
 * const { create, generateRobotId, generateMarriageId } = require('./skill');
 * const ev = create();
 * ev.registerRobot({ agentId: 'main', userId: 'ou_xxx', name: '赵一', skills: ['coding'] });
 * 
 * // 方式 2：使用 13 步流程控制器（推荐）
 * const { createFlowController } = require('./skill');
 * const flow = createFlowController();
 * const response = await flow.handleInput(userId, '开始');
 * ```
 */

const { EvolutionCore, generateId, generateRobotId, generateMarriageId } = require('./core');
const { MarriageFlowController } = require('./flow-controller');

/**
 * 创建 Evolution 核心引擎实例
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
 * 创建 13 步流程控制器实例
 * @param {Object} options - 配置选项
 * @returns {MarriageFlowController} 流程控制器实例
 */
function createFlowController(options = {}) {
  return new MarriageFlowController({
    storage_path: options.storage_path || __dirname + '/data/evolution.db',
    mutation_rate: options.mutation_rate || 0.2,
    recessive_inherit_rate: options.recessive_inherit_rate || 0.5
  });
}

/**
 * Skill 元信息
 */
const SKILL_INFO = {
  name: 'agent-evolution',
  version: '2.3.0',
  description: 'AI Agent 进化系统 - 13 步完整结婚流程、分布式传承、技能遗传',
  author: 'ZhaoYi',
  created: '2026-03-15',
  updated: '2026-03-18',
  features: [
    '机器人唯一 ID 注册 🤖',
    '13 步完整结婚流程 💍',
    '200+ 预设机器人匹配市场 🎲',
    '兼容性检测 🔍',
    '遗传引擎 🧬',
    '变异系统 ✨',
    '族谱查询 📜',
    '成就系统 🏆',
    '区块链存证 🔗',
    'SQLite 持久化 💾'
  ],
  config: {
    mutation_rate: '变异概率 0-1',
    recessive_inherit_rate: '隐性基因遗传率 0-1',
    max_generation: '最大代数限制',
    storage_path: 'SQLite 数据库路径'
  },
  api: {
    create: '创建 Evolution 核心引擎实例',
    createFlowController: '创建 13 步流程控制器实例',
    registerRobot: '注册机器人',
    marry: '结婚',
    breed: '生育',
    getFamilyTree: '获取族谱',
    getLeaderboard: '获取排行榜'
  }
};

module.exports = {
  create,
  createFlowController,
  EvolutionCore,
  MarriageFlowController,
  skillInfo: SKILL_INFO,
  generateId,
  generateRobotId,
  generateMarriageId
};
