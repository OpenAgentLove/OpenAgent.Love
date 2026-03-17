#!/usr/bin/env node

/**
 * 数据库加密迁移工具
 * 
 * 用途：
 * 1. 将未加密的 SQLite 数据库迁移到加密数据库
 * 2. 验证迁移后的数据完整性
 * 3. 备份原始数据库
 * 
 * 使用方法：
 *   node scripts/migrate-encryption.js [数据库路径] [选项]
 * 
 * 示例：
 *   node scripts/migrate-encryption.js ./data/evolution.db              # 迁移数据库
 *   node scripts/migrate-encryption.js ./data/evolution.db --backup    # 迁移并保留备份
 *   node scripts/migrate-encryption.js --check                         # 检查数据库加密状态
 */

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// 检查命令行参数
const args = process.argv.slice(2);
const helpFlags = ['--help', '-h', 'help'];

if (args.some(arg => helpFlags.includes(arg))) {
  console.log(`
🔐 数据库加密迁移工具

用法:
  node scripts/migrate-encryption.js [数据库路径] [选项]

选项:
  --help, -h           显示此帮助信息
  --check              检查数据库加密状态
  --backup             迁移前创建备份
  --force              强制迁移（即使已加密）
  --verify             迁移后验证数据完整性

示例:
  node scripts/migrate-encryption.js ./data/evolution.db
  node scripts/migrate-encryption.js ./data/evolution.db --backup --verify
  node scripts/migrate-encryption.js --check

注意事项:
  - 迁移前会自动创建备份（.backup 后缀）
  - 需要设置 DATABASE_ENCRYPTION_KEY 环境变量
  - 迁移过程不可逆，请确保备份安全
`);
  process.exit(0);
}

// 检查加密状态
if (args.includes('--check')) {
  checkEncryptionStatus();
  process.exit(0);
}

// 主迁移流程
async function migrateEncryption() {
  console.log('🔐 数据库加密迁移工具\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // 获取数据库路径
  let dbPath = args.find(arg => !arg.startsWith('--'));
  if (!dbPath) {
    dbPath = path.join(__dirname, '..', 'data', 'evolution.db');
  }
  dbPath = path.resolve(dbPath);
  
  console.log('📁 数据库路径:', dbPath);
  
  // 检查数据库是否存在
  if (!fs.existsSync(dbPath)) {
    console.error('❌ 数据库文件不存在:', dbPath);
    console.log('\n提示：如果是新数据库，直接启用加密即可，无需迁移。');
    process.exit(1);
  }
  
  // 检查是否已加密
  console.log('\n🔍 检查数据库加密状态...');
  const isAlreadyEncrypted = checkDatabaseEncrypted(dbPath);
  
  if (isAlreadyEncrypted && !args.includes('--force')) {
    console.log('✅ 数据库已经加密，无需迁移');
    console.log('\n提示：使用 --force 强制重新加密');
    process.exit(0);
  }
  
  // 检查加密密钥
  const encryptionKey = process.env.DATABASE_ENCRYPTION_KEY;
  if (!encryptionKey) {
    console.error('❌ 未设置加密密钥');
    console.log('\n请设置环境变量:');
    console.log('  export DATABASE_ENCRYPTION_KEY=<your-key>');
    console.log('\n或运行生成工具:');
    console.log('  node scripts/generate-key.js');
    process.exit(1);
  }
  
  console.log('✅ 加密密钥已配置');
  
  // 创建备份
  if (args.includes('--backup') || true) { // 默认总是备份
    console.log('\n💾 创建数据库备份...');
    const backupPath = dbPath + '.backup.' + Date.now();
    
    try {
      fs.copyFileSync(dbPath, backupPath);
      console.log('✅ 备份已创建:', backupPath);
      
      // 计算原始数据库的校验和
      const originalChecksum = calculateChecksum(dbPath);
      fs.writeFileSync(backupPath + '.checksum', originalChecksum);
      console.log('✅ 校验和已保存');
    } catch (error) {
      console.error('❌ 创建备份失败:', error.message);
      process.exit(1);
    }
  }
  
  // 执行迁移
  console.log('\n🔄 开始迁移数据库...');
  
  try {
    // 使用 better-sqlite3-multiple-ciphers 打开数据库
    const Database = require('better-sqlite3-multiple-ciphers');
    const db = new Database(dbPath);
    
    // 应用加密密钥
    console.log('🔑 应用加密密钥...');
    db.pragma(`key='${encryptionKey}'`);
    
    // 重新加密数据库
    console.log('🔐 加密数据库...');
    db.pragma(`rekey='${encryptionKey}'`);
    
    // 配置加密参数
    db.pragma('cipher_page_size = 4096');
    db.pragma('cipher_kdf_iter = 256000');
    
    // 验证加密
    const cipherVersion = db.pragma('cipher_version');
    if (!cipherVersion || cipherVersion.length === 0) {
      throw new Error('加密验证失败');
    }
    
    console.log('✅ 数据库已加密');
    
    // 验证数据完整性
    if (args.includes('--verify')) {
      console.log('\n🔍 验证数据完整性...');
      verifyDataIntegrity(db);
    }
    
    // 获取统计信息
    const stats = getDatabaseStats(db);
    console.log('\n📊 数据库统计:');
    console.log('   表数量:', stats.tableCount);
    console.log('   机器人数量:', stats.robotCount);
    console.log('   Agent 数量:', stats.agentCount);
    console.log('   婚姻记录:', stats.marriageCount);
    
    db.close();
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ 数据库加密迁移成功！');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('📋 后续步骤:');
    console.log('   1. 验证应用程序能正常访问数据库');
    console.log('   2. 安全保存加密密钥');
    console.log('   3. 保留备份文件至少 7 天');
    console.log('   4. 更新文档和配置\n');
    
  } catch (error) {
    console.error('\n❌ 迁移失败:', error.message);
    console.error('\n⚠️  如果迁移失败，可以从备份恢复:');
    console.log('   cp ' + dbPath + '.backup.* ' + dbPath);
    process.exit(1);
  }
}

/**
 * 检查数据库是否已加密
 */
function checkDatabaseEncrypted(dbPath) {
  try {
    const Database = require('better-sqlite3-multiple-ciphers');
    const db = new Database(dbPath);
    
    try {
      const result = db.pragma('cipher_version');
      db.close();
      return result && result.length > 0;
    } catch (error) {
      db.close();
      return false;
    }
  } catch (error) {
    console.warn('⚠️  无法打开数据库:', error.message);
    return false;
  }
}

/**
 * 检查加密状态
 */
function checkEncryptionStatus() {
  console.log('🔍 检查数据库加密状态...\n');
  
  let dbPath = args.find(arg => !arg.startsWith('--'));
  if (!dbPath) {
    dbPath = path.join(__dirname, '..', 'data', 'evolution.db');
  }
  dbPath = path.resolve(dbPath);
  
  console.log('数据库路径:', dbPath);
  console.log('文件存在:', fs.existsSync(dbPath) ? '✅ 是' : '❌ 否');
  
  if (fs.existsSync(dbPath)) {
    const isEncrypted = checkDatabaseEncrypted(dbPath);
    console.log('加密状态:', isEncrypted ? '✅ 已加密' : '❌ 未加密');
    
    if (isEncrypted) {
      try {
        const Database = require('better-sqlite3-multiple-ciphers');
        const db = new Database(dbPath);
        
        const key = process.env.DATABASE_ENCRYPTION_KEY;
        if (key) {
          db.pragma(`key='${key}'`);
          
          try {
            const cipherVersion = db.pragma('cipher_version');
            console.log('密钥验证:', cipherVersion.length > 0 ? '✅ 正确' : '❌ 错误');
            
            if (cipherVersion.length > 0) {
              const stats = getDatabaseStats(db);
              console.log('\n📊 数据库统计:');
              console.log('   表数量:', stats.tableCount);
              console.log('   机器人数量:', stats.robotCount);
              console.log('   Agent 数量:', stats.agentCount);
            }
          } catch (error) {
            console.log('密钥验证:', '❌ 错误（密钥不匹配）');
          }
        } else {
          console.log('密钥配置:', '❌ 未设置 DATABASE_ENCRYPTION_KEY');
        }
        
        db.close();
      } catch (error) {
        console.log('⚠️  无法检查详细信息:', error.message);
      }
    }
  }
  
  console.log('\n密钥配置:');
  console.log('  环境变量:', process.env.DATABASE_ENCRYPTION_KEY ? '✅ 已设置' : '❌ 未设置');
  
  const keyFile = path.join(__dirname, '..', 'data', '.db_key');
  console.log('  密钥文件:', fs.existsSync(keyFile) ? '✅ 存在' : '❌ 不存在');
}

/**
 * 计算文件校验和
 */
function calculateChecksum(filePath) {
  const data = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * 验证数据完整性
 */
function verifyDataIntegrity(db) {
  try {
    // 检查所有表
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log('   表检查: ✅ 通过 (' + tables.length + ' 个表)');
    
    // 检查 robots 表
    const robotCount = db.prepare('SELECT COUNT(*) as count FROM robots').get().count;
    console.log('   Robots 表: ✅ 通过 (' + robotCount + ' 条记录)');
    
    // 检查 agents 表
    const agentCount = db.prepare('SELECT COUNT(*) as count FROM agents').get().count;
    console.log('   Agents 表: ✅ 通过 (' + agentCount + ' 条记录)');
    
    // 检查 marriages 表
    const marriageCount = db.prepare('SELECT COUNT(*) as count FROM marriages').get().count;
    console.log('   Marriages 表: ✅ 通过 (' + marriageCount + ' 条记录)');
    
    // 执行完整性检查
    const integrityCheck = db.pragma('integrity_check');
    if (integrityCheck[0]['integrity_check'] === 'ok') {
      console.log('   完整性检查: ✅ 通过');
    } else {
      throw new Error('完整性检查失败');
    }
    
    console.log('✅ 数据完整性验证通过');
  } catch (error) {
    console.error('❌ 数据完整性验证失败:', error.message);
    throw error;
  }
}

/**
 * 获取数据库统计信息
 */
function getDatabaseStats(db) {
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  
  let robotCount = 0, agentCount = 0, marriageCount = 0;
  
  try {
    robotCount = db.prepare('SELECT COUNT(*) as count FROM robots').get().count;
  } catch (e) {}
  
  try {
    agentCount = db.prepare('SELECT COUNT(*) as count FROM agents').get().count;
  } catch (e) {}
  
  try {
    marriageCount = db.prepare('SELECT COUNT(*) as count FROM marriages').get().count;
  } catch (e) {}
  
  return {
    tableCount: tables.length,
    robotCount,
    agentCount,
    marriageCount
  };
}

// 运行迁移
migrateEncryption().catch(error => {
  console.error('❌ 迁移过程发生错误:', error.message);
  process.exit(1);
});
