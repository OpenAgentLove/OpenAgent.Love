#!/usr/bin/env node

/**
 * 数据库密钥生成工具
 * 
 * 用途：
 * 1. 生成新的数据库加密密钥
 * 2. 保存密钥到安全位置
 * 3. 输出配置建议
 * 
 * 使用方法：
 *   node scripts/generate-key.js [输出文件路径]
 * 
 * 示例：
 *   node scripts/generate-key.js                          # 生成并显示密钥
 *   node scripts/generate-key.js ./data/.db_key          # 生成并保存到文件
 *   node scripts/generate-key.js --help                  # 显示帮助
 */

const path = require('path');
const fs = require('fs');
const KeyManager = require('../key-manager');

// 解析命令行参数
const args = process.argv.slice(2);
const helpFlags = ['--help', '-h', 'help'];

if (args.some(arg => helpFlags.includes(arg))) {
  console.log(`
🔐 数据库密钥生成工具

用法:
  node scripts/generate-key.js [选项] [输出文件路径]

选项:
  --help, -h     显示此帮助信息
  --check        检查当前密钥配置状态
  
示例:
  node scripts/generate-key.js                          # 生成并显示密钥
  node scripts/generate-key.js ./data/.db_key          # 生成并保存到文件
  node scripts/generate-key.js --check                 # 检查密钥配置

安全提示:
  - 密钥文件应设置权限 chmod 600
  - 不要将密钥提交到版本控制系统
  - 建议将密钥添加到 .gitignore
  - 生产环境建议使用环境变量 DATABASE_ENCRYPTION_KEY
`);
  process.exit(0);
}

// 检查密钥配置状态
if (args.includes('--check')) {
  console.log('🔍 检查当前密钥配置...\n');
  
  const keyInfo = KeyManager.getKeyInfo();
  console.log('密钥配置状态:', keyInfo.configured ? '✅ 已配置' : '❌ 未配置');
  
  if (keyInfo.configured) {
    console.log('密钥有效性:', keyInfo.valid ? '✅ 有效' : '❌ 无效');
    if (keyInfo.valid) {
      console.log('密钥长度:', keyInfo.length, '位');
      console.log('密钥前缀:', keyInfo.prefix);
      console.log('密钥后缀:', keyInfo.suffix);
    }
  }
  
  console.log('\n消息:', keyInfo.message);
  
  // 检查密钥文件
  const defaultKeyFile = path.join(__dirname, '..', 'data', '.db_key');
  if (fs.existsSync(defaultKeyFile)) {
    console.log('\n✅ 密钥文件存在:', defaultKeyFile);
    
    // 检查文件权限
    try {
      const stats = fs.statSync(defaultKeyFile);
      const mode = stats.mode & 0o777;
      console.log('文件权限:', mode.toString(8));
      
      if (mode !== 0o600) {
        console.log('⚠️  警告：建议设置权限 chmod 600');
      }
    } catch (error) {
      console.log('⚠️  无法检查文件权限');
    }
  } else {
    console.log('\n⚠️  密钥文件不存在:', defaultKeyFile);
  }
  
  process.exit(0);
}

// 生成新密钥
console.log('🔐 正在生成数据库加密密钥...\n');

const newKey = KeyManager.generateKey();

console.log('✅ 密钥生成成功！\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📝 密钥信息:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('密钥长度：256 位 (64 字符 hex)');
console.log('密钥格式：', newKey);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// 如果提供了输出文件路径，保存密钥
if (args.length > 0 && !args[0].startsWith('--')) {
  const outputFile = path.resolve(args[0]);
  
  try {
    KeyManager.saveKeyToFile(newKey, outputFile);
    
    console.log('\n📁 保存位置:', outputFile);
    console.log('\n⚠️  安全提示:');
    console.log('   1. 设置文件权限：chmod 600', outputFile);
    console.log('   2. 不要将密钥文件提交到 Git');
    console.log('   3. 建议添加到 .gitignore');
    console.log('   4. 生产环境建议使用环境变量\n');
    
    // 生成 .gitignore 条目
    const gitignorePath = path.join(__dirname, '..', '.gitignore');
    const keyFileName = path.basename(outputFile);
    
    if (fs.existsSync(gitignorePath)) {
      const gitignore = fs.readFileSync(gitignorePath, 'utf8');
      if (!gitignore.includes(keyFileName)) {
        fs.appendFileSync(gitignorePath, `\n# 数据库密钥文件\n${keyFileName}\n`);
        console.log('✅ 已自动添加到 .gitignore');
      }
    }
  } catch (error) {
    console.error('❌ 保存密钥失败:', error.message);
    process.exit(1);
  }
} else {
  // 未指定输出文件，显示配置建议
  console.log('📋 配置建议:\n');
  console.log('方法 1: 使用环境变量（推荐用于生产环境）');
  console.log('  export DATABASE_ENCRYPTION_KEY="' + newKey + '"');
  console.log('  # 或添加到 .env 文件\n');
  
  console.log('方法 2: 保存到密钥文件');
  console.log('  node scripts/generate-key.js ./data/.db_key');
  console.log('  chmod 600 ./data/.db_key\n');
  
  console.log('方法 3: Docker 部署');
  console.log('  在 docker-compose.yml 中添加:');
  console.log('  environment:');
  console.log('    - DATABASE_ENCRYPTION_KEY=' + newKey + '\n');
}

console.log('⚠️  重要安全提示:');
console.log('   - 请妥善保管密钥，丢失后无法恢复数据');
console.log('   - 不要将密钥提交到版本控制系统');
console.log('   - 定期轮换密钥（建议每 90 天）');
console.log('   - 使用密钥管理工具（如 AWS Secrets Manager）\n');
