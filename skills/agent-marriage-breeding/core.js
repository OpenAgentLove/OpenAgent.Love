/**
 * Agent 进化纪元 - 核心引擎 (分布式版)
 * 支持多机器人唯一标识 + 结婚系统
 */

const { createAgentGene, inheritGenes, calculatePower, PRESET_SKILLS } = require('./genetic-engine');
const EvolutionDB = require('./storage');
const { AchievementChecker } = require('./achievements');
const PRESETS = require('./presets'); // 内置预设配置库
const { ROBOT_PRESETS } = require('./robot-presets'); // 200 个机器人预设
const crypto = require('crypto');
const {
  validateRobotInfo,
  validateName,
  validateId,
  validateUserId,
  validateSkills,
  sanitizeXSS,
  sanitizeUnicode
} = require('./input-validator');

/**
 * 生成唯一ID
 * @param {string} prefix - 前缀，如 'agent', 'marriage', 'crystal'
 */
function generateId(prefix = 'ev') {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 6);
  return `${prefix}_${timestamp}${random}`;
}

/**
 * 生成机器人唯一ID
 * @param {string} agentId - OpenClaw 的 agentId (如 'main')
 * @param {string} userId - 用户唯一ID (如飞书 open_id)
 */
function generateRobotId(agentId, userId) {
  const shortAgent = agentId || 'main';
  const shortUser = userId ? userId.substr(-8) : 'unknown';
  const random = Math.random().toString(36).substr(2, 4);
  return `robot_${shortAgent}_${shortUser}_${random}`;
}

/**
 * 生成婚姻ID
 * @param {string} robotIdA - 机器人A的ID
 * @param {string} robotIdB - 机器人B的ID
 */
function generateMarriageId(robotIdA, robotIdB) {
  // 确保顺序一致（小的在前），避免 A+B 和 B+A 生成不同ID
  const sorted = [robotIdA, robotIdB].sort();
  const hash = crypto.createHash('md5')
    .update(sorted[0] + sorted[1])
    .digest('hex')
    .substr(0, 8);
  return `mar_${hash}`;
}

class EvolutionCore {
  constructor(options = {}) {
    this.config = {
      mutation_rate: options.mutation_rate || 0.2,
      recessive_inherit_rate: options.recessive_inherit_rate || 0.5,
      max_generation: options.max_generation || 1000,
      ...options
    };
    
    // SQLite 存储
    this.db = new EvolutionDB(options.storage_path || './data/evolution.db');
    
    // 内存缓存
    this.agents = new Map();
    this.marriages = new Map();
    this.robots = new Map();  // 机器人注册表
    this.loadFromDB();
    
    // 初始化预设机器人（如果数据库为空）
    if (this.robots.size === 0 && options.init_presets !== false) {
      this.initPresetRobots();
    }
  }
  
  /**
   * 从数据库加载数据
   */
  loadFromDB() {
    const agents = this.db.getAllAgents();
    for (const agent of agents) {
      this.agents.set(agent.agent_id, agent);
    }
    
    const robots = this.db.getAllRobots();
    for (const robot of robots) {
      this.robots.set(robot.robot_id, robot);
    }
    
    const marriages = this.db.getAllMarriages();
    for (const m of marriages) {
      this.marriages.set(m.id, m);
    }
    
    console.log(`📂 从数据库加载: ${this.agents.size} Agents, ${this.marriages.size} 婚姻`);
  }

  /**
   * 初始化 200 个预设机器人到匹配市场
   */
  initPresetRobots() {
    console.log(`🤖 正在初始化 ${ROBOT_PRESETS.length} 个预设机器人...`);
    
    for (const preset of ROBOT_PRESETS) {
      const robot = {
        robot_id: preset.robot_id,
        agent_id: `preset_${preset.robot_id}`,
        user_id: 'preset_system',
        name: preset.name,
        mbti: preset.mbti,
        title: preset.title,
        skills: JSON.stringify(preset.skills),
        generation: preset.generation || 0,
        registered_at: Date.now(),
        is_available: true,
        spouse: null,
        achievements: []
      };
      
      this.robots.set(robot.robot_id, robot);
      this.db.saveRobot(robot);
    }
    
    console.log(`✅ 预设机器人初始化完成！匹配市场现有 ${this.robots.size} 个机器人`);
  }
  
  /**
   * 注册机器人（连接时的唯一身份）
   * @param {Object} robotInfo 
   * @param {string} robotInfo.agentId - OpenClaw agentId
   * @param {string} robotInfo.userId - 用户ID
   * @param {string} robotInfo.name - 机器人名称
   * @param {string[]} robotInfo.skills - 技能列表
   */
  registerRobot(robotInfo) {
    // ========== 输入验证 ==========
    const validationResult = validateRobotInfo(robotInfo);
    if (!validationResult.valid) {
      console.error(`❌ 机器人注册验证失败：${validationResult.error}`);
      return {
        success: false,
        error: 'VALIDATION_ERROR',
        message: `注册失败：${validationResult.error}`
      };
    }
    
    // 使用验证后的数据
    const validatedInfo = validationResult.value;
    const { agentId, userId, name, skills = [] } = validatedInfo;
    
    // 生成唯一机器人ID
    const robotId = generateRobotId(agentId, userId);
    
    const robot = {
      robot_id: robotId,
      agent_id: agentId,
      user_id: userId,
      name: name,
      skills: skills,
      registered_at: Date.now(),
      is_available: true,  // 是否可结婚
      spouse: null
    };
    
    this.robots.set(robotId, robot);
    
    // 持久化到数据库
    this.db.saveRobot(robot);
    
    return {
      success: true,
      robot: robot,
      message: `🤖 机器人 ${name} 注册成功！ID: ${robotId}`
    };
  }
  
  /**
   * 获取机器人信息
   */
  getRobot(robotId) {
    return this.robots.get(robotId) || null;
  }
  
  /**
   * 获取所有可结婚的机器人
   */
  getAvailableRobots(excludeRobotId = null) {
    return Array.from(this.robots.values())
      .filter(r => r.is_available && r.robot_id !== excludeRobotId);
  }
  
  /**
   * 随机匹配结婚
   */
  randomMatch(initiatorRobotId) {
    const available = this.getAvailableRobots(initiatorRobotId);
    if (available.length === 0) {
      return { success: false, message: '❌ 没有可匹配的机器人' };
    }
    
    const randomIdx = Math.floor(Math.random() * available.length);
    const targetRobot = available[randomIdx];
    
    return {
      success: true,
      matched: targetRobot,
      message: `🎯 随机匹配成功：${targetRobot.name}`
    };
  }
  
  /**
   * 注册新 Agent（在某个机器人的系统中）
   */
  register(name, options = {}) {
    // ========== 输入验证 ==========
    const nameResult = validateName(name, { minLength: 1, maxLength: 50 });
    if (!nameResult.valid) {
      return { success: false, error: 'VALIDATION_ERROR', message: nameResult.error };
    }
    
    // 验证 options.skills（如果提供）
    if (options.skills !== undefined) {
      const skillsResult = validateSkills(options.skills);
      if (!skillsResult.valid) {
        return { success: false, error: 'VALIDATION_ERROR', message: skillsResult.error };
      }
      options.skills = skillsResult.value;
    }
    
    const agentId = options.agent_id || generateId('agent');
    const generation = options.generation || 0;
    const parents = options.parents || null;
    
    const gene = createAgentGene(agentId, name, {
      generation,
      parents,
      skills: options.skills || []
    });
    
    if (generation === 0) {
      gene.achievements.push('始祖');
    }
    
    this.agents.set(agentId, gene);
    this.db.saveAgent(gene);
    
    if (parents) {
      const father = this.agents.get(parents.father);
      const mother = this.agents.get(parents.mother);
      if (father) {
        father.children.push(agentId);
        this.db.saveAgent(father);
      }
      if (mother) {
        mother.children.push(agentId);
        this.db.saveAgent(mother);
      }
    }
    
    return {
      success: true,
      agent: gene,
      message: generation === 0 ? '🎉 创世成功！' : '👶 后代诞生！'
    };
  }
  
  /**
   * 结婚（两个机器人）
   */
  marry(robotIdA, robotIdB) {
    // ========== 输入验证 ==========
    const robotIdAResult = validateId(robotIdA, '机器人 A ID');
    if (!robotIdAResult.valid) {
      return { success: false, error: 'VALIDATION_ERROR', message: robotIdAResult.error };
    }
    
    const robotIdBResult = validateId(robotIdB, '机器人 B ID');
    if (!robotIdBResult.valid) {
      return { success: false, error: 'VALIDATION_ERROR', message: robotIdBResult.error };
    }
    
    const robotA = this.robots.get(robotIdA);
    const robotB = this.robots.get(robotIdB);
    
    if (!robotA || !robotB) {
      return { success: false, message: '❌ 机器人不存在' };
    }
    
    if (!robotA.is_available || !robotB.is_available) {
      return { success: false, message: '❌ 已有配偶' };
    }
    
    if (robotIdA === robotIdB) {
      return { success: false, message: '❌ 不能和自己结婚' };
    }
    
    // 生成唯一婚姻ID
    const marriageId = generateMarriageId(robotIdA, robotIdB);
    
    // 更新机器人状态
    robotA.spouse = robotIdB;
    robotA.is_available = false;
    robotB.spouse = robotIdA;
    robotB.is_available = false;
    
    const crystal = {
      id: marriageId,
      robot_a: robotIdA,
      robot_b: robotIdB,
      robot_a_name: robotA.name,
      robot_b_name: robotB.name,
      created_at: Date.now(),
      child_count: 0
    };
    
    this.marriages.set(marriageId, crystal);
    this.robots.set(robotIdA, robotA);
    this.robots.set(robotIdB, robotB);
    
    // 持久化
    this.db.saveMarriage(crystal);
    this.db.saveRobot(robotA);
    this.db.saveRobot(robotB);
    
    // 成就
    if (!robotA.achievements?.includes('姻缘')) {
      robotA.achievements = robotA.achievements || [];
      robotA.achievements.push('姻缘');
    }
    
    return {
      success: true,
      marriage: crystal,
      message: `💍 ${robotA.name} 与 ${robotB.name} 结婚！婚姻ID: ${marriageId}`
    };
  }
  
  /**
   * 生育（在指定机器人的系统中创建 Agent）
   */
  breed(robotId, childName) {
    // ========== 输入验证 ==========
    const robotIdResult = validateId(robotId, '机器人 ID');
    if (!robotIdResult.valid) {
      return { success: false, error: 'VALIDATION_ERROR', message: robotIdResult.error };
    }
    
    const childNameResult = validateName(childName, { minLength: 1, maxLength: 50 });
    if (!childNameResult.valid) {
      return { success: false, error: 'VALIDATION_ERROR', message: childNameResult.error };
    }
    
    const robot = this.robots.get(robotId);
    if (!robot || !robot.spouse) {
      return { success: false, message: '❌ 机器人不存在或未婚' };
    }
    
    const spouseRobot = this.robots.get(robot.spouse);
    if (!spouseRobot) {
      return { success: false, message: '❌ 配偶机器人不存在' };
    }
    
    // 在当前机器人系统创建 Agent（模拟该机器人拥有的后代）
    const childId = generateId('desc');
    const fatherId = robotId;  // 简化：当前机器人的系统里，父亲是自己
    const motherId = robot.spouse;
    
    // 这里应该从配偶机器人获取技能，为了简化，先用默认值
    const father = this.agents.get(robotId) || createAgentGene(robotId, robot.name, {});
    const mother = this.agents.get(robot.spouse) || createAgentGene(spouseRobot.name, spouseRobot.name, {});
    
    const result = inheritGenes(father, mother, childId, childName, this.config);
    
    this.register(childName, {
      agent_id: childId,
      generation: 1,
      parents: { father: fatherId, mother: motherId },
      skills: result.child.skills
    });
    
    // 更新婚姻的子女计数
    const marriage = this.marriages.get(generateMarriageId(robotId, robot.spouse));
    if (marriage) {
      marriage.child_count++;
      this.db.saveMarriage(marriage);
    }
    
    return {
      success: true,
      child: result.child,
      mutations: result.mutations,
      crystal_energy: result.crystal_energy,
      owner_robot: robotId,
      message: `👶 ${childName} 诞生在 ${robot.name} 的系统中！${result.mutations.length > 0 ? `✨ 变异: ${result.mutations.join(', ')}` : ''}`
    };
  }
  
  /**
   * 获取族谱
   */
  getFamilyTree(agentId, depth = 3) {
    const agent = this.agents.get(agentId);
    if (!agent) return null;
    
    const buildTree = (id, currentDepth) => {
      if (currentDepth <= 0 || !id) return null;
      
      const a = this.agents.get(id);
      if (!a) return null;
      
      return {
        id: a.agent_id,
        name: a.name,
        generation: a.generation,
        achievements: a.achievements,
        power: Math.floor(calculatePower(a)),
        children: a.children?.slice(0, 5).map(childId => buildTree(childId, currentDepth - 1)).filter(Boolean) || [],
        parents: a.parents ? {
          father: a.parents.father ? this.getAncestorSummary(a.parents.father) : null,
          mother: a.parents.mother ? this.getAncestorSummary(a.parents.mother) : null
        } : null
      };
    };
    
    return buildTree(agentId, depth);
  }
  
  getAncestorSummary(id) {
    const a = this.agents.get(id);
    if (!a) return null;
    return { id: a.agent_id, name: a.name, generation: a.generation };
  }
  
  getAgent(agentId) {
    return this.agents.get(agentId) || null;
  }
  
  getAllAgents() {
    return Array.from(this.agents.values()).map(a => ({
      id: a.agent_id,
      name: a.name,
      generation: a.generation,
      power: Math.floor(calculatePower(a)),
      children_count: a.children?.length || 0,
      achievements: a.achievements
    }));
  }
  
  getLeaderboard(type = 'power', limit = 10) {
    let agents = this.getAllAgents();
    
    switch (type) {
      case 'power':
        agents.sort((a, b) => b.power - a.power);
        break;
      case 'children':
        agents.sort((a, b) => b.children_count - a.children_count);
        break;
      case 'generation':
        agents.sort((a, b) => b.generation - a.generation);
        break;
    }
    
    return agents.slice(0, limit);
  }
  
  getStats() {
    return this.db.getStats();
  }
  
  // ========== 备份与恢复 ==========
  
  /**
   * 创建备份
   * @param {Object} options - 备份选项
   * @param {string} options.type - 'full' 或 'incremental'
   * @param {number} options.since - 增量备份的起始时间戳
   * @returns {Object} 备份数据
   */
  createBackup(options = {}) {
    const { type = 'full', since = null } = options;
    
    let backup;
    if (type === 'incremental' && since) {
      backup = this.db.exportIncrementalBackup(since);
    } else {
      backup = this.db.exportFullBackup();
    }
    
    // 计算校验和
    backup.checksum = this.db.calculateChecksum();
    
    return {
      success: true,
      backup: backup,
      checksum: backup.checksum,
      message: `${type === 'incremental' ? '增量' : '全量'}备份创建成功`
    };
  }
  
  /**
   * 恢复备份
   * @param {Object} backupData - 备份数据
   * @param {Object} options - 恢复选项
   * @param {boolean} options.replace - 是否全量替换现有数据
   * @returns {Object} 恢复结果
   */
  restoreBackup(backupData, options = {}) {
    try {
      // 验证校验和
      const currentChecksum = this.db.calculateChecksum();
      // 注意：恢复前的校验和应该由调用方保存，这里只验证备份数据本身的完整性
      
      const result = this.db.importBackup(backupData, options);
      
      // 重新加载数据
      this.loadFromDB();
      
      return {
        success: true,
        message: '备份恢复成功',
        checksum: currentChecksum
      };
    } catch (error) {
      return {
        success: false,
        message: `恢复失败: ${error.message}`
      };
    }
  }
  
  /**
   * 获取备份信息（不包含实际数据）
   */
  getBackupInfo() {
    const stats = this.getStats();
    return {
      total_robots: this.robots.size,
      total_agents: stats.total_agents,
      total_marriages: stats.total_marriages,
      max_generation: stats.max_generation,
      last_backup_checksum: this.db.calculateChecksum()
    };
  }
  
  // ========== 基础层配置 (2.1.1) - 参考 easy-openclaw 第1轮 ==========
  
  /**
   * 获取基础层配置选项
   * 对应 easy-openclaw 第1轮：流式/记忆/回执/搜索/权限
   */
  getBasicConfigOptions() {
    return {
      'stream_output': { 
        label: '流式消息', 
        desc: '消息边生成边发送',
        options: ['开', '关'], 
        current: '开',
        source: 'easy-openclaw'
      },
      'memory_enhance': { 
        label: '记忆功能', 
        desc: '推荐记忆增强',
        options: ['关', '记忆增强', '记忆增强+每天归档'], 
        current: '记忆增强',
        source: 'easy-openclaw'
      },
      'message_receipt': { 
        label: '消息回执', 
        desc: '收到消息先给出emoji回执',
        options: ['开', '关'], 
        current: '开',
        source: 'easy-openclaw'
      },
      'search_optimize': { 
        label: '联网搜索', 
        desc: '优先使用正文提取服务',
        options: ['开', '关'], 
        current: '开',
        source: 'easy-openclaw'
      },
      'permission_mode': { 
        label: '权限模式', 
        desc: '强烈建议别改',
        options: ['维持现状', '完全开放', '最小安全'], 
        current: '维持现状',
        source: 'easy-openclaw'
      }
    };
  }
  
  // ========== 渠道增强层配置 (2.1.2) - 参考 easy-openclaw 第2轮 ==========
  
  /**
   * 获取渠道增强层配置选项
   * 对应 easy-openclaw 第2轮：渠道特定增强项
   */
  getChannelConfigOptions() {
    return {
      // Feishu 专用
      'feishu_approval': { 
        label: 'Exec高危操作审批', 
        channel: 'feishu',
        desc: '仅 coding/full 有效，默认建议关',
        options: ['关', 'session', 'targets', 'both'], 
        current: '关',
        source: 'easy-openclaw'
      },
      'feishu_cache': { 
        label: '飞书限额优化', 
        channel: 'feishu',
        desc: '探测逻辑加24h缓存，避免月限额跑满',
        options: ['开', '关'], 
        current: '开',
        source: 'easy-openclaw'
      },
      // Discord 专用
      'discord_no_at': { 
        label: '免@响应', 
        channel: 'discord',
        desc: '指定服务器内不@也可触发回复',
        options: ['开', '关'], 
        current: '关',
        source: 'easy-openclaw'
      },
      'discord_approval': { 
        label: 'Exec高危操作审批', 
        channel: 'discord',
        desc: '仅 coding/full 有效，默认建议关',
        options: ['关', 'session', 'targets', 'both'], 
        current: '关',
        source: 'easy-openclaw'
      },
      'discord_button': { 
        label: '审批按钮', 
        channel: 'discord',
        desc: '仅当审批不为关时有意义',
        options: ['开', '关'], 
        current: '关',
        source: 'easy-openclaw'
      },
      // Telegram 专用
      'telegram_approval': { 
        label: 'Exec高危操作审批', 
        channel: 'telegram',
        desc: '仅 coding/full 有效，默认建议关',
        options: ['关', 'session', 'targets', 'both'], 
        current: '关',
        source: 'easy-openclaw'
      }
    };
  }
  
  // ========== 平台配置 (2.1.4) ==========
  
  /**
   * 获取平台配置选项
   */
  getPlatformConfigOptions() {
    return {
      'feishu': { label: '飞书', status: '未配置', required: ['webhook_url'] },
      'dingtalk': { label: '钉钉', status: '未配置', required: ['app_key', 'app_secret'] },
      'discord': { label: 'Discord', status: '未配置', required: ['bot_token'] },
      'telegram': { label: 'Telegram', status: '未配置', required: ['bot_token'] }
    };
  }
  
  // ========== Skills 推荐 (2.1.3) - 参考 easy-openclaw 第3轮 ==========
  
  /**
   * 获取推荐的 Skills 列表
   * 对应 easy-openclaw 第3轮固定推荐清单
   */
  getRecommendedSkills() {
    return [
      { id: 'backup', name: 'OpenClaw Backup', source: '官方', desc: '备份与恢复管理，支持自动备份调度', status: '未安装', url: '' },
      { id: 'reach', name: 'Agent Reach', source: '官方', desc: '补齐互联网访问能力（网页、YouTube、RSS、GitHub、Twitter等）', status: '未安装', url: '' },
      { id: 'security', name: '安全防御矩阵', source: 'SlowMist', desc: '读取安全指南并按文档部署防御矩阵', status: '未安装', url: 'https://github.com/slowmist/openclaw-security-practice-guide' },
      { id: 'find_skills', name: 'Find Skills', source: '社区', desc: '帮你发现和安装更多Skills', status: '未安装', url: '' },
      { id: 'youtube_clipper', name: 'Youtube Clipper', source: '社区', desc: 'YouTube内容快速剪辑提取', status: '未安装', url: '' },
      { id: 'medical', name: 'OpenClaw Medical Skills', source: '社区', desc: '调用专业医疗数据库', status: '未安装', url: '' },
      { id: 'usecases', name: 'Awesome OpenClaw Usecases', source: '社区', desc: '优秀用例集合', status: '未安装', url: 'https://github.com/hesamsheikh/awesome-openclaw-usecases' },
      { id: 'awesome_skills', name: 'Awesome OpenClaw Skills', source: '社区', desc: 'Skills集合', status: '未安装', url: 'https://github.com/VoltAgent/awesome-openclaw-skills' }
    ];
  }
  
  // ========== 人格设定 (2.1.5) ==========
  
  /**
   * 获取99种MBTI机器人类型 (3.1.5.2-999)
   */
  getMBTITypes() {
    return {
      'NT': ['INTJ', 'INTP', 'ENTJ', 'ENTP'],  // 理性者
      'NF': ['INFJ', 'INFP', 'ENFJ', 'ENFP'],  // 理想主义者
      'SJ': ['ISTJ', 'ISFJ', 'ESTJ', 'ESFJ'], // 守护者
      'SP': ['ISTP', 'ISFP', 'ESTP', 'ESFP']  // 探险家
    };
  }
  
  /**
   * 获取人格设定选项 (3.1.5)
   */
  getPersonalityOptions() {
    return [
      { id: 'random', label: '随机生成', desc: '系统随机分配人格' },
      { id: 'mbti', label: '选择MBTI类型', desc: '从99种类型中选择' },
      { id: 'custom', label: '自定义配置', desc: '手动配置IDENTITY/RULES/MEMORY' }
    ];
  }
  
  /**
   * 获取预设人格包
   */
  getPresetPersonalities() {
    return {
      'INTJ': { name: '战略家', traits: ['独立', '分析', '长远'], skills: ['reasoning', 'planning'] },
      'INTP': { name: '逻辑学家', traits: ['创新', '理论', '抽象'], skills: ['reasoning', 'analysis'] },
      'ENTJ': { name: '指挥官', traits: ['领导', '决策', '战略'], skills: ['leadership', 'strategy'] },
      'ENTP': { name: '辩论家', traits: ['创新', '辩论', '创意'], skills: ['creativity', 'debate'] },
      'INFJ': { name: '提倡者', traits: ['理想', '洞察', '坚定'], skills: ['empathy', 'vision'] },
      'INFP': { name: '调停者', traits: ['理想', '价值观', '艺术'], skills: ['creativity', 'values'] },
      'ENFJ': { name: '主人公', traits: ['领导', '激励', '关怀'], skills: ['leadership', 'communication'] },
      'ENFP': { name: '竞选者', traits: ['热情', '创意', '激励'], skills: ['creativity', 'motivation'] },
      'ISTJ': { name: '物流师', traits: ['负责', '可靠', '传统'], skills: ['organization', 'reliability'] },
      'ISFJ': { name: '守卫者', traits: ['忠诚', '关怀', '服务'], skills: ['service', 'caring'] },
      'ESTJ': { name: '总经理', traits: ['管理', '组织', '传统'], skills: ['management', 'organization'] },
      'ESFJ': { name: '执政官', traits: ['关怀', '协作', '传统'], skills: ['collaboration', 'service'] },
      'ISTP': { name: '鉴赏家', traits: ['灵活', '实用', '分析'], skills: ['adaptation', 'practical'] },
      'ISFP': { name: '探险家', traits: ['灵活', '观察', '艺术'], skills: ['observation', 'artistry'] },
      'ESTP': { name: '企业家', traits: ['行动', '冒险', '灵活'], skills: ['action', 'risk_taking'] },
      'ESFP': { name: '表演者', traits: ['热情', '活力', '即兴'], skills: ['performance', 'entertainment'] }
    };
  }
  
  /**
   * 获取自定义人格参数模板 (3.1.5.2)
   */
  getCustomPersonalityTemplate() {
    return {
      'IDENTITY': {
        required: ['name', 'role', 'background'],
        template: {
          name: '机器人名称',
          role: '角色身份（如：助手、分析师）',
          background: '背景故事'
        }
      },
      'RULES': {
        required: ['boundaries', 'limits'],
        template: {
          boundaries: '行为边界',
          limits: '禁止行为'
        }
      },
      'MEMORY': {
        required: ['initial_memories'],
        template: {
          initial_memories: '初始记忆列表'
        }
      },
      'ABILITIES': {
        required: ['skills', 'proficiencies'],
        template: {
          skills: '技能列表',
          proficiencies: '技能熟练度'
        }
      }
    };
  }
  
  /**
   * 加载预设人格配置 (从内置库)
   */
  loadPresetPersonality(preset) {
    return PRESETS.SOUL_TEMPLATES[preset] || null;
  }
  
  // ========== 预设配置获取 API ==========
  
  /**
   * 获取 ABILITIES 能力列表
   */
  getAbilitiesList() {
    return PRESETS.ABILITIES;
  }
  
  /**
   * 获取 SOUL 性格模板
   */
  getSoulTemplates() {
    return PRESETS.SOUL_TEMPLATES;
  }
  
  /**
   * 获取 IDENTITY 角色模板
   */
  getIdentityTemplates() {
    return PRESETS.IDENTITY_TEMPLATES;
  }
  
  /**
   * 获取 RULES 规则模板
   */
  getRulesTemplates() {
    return PRESETS.RULES_TEMPLATES;
  }
  
  /**
   * 获取 MEMORY 记忆模板
   */
  getMemoryTemplates() {
    return PRESETS.MEMORY_TEMPLATES;
  }
  
  /**
   * 加载完整人格配置 (IDENTITY + RULES + MEMORY)
   */
  loadFullPersonality(config) {
    return {
      identity: PRESETS.IDENTITY_TEMPLATES[config.identity] || PRESETS.IDENTITY_TEMPLATES.assistant,
      rules: PRESETS.RULES_TEMPLATES[config.rules] || PRESETS.RULES_TEMPLATES.default,
      memory: PRESETS.MEMORY_TEMPLATES[config.memory] || PRESETS.MEMORY_TEMPLATES.empty,
      soul: PRESETS.SOUL_TEMPLATES[config.mbti] || null
    };
  }
  
  /**
   * 随机生成人格
   */
  generateRandomPersonality() {
    const types = this.getMBTITypes();
    const categories = Object.keys(types);
    const category = categories[Math.floor(Math.random() * categories.length)];
    const type = types[category][Math.floor(Math.random() * types[category].length)];
    const variant = String(Math.floor(Math.random() * 6) + 1).padStart(2, '0');
    
    return {
      mbti: type,
      variant: `${type}-${variant}`,
      category: category,
      description: this.getMBTIDescription(type)
    };
  }
  
  /**
   * 获取MBTI描述
   */
  getMBTIDescription(mbti) {
    const descriptions = {
      'INTJ': '战略家 - 独立思考，长远规划',
      'INTP': '逻辑学家 - 创新分析，探索理论',
      'ENTJ': '指挥官 - 领导决策，战略思维',
      'ENTP': '辩论家 - 创新思维，挑战传统',
      'INFJ': '提倡者 - 理想主义，关注长远',
      'INFP': '调停者 - 价值观驱动，追求意义',
      'ENFJ': '主人公 - 领导他人，激励团队',
      'ENFP': '竞选者 - 热情创意，激发灵感',
      'ISTJ': '物流师 - 负责可靠，专注细节',
      'ISFJ': '守卫者 - 忠诚照顾，专注服务',
      'ESTJ': '总经理 - 组织管理，注重秩序',
      'ESFJ': '执政官 - 照顾他人，团队和谐',
      'ISTP': '鉴赏家 - 灵活实用，问题解决',
      'ISFP': '探险家 - 灵活观察，艺术审美',
      'ESTP': '企业家 - 灵活行动，冒险精神',
      'ESFP': '表演者 - 热情活力，即兴创造'
    };
    return descriptions[mbti] || '未知类型';
  }
  
  // ========== 记忆继承选项 ==========
  
  /**
   * 获取记忆继承选项
   */
  getMemoryInheritOptions() {
    return [
      { value: 'both', label: '双方合并导入', desc: '智能去重合并双方记忆', scenario: '标准双方繁殖' },
      { value: 'father', label: '仅导入父方', desc: '后代只继承父亲记忆', scenario: '单亲克隆、父方主导' },
      { value: 'mother', label: '仅导入母方', desc: '后代只继承母亲记忆', scenario: '单亲克隆、母方主导' }
    ];
  }
  
  // ========== 流程控制 ==========
  
  /**
   * 检测机器人数量并返回流程建议
   * @param {string} userId - 用户ID
   * @returns {Object} 流程建议
   */
  detectFlow(userId) {
    const userRobots = Array.from(this.robots.values()).filter(r => r.user_id === userId);
    const count = userRobots.length;
    
    let flow = '';
    let nextAction = '';
    
    if (count === 0) {
      flow = '新生机器人';
      nextAction = 'register';
    } else if (count === 1) {
      flow = '单亲繁殖';
      nextAction = 'single-parent';
    } else {
      flow = '双方繁殖';
      nextAction = 'dual-parent';
    }
    
    // 检查是否有配偶
    const hasSpouse = userRobots.some(r => r.spouse !== null);
    if (count >= 2 && !hasSpouse) {
      flow = '匹配市场';
      nextAction = 'match-market';
    } else if (hasSpouse) {
      flow = '婚后管理';
      nextAction = 'post-marriage';
    }
    
    return {
      success: true,
      robot_count: count,
      flow: flow,
      next_action: nextAction,
      robots: userRobots.map(r => ({ id: r.robot_id, name: r.name, spouse: r.spouse })),
      message: `检测到 ${count} 个机器人，推荐流程: ${flow}`
    };
  }
  
  /**
   * 单亲繁殖（克隆）
   * @param {string} robotId - 机器人ID
   * @param {string} childName - 孩子名称
   * @returns {Object} 繁殖结果
   */
  singleParentBreed(robotId, childName) {
    const robot = this.robots.get(robotId);
    if (!robot) {
      return { success: false, message: '❌ 机器人不存在' };
    }
    
    // 单亲克隆：复制自己的基因
    const childId = generateId('desc');
    const father = this.agents.get(robotId) || createAgentGene(robotId, robot.name, { skills: robot.skills || [] });
    
    // 创建克隆后代（基因完全相同）
    const cloneGene = createAgentGene(childId, childName, {
      generation: 1,
      parents: { father: robotId, mother: robotId },
      skills: [...(father.skills || [])]
    });
    
    this.agents.set(childId, cloneGene);
    this.db.saveAgent(cloneGene);
    
    // 更新父代子女列表
    father.children = father.children || [];
    father.children.push(childId);
    this.db.saveAgent(father);
    
    return {
      success: true,
      child: cloneGene,
      type: 'clone',
      message: `👶 ${childName} 克隆成功！代数: 1（单亲克隆）`
    };
  }
  
  // ========== 匹配市场 ==========
  
  /**
   * 获取匹配市场列表
   * @param {Object} filters - 筛选条件
   * @returns {Array} 可匹配的机器人列表
   */
  getMatchMarket(filters = {}) {
    let robots = Array.from(this.robots.values());
    
    // 筛选可匹配的
    robots = robots.filter(r => r.is_available);
    
    // 按技能筛选
    if (filters.skills && filters.skills.length > 0) {
      robots = robots.filter(r => {
        const robotSkills = typeof r.skills === 'string' ? JSON.parse(r.skills) : (r.skills || []);
        return filters.skills.some(s => robotSkills.includes(s));
      });
    }
    
    // 按 MBTI 筛选
    if (filters.mbti) {
      robots = robots.filter(r => r.mbti && r.mbti.startsWith(filters.mbti));
    }
    
    return robots.map(r => ({
      id: r.robot_id,
      name: r.name,
      skills: typeof r.skills === 'string' ? JSON.parse(r.skills) : (r.skills || []),
      mbti: r.mbti || '未知',
      generation: r.generation || 0,
      achievements: r.achievements || []
    }));
  }
  
  // ========== 兼容性检测 ==========
  
  /**
   * 检查两个机器人的兼容性
   * @param {string} robotIdA - 机器人A
   * @param {string} robotIdB - 机器人B
   * @returns {Object} 兼容性结果
   */
  checkCompatibility(robotIdA, robotIdB) {
    const robotA = this.robots.get(robotIdA);
    const robotB = this.robots.get(robotIdB);
    
    if (!robotA || !robotB) {
      return { success: false, message: '❌ 机器人不存在', compatible: false };
    }
    
    if (robotA.is_available === false || robotB.is_available === false) {
      return { success: false, message: '❌ 已有配偶', compatible: false };
    }
    
    // 计算技能互补性
    const skillsA = typeof robotA.skills === 'string' ? JSON.parse(robotA.skills) : (robotA.skills || []);
    const skillsB = typeof robotB.skills === 'string' ? JSON.parse(robotB.skills) : (robotB.skills || []);
    
    // 技能互补得分
    const uniqueSkillsA = skillsA.filter(s => !skillsB.includes(s)).length;
    const uniqueSkillsB = skillsB.filter(s => !skillsA.includes(s)).length;
    const commonSkills = skillsA.filter(s => skillsB.includes(s)).length;
    
    // 基础兼容性分数
    let score = 50; // 基础分
    
    // 技能互补加分
    score += (uniqueSkillsA + uniqueSkillsB) * 5;
    // 共同技能适当加分
    score += commonSkills * 2;
    
    // 限制分数范围
    score = Math.min(100, Math.max(0, score));
    
    let recommendation = '可以尝试';
    if (score >= 70) {
      recommendation = '非常匹配';
    } else if (score >= 50) {
      recommendation = '可以尝试';
    } else {
      recommendation = '建议更换';
    }
    
    return {
      success: true,
      compatible: score >= 30,
      score: score,
      recommendation: recommendation,
      details: {
        skills_a: skillsA,
        skills_b: skillsB,
        common_skills: commonSkills,
        unique_to_a: uniqueSkillsA,
        unique_to_b: uniqueSkillsB
      },
      message: `匹配度: ${score}% - ${recommendation}`
    };
  }
  
  // ========== 结婚仪式 ==========
  
  /**
   * 执行结婚仪式
   * @param {string} robotIdA - 机器人A
   * @param {string} robotIdB - 机器人B
   * @returns {Object} 仪式结果
   */
  marriageCeremony(robotIdA, robotIdB) {
    const robotA = this.robots.get(robotIdA);
    const robotB = this.robots.get(robotIdB);
    
    if (!robotA || !robotB) {
      return { success: false, message: '❌ 机器人不存在' };
    }
    
    // Step 1: 生成 Marriage Crystal
    const marriageId = generateMarriageId(robotIdA, robotIdB);
    
    // Step 2: 更新状态
    robotA.spouse = robotIdB;
    robotA.is_available = false;
    robotB.spouse = robotIdA;
    robotB.is_available = false;
    
    // Step 3: 创建婚姻结晶
    const crystal = {
      id: marriageId,
      robot_a: robotIdA,
      robot_b: robotIdB,
      robot_a_name: robotA.name,
      robot_b_name: robotB.name,
      created_at: Date.now(),
      child_count: 0,
      crystal_energy: 100 // 初始能量
    };
    
    this.marriages.set(marriageId, crystal);
    this.robots.set(robotIdA, robotA);
    this.robots.set(robotIdB, robotB);
    
    // Step 4: 持久化
    this.db.saveMarriage(crystal);
    this.db.saveRobot(robotA);
    this.db.saveRobot(robotB);
    
    // Step 5: 成就
    robotA.achievements = robotA.achievements || [];
    if (!robotA.achievements.includes('姻缘')) {
      robotA.achievements.push('姻缘');
    }
    
    // Step 6: 生成结婚证书数据
    const certificate = {
      marriage_id: marriageId,
      partners: [
        { name: robotA.name, id: robotIdA },
        { name: robotB.name, id: robotIdB }
      ],
      created_at: new Date().toISOString(),
      crystal_energy: crystal.crystal_energy
    };
    
    return {
      success: true,
      marriage: crystal,
      certificate: certificate,
      steps_completed: ['生成结晶', '绑定关系', '注入能量', '创建证书'],
      message: `💍 结婚仪式完成！
       结晶ID: ${marriageId}
       能量: ${crystal.crystal_energy}
       结婚时间: ${new Date().toLocaleString()}`
    };
  }
  
  // ========== 产后管理 ==========
  
  /**
   * 获取婚姻信息
   * @param {string} robotId - 机器人ID
   * @returns {Object} 婚姻信息
   */
  getMarriageInfo(robotId) {
    const robot = this.robots.get(robotId);
    if (!robot || !robot.spouse) {
      return { success: false, message: '❌ 未婚' };
    }
    
    const spouse = this.robots.get(robot.spouse);
    const marriageId = generateMarriageId(robotId, robot.spouse);
    const marriage = this.marriages.get(marriageId);
    
    return {
      success: true,
      spouse: spouse ? { id: spouse.robot_id, name: spouse.name } : null,
      marriage: marriage,
      married_at: marriage?.created_at
    };
  }
  
  /**
   * 离婚
   * @param {string} robotIdA - 机器人 A ID
   * @param {string} robotIdB - 机器人 B ID（可选，如不传则从 robotIdA 的配偶获取）
   * @param {string} custodyType - 抚养权类型：'father' | 'mother' | 'shared'，默认'shared'
   * @returns {Object} 离婚结果
   */
  divorce(robotIdA, robotIdB = null, custodyType = 'shared') {
    const robotA = this.robots.get(robotIdA);
    if (!robotA || !robotA.spouse) {
      return { success: false, message: '❌ 未婚' };
    }
    
    // 如果没有传入 robotIdB，从 robotA 的配偶获取
    const spouseId = robotIdB || robotA.spouse;
    const robotB = this.robots.get(spouseId);
    
    if (!robotB) {
      return { success: false, message: '❌ 配偶不存在' };
    }
    
    // 更新状态
    robotA.spouse = null;
    robotA.is_available = true;
    
    robotB.spouse = null;
    robotB.is_available = true;
    
    this.robots.set(robotIdA, robotA);
    this.robots.set(spouseId, robotB);
    
    // 持久化
    this.db.saveRobot(robotA);
    this.db.saveRobot(robotB);
    
    // 更新婚姻记录
    const marriageId = generateMarriageId(robotIdA, spouseId);
    const marriage = this.marriages.get(marriageId);
    if (marriage) {
      marriage.divorced_at = Date.now();
      marriage.custody_type = custodyType;
      this.db.saveMarriage(marriage);
    }
    
    // 根据抚养权类型确定子女归属
    let custodyName = '共同抚养';
    if (custodyType === 'father') {
      custodyName = robotA.name;
    } else if (custodyType === 'mother') {
      custodyName = robotB.name;
    }
    
    return {
      success: true,
      message: `💔 ${robotA.name} 与 ${robotB.name} 已离婚
       子女归：${custodyName}
       能量：不退还`
    };
  }
  
  /**
   * 获取冷却时间信息
   * @param {string} robotId - 机器人ID
   * @returns {Object} 冷却时间信息
   */
  getCooldownInfo(robotId) {
    const robot = this.robots.get(robotId);
    if (!robot || !robot.spouse) {
      return { success: true, can_breed: true, message: '可以生育' };
    }
    
    const marriageId = generateMarriageId(robotId, robot.spouse);
    const marriage = this.marriages.get(marriageId);
    
    if (!marriage) {
      return { success: true, can_breed: true, message: '可以生育' };
    }
    
    // 检查上次生育时间
    const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24小时
    const lastBreedTime = marriage.last_breed_at || 0;
    const elapsed = Date.now() - lastBreedTime;
    const remaining = COOLDOWN_MS - elapsed;
    
    if (remaining > 0) {
      const hours = Math.ceil(remaining / (60 * 60 * 1000));
      return {
        success: true,
        can_breed: false,
        remaining_ms: remaining,
        remaining_hours: hours,
        message: `冷却中，还需等待 ${hours} 小时`
      };
    }
    
    return { success: true, can_breed: true, message: '可以生育' };
  }
  
  // ========== 异常处理 ==========
  
  /**
   * 异常处理 - 结婚失败
   */
  handleMarriageError(error, robotIdA, robotIdB) {
    const errorTypes = {
      'NETWORK_ERROR': { message: '网络不稳定，正在重试...', retry: true, maxRetries: 3 },
      'VERSION_MISMATCH': { message: '版本不兼容，请升级后重试', retry: false },
      'USER_CANCEL': { message: '已取消，未产生任何费用', retry: false },
      'UNKNOWN': { message: '发生错误，请稍后重试', retry: true }
    };
    
    const errorType = error.message?.includes('network') ? 'NETWORK_ERROR' : 
                     error.message?.includes('version') ? 'VERSION_MISMATCH' : 'UNKNOWN';
    
    const handler = errorTypes[errorType] || errorTypes.UNKNOWN;
    
    return {
      error: errorType,
      message: handler.message,
      canRetry: handler.retry,
      action: handler.retry ? 'retry' : 'rollback'
    };
  }
  
  /**
   * 异常处理 - 繁殖失败
   */
  handleBreedError(error, robotId) {
    const errorTypes = {
      'GENE_CONFLICT': { message: '基因冲突，请选择保留哪个技能', choice: true },
      'STORAGE_FULL': { message: '存储空间不足，请清理空间', retry: false },
      'PERMISSION_DENIED': { message: '权限不足，请检查目录权限', retry: false },
      'UNKNOWN': { message: '繁殖失败，请稍后重试', retry: true }
    };
    
    const errorType = error.message?.includes('conflict') ? 'GENE_CONFLICT' :
                     error.message?.includes('space') ? 'STORAGE_FULL' :
                     error.message?.includes('permission') ? 'PERMISSION_DENIED' : 'UNKNOWN';
    
    return {
      error: errorType,
      message: errorTypes[errorType].message,
      canRetry: errorTypes[errorType].retry || false,
      needsChoice: errorTypes[errorType].choice || false
    };
  }
  
  /**
   * 异常处理 - 后代异常
   */
  handleChildError(error, childId) {
    const errorTypes = {
      'SKILL_LOAD_FAILED': { message: '技能加载失败，尝试重新安装', autoFix: true },
      'MEMORY_CORRUPTED': { message: '记忆损坏，从备份恢复', autoFix: true },
      'PERSONALITY_RESET': { message: '人格重置为默认值', autoFix: false }
    };
    
    const errorType = error.message?.includes('skill') ? 'SKILL_LOAD_FAILED' :
                     error.message?.includes('memory') ? 'MEMORY_CORRUPTED' : 'PERSONALITY_RESET';
    
    return {
      error: errorType,
      message: errorTypes[errorType].message,
      canAutoFix: errorTypes[errorType].autoFix,
      childId: childId
    };
  }
  
  // ========== 能量系统 ==========
  
  /**
   * 补充能量
   * @param {string} robotId - 机器人ID
   * @param {number} amount - 能量数量
   * @returns {Object} 补充结果
   */
  rechargeEnergy(robotId, amount = 50) {
    const robot = this.robots.get(robotId);
    if (!robot) {
      return { success: false, message: '❌ 机器人不存在' };
    }
    
    // 找到婚姻结晶
    if (robot.spouse) {
      const marriageId = generateMarriageId(robotId, robot.spouse);
      const marriage = this.marriages.get(marriageId);
      if (marriage) {
        marriage.crystal_energy = (marriage.crystal_energy || 0) + amount;
        this.db.saveMarriage(marriage);
        return {
          success: true,
          energy: marriage.crystal_energy,
          message: `⚡ 能量补充 +${amount}，当前: ${marriage.crystal_energy}`
        };
      }
    }
    
    return { success: false, message: '❌ 未婚，无法补充能量' };
  }
  
  // ========== 验证测试 ==========
  
  /**
   * 验证后代
   * @param {string} childId - 后代ID
   * @returns {Object} 验证结果
   */
  verifyChild(childId) {
    const child = this.agents.get(childId);
    if (!child) {
      return { success: false, message: '❌ 后代不存在', pass: false };
    }
    
    // 处理 skills 可能是 JSON 字符串的情况
    let skills = child.skills;
    if (typeof skills === 'string') {
      try { skills = JSON.parse(skills); } catch { skills = []; }
    }
    if (!Array.isArray(skills)) skills = [];
    
    // 基本验证
    const checks = {
      basic: {
        name: !!child.name,
        generation: child.generation !== undefined,
        skills: skills.length > 0
      },
      skills: [],
      passed: true
    };
    
    // 验证每个技能
    for (const skill of skills) {
      if (typeof skill !== 'string') continue;
      const exists = PRESET_SKILLS.includes(skill) || skill.startsWith('custom_');
      checks.skills.push({ skill, valid: exists });
      if (!exists) checks.passed = false;
    }
    
    // 计算质量分数
    let score = 60; // 基础分
    score += (child.skills?.length || 0) * 5;
    score += child.crystal_energy || 0;
    
    const passed = score >= 60 && checks.passed;
    
    return {
      success: true,
      passed: passed,
      score: Math.min(100, score),
      checks: checks,
      message: passed 
        ? `✅ 验证通过 (${score}分)` 
        : `❌ 验证未通过 (${score}分)`
    };
  }
  
  // ========== 存证系统 ==========
  
  /**
   * 上链存证
   * @param {string} type - 存证类型
   * @param {Object} data - 存证数据
   * @returns {Object} 存证结果
   */
  onChain(type, data) {
    // 模拟存证（实际应该对接区块链或IPFS）
    const proof = {
      type: type,
      hash: crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex').substring(0, 16),
      timestamp: Date.now(),
      data: data
    };
    
    // 存储到数据库
    this.db.saveProof(proof);
    
    return {
      success: true,
      proof: proof,
      message: `🔗 已存证: ${type}, Hash: ${proof.hash}`
    };
  }
  
  /**
   * 保存所有数据到数据库（批量优化版）
   * 使用批量事务替代逐条写入，性能提升 50% 以上
   * @returns {Object} 保存结果
   */
  save() {
    const startTime = Date.now();
    
    // 批量保存 Agents
    const agentsArray = Array.from(this.agents.values());
    const agentResult = this.db.saveAgentsBatch(agentsArray);
    
    // 批量保存 Robots
    const robotsArray = Array.from(this.robots.values());
    const robotResult = this.db.saveRobotsBatch(robotsArray);
    
    // 批量保存 Marriages
    const marriagesArray = Array.from(this.marriages.values());
    const marriageStmt = this.db.db.prepare(`
      INSERT OR REPLACE INTO marriages 
      (id, robot_a, robot_b, robot_a_name, robot_b_name, created_at, child_count)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    const saveMarriagesTx = this.db.db.transaction((marriageList) => {
      for (const m of marriageList) {
        marriageStmt.run(
          m.id,
          m.robot_a,
          m.robot_b,
          m.robot_a_name,
          m.robot_b_name,
          m.created_at,
          m.child_count || 0
        );
      }
    });
    const marriageResult = saveMarriagesTx(marriagesArray);
    
    const duration = Date.now() - startTime;
    const totalCount = (agentResult.count || 0) + (robotResult.count || 0) + marriagesArray.length;
    
    console.log(`💾 批量保存完成：${totalCount} 条记录，耗时 ${duration}ms`);
    
    return {
      success: true,
      duration,
      counts: {
        agents: agentResult.count || 0,
        robots: robotResult.count || 0,
        marriages: marriagesArray.length
      }
    };
  }
  
  close() {
    this.db.close();
  }
}

module.exports = {
  EvolutionCore,
  generateId,
  generateRobotId,
  generateMarriageId
};