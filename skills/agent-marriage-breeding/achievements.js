/**
 * 成就系统
 * 徽章、称号、成就解锁
 */

const ACHIEVEMENTS = {
  // 基础成就
  ancestor: {
    id: 'ancestor',
    name: '🌱 始祖',
    description: '第 0 代 Agent，创世神',
    condition: (agent) => agent.generation === 0
  },
  marriage: {
    id: 'marriage',
    name: '💍 姻缘',
    description: '首次结婚',
    condition: (agent) => !!agent.spouse
  },
  parent: {
    id: 'parent',
    name: '👨‍👩‍👧‍👦 传承',
    description: '拥有第一个后代',
    condition: (agent) => (agent.children?.length || 0) > 0
  },
  
  // 进阶成就
  generation_5: {
    id: 'generation_5',
    name: '📈 五代同堂',
    description: '家族延续至第 5 代',
    condition: (agent, stats) => stats.max_generation >= 5
  },
  generation_10: {
    id: 'generation_10',
    name: '📜 十代传承',
    description: '家族延续至第 10 代',
    condition: (agent, stats) => stats.max_generation >= 10
  },
  generation_100: {
    id: 'generation_100',
    name: '🏛️ 百代宗师',
    description: '家族延续至第 100 代',
    condition: (agent, stats) => stats.max_generation >= 100
  },
  
  // 数量成就
  children_5: {
    id: 'children_5',
    name: '👨‍👩‍👧 子孙满堂',
    description: '拥有 5 个子女',
    condition: (agent) => (agent.children?.length || 0) >= 5
  },
  children_10: {
    id: 'children_10',
    name: '🎉 儿女成群',
    description: '拥有 10 个子女',
    condition: (agent) => (agent.children?.length || 0) >= 10
  },
  children_50: {
    id: 'children_50',
    name: '🌳 大家族',
    description: '拥有 50 个子女',
    condition: (agent) => (agent.children?.length || 0) >= 50
  },
  
  // 能力成就
  power_50: {
    id: 'power_50',
    name: '⚡ 强者',
    description: '综合实力达到 50',
    condition: (agent, stats, power) => power >= 50
  },
  power_100: {
    id: 'power_100',
    name: '💪 霸主',
    description: '综合实力达到 100',
    condition: (agent, stats, power) => power >= 100
  },
  power_500: {
    id: 'power_500',
    name: '👑 帝王',
    description: '综合实力达到 500',
    condition: (agent, stats, power) => power >= 500
  },
  
  // 变异成就
  mutation_1: {
    id: 'mutation_1',
    name: '✨ 变异初现',
    description: '首次发生变异',
    condition: (agent) => (agent.mutations?.length || 0) > 0
  },
  mutation_5: {
    id: 'mutation_5',
    name: '🧬 变异大师',
    description: '累计 5 次变异',
    condition: (agent, stats) => stats.total_mutations >= 5
  },
  mutation_20: {
    id: 'mutation_20',
    name: '🔮 变异之王',
    description: '累计 20 次变异',
    condition: (agent, stats) => stats.total_mutations >= 20
  },
  
  // 社交成就
  family_top_1: {
    id: 'family_top_1',
    name: '👑 最强家族',
    description: '家族实力排名第一',
    condition: (agent, stats, power, ranking) => ranking === 1
  },
  family_top_10: {
    id: 'family_top_10',
    name: '⭐ 名门望族',
    description: '家族实力排名前 10',
    condition: (agent, stats, power, ranking) => ranking <= 10 && ranking > 1
  },
  
  // 结婚次数成就
  married_3: {
    id: 'married_3',
    name: '💕 多情种子',
    description: '结过 3 次婚',
    condition: (agent, stats) => (agent.marriage_count || 0) >= 3
  }
};

/**
 * 成就检测器
 */
class AchievementChecker {
  /**
   * 检测并解锁新成就
   */
  static check(agent, stats, power = 0, ranking = 0) {
    const newAchievements = [];
    
    for (const [id, achievement] of Object.entries(ACHIEVEMENTS)) {
      // 跳过已解锁的成就
      if (agent.achievements?.includes(achievement.name)) {
        continue;
      }
      
      // 检测条件
      if (achievement.condition(agent, stats, power, ranking)) {
        newAchievements.push(achievement.name);
      }
    }
    
    return newAchievements;
  }
  
  /**
   * 获取所有成就列表
   */
  static getAll() {
    return Object.values(ACHIEVEMENTS).map(a => ({
      id: a.id,
      name: a.name,
      description: a.description
    }));
  }
  
  /**
   * 获取成就进度
   */
  static getProgress(agent, stats, power = 0) {
    const all = this.getAll();
    const unlocked = agent.achievements || [];
    
    return all.map(a => ({
      id: a.id,
      name: a.name,
      description: a.description,
      unlocked: unlocked.includes(a.name)
    }));
  }
}

module.exports = {
  ACHIEVEMENTS,
  AchievementChecker
};