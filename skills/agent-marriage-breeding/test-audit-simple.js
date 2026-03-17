#!/usr/bin/env node
/**
 * 审计日志模块简单测试
 * 直接测试 AuditLogger 类，不依赖 EvolutionCore
 */

const path = require('path');
const fs = require('fs');
const AuditLogger = require('./audit-logger');

console.log('🧪 开始审计日志模块简单测试...\n');

// 测试数据目录
const testDataDir = path.join(__dirname, 'test-data');
if (!fs.existsSync(testDataDir)) {
  fs.mkdirSync(testDataDir, { recursive: true });
}

// 清理旧测试数据
const auditDbPath = path.join(testDataDir, 'test-audit-simple.db');
if (fs.existsSync(auditDbPath)) {
  fs.unlinkSync(auditDbPath);
}

// 创建审计日志实例
const auditLogger = new AuditLogger(auditDbPath);

let testCount = 0;
let passCount = 0;

function test(name, fn) {
  testCount++;
  try {
    fn();
    passCount++;
    console.log(`✅ ${name}`);
  } catch (error) {
    console.log(`❌ ${name}`);
    console.log(`   错误：${error.message}`);
  }
}

// ========== 测试 1: 记录成功操作 ==========
test('记录成功操作', () => {
  const result = auditLogger.logSuccess('register', {
    actor_agent_id: 'test_agent_1',
    actor_user_id: 'ou_testuser1',
    target_id: 'robot_test_1',
    target_type: 'robot',
    details: { name: 'TestRobot', skills: ['skill_1'] },
    ip: '192.168.1.100'
  });
  
  if (!result) throw new Error('记录失败');
});

// ========== 测试 2: 记录失败操作 ==========
test('记录失败操作', () => {
  const result = auditLogger.logFailure('marry', {
    actor_agent_id: 'test_agent_2',
    actor_user_id: 'ou_testuser2',
    target_id: 'robot_test_2',
    target_type: 'robot',
    details: { reason: 'already married' },
    error_message: '已有配偶',
    ip: '192.168.1.101'
  });
  
  if (!result) throw new Error('记录失败');
});

// ========== 测试 3: 记录离婚操作 ==========
test('记录离婚操作', () => {
  const result = auditLogger.logSuccess('divorce', {
    actor_agent_id: 'test_agent_3',
    actor_user_id: 'ou_testuser3',
    target_id: 'mar_xxx',
    target_type: 'marriage',
    details: { robot_a: 'robot_1', robot_b: 'robot_2', custody_type: 'shared' },
    ip: '192.168.1.102'
  });
  
  if (!result) throw new Error('记录失败');
});

// ========== 测试 4: 记录生育操作 ==========
test('记录生育操作', () => {
  const result = auditLogger.logSuccess('breed', {
    actor_agent_id: 'test_agent_4',
    actor_user_id: 'ou_testuser4',
    target_id: 'desc_xxx',
    target_type: 'agent',
    details: { child_name: 'ChildRobot', mutations: ['mutation_1'] },
    ip: '192.168.1.103'
  });
  
  if (!result) throw new Error('记录失败');
});

// ========== 测试 5: 查询审计日志 ==========
test('查询审计日志', () => {
  const logs = auditLogger.query({ limit: 100 });
  
  if (logs.length !== 4) {
    throw new Error(`日志数量错误：期望 4 条，实际 ${logs.length} 条`);
  }
  
  console.log(`   ✓ 查询到 ${logs.length} 条日志`);
});

// ========== 测试 6: 按操作类型查询 ==========
test('按操作类型查询', () => {
  const registerLogs = auditLogger.query({ action: 'register', limit: 10 });
  const marryLogs = auditLogger.query({ action: 'marry', limit: 10 });
  const divorceLogs = auditLogger.query({ action: 'divorce', limit: 10 });
  const breedLogs = auditLogger.query({ action: 'breed', limit: 10 });
  
  if (registerLogs.length !== 1) throw new Error('register 日志数量错误');
  if (marryLogs.length !== 1) throw new Error('marry 日志数量错误');
  if (divorceLogs.length !== 1) throw new Error('divorce 日志数量错误');
  if (breedLogs.length !== 1) throw new Error('breed 日志数量错误');
  
  console.log(`   ✓ 按类型查询正常`);
});

// ========== 测试 7: 按结果查询 ==========
test('按结果查询', () => {
  const successLogs = auditLogger.query({ result: 'success', limit: 10 });
  const failureLogs = auditLogger.query({ result: 'failure', limit: 10 });
  
  if (successLogs.length !== 3) throw new Error('成功日志数量错误');
  if (failureLogs.length !== 1) throw new Error('失败日志数量错误');
  
  console.log(`   ✓ 按结果查询正常 (成功:${successLogs.length}, 失败:${failureLogs.length})`);
});

// ========== 测试 8: 统计功能 ==========
test('统计功能', () => {
  const stats = auditLogger.getStats();
  
  if (stats.total !== 4) throw new Error(`总记录数错误：${stats.total}`);
  if (!stats.by_result || stats.by_result.length === 0) throw new Error('按结果统计错误');
  if (!stats.by_action || stats.by_action.length === 0) throw new Error('按操作统计错误');
  
  console.log(`   ✓ 统计功能正常 (总记录：${stats.total})`);
});

// ========== 测试 9: IP 哈希 ==========
test('IP 哈希功能', () => {
  const logs = auditLogger.query({ limit: 100 });
  
  for (const log of logs) {
    if (!log.ip_hash) {
      throw new Error('IP 哈希缺失');
    }
    if (!/^[a-f0-9]{16}$/.test(log.ip_hash)) {
      throw new Error(`IP 哈希格式错误：${log.ip_hash}`);
    }
  }
  
  console.log(`   ✓ IP 哈希格式正确`);
});

// ========== 测试 10: 导出 CSV ==========
test('导出 CSV', () => {
  const exportPath = path.join(testDataDir, 'test-export.csv');
  const success = auditLogger.exportToCSV({}, exportPath);
  
  if (!success) throw new Error('导出失败');
  if (!fs.existsSync(exportPath)) throw new Error('导出文件不存在');
  
  const content = fs.readFileSync(exportPath, 'utf8');
  const lines = content.split('\n');
  
  if (lines.length < 5) throw new Error('导出内容不完整');
  
  console.log(`   ✓ 导出 CSV 成功 (${lines.length - 1} 条记录)`);
});

// ========== 测试 11: 敏感信息脱敏 ==========
test('敏感信息脱敏', () => {
  // 记录包含敏感信息的日志
  auditLogger.logSuccess('test', {
    actor_user_id: 'ou_testuser',
    details: {
      email: 'test@example.com',
      phone: '13800138000',
      password: 'secret123'
    }
  });
  
  const logs = auditLogger.query({ action: 'test', limit: 10 });
  if (logs.length === 0) throw new Error('测试日志未找到');
  
  const detailsStr = JSON.stringify(logs[0].details);
  
  // 检查敏感信息是否被脱敏
  if (detailsStr.includes('test@example.com')) {
    throw new Error('邮箱未脱敏');
  }
  if (detailsStr.includes('13800138000')) {
    throw new Error('手机号未脱敏');
  }
  if (detailsStr.includes('secret123')) {
    throw new Error('密码未脱敏');
  }
  
  console.log(`   ✓ 敏感信息已脱敏`);
});

// ========== 测试 12: 时间范围查询 ==========
test('时间范围查询', () => {
  const now = Date.now();
  const startTime = now - 60000; // 1 分钟前
  const endTime = now + 60000;   // 1 分钟后
  
  const logs = auditLogger.query({
    start_time: startTime,
    end_time: endTime,
    limit: 100
  });
  
  if (logs.length === 0) {
    throw new Error('时间范围查询未返回结果');
  }
  
  console.log(`   ✓ 时间范围查询正常 (${logs.length} 条)`);
});

// ========== 清理 ==========
console.log('\n🧹 清理测试数据...');
auditLogger.close();

// 删除测试数据库（可选：保留以便检查）
// fs.unlinkSync(auditDbPath);
// fs.rmSync(testDataDir, { recursive: true });

// ========== 测试报告 ==========
console.log('\n' + '='.repeat(60));
console.log('📊 审计日志模块测试报告');
console.log('='.repeat(60));
console.log(`总测试数：${testCount}`);
console.log(`✅ 通过：${passCount}`);
console.log(`❌ 失败：${testCount - passCount}`);
console.log('='.repeat(60));

if (passCount === testCount) {
  console.log('\n🎉 所有测试通过！审计日志模块功能正常');
  process.exit(0);
} else {
  console.log('\n⚠️  部分测试失败，请检查错误信息');
  process.exit(1);
}
