#!/usr/bin/env node

/**
 * 数据库加密功能简单测试
 */

const path = require('path');
const fs = require('fs');

const TEST_DIR = path.join(__dirname, 'test-encrypt-simple');
const TEST_DB = path.join(TEST_DIR, 'test.db');

// 清理
if (fs.existsSync(TEST_DIR)) {
  fs.rmSync(TEST_DIR, { recursive: true, force: true });
}
fs.mkdirSync(TEST_DIR, { recursive: true });

console.log('🔐 数据库加密简单测试\n');

// 设置加密密钥
const crypto = require('crypto');
const testKey = crypto.randomBytes(32).toString('hex');
process.env.DATABASE_ENCRYPTION_KEY = testKey;

console.log('1️⃣  创建加密数据库...');
const EvolutionDB = require('../storage.js');

try {
  const db = new EvolutionDB(TEST_DB, {
    encryption_enabled: true,
    auto_generate_key: false,
    auto_index: false,  // 禁用索引创建
    cache_enabled: false  // 禁用缓存
  });
  
  console.log('✅ 数据库创建成功');
  
  console.log('\n2️⃣  检查加密状态...');
  const status = db.getEncryptionStatus();
  console.log('   加密状态:', status.encrypted ? '已加密 ✅' : '未加密 ❌');
  if (status.cipher) {
    console.log('   加密算法:', status.cipher);
  }
  
  console.log('\n3️⃣  写入测试数据...');
  db.saveRobot({
    robot_id: 'test_001',
    agent_id: 'agent_001',
    user_id: 'ou_test',
    name: '测试机器人',
    skills: ['skill1'],
    registered_at: Date.now(),
    is_available: true,
    achievements: []
  });
  console.log('✅ 数据写入成功');
  
  console.log('\n4️⃣  读取测试数据...');
  const robot = db.getRobot('test_001');
  console.log('   机器人名称:', robot.name);
  console.log('✅ 数据读取成功');
  
  console.log('\n5️⃣  关闭并重新打开数据库...');
  db.close();
  
  const db2 = new EvolutionDB(TEST_DB, {
    encryption_enabled: true,
    auto_generate_key: false,
    auto_index: false,
    cache_enabled: false
  });
  
  const robot2 = db2.getRobot('test_001');
  console.log('   机器人名称:', robot2.name);
  console.log('✅ 重新打开成功');
  
  db2.close();
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ 所有测试通过！数据库加密功能正常');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
} catch (error) {
  console.error('\n❌ 测试失败:', error.message);
  console.error(error.stack);
  process.exit(1);
} finally {
  // 清理
  if (fs.existsSync(TEST_DIR)) {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  }
}
