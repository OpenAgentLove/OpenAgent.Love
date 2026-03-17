#!/usr/bin/env node

/**
 * 数据库加密功能测试脚本
 * 
 * 测试内容：
 * 1. 密钥生成和验证
 * 2. 加密数据库创建
 * 3. 数据读写测试
 * 4. 加密状态验证
 * 5. 密钥轮换测试
 * 6. 备份恢复测试
 */

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// 测试配置
const TEST_DIR = path.join(__dirname, '..', 'test-encryption-data');
const TEST_DB_PATH = path.join(TEST_DIR, 'test.db');
const TEST_KEY_FILE = path.join(TEST_DIR, '.test_key');

// 清理函数
function cleanup() {
  try {
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
    if (fs.existsSync(TEST_KEY_FILE)) {
      fs.unlinkSync(TEST_KEY_FILE);
    }
    if (fs.existsSync(TEST_DIR)) {
      fs.rmdirSync(TEST_DIR);
    }
  } catch (error) {
    // 忽略清理错误
  }
}

// 确保测试目录存在
function setup() {
  if (!fs.existsSync(TEST_DIR)) {
    fs.mkdirSync(TEST_DIR, { recursive: true });
  }
}

// 测试 1: 密钥管理
function testKeyManager() {
  console.log('\n📝 测试 1: 密钥管理');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const KeyManager = require('../key-manager.js');
  
  // 测试密钥生成
  console.log('1.1 生成密钥...');
  const key1 = KeyManager.generateKey();
  console.assert(key1.length === 64, '密钥长度应为 64 字符');
  console.assert(/^[0-9a-f]+$/.test(key1), '密钥应为 hex 格式');
  console.log('   ✅ 密钥生成成功:', key1.substring(0, 8) + '...');
  
  // 测试密钥验证
  console.log('1.2 验证密钥...');
  const validated = KeyManager.validateKey(key1);
  console.assert(validated === key1, '密钥验证应通过');
  console.log('   ✅ 密钥验证通过');
  
  // 测试不同格式的密钥
  console.log('1.3 测试不同格式密钥...');
  
  // Base64 格式
  const base64Key = crypto.randomBytes(32).toString('base64');
  const validatedBase64 = KeyManager.validateKey(base64Key);
  console.assert(validatedBase64, 'Base64 密钥应能转换');
  console.log('   ✅ Base64 格式密钥转换成功');
  
  // 字符串密钥（应使用 SHA-256 哈希）
  const stringKey = 'my-secret-password-12345';
  const validatedString = KeyManager.validateKey(stringKey);
  console.assert(validatedString && validatedString.length === 64, '字符串密钥应哈希为 64 字符');
  console.log('   ✅ 字符串密钥哈希成功');
  
  // 测试密钥信息
  console.log('1.4 获取密钥信息...');
  process.env.DATABASE_ENCRYPTION_KEY = key1;
  const keyInfo = KeyManager.getKeyInfo();
  console.assert(keyInfo.configured === true, '密钥应已配置');
  console.assert(keyInfo.valid === true, '密钥应有效');
  console.log('   ✅ 密钥信息获取成功');
  
  console.log('✅ 测试 1 通过：密钥管理\n');
  return key1;
}

// 测试 2: 加密数据库创建
function testEncryptedDatabaseCreation(encryptionKey) {
  console.log('📝 测试 2: 加密数据库创建');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  // 设置环境变量
  process.env.DATABASE_ENCRYPTION_KEY = encryptionKey;
  
  console.log('2.1 创建加密数据库...');
  const EvolutionDB = require('../storage.js');
  
  const db = new EvolutionDB(TEST_DB_PATH, {
    encryption_enabled: true,
    auto_generate_key: false,
    cache_enabled: false,
    auto_index: false
  });
  
  console.log('   ✅ 数据库创建成功');
  
  // 验证加密状态
  console.log('2.2 验证加密状态...');
  const status = db.getEncryptionStatus();
  console.assert(status.encrypted === true, '数据库应已加密');
  console.log('   ✅ 加密状态验证通过');
  console.log('   加密方式:', status.cipher || 'SQLCipher');
  
  console.log('✅ 测试 2 通过：加密数据库创建\n');
  return db;
}

// 测试 3: 数据读写测试
function testReadWrite(db) {
  console.log('📝 测试 3: 数据读写测试');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  console.log('3.1 写入测试数据...');
  
  // 保存机器人
  const robot = {
    robot_id: 'test_robot_001',
    agent_id: 'test_agent_001',
    user_id: 'ou_test_user',
    name: '测试机器人',
    skills: ['skill1', 'skill2'],
    registered_at: Date.now(),
    is_available: true,
    achievements: ['achievement1']
  };
  
  db.saveRobot(robot);
  console.log('   ✅ 机器人数据写入成功');
  
  // 保存 Agent
  const agent = {
    agent_id: 'test_agent_001',
    name: '测试 Agent',
    generation: 1,
    skills: ['skill1', 'skill2'],
    parents: null,
    created_at: Date.now(),
    crystal_energy: 100,
    achievements: [],
    children: [],
    spouse: null
  };
  
  db.saveAgent(agent);
  console.log('   ✅ Agent 数据写入成功');
  
  console.log('3.2 读取测试数据...');
  
  // 读取机器人
  const retrievedRobot = db.getRobot('test_robot_001');
  console.assert(retrievedRobot !== null, '应能读取机器人数据');
  console.assert(retrievedRobot.name === '测试机器人', '机器人名称应匹配');
  console.log('   ✅ 机器人数据读取成功');
  
  // 读取 Agent
  const retrievedAgent = db.getAgent('test_agent_001');
  console.assert(retrievedAgent !== null, '应能读取 Agent 数据');
  console.assert(retrievedAgent.name === '测试 Agent', 'Agent 名称应匹配');
  console.log('   ✅ Agent 数据读取成功');
  
  console.log('3.3 批量操作测试...');
  
  // 批量保存
  const agents = [];
  for (let i = 0; i < 10; i++) {
    agents.push({
      agent_id: `test_agent_batch_${i}`,
      name: `批量 Agent ${i}`,
      generation: 1,
      skills: [],
      parents: null,
      created_at: Date.now(),
      crystal_energy: 0,
      achievements: [],
      children: [],
      spouse: null
    });
  }
  
  const result = db.saveAgentsBatch(agents);
  console.assert(result.success === true, '批量保存应成功');
  console.log('   ✅ 批量保存成功:', result.count, '条记录');
  
  // 验证数量
  const allAgents = db.getAllAgents();
  console.assert(allAgents.length >= 11, 'Agent 数量应至少为 11');
  console.log('   ✅ 数据验证通过，共', allAgents.length, '条记录');
  
  console.log('✅ 测试 3 通过：数据读写\n');
}

// 测试 4: 加密状态验证
function testEncryptionStatus(db) {
  console.log('📝 测试 4: 加密状态验证');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  console.log('4.1 检查加密状态...');
  const isEncrypted = db.isEncrypted();
  console.assert(isEncrypted === true, '数据库应已加密');
  console.log('   ✅ 数据库已加密');
  
  console.log('4.2 获取详细加密信息...');
  const status = db.getEncryptionStatus();
  console.log('   加密状态:', status.encrypted ? '已加密' : '未加密');
  console.log('   加密算法:', status.cipher || '未知');
  console.log('   页大小:', status.page_size || '未知');
  console.log('   KDF 迭代:', status.kdf_iter || '未知');
  
  console.assert(status.encrypted === true, '状态应显示已加密');
  console.log('   ✅ 加密信息获取成功');
  
  console.log('✅ 测试 4 通过：加密状态验证\n');
}

// 测试 5: 密钥轮换测试
function testKeyRotation(db, oldKey) {
  console.log('📝 测试 5: 密钥轮换测试');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const KeyManager = require('../key-manager.js');
  
  console.log('5.1 生成新密钥...');
  const newKey = KeyManager.generateKey();
  console.log('   ✅ 新密钥生成成功');
  
  console.log('5.2 执行密钥轮换...');
  const result = db.rotateEncryptionKey(newKey, oldKey);
  console.assert(result.success === true, '密钥轮换应成功');
  console.log('   ✅ 密钥轮换成功');
  
  console.log('5.3 验证新密钥...');
  
  // 关闭并重新打开数据库
  db.close();
  
  process.env.DATABASE_ENCRYPTION_KEY = newKey;
  const EvolutionDB = require('../storage.js');
  const db2 = new EvolutionDB(TEST_DB_PATH, {
    encryption_enabled: true,
    auto_generate_key: false,
    cache_enabled: false,
    auto_index: false
  });
  
  // 验证能读取数据
  const robot = db2.getRobot('test_robot_001');
  console.assert(robot !== null, '应能用新密钥读取数据');
  console.log('   ✅ 新密钥验证通过');
  
  db2.close();
  
  console.log('✅ 测试 5 通过：密钥轮换\n');
  return newKey;
}

// 测试 6: 备份恢复测试
function testBackupRestore(encryptionKey) {
  console.log('📝 测试 6: 备份恢复测试');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const backupPath = path.join(TEST_DIR, 'backup.db');
  
  console.log('6.1 创建备份...');
  process.env.DATABASE_ENCRYPTION_KEY = encryptionKey;
  
  const db = new EvolutionDB(TEST_DB_PATH, {
    encryption_enabled: true,
    auto_generate_key: false,
    cache_enabled: false,
    auto_index: false
  });
  
  // 导出未加密备份
  const result = db.exportUnencryptedBackup(backupPath);
  console.assert(result.success === true, '备份导出应成功');
  console.log('   ✅ 备份创建成功');
  
  console.log('6.2 验证备份文件...');
  console.assert(fs.existsSync(backupPath), '备份文件应存在');
  const backupSize = fs.statSync(backupPath).size;
  console.log('   备份文件大小:', backupSize, '字节');
  console.log('   ✅ 备份文件验证通过');
  
  console.log('6.3 恢复测试...');
  
  // 删除原数据库
  db.close();
  fs.unlinkSync(TEST_DB_PATH);
  console.assert(!fs.existsSync(TEST_DB_PATH), '原数据库应已删除');
  
  // 从备份恢复
  const EvolutionDB = require('../storage.js');
  const db2 = new EvolutionDB(TEST_DB_PATH, {
    encryption_enabled: true,
    auto_generate_key: false,
    cache_enabled: false,
    auto_index: false
  });
  
  const restoreResult = db2.restoreFromBackup(backupPath);
  console.assert(restoreResult.success === true, '恢复应成功');
  console.log('   ✅ 数据库恢复成功');
  
  // 验证恢复后的数据
  const robot = db2.getRobot('test_robot_001');
  console.assert(robot !== null, '应能读取恢复的数据');
  console.log('   ✅ 恢复数据验证通过');
  
  db2.close();
  
  console.log('✅ 测试 6 通过：备份恢复\n');
}

// 主测试流程
async function runTests() {
  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║     数据库加密功能测试                             ║');
  console.log('╚════════════════════════════════════════════════════╝');
  
  try {
    // 设置
    setup();
    
    // 运行测试
    const key = testKeyManager();
    const db = testEncryptedDatabaseCreation(key);
    testReadWrite(db);
    testEncryptionStatus(db);
    const newKey = testKeyRotation(db, key);
    testBackupRestore(newKey);
    
    // 总结
    console.log('╔════════════════════════════════════════════════════╗');
    console.log('║     ✅ 所有测试通过！                              ║');
    console.log('╚════════════════════════════════════════════════════╝\n');
    
    console.log('📊 测试总结:');
    console.log('   ✓ 密钥管理');
    console.log('   ✓ 加密数据库创建');
    console.log('   ✓ 数据读写');
    console.log('   ✓ 加密状态验证');
    console.log('   ✓ 密钥轮换');
    console.log('   ✓ 备份恢复');
    console.log('\n✅ 数据库加密功能运行正常！\n');
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    // 清理
    console.log('🧹 清理测试文件...');
    cleanup();
    console.log('✅ 清理完成\n');
  }
}

// 运行测试
runTests();
