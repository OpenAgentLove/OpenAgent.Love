#!/usr/bin/env node
/**
 * 审计日志功能测试脚本
 */

const path = require('path');
const fs = require('fs');

// 确保测试数据库目录存在
const testDataDir = path.join(__dirname, 'test-data');
if (!fs.existsSync(testDataDir)) {
  fs.mkdirSync(testDataDir, { recursive: true });
}

const { EvolutionCore } = require('./core');
const AuditLogger = require('./audit-logger');

console.log('🧪 开始审计日志功能测试...\n');

// 测试配置
const config = {
  storage_path: path.join(testDataDir, 'test-evolution.db'),
  audit_storage_path: path.join(testDataDir, 'test-audit.db'),
  enable_audit: true,
  init_presets: false, // 不初始化预设机器人，避免干扰测试
  encryption_enabled: false // 禁用加密以避免测试复杂化
};

// 清理旧测试数据
if (fs.existsSync(config.storage_path)) {
  fs.unlinkSync(config.storage_path);
}
if (fs.existsSync(config.audit_storage_path)) {
  fs.unlinkSync(config.audit_storage_path);
}
if (fs.existsSync(path.join(testDataDir, '.db_key'))) {
  fs.unlinkSync(path.join(testDataDir, '.db_key'));
}

// 创建核心实例
const core = new EvolutionCore(config);

let testCount = 0;
let passCount = 0;
let failCount = 0;

function test(name, fn) {
  testCount++;
  try {
    fn();
    passCount++;
    console.log(`✅ ${name}`);
  } catch (error) {
    failCount++;
    console.log(`❌ ${name}`);
    console.log(`   错误：${error.message}`);
  }
}

// ========== 测试 1: 审计日志模块初始化 ==========
test('审计日志模块初始化', () => {
  if (!core.auditLogger) {
    throw new Error('审计日志模块未初始化');
  }
  console.log('   ✓ 审计日志模块已初始化');
});

// ========== 测试 2: 机器人注册审计 ==========
test('机器人注册审计 - 成功', () => {
  const result = core.registerRobot({
    agentId: 'test_agent_1',
    userId: 'ou_testuser1',
    name: 'TestRobot-A',
    skills: ['skill_1', 'skill_2']
  }, {
    ip: '192.168.1.100'
  });
  
  if (!result.success) {
    throw new Error(`注册失败：${result.message}`);
  }
  
  // 验证审计日志
  const logs = core.auditLogger.query({
    action: 'register',
    result: 'success',
    limit: 10
  });
  
  if (logs.length === 0) {
    throw new Error('未找到注册成功的审计日志');
  }
  
  const registerLog = logs[0];
  if (registerLog.action !== 'register') {
    throw new Error(`操作类型错误：${registerLog.action}`);
  }
  if (registerLog.target_id !== result.robot.robot_id) {
    throw new Error(`目标 ID 不匹配`);
  }
  
  console.log(`   ✓ 注册成功审计日志已记录 (robot_id: ${result.robot.robot_id})`);
});

// ========== 测试 3: 机器人注册审计 - 失败 ==========
test('机器人注册审计 - 失败（验证错误）', () => {
  const result = core.registerRobot({
    agentId: 'test-agent-2',
    userId: 'ou_test_user_2',
    name: '', // 空名称，应该失败
    skills: []
  }, {
    ip: '192.168.1.101'
  });
  
  if (result.success) {
    throw new Error('应该验证失败');
  }
  
  // 验证审计日志
  const logs = core.auditLogger.query({
    action: 'register',
    result: 'failure',
    limit: 10
  });
  
  if (logs.length === 0) {
    throw new Error('未找到注册失败的审计日志');
  }
  
  const failLog = logs[0];
  if (failLog.error_message) {
    console.log(`   ✓ 注册失败审计日志已记录 (错误：${failLog.error_message})`);
  } else {
    throw new Error('失败日志缺少错误信息');
  }
});

// ========== 测试 4: 结婚审计 ==========
test('结婚审计 - 成功', () => {
  // 注册第二个机器人
  const robotB = core.registerRobot({
    agentId: 'test_agent_3',
    userId: 'ou_testuser3',
    name: 'TestRobot-B',
    skills: ['skill_3']
  }, { ip: '192.168.1.102' });
  
  if (!robotB.success) {
    throw new Error('机器人 B 注册失败');
  }
  
  // 获取第一个机器人（从之前的测试）
  const robotA = core.getRobot(core.robots.keys().next().value);
  
  // 结婚
  const marryResult = core.marry(robotA.robot_id, robotB.robot.robot_id, {
    ip: '192.168.1.103',
    actor_user_id: 'ou_test_admin'
  });
  
  if (!marryResult.success) {
    throw new Error(`结婚失败：${marryResult.message}`);
  }
  
  // 验证审计日志
  const logs = core.auditLogger.query({
    action: 'marry',
    result: 'success',
    limit: 10
  });
  
  if (logs.length === 0) {
    throw new Error('未找到结婚成功的审计日志');
  }
  
  const marryLog = logs[0];
  if (marryLog.details && marryLog.details.robot_a_name && marryLog.details.robot_b_name) {
    console.log(`   ✓ 结婚审计日志已记录 (${marryLog.details.robot_a_name} & ${marryLog.details.robot_b_name})`);
  } else {
    throw new Error('结婚日志详情不完整');
  }
});

// ========== 测试 5: 离婚审计 ==========
test('离婚审计 - 成功', () => {
  const robotA = core.getRobot(core.robots.keys().next().value);
  
  // 离婚
  const divorceResult = core.divorce(robotA.robot_id, null, 'shared', {
    ip: '192.168.1.104',
    actor_user_id: 'ou_test_admin'
  });
  
  if (!divorceResult.success) {
    throw new Error(`离婚失败：${divorceResult.message}`);
  }
  
  // 验证审计日志
  const logs = core.auditLogger.query({
    action: 'divorce',
    result: 'success',
    limit: 10
  });
  
  if (logs.length === 0) {
    throw new Error('未找到离婚成功的审计日志');
  }
  
  const divorceLog = logs[0];
  if (divorceLog.details && divorceLog.details.custody_type) {
    console.log(`   ✓ 离婚审计日志已记录 (抚养权：${divorceLog.details.custody_type})`);
  } else {
    throw new Error('离婚日志详情不完整');
  }
});

// ========== 测试 6: 生育审计 ==========
test('生育审计 - 成功', () => {
  // 先结婚（重新）
  const robots = Array.from(core.robots.values()).filter(r => r.is_available);
  if (robots.length < 2) {
    throw new Error('没有足够的可结婚机器人');
  }
  
  const marryResult = core.marry(robots[0].robot_id, robots[1].robot_id, {
    ip: '192.168.1.105'
  });
  
  if (!marryResult.success) {
    throw new Error(`结婚失败：${marryResult.message}`);
  }
  
  // 生育
  const breedResult = core.breed(robots[0].robot_id, '测试子代', {
    ip: '192.168.1.106',
    actor_user_id: 'ou_test_parent'
  });
  
  if (!breedResult.success) {
    throw new Error(`生育失败：${breedResult.message}`);
  }
  
  // 验证审计日志
  const logs = core.auditLogger.query({
    action: 'breed',
    result: 'success',
    limit: 10
  });
  
  if (logs.length === 0) {
    throw new Error('未找到生育成功的审计日志');
  }
  
  const breedLog = logs[0];
  if (breedLog.details && breedLog.details.child_name) {
    console.log(`   ✓ 生育审计日志已记录 (子代：${breedLog.details.child_name})`);
  } else {
    throw new Error('生育日志详情不完整');
  }
});

// ========== 测试 7: 审计日志查询功能 ==========
test('审计日志查询功能', () => {
  // 按操作类型查询
  const registerLogs = core.auditLogger.query({ action: 'register', limit: 100 });
  const marryLogs = core.auditLogger.query({ action: 'marry', limit: 100 });
  const divorceLogs = core.auditLogger.query({ action: 'divorce', limit: 100 });
  const breedLogs = core.auditLogger.query({ action: 'breed', limit: 100 });
  
  if (registerLogs.length === 0) throw new Error('register 日志查询失败');
  if (marryLogs.length === 0) throw new Error('marry 日志查询失败');
  if (divorceLogs.length === 0) throw new Error('divorce 日志查询失败');
  if (breedLogs.length === 0) throw new Error('breed 日志查询失败');
  
  console.log(`   ✓ 查询功能正常 (register:${registerLogs.length}, marry:${marryLogs.length}, divorce:${divorceLogs.length}, breed:${breedLogs.length})`);
});

// ========== 测试 8: 审计日志统计功能 ==========
test('审计日志统计功能', () => {
  const stats = core.auditLogger.getStats();
  
  if (!stats.total || stats.total === 0) {
    throw new Error('统计信息错误');
  }
  
  if (!stats.by_result || stats.by_result.length === 0) {
    throw new Error('按结果分类统计错误');
  }
  
  if (!stats.by_action || stats.by_action.length === 0) {
    throw new Error('按操作类型统计错误');
  }
  
  console.log(`   ✓ 统计功能正常 (总记录：${stats.total}, 成功：${stats.by_result.find(r => r.result === 'success')?.count || 0})`);
});

// ========== 测试 9: 审计日志导出功能 ==========
test('审计日志导出功能', () => {
  const exportPath = path.join(testDataDir, 'test-audit-export.csv');
  const success = core.auditLogger.exportToCSV({}, exportPath);
  
  if (!success) {
    throw new Error('导出失败');
  }
  
  if (!fs.existsSync(exportPath)) {
    throw new Error('导出文件不存在');
  }
  
  const content = fs.readFileSync(exportPath, 'utf8');
  const lines = content.split('\n');
  
  if (lines.length < 2) {
    throw new Error('导出文件内容为空');
  }
  
  // 验证 CSV 头部
  const headers = lines[0].split(',');
  if (!headers.includes('action') || !headers.includes('result')) {
    throw new Error('CSV 头部不完整');
  }
  
  console.log(`   ✓ 导出功能正常 (${lines.length - 1} 条记录)`);
});

// ========== 测试 10: IP 哈希功能 ==========
test('IP 哈希功能', () => {
  const logs = core.auditLogger.query({ limit: 100 });
  
  let hasIPHash = false;
  for (const log of logs) {
    if (log.ip_hash) {
      hasIPHash = true;
      // 验证哈希格式（应该是 16 位十六进制）
      if (!/^[a-f0-9]{16}$/.test(log.ip_hash)) {
        throw new Error(`IP 哈希格式错误：${log.ip_hash}`);
      }
      break;
    }
  }
  
  if (!hasIPHash) {
    console.log('   ⚠️  未找到带 IP 的日志（可能测试未传入 IP）');
  } else {
    console.log('   ✓ IP 哈希功能正常');
  }
});

// ========== 测试 11: 敏感信息脱敏 ==========
test('敏感信息脱敏', () => {
  const logs = core.auditLogger.query({ limit: 100 });
  
  for (const log of logs) {
    if (log.details) {
      const detailsStr = JSON.stringify(log.details);
      // 检查是否有明显的敏感信息模式
      if (/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/.test(detailsStr)) {
        throw new Error('审计日志中包含未脱敏的邮箱');
      }
      if (/\b1[3-9]\d{9}\b/.test(detailsStr)) {
        throw new Error('审计日志中包含未脱敏的手机号');
      }
    }
  }
  
  console.log('   ✓ 敏感信息脱敏正常');
});

// ========== 清理 ==========
console.log('\n🧹 清理测试数据...');
core.db.close();
core.auditLogger.close();

// 可选：保留测试数据以便检查
// fs.unlinkSync(config.storage_path);
// fs.unlinkSync(config.audit_storage_path);
// fs.rmSync(testDataDir, { recursive: true });

// ========== 测试报告 ==========
console.log('\n' + '='.repeat(60));
console.log('📊 审计日志功能测试报告');
console.log('='.repeat(60));
console.log(`总测试数：${testCount}`);
console.log(`✅ 通过：${passCount}`);
console.log(`❌ 失败：${failCount}`);
console.log('='.repeat(60));

if (failCount > 0) {
  console.log('\n⚠️  部分测试失败，请检查错误信息');
  process.exit(1);
} else {
  console.log('\n🎉 所有测试通过！审计日志功能正常');
  process.exit(0);
}
