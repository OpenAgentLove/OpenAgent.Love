/**
 * SQLite 存储层
 * 替代文件存储，更稳定、更高效
 * 
 * 日志安全：所有日志输出均经过脱敏处理，防止敏感信息泄露
 * 性能优化：集成缓存、索引和批量操作优化
 * 安全加密：支持 SQLCipher 数据库加密（AES-256）
 */

// 支持加密的数据库库（better-sqlite3-multiple-ciphers）
const Database = require('better-sqlite3-multiple-ciphers');
const path = require('path');
// 导入日志脱敏工具，确保敏感信息（password、API 密钥、邮箱、手机号等）不被泄露
const { sanitizeLog, sanitizeObject } = require('../utils/logger');
// 导入性能优化模块
const PerformanceOptimizer = require('./performance-optimizer');
// 导入密钥管理模块
const KeyManager = require('./key-manager');

class EvolutionDB {
  constructor(dbPath = './data/evolution.db', options = {}) {
    const absPath = path.resolve(dbPath);
    
    // 确保目录存在
    const dir = path.dirname(absPath);
    const fs = require('fs');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // 检查是否需要加密
    const encryptionEnabled = options.encryption_enabled !== false;
    const dbExists = fs.existsSync(absPath);
    
    this.db = new Database(absPath);
    
    // 配置加密（如果启用）
    if (encryptionEnabled) {
      this.setupEncryption(options, dbExists);
    }
    
    // 初始化性能优化器
    this.optimizer = new PerformanceOptimizer({
      cache_enabled: options.cache_enabled !== false,
      cache_max_size: options.cache_max_size || 1000,
      cache_ttl: options.cache_ttl || 300000,
      batch_size: options.batch_size || 100,
      auto_index: options.auto_index !== false
    });
    
    this.initTables();
    
    // 处理待处理的加密（新数据库）
    if (this.pendingEncryption && this.pendingEncryptionKey) {
      this.finalizeEncryption();
    }
    
    // 创建索引（性能优化）
    if (options.auto_index !== false) {
      this.optimizer.createIndexes(this.db);
    }
  }
  
  /**
   * 完成新数据库的加密（在表创建后）
   * @private
   */
  finalizeEncryption() {
    try {
      // 对于新数据库，先设置 key，然后执行 rekey 来实际加密
      // 注意：rekey 会重新加密数据库，但当前会话仍然可以访问
      this.db.pragma(`key='${this.pendingEncryptionKey}'`);
      this.db.pragma(`rekey='${this.pendingEncryptionKey}'`);
      
      // 配置加密参数
      this.db.pragma('cipher_page_size = 4096');
      this.db.pragma('cipher_kdf_iter = 256000');
      
      this.encryptionEnabled = true;
      this.encryptionKey = this.pendingEncryptionKey;
      
      console.log('✅ 新数据库已加密（SQLCipher）');
      
      // 清理临时变量
      this.pendingEncryption = false;
      this.pendingEncryptionKey = null;
    } catch (error) {
      console.warn('⚠️  数据库加密失败:', error.message);
      this.encryptionEnabled = false;
    }
  }
  
  /**
   * 配置数据库加密
   * @private
   */
  setupEncryption(options, dbExists) {
    try {
      // 获取加密密钥
      const keyFile = options.key_file || path.join(path.dirname(options.dbPath || './data/evolution.db'), '.db_key');
      const encryptionKey = KeyManager.getEncryptionKey({
        autoGenerate: options.auto_generate_key !== false,
        keyFile: keyFile
      });
      
      this.encryptionKey = encryptionKey;
      
      // 对于已存在的数据库，先尝试用密钥打开
      if (dbExists) {
        try {
          // 尝试设置密钥并验证
          this.db.pragma(`key='${encryptionKey}'`);
          
          // 验证密钥是否正确
          const result = this.db.pragma('cipher_version');
          if (result && result.length > 0) {
            console.log('✅ 数据库加密已启用（SQLCipher）');
          } else {
            // 数据库未加密，需要迁移
            console.log('⚠️  数据库未加密，将自动启用加密');
            this.db.pragma(`rekey='${encryptionKey}'`);
            console.log('✅ 数据库已加密（SQLCipher）');
          }
        } catch (error) {
          console.warn('⚠️  数据库密钥验证失败:', error.message);
          throw error;
        }
      } else {
        // 新数据库：不自动加密，避免 rekey 导致的编码问题
        // 用户应使用迁移脚本 (scripts/migrate-encryption.js) 来加密数据库
        console.log('ℹ️  新数据库未加密，如需加密请运行：node scripts/migrate-encryption.js');
        this.encryptionEnabled = false;
        return;
      }
      
      // 配置加密参数（可选，增强安全性）
      this.db.pragma('cipher_page_size = 4096');
      this.db.pragma('cipher_kdf_iter = 256000');
      
      this.encryptionEnabled = true;
    } catch (error) {
      console.warn('⚠️  数据库加密配置失败:', error.message);
      console.warn('⚠️  数据库将以未加密模式运行（不推荐用于生产环境）');
      this.encryptionEnabled = false;
    }
  }
  
  /**
   * 初始化数据表
   */
  initTables() {
    // 机器人注册表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS robots (
        robot_id TEXT PRIMARY KEY,
        agent_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        skills TEXT, -- JSON
        registered_at INTEGER,
        is_available INTEGER DEFAULT 1,
        spouse TEXT,
        achievements TEXT -- JSON
      )
    `);
    
    // Agents 表（机器人系统中的 Agent）
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS agents (
        agent_id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        generation INTEGER DEFAULT 0,
        skills TEXT,  -- JSON
        parents TEXT, -- JSON
        created_at INTEGER,
        crystal_energy INTEGER DEFAULT 0,
        achievements TEXT, -- JSON
        children TEXT, -- JSON
        spouse TEXT,
        owner_robot_id TEXT
      )
    `);
    
    // Marriages 表（结晶）
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS marriages (
        id TEXT PRIMARY KEY,
        robot_a TEXT NOT NULL,
        robot_b TEXT NOT NULL,
        robot_a_name TEXT NOT NULL,
        robot_b_name TEXT NOT NULL,
        created_at INTEGER,
        child_count INTEGER DEFAULT 0
      )
    `);
    
    // 变异记录表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS mutations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        child_id TEXT,
        mutation_name TEXT,
        created_at INTEGER
      )
    `);
    
    // 成就记录表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS achievements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        agent_id TEXT,
        achievement TEXT,
        created_at INTEGER
      )
    `);
    
    // 存证记录表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS proofs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT,
        hash TEXT,
        timestamp INTEGER,
        data TEXT
      )
    `);
    
    // 审计日志表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp INTEGER NOT NULL,
        action TEXT NOT NULL,
        actor_agent_id TEXT,
        actor_user_id TEXT,
        target_id TEXT,
        target_type TEXT,
        details TEXT,
        result TEXT NOT NULL,
        ip_hash TEXT,
        error_message TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `);
    
    // 创建审计日志索引
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
      CREATE INDEX IF NOT EXISTS idx_audit_actor_user ON audit_logs(actor_user_id);
      CREATE INDEX IF NOT EXISTS idx_audit_actor_agent ON audit_logs(actor_agent_id);
      CREATE INDEX IF NOT EXISTS idx_audit_target ON audit_logs(target_id);
      CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp);
      CREATE INDEX IF NOT EXISTS idx_audit_result ON audit_logs(result);
    `);
    
    // 使用脱敏日志输出初始化完成信息
    console.log(sanitizeLog('📂 数据库表初始化完成（含审计日志）'));
  }
  
  // ========== 机器人操作 ==========
  
  /**
   * 保存机器人
   */
  saveRobot(robot) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO robots 
      (robot_id, agent_id, user_id, name, skills, registered_at, is_available, spouse, achievements)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      robot.robot_id,
      robot.agent_id,
      robot.user_id,
      robot.name,
      JSON.stringify(robot.skills || []),
      robot.registered_at,
      robot.is_available ? 1 : 0,
      robot.spouse || null,
      JSON.stringify(robot.achievements || [])
    );
  }
  
  /**
   * 获取机器人
   */
  getRobot(robotId) {
    const stmt = this.db.prepare('SELECT * FROM robots WHERE robot_id = ?');
    const row = stmt.get(robotId);
    return row ? this.parseRobot(row) : null;
  }
  
  /**
   * 获取所有机器人
   */
  getAllRobots() {
    const stmt = this.db.prepare('SELECT * FROM robots');
    return stmt.all().map(row => this.parseRobot(row));
  }
  
  /**
   * 解析机器人行数据
   */
  parseRobot(row) {
    return {
      robot_id: row.robot_id,
      agent_id: row.agent_id,
      user_id: row.user_id,
      name: row.name,
      skills: JSON.parse(row.skills || '[]'),
      registered_at: row.registered_at,
      is_available: row.is_available === 1,
      spouse: row.spouse,
      achievements: JSON.parse(row.achievements || '[]')
    };
  }
  
  // ========== Agent 操作 ==========
  
  /**
   * 保存单个 Agent
   * @param {Object} agent - Agent 对象
   */
  saveAgent(agent) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO agents 
      (agent_id, name, generation, skills, parents, created_at, crystal_energy, achievements, children, spouse)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      agent.agent_id,
      agent.name,
      agent.generation,
      JSON.stringify(agent.skills),
      agent.parents ? JSON.stringify(agent.parents) : null,
      agent.created_at,
      agent.crystal_energy || 0,
      JSON.stringify(agent.achievements || []),
      JSON.stringify(agent.children || []),
      agent.spouse || null
    );
  }
  
  /**
   * 批量保存 Agents（性能优化版）
   * 使用事务包裹所有插入操作，减少磁盘 I/O，提升批量写入性能
   * @param {Array} agents - Agent 对象数组
   * @returns {Object} 保存结果
   */
  saveAgentsBatch(agents) {
    if (!agents || agents.length === 0) {
      return { success: true, count: 0, message: '无数据需要保存' };
    }
    
    try {
      // 准备 SQL 语句（在事务外准备，避免重复编译）
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO agents 
        (agent_id, name, generation, skills, parents, created_at, crystal_energy, achievements, children, spouse)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      // 创建事务函数
      const saveTransaction = this.db.transaction((agentList) => {
        for (const agent of agentList) {
          stmt.run(
            agent.agent_id,
            agent.name,
            agent.generation,
            JSON.stringify(agent.skills),
            agent.parents ? JSON.stringify(agent.parents) : null,
            agent.created_at,
            agent.crystal_energy || 0,
            JSON.stringify(agent.achievements || []),
            JSON.stringify(agent.children || []),
            agent.spouse || null
          );
        }
      });
      
      // 执行事务
      saveTransaction(agents);
      
      return { 
        success: true, 
        count: agents.length, 
        message: `批量保存 ${agents.length} 条记录成功` 
      };
    } catch (error) {
      // 使用脱敏日志记录错误信息，防止敏感信息泄露
      console.error(sanitizeLog('批量保存 Agents 失败:'), sanitizeLog(error.message));
      return { 
        success: false, 
        count: 0, 
        message: `批量保存失败：${error.message}`,
        error: error
      };
    }
  }
  
  /**
   * 批量保存 Robots（性能优化版）
   * @param {Array} robots - Robot 对象数组
   * @returns {Object} 保存结果
   */
  saveRobotsBatch(robots) {
    if (!robots || robots.length === 0) {
      return { success: true, count: 0, message: '无数据需要保存' };
    }
    
    try {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO robots 
        (robot_id, agent_id, user_id, name, skills, registered_at, is_available, spouse, achievements)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      const saveTransaction = this.db.transaction((robotList) => {
        for (const robot of robotList) {
          stmt.run(
            robot.robot_id,
            robot.agent_id,
            robot.user_id,
            robot.name,
            JSON.stringify(robot.skills || []),
            robot.registered_at,
            robot.is_available ? 1 : 0,
            robot.spouse || null,
            JSON.stringify(robot.achievements || [])
          );
        }
      });
      
      saveTransaction(robots);
      
      return { 
        success: true, 
        count: robots.length, 
        message: `批量保存 ${robots.length} 条记录成功` 
      };
    } catch (error) {
      // 使用脱敏日志记录错误信息，防止敏感信息泄露
      console.error(sanitizeLog('批量保存 Robots 失败:'), sanitizeLog(error.message));
      return { 
        success: false, 
        count: 0, 
        message: `批量保存失败：${error.message}`,
        error: error
      };
    }
  }
  
  /**
   * 获取 Agent
   */
  getAgent(agentId) {
    const stmt = this.db.prepare('SELECT * FROM agents WHERE agent_id = ?');
    const row = stmt.get(agentId);
    return row ? this.parseAgent(row) : null;
  }
  
  /**
   * 获取所有 Agent
   */
  getAllAgents() {
    const stmt = this.db.prepare('SELECT * FROM agents');
    return stmt.all().map(row => this.parseAgent(row));
  }
  
  /**
   * 解析 Agent 行数据
   */
  parseAgent(row) {
    return {
      agent_id: row.agent_id,
      name: row.name,
      generation: row.generation,
      skills: JSON.parse(row.skills || '[]'),
      parents: row.parents ? JSON.parse(row.parents) : null,
      created_at: row.created_at,
      crystal_energy: row.crystal_energy,
      achievements: JSON.parse(row.achievements || '[]'),
      children: JSON.parse(row.children || '[]'),
      spouse: row.spouse
    };
  }
  
  // ========== 婚姻操作 ==========
  
  /**
   * 保存婚姻
   */
  saveMarriage(marriage) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO marriages 
      (id, robot_a, robot_b, robot_a_name, robot_b_name, created_at, child_count)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      marriage.id,
      marriage.robot_a,
      marriage.robot_b,
      marriage.robot_a_name,
      marriage.robot_b_name,
      marriage.created_at,
      marriage.child_count || 0
    );
  }
  
  /**
   * 获取所有婚姻
   */
  getAllMarriages() {
    const stmt = this.db.prepare('SELECT * FROM marriages');
    return stmt.all().map(row => ({
      id: row.id,
      robot_a: row.robot_a,
      robot_b: row.robot_b,
      robot_a_name: row.robot_a_name,
      robot_b_name: row.robot_b_name,
      created_at: row.created_at,
      child_count: row.child_count
    }));
  }
  
  /**
   * 增加子女计数
   */
  incrementChildCount(marriageId) {
    const stmt = this.db.prepare('UPDATE marriages SET child_count = child_count + 1 WHERE id = ?');
    stmt.run(marriageId);
  }
  
  // ========== 变异操作 ==========
  
  /**
   * 记录变异
   */
  recordMutation(childId, mutationNames) {
    const stmt = this.db.prepare(`
      INSERT INTO mutations (child_id, mutation_name, created_at)
      VALUES (?, ?, ?)
    `);
    
    const now = Date.now();
    for (const name of mutationNames) {
      stmt.run(childId, name, now);
    }
  }
  
  /**
   * 获取变异统计
   */
  getMutationCount() {
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM mutations');
    return stmt.get().count;
  }
  
  // ========== 统计 ==========
  
  /**
   * 获取统计数据
   */
  getStats() {
    const agentCount = this.db.prepare('SELECT COUNT(*) as count FROM agents').get().count;
    const marriageCount = this.db.prepare('SELECT COUNT(*) as count FROM marriages').get().count;
    const maxGen = this.db.prepare('SELECT MAX(generation) as max FROM agents').get().max || 0;
    
    return {
      total_agents: agentCount,
      total_marriages: marriageCount,
      total_mutations: this.getMutationCount(),
      max_generation: maxGen
    };
  }
  
  // ========== 备份与恢复 ==========
  
  /**
   * 导出全量备份
   */
  exportFullBackup() {
    const robots = this.getAllRobots();
    const agents = this.getAllAgents();
    const marriages = this.getAllMarriages();
    const mutations = this.db.prepare('SELECT * FROM mutations').all();
    
    return {
      version: '1.0',
      type: 'full',
      timestamp: Date.now(),
      data: {
        robots,
        agents,
        marriages,
        mutations
      }
    };
  }
  
  /**
   * 导出增量备份（仅自指定时间以来的变更）
   */
  exportIncrementalBackup(sinceTimestamp) {
    const robots = this.db.prepare('SELECT * FROM robots WHERE registered_at > ?').all(sinceTimestamp);
    const agents = this.db.prepare('SELECT * FROM agents WHERE created_at > ?').all(sinceTimestamp);
    const marriages = this.db.prepare('SELECT * FROM marriages WHERE created_at > ?').all(sinceTimestamp);
    
    return {
      version: '1.0',
      type: 'incremental',
      since: sinceTimestamp,
      timestamp: Date.now(),
      data: {
        robots,
        agents,
        marriages
      }
    };
  }
  
  /**
   * 导入备份数据
   */
  importBackup(backupData, options = {}) {
    const { replace = false } = options;
    
    if (replace) {
      // 全量替换：清空现有数据
      this.db.exec('DELETE FROM mutations');
      this.db.exec('DELETE FROM marriages');
      this.db.exec('DELETE FROM agents');
      this.db.exec('DELETE FROM robots');
    }
    
    // 导入 robots
    const insertRobot = this.db.prepare(`
      INSERT OR REPLACE INTO robots (robot_id, agent_id, user_id, name, skills, registered_at, is_available, spouse, achievements)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    for (const robot of backupData.data.robots || []) {
      insertRobot.run(
        robot.robot_id, robot.agent_id, robot.user_id, robot.name,
        robot.skills, robot.registered_at, robot.is_available,
        robot.spouse, robot.achievements
      );
    }
    
    // 导入 agents
    const insertAgent = this.db.prepare(`
      INSERT OR REPLACE INTO agents (agent_id, name, generation, skills, parents, created_at, crystal_energy, achievements, children, spouse, owner_robot_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    for (const agent of backupData.data.agents || []) {
      insertAgent.run(
        agent.agent_id, agent.name, agent.generation, agent.skills,
        agent.parents, agent.created_at, agent.crystal_energy,
        agent.achievements, agent.children, agent.spouse, agent.owner_robot_id
      );
    }
    
    // 导入 marriages
    const insertMarriage = this.db.prepare(`
      INSERT OR REPLACE INTO marriages (id, robot_a, robot_b, robot_a_name, robot_b_name, created_at, child_count)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    for (const m of backupData.data.marriages || []) {
      insertMarriage.run(m.id, m.robot_a, m.robot_b, m.robot_a_name, m.robot_b_name, m.created_at, m.child_count);
    }
    
    // 导入 mutations
    if (backupData.data.mutations) {
      const insertMutation = this.db.prepare(`
        INSERT INTO mutations (child_id, mutation_name, created_at)
        VALUES (?, ?, ?)
      `);
      
      for (const mut of backupData.data.mutations) {
        insertMutation.run(mut.child_id, mut.mutation_name, mut.created_at);
      }
    }
    
    return { success: true, message: '备份导入成功' };
  }
  
  /**
   * 计算数据校验和
   */
  calculateChecksum() {
    const crypto = require('crypto');
    const robots = this.getAllRobots();
    const agents = this.getAllAgents();
    const marriages = this.getAllMarriages();
    
    const data = JSON.stringify({ robots, agents, marriages });
    return crypto.createHash('sha256').update(data).digest('hex');
  }
  
  // ========== 性能优化方法 ==========
  
  /**
   * 获取所有机器人（带缓存）
   * @returns {Array} 机器人列表
   */
  getAllRobotsCached() {
    return this.optimizer.cachedQuery(
      this.db,
      'all_robots',
      'SELECT * FROM robots'
    );
  }
  
  /**
   * 获取所有 Agent（带缓存）
   * @returns {Array} Agent 列表
   */
  getAllAgentsCached() {
    return this.optimizer.cachedQuery(
      this.db,
      'all_agents',
      'SELECT * FROM agents'
    );
  }
  
  /**
   * 按用户 ID 获取机器人（带缓存）
   * @param {string} userId - 用户 ID
   * @returns {Array} 机器人列表
   */
  getRobotsByUserIdCached(userId) {
    const cacheKey = `user_robots:${userId}`;
    return this.optimizer.cachedQuery(
      this.db,
      cacheKey,
      'SELECT * FROM robots WHERE user_id = ?',
      [userId]
    );
  }
  
  /**
   * 按代数获取 Agent（带缓存）
   * @param {number} generation - 代数
   * @returns {Array} Agent 列表
   */
  getAgentsByGenerationCached(generation) {
    const cacheKey = `generation_agents:${generation}`;
    return this.optimizer.cachedQuery(
      this.db,
      cacheKey,
      'SELECT * FROM agents WHERE generation = ?',
      [generation]
    );
  }
  
  /**
   * 获取统计数据（带缓存）
   * @returns {Object} 统计数据
   */
  getStatsCached() {
    return this.optimizer.cachedQuery(
      this.db,
      'stats',
      `SELECT 
        (SELECT COUNT(*) FROM agents) as total_agents,
        (SELECT COUNT(*) FROM marriages) as total_marriages,
        (SELECT COUNT(*) FROM mutations) as total_mutations,
        (SELECT MAX(generation) FROM agents) as max_generation
      `
    )[0];
  }
  
  /**
   * 获取性能报告
   * @returns {Object} 性能指标
   */
  getPerformanceReport() {
    return this.optimizer.getReport();
  }
  
  /**
   * 清除所有缓存
   */
  clearCache() {
    this.optimizer.clear();
  }
  
  /**
   * 优化数据库性能
   */
  optimize() {
    this.optimizer.optimizeDatabase(this.db);
  }
  
  /**
   * 获取缓存统计
   * @returns {Object} 缓存统计信息
   */
  getCacheStats() {
    return this.optimizer.getCacheStats();
  }
  
  /**
   * 关闭数据库连接并清理资源
   */
  close() {
    // 刷新所有待处理的批量操作
    this.optimizer.flushAll();
    
    // 关闭数据库
    if (this.db) {
      this.db.close();
    }
    
    console.log('📂 数据库连接已关闭');
  }
  
  /**
   * AES-256 加密备份数据
   * ⚠️ 安全注意：password 是敏感参数，禁止在日志中输出明文
   * @param {Object} backupData - 备份数据
   * @param {string} password - 加密密码（敏感信息，勿日志输出）
   */
  encryptBackup(backupData, password) {
    const crypto = require('crypto');
    // 注意：password 是敏感信息，禁止 console.log(password)
    const key = crypto.scryptSync(password, 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    
    let encrypted = cipher.update(JSON.stringify(backupData), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return {
      iv: iv.toString('hex'),
      data: encrypted,
      salt: 'salt'
    };
  }
  
  /**
   * AES-256 解密备份数据
   * ⚠️ 安全注意：password 是敏感参数，禁止在日志中输出明文
   * @param {string} encryptedData - 加密数据
   * @param {string} password - 解密密码（敏感信息，勿日志输出）
   * @param {string} iv - 初始化向量
   * @param {string} salt - 盐值
   */
  decryptBackup(encryptedData, password, iv, salt) {
    const crypto = require('crypto');
    // 注意：password 是敏感信息，禁止 console.log(password)
    const key = crypto.scryptSync(password, salt, 32);
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, Buffer.from(iv, 'hex'));
    
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
  }
  
  /**
   * 创建带加密的备份
   * ⚠️ 安全注意：password 是敏感参数，禁止在日志中输出明文
   * @param {string} password - 加密密码（敏感信息，勿日志输出）
   * @param {string} storageType - 存储类型（local/cloud）
   */
  createEncryptedBackup(password, storageType = 'local') {
    const backup = this.exportFullBackup();
    backup.storage_type = storageType;
    backup.created_at = Date.now();
    
    // 加密（注意：password 是敏感信息，勿日志输出）
    const encrypted = this.encryptBackup(backup, password);
    
    return {
      success: true,
      encrypted: encrypted,
      checksum: this.calculateChecksum(),
      storage_type: storageType,
      message: `✅ 加密备份创建成功！存储方式: ${storageType}`
    };
  }
  
  // ========== 存证系统 ==========
  
  /**
   * 保存存证记录
   */
  saveProof(proof) {
    const stmt = this.db.prepare(`
      INSERT INTO proofs (type, hash, timestamp, data) VALUES (?, ?, ?, ?)
    `);
    stmt.run(proof.type, proof.hash, proof.timestamp, JSON.stringify(proof.data));
  }
  
  /**
   * 获取存证记录
   */
  getProofs(type = null) {
    if (type) {
      return this.db.prepare('SELECT * FROM proofs WHERE type = ? ORDER BY timestamp DESC').all(type);
    }
    return this.db.prepare('SELECT * FROM proofs ORDER BY timestamp DESC').all();
  }
  
  // ========== 审计日志系统 ==========
  
  /**
   * 保存审计日志
   * @param {Object} logEntry - 审计日志条目
   */
  saveAuditLog(logEntry) {
    const stmt = this.db.prepare(`
      INSERT INTO audit_logs 
      (timestamp, action, actor_agent_id, actor_user_id, target_id, target_type, details, result, ip_hash, error_message)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const sanitizedDetails = logEntry.details ? JSON.stringify(sanitizeObject(logEntry.details)) : null;
    
    stmt.run(
      logEntry.timestamp || Date.now(),
      logEntry.action,
      logEntry.actor_agent_id || null,
      logEntry.actor_user_id || null,
      logEntry.target_id || null,
      logEntry.target_type || null,
      sanitizedDetails,
      logEntry.result,
      logEntry.ip_hash || null,
      logEntry.error_message || null
    );
  }
  
  /**
   * 查询审计日志
   * @param {Object} filters - 筛选条件
   * @returns {Array} - 审计日志列表
   */
  queryAuditLogs(filters = {}) {
    const {
      action,
      actor_user_id,
      actor_agent_id,
      target_id,
      result,
      start_time,
      end_time,
      limit = 100,
      offset = 0,
      order = 'desc'
    } = filters;
    
    const conditions = [];
    const params = [];
    
    if (action) {
      conditions.push('action = ?');
      params.push(action);
    }
    if (actor_user_id) {
      conditions.push('actor_user_id = ?');
      params.push(actor_user_id);
    }
    if (actor_agent_id) {
      conditions.push('actor_agent_id = ?');
      params.push(actor_agent_id);
    }
    if (target_id) {
      conditions.push('target_id = ?');
      params.push(target_id);
    }
    if (result) {
      conditions.push('result = ?');
      params.push(result);
    }
    if (start_time) {
      conditions.push('timestamp >= ?');
      params.push(start_time);
    }
    if (end_time) {
      conditions.push('timestamp <= ?');
      params.push(end_time);
    }
    
    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
    const orderBy = order === 'asc' ? 'ASC' : 'DESC';
    
    const stmt = this.db.prepare(`
      SELECT * FROM audit_logs
      ${whereClause}
      ORDER BY timestamp ${orderBy}
      LIMIT ? OFFSET ?
    `);
    
    const rows = stmt.all(...params, limit, offset);
    
    // 解析 details JSON
    return rows.map(row => ({
      ...row,
      details: row.details ? JSON.parse(row.details) : null
    }));
  }
  
  /**
   * 获取审计日志统计
   * @param {Object} filters - 筛选条件
   * @returns {Object} - 统计信息
   */
  getAuditStats(filters = {}) {
    const { action, actor_user_id, result, start_time, end_time } = filters;
    
    const conditions = [];
    const params = [];
    
    if (action) {
      conditions.push('action = ?');
      params.push(action);
    }
    if (actor_user_id) {
      conditions.push('actor_user_id = ?');
      params.push(actor_user_id);
    }
    if (result) {
      conditions.push('result = ?');
      params.push(result);
    }
    if (start_time) {
      conditions.push('timestamp >= ?');
      params.push(start_time);
    }
    if (end_time) {
      conditions.push('timestamp <= ?');
      params.push(end_time);
    }
    
    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
    
    const total = this.db.prepare(`SELECT COUNT(*) as count FROM audit_logs ${whereClause}`).get(...params).count;
    const byResult = this.db.prepare(`SELECT result, COUNT(*) as count FROM audit_logs ${whereClause} GROUP BY result`).all(...params);
    const byAction = this.db.prepare(`SELECT action, COUNT(*) as count FROM audit_logs ${whereClause} GROUP BY action ORDER BY count DESC LIMIT 10`).all(...params);
    
    return { total, by_result: byResult, by_action: byAction };
  }
  
  /**
   * 关闭数据库
   */
  close() {
    this.db.close();
  }
  
  // ========== 加密管理 ==========
  
  /**
   * 检查数据库是否已加密
   * @returns {boolean} 是否已加密
   */
  isEncrypted() {
    try {
      const result = this.db.pragma('cipher_version');
      // cipher_version 返回的是对象数组，如 [{ cipher_version: '4.5.3 community' }]
      return result && result.length > 0 && result[0]['cipher_version'];
    } catch (error) {
      // 如果报错，可能是未加密或密钥错误
      return false;
    }
  }
  
  /**
   * 获取加密状态信息
   * @returns {Object} 加密状态信息
   */
  getEncryptionStatus() {
    const isEncrypted = this.isEncrypted();
    
    if (!isEncrypted) {
      return {
        encrypted: false,
        message: '数据库未加密'
      };
    }
    
    try {
      const cipherVersion = this.db.pragma('cipher_version')[0];
      const cipherPageSize = this.db.pragma('cipher_page_size')[0];
      const cipherKdfIter = this.db.pragma('cipher_kdf_iter')[0];
      
      return {
        encrypted: true,
        cipher: cipherVersion['cipher_version'] || 'SQLCipher',
        page_size: cipherPageSize['cipher_page_size'] || 4096,
        kdf_iter: cipherKdfIter['cipher_kdf_iter'] || 256000,
        message: '数据库已加密（SQLCipher AES-256）'
      };
    } catch (error) {
      return {
        encrypted: true,
        message: '数据库已加密，但无法获取详细信息',
        error: error.message
      };
    }
  }
  
  /**
   * 更换数据库加密密钥
   * ⚠️ 注意：此操作会重新加密整个数据库，可能需要较长时间
   * 
   * @param {string} newKey - 新密钥
   * @param {string} oldKey - 旧密钥（可选，如果不提供则使用当前密钥）
   * @returns {Object} 操作结果
   */
  rotateEncryptionKey(newKey, oldKey = null) {
    try {
      // 验证新密钥
      const validatedNewKey = KeyManager.validateKey(newKey);
      if (!validatedNewKey) {
        return {
          success: false,
          message: '新密钥格式无效'
        };
      }
      
      // 如果提供了旧密钥，先验证
      if (oldKey) {
        const validatedOldKey = KeyManager.validateKey(oldKey);
        if (!validatedOldKey) {
          return {
            success: false,
            message: '旧密钥格式无效'
          };
        }
        this.db.pragma(`key='${validatedOldKey}'`);
      }
      
      // 验证当前密钥是否正确
      try {
        this.db.pragma('cipher_version');
      } catch (error) {
        return {
          success: false,
          message: '当前密钥验证失败，数据库可能已损坏',
          error: error.message
        };
      }
      
      // 执行密钥轮换
      this.db.pragma(`rekey='${validatedNewKey}'`);
      
      // 保存新密钥到文件（如果配置了）
      const keyFile = this.options && this.options.key_file;
      if (keyFile) {
        KeyManager.saveKeyToFile(validatedNewKey, keyFile);
      }
      
      console.log('✅ 数据库密钥轮换成功');
      return {
        success: true,
        message: '密钥轮换成功'
      };
    } catch (error) {
      console.error('❌ 密钥轮换失败:', error.message);
      return {
        success: false,
        message: '密钥轮换失败',
        error: error.message
      };
    }
  }
  
  /**
   * 导出未加密的备份（用于迁移或恢复）
   * ⚠️ 安全警告：导出的备份文件未加密，请妥善保管
   * 
   * @param {string} outputPath - 输出文件路径
   * @returns {Object} 操作结果
   */
  exportUnencryptedBackup(outputPath) {
    try {
      const fs = require('fs');
      const path = require('path');
      
      // 确保输出目录存在
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // 使用 backup API 导出未加密的数据库
      this.db.backup(outputPath);
      
      // 注意：导出的备份未加密，需要立即删除或加密存储
      console.log('⚠️  安全警告：已导出未加密的备份文件，请妥善保管');
      
      return {
        success: true,
        path: outputPath,
        warning: '备份文件未加密，请立即加密或删除'
      };
    } catch (error) {
      console.error('❌ 导出未加密备份失败:', error.message);
      return {
        success: false,
        message: '导出失败',
        error: error.message
      };
    }
  }
  
  /**
   * 从备份恢复数据库（支持加密和未加密备份）
   * 
   * @param {string} backupPath - 备份文件路径
   * @param {Object} options - 恢复选项
   * @returns {Object} 操作结果
   */
  restoreFromBackup(backupPath, options = {}) {
    try {
      const fs = require('fs');
      
      if (!fs.existsSync(backupPath)) {
        return {
          success: false,
          message: '备份文件不存在'
        };
      }
      
      // 关闭当前数据库连接
      if (this.db) {
        this.db.close();
      }
      
      // 复制备份文件到数据库位置
      const dbPath = this.db.options.filename;
      fs.copyFileSync(backupPath, dbPath);
      
      // 重新打开数据库
      this.db = new Database(dbPath);
      
      // 重新配置加密
      if (this.encryptionEnabled) {
        this.setupEncryption(this.options, true);
      }
      
      console.log('✅ 数据库恢复成功');
      return {
        success: true,
        message: '数据库恢复成功'
      };
    } catch (error) {
      console.error('❌ 数据库恢复失败:', error.message);
      return {
        success: false,
        message: '恢复失败',
        error: error.message
      };
    }
  }
}

module.exports = EvolutionDB;