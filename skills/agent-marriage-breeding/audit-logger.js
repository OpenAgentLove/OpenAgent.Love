/**
 * 审计日志模块
 * 记录敏感操作的详细信息，用于合规和安全审计
 * 
 * 审计日志字段：
 * - timestamp: 时间戳
 * - action: 操作类型 (register/marry/divorce/breed/delete 等)
 * - actor_agent_id: 操作者 Agent ID
 * - actor_user_id: 操作者用户 ID
 * - target_id: 目标 ID（如机器人 ID）
 * - details: 操作详情（JSON 格式，已脱敏）
 * - result: 成功/失败
 * - ip_hash: IP 地址哈希（可选）
 * - error_message: 错误信息（失败时）
 */

const Database = require('better-sqlite3-multiple-ciphers');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const { sanitizeLog, sanitizeObject } = require('../utils/logger');

class AuditLogger {
  constructor(dbPath = './data/audit.db', options = {}) {
    const absPath = path.resolve(dbPath);
    
    // 确保目录存在
    const dir = path.dirname(absPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    this.db = new Database(absPath);
    this.config = {
      retention_days: options.retention_days || 365, // 日志保留天数
      max_records: options.max_records || 100000,    // 最大记录数
      ...options
    };
    
    this.initTable();
    this.createIndexes();
    
    console.log(sanitizeLog('📋 审计日志模块初始化完成'));
  }
  
  /**
   * 初始化审计日志表
   */
  initTable() {
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
    
    console.log(sanitizeLog('📊 审计日志表初始化完成'));
  }
  
  /**
   * 创建索引以提升查询性能
   */
  createIndexes() {
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
      CREATE INDEX IF NOT EXISTS idx_audit_actor_user ON audit_logs(actor_user_id);
      CREATE INDEX IF NOT EXISTS idx_audit_actor_agent ON audit_logs(actor_agent_id);
      CREATE INDEX IF NOT EXISTS idx_audit_target ON audit_logs(target_id);
      CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp);
      CREATE INDEX IF NOT EXISTS idx_audit_result ON audit_logs(result);
    `);
    
    console.log(sanitizeLog('📈 审计日志索引创建完成'));
  }
  
  /**
   * 哈希 IP 地址（保护隐私）
   * @param {string} ip - IP 地址
   * @returns {string} - IP 哈希值
   */
  hashIP(ip) {
    if (!ip) return null;
    return crypto.createHash('sha256').update(ip).digest('hex').substr(0, 16);
  }
  
  /**
   * 记录审计日志
   * @param {Object} logEntry - 日志条目
   * @param {string} logEntry.action - 操作类型
   * @param {string} [logEntry.actor_agent_id] - 操作者 Agent ID
   * @param {string} [logEntry.actor_user_id] - 操作者用户 ID
   * @param {string} [logEntry.target_id] - 目标 ID
   * @param {string} [logEntry.target_type] - 目标类型 (robot/marriage/agent)
   * @param {Object} [logEntry.details] - 操作详情
   * @param {string} logEntry.result - 结果 (success/failure)
   * @param {string} [logEntry.ip] - IP 地址（可选）
   * @param {string} [logEntry.error_message] - 错误信息（失败时）
   */
  log(logEntry) {
    const {
      action,
      actor_agent_id,
      actor_user_id,
      target_id,
      target_type,
      details,
      result,
      ip,
      error_message
    } = logEntry;
    
    // 验证必填字段
    if (!action || !result) {
      console.error(sanitizeLog('❌ 审计日志记录失败：缺少必填字段 action 或 result'));
      return false;
    }
    
    // 脱敏详情数据
    const sanitizedDetails = details ? JSON.stringify(sanitizeObject(details)) : null;
    const ipHash = this.hashIP(ip);
    
    const stmt = this.db.prepare(`
      INSERT INTO audit_logs 
      (timestamp, action, actor_agent_id, actor_user_id, target_id, target_type, details, result, ip_hash, error_message)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    try {
      stmt.run(
        Date.now(),
        action,
        actor_agent_id || null,
        actor_user_id || null,
        target_id || null,
        target_type || null,
        sanitizedDetails,
        result,
        ipHash,
        error_message || null
      );
      
      console.log(sanitizeLog(`✅ 审计日志记录：${action} - ${result}`));
      return true;
    } catch (error) {
      console.error(sanitizeLog(`❌ 审计日志记录失败：${error.message}`));
      return false;
    }
  }
  
  /**
   * 记录成功操作
   * @param {string} action - 操作类型
   * @param {Object} context - 上下文信息
   */
  logSuccess(action, context = {}) {
    return this.log({
      action,
      result: 'success',
      ...context
    });
  }
  
  /**
   * 记录失败操作
   * @param {string} action - 操作类型
   * @param {Object} context - 上下文信息
   * @param {string} context.error_message - 错误信息
   */
  logFailure(action, context = {}) {
    return this.log({
      action,
      result: 'failure',
      ...context
    });
  }
  
  /**
   * 查询审计日志
   * @param {Object} filters - 筛选条件
   * @param {string} [filters.action] - 操作类型
   * @param {string} [filters.actor_user_id] - 操作者用户 ID
   * @param {string} [filters.actor_agent_id] - 操作者 Agent ID
   * @param {string} [filters.target_id] - 目标 ID
   * @param {string} [filters.result] - 结果 (success/failure)
   * @param {number} [filters.start_time] - 开始时间戳
   * @param {number} [filters.end_time] - 结束时间戳
   * @param {number} [filters.limit] - 返回数量限制
   * @param {number} [filters.offset] - 偏移量
   * @param {string} [filters.order] - 排序方向 (asc/desc)
   * @returns {Array} - 审计日志列表
   */
  query(filters = {}) {
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
    
    // 构建 WHERE 子句
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
    
    try {
      const rows = stmt.all(...params, limit, offset);
      
      // 解析 details JSON
      return rows.map(row => ({
        ...row,
        details: row.details ? JSON.parse(row.details) : null
      }));
    } catch (error) {
      console.error(sanitizeLog(`❌ 审计日志查询失败：${error.message}`));
      return [];
    }
  }
  
  /**
   * 获取审计日志统计信息
   * @param {Object} filters - 筛选条件（同 query）
   * @returns {Object} - 统计信息
   */
  getStats(filters = {}) {
    const {
      action,
      actor_user_id,
      actor_agent_id,
      target_id,
      result,
      start_time,
      end_time
    } = filters;
    
    // 构建 WHERE 子句
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
    
    // 总记录数
    const totalStmt = this.db.prepare(`SELECT COUNT(*) as count FROM audit_logs ${whereClause}`);
    const total = totalStmt.get(...params).count;
    
    // 按结果分组统计
    const resultStmt = this.db.prepare(`
      SELECT result, COUNT(*) as count 
      FROM audit_logs 
      ${whereClause}
      GROUP BY result
    `);
    const byResult = resultStmt.all(...params);
    
    // 按操作类型分组统计
    const actionStmt = this.db.prepare(`
      SELECT action, COUNT(*) as count 
      FROM audit_logs 
      ${whereClause}
      GROUP BY action
      ORDER BY count DESC
      LIMIT 10
    `);
    const byAction = actionStmt.all(...params);
    
    return {
      total,
      by_result: byResult,
      by_action: byAction,
      filters
    };
  }
  
  /**
   * 导出审计日志（CSV 格式）
   * @param {Object} filters - 筛选条件
   * @param {string} outputPath - 输出文件路径
   * @returns {boolean} - 是否成功
   */
  exportToCSV(filters = {}, outputPath) {
    const logs = this.query({ ...filters, limit: 10000 });
    
    if (logs.length === 0) {
      console.log(sanitizeLog('⚠️ 没有可导出的审计日志'));
      return false;
    }
    
    // CSV 头部
    const headers = [
      'id',
      'timestamp',
      'datetime',
      'action',
      'actor_agent_id',
      'actor_user_id',
      'target_id',
      'target_type',
      'details',
      'result',
      'ip_hash',
      'error_message'
    ];
    
    // CSV 内容
    const csvRows = [headers.join(',')];
    
    for (const log of logs) {
      const row = [
        log.id,
        log.timestamp,
        new Date(log.timestamp).toISOString(),
        log.action,
        log.actor_agent_id || '',
        log.actor_user_id || '',
        log.target_id || '',
        log.target_type || '',
        `"${(log.details ? JSON.stringify(log.details) : '').replace(/"/g, '""')}"`,
        log.result,
        log.ip_hash || '',
        log.error_message || ''
      ];
      csvRows.push(row.join(','));
    }
    
    try {
      fs.writeFileSync(outputPath, csvRows.join('\n'));
      console.log(sanitizeLog(`✅ 审计日志导出成功：${outputPath} (${logs.length} 条记录)`));
      return true;
    } catch (error) {
      console.error(sanitizeLog(`❌ 审计日志导出失败：${error.message}`));
      return false;
    }
  }
  
  /**
   * 清理过期日志
   * @param {number} retentionDays - 保留天数
   * @returns {number} - 删除的记录数
   */
  cleanup(retentionDays = this.config.retention_days) {
    const cutoffTime = Date.now() - (retentionDays * 24 * 60 * 60 * 1000);
    
    const stmt = this.db.prepare(`
      DELETE FROM audit_logs 
      WHERE timestamp < ?
    `);
    
    try {
      const result = stmt.run(cutoffTime);
      console.log(sanitizeLog(`🧹 清理过期审计日志：删除 ${result.changes} 条记录（>${retentionDays} 天）`));
      return result.changes;
    } catch (error) {
      console.error(sanitizeLog(`❌ 清理审计日志失败：${error.message}`));
      return 0;
    }
  }
  
  /**
   * 关闭数据库连接
   */
  close() {
    this.db.close();
    console.log(sanitizeLog('🔒 审计日志数据库连接已关闭'));
  }
}

module.exports = AuditLogger;
