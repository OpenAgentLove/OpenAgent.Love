#!/usr/bin/env node
/**
 * 审计日志查询工具
 * 
 * 使用方法：
 *   node audit-query.js [command] [options]
 * 
 * 命令：
 *   query     - 查询审计日志
 *   stats     - 获取统计信息
 *   export    - 导出 CSV
 *   cleanup   - 清理过期日志
 * 
 * 示例：
 *   node audit-query.js query --action marry --limit 10
 *   node audit-query.js stats --start-time 2026-03-01
 *   node audit-query.js export --output /tmp/audit.csv
 *   node audit-query.js cleanup --retention-days 90
 */

const path = require('path');
const AuditLogger = require('./audit-logger');

// 解析命令行参数
function parseArgs(args) {
  const options = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2);
      const value = args[i + 1] && !args[i + 1].startsWith('--') ? args[++i] : true;
      options[key] = value;
    }
  }
  return options;
}

// 格式化时间戳
function formatTimestamp(timestamp) {
  return new Date(timestamp).toISOString().replace('T', ' ').substr(0, 19);
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const options = parseArgs(args.slice(1));
  
  // 初始化审计日志
  const dbPath = options.db || './data/audit.db';
  const auditLogger = new AuditLogger(dbPath);
  
  try {
    switch (command) {
      case 'query':
        await queryLogs(auditLogger, options);
        break;
      case 'stats':
        await getStats(auditLogger, options);
        break;
      case 'export':
        await exportLogs(auditLogger, options);
        break;
      case 'cleanup':
        await cleanupLogs(auditLogger, options);
        break;
      default:
        showHelp();
    }
  } finally {
    auditLogger.close();
  }
}

// 查询审计日志
async function queryLogs(auditLogger, options) {
  const filters = {
    limit: parseInt(options.limit) || 50,
    offset: parseInt(options.offset) || 0,
    order: options.order || 'desc'
  };
  
  if (options.action) filters.action = options.action;
  if (options['actor-user-id']) filters.actor_user_id = options['actor-user-id'];
  if (options['actor-agent-id']) filters.actor_agent_id = options['actor-agent-id'];
  if (options['target-id']) filters.target_id = options['target-id'];
  if (options.result) filters.result = options.result;
  
  if (options['start-time']) {
    filters.start_time = new Date(options['start-time']).getTime();
  }
  if (options['end-time']) {
    filters.end_time = new Date(options['end-time']).getTime();
  }
  
  const logs = auditLogger.query(filters);
  
  console.log(`\n📊 审计日志查询结果（共 ${logs.length} 条）\n`);
  console.log('='.repeat(120));
  
  for (const log of logs) {
    const resultIcon = log.result === 'success' ? '✅' : '❌';
    console.log(`${resultIcon} [${formatTimestamp(log.timestamp)}] ${log.action.toUpperCase()}`);
    console.log(`   操作者：${log.actor_user_id || 'N/A'} (${log.actor_agent_id || 'N/A'})`);
    console.log(`   目标：${log.target_type || 'N/A'}:${log.target_id || 'N/A'}`);
    console.log(`   结果：${log.result}${log.error_message ? ` - ${log.error_message}` : ''}`);
    if (log.details) {
      console.log(`   详情：${JSON.stringify(log.details).substr(0, 200)}`);
    }
    console.log('-'.repeat(120));
  }
}

// 获取统计信息
async function getStats(auditLogger, options) {
  const filters = {};
  
  if (options['start-time']) {
    filters.start_time = new Date(options['start-time']).getTime();
  }
  if (options['end-time']) {
    filters.end_time = new Date(options['end-time']).getTime();
  }
  
  const stats = auditLogger.getStats(filters);
  
  console.log('\n📈 审计日志统计信息\n');
  console.log('='.repeat(60));
  console.log(`总记录数：${stats.total}`);
  
  console.log('\n按结果分类:');
  for (const item of stats.by_result) {
    const icon = item.result === 'success' ? '✅' : '❌';
    console.log(`  ${icon} ${item.result}: ${item.count}`);
  }
  
  console.log('\n按操作类型分类（Top 10）:');
  for (const item of stats.by_action) {
    console.log(`  ${item.action}: ${item.count}`);
  }
  console.log('='.repeat(60));
}

// 导出 CSV
async function exportLogs(auditLogger, options) {
  const outputPath = options.output || './audit_export.csv';
  
  const filters = {};
  if (options['start-time']) {
    filters.start_time = new Date(options['start-time']).getTime();
  }
  if (options['end-time']) {
    filters.end_time = new Date(options['end-time']).getTime();
  }
  if (options.action) filters.action = options.action;
  
  const success = auditLogger.exportToCSV(filters, outputPath);
  
  if (success) {
    console.log(`✅ 审计日志已导出到：${outputPath}`);
  } else {
    console.log('❌ 导出失败');
  }
}

// 清理过期日志
async function cleanupLogs(auditLogger, options) {
  const retentionDays = parseInt(options['retention-days']) || 365;
  
  console.log(`🧹 正在清理 ${retentionDays} 天前的审计日志...`);
  const deletedCount = auditLogger.cleanup(retentionDays);
  console.log(`✅ 已删除 ${deletedCount} 条过期记录`);
}

// 显示帮助
function showHelp() {
  console.log(`
审计日志查询工具

使用方法：
  node audit-query.js [command] [options]

命令：
  query     - 查询审计日志
  stats     - 获取统计信息
  export    - 导出 CSV
  cleanup   - 清理过期日志

查询选项：
  --action <action>        操作类型 (register/marry/divorce/breed)
  --actor-user-id <id>     操作者用户 ID
  --actor-agent-id <id>    操作者 Agent ID
  --target-id <id>         目标 ID
  --result <result>        结果 (success/failure)
  --start-time <datetime>  开始时间 (ISO 格式)
  --end-time <datetime>    结束时间 (ISO 格式)
  --limit <number>         返回数量限制 (默认 50)
  --offset <number>        偏移量
  --order <asc|desc>       排序方向 (默认 desc)

统计选项：
  --start-time <datetime>  开始时间
  --end-time <datetime>    结束时间

导出选项：
  --output <path>          输出文件路径
  --start-time <datetime>  开始时间
  --end-time <datetime>    结束时间
  --action <action>        操作类型过滤

清理选项：
  --retention-days <days>  保留天数 (默认 365)

通用选项：
  --db <path>              数据库路径 (默认 ./data/audit.db)

示例：
  node audit-query.js query --action marry --limit 10
  node audit-query.js stats --start-time 2026-03-01
  node audit-query.js export --output /tmp/audit.csv
  node audit-query.js cleanup --retention-days 90
`);
}

// 运行
main().catch(error => {
  console.error('❌ 错误:', error.message);
  process.exit(1);
});
