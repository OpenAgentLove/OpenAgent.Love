/**
 * 数据库密钥管理模块
 * 
 * 功能：
 * 1. 从环境变量读取加密密钥
 * 2. 生成安全的随机密钥
 * 3. 密钥验证和格式化
 * 
 * 安全要求：
 * - 密钥必须从环境变量读取，禁止硬编码
 * - 密钥长度至少 32 字节（256 位）
 * - 支持密钥轮换
 */

const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

class KeyManager {
  /**
   * 获取数据库加密密钥
   * 从环境变量读取，如果不存在则生成新密钥
   * 
   * @param {Object} options - 配置选项
   * @param {boolean} options.autoGenerate - 是否自动生成密钥（默认 true）
   * @param {string} options.keyFile - 密钥文件路径（可选）
   * @returns {string} 加密密钥（hex 格式）
   */
  static getEncryptionKey(options = {}) {
    const { autoGenerate = true, keyFile = null } = options;
    
    // 1. 尝试从环境变量读取
    let key = process.env.DATABASE_ENCRYPTION_KEY;
    
    if (key) {
      // 验证密钥格式
      const validated = this.validateKey(key);
      if (validated) {
        console.log('✅ 已从环境变量加载数据库加密密钥');
        return validated;
      }
    }
    
    // 2. 尝试从密钥文件读取
    if (keyFile && fs.existsSync(keyFile)) {
      try {
        key = fs.readFileSync(keyFile, 'utf8').trim();
        const validated = this.validateKey(key);
        if (validated) {
          console.log('✅ 已从密钥文件加载数据库加密密钥');
          return validated;
        }
      } catch (error) {
        console.warn('⚠️ 读取密钥文件失败:', error.message);
      }
    }
    
    // 3. 自动生成新密钥
    if (autoGenerate) {
      key = this.generateKey();
      console.log('🔑 已生成新的数据库加密密钥');
      
      // 保存到密钥文件（如果指定了路径）
      if (keyFile) {
        this.saveKeyToFile(key, keyFile);
      }
      
      return key;
    }
    
    // 4. 无法获取密钥
    throw new Error(
      '数据库加密密钥未配置。请设置环境变量 DATABASE_ENCRYPTION_KEY 或提供密钥文件路径。' +
      '运行 "node scripts/generate-key.js" 生成新密钥。'
    );
  }
  
  /**
   * 生成安全的随机密钥
   * 
   * @returns {string} 64 字符的 hex 字符串（32 字节/256 位）
   */
  static generateKey() {
    const key = crypto.randomBytes(32).toString('hex');
    console.log('🔐 已生成 256 位加密密钥');
    return key;
  }
  
  /**
   * 验证密钥格式
   * 
   * @param {string} key - 待验证的密钥
   * @returns {string|null} 验证通过的密钥（hex 格式），失败返回 null
   */
  static validateKey(key) {
    if (!key || typeof key !== 'string') {
      console.warn('⚠️ 密钥格式无效：密钥为空');
      return null;
    }
    
    // 去除前后空格
    key = key.trim();
    
    // 检查是否是 hex 格式（64 字符）
    if (/^[0-9a-fA-F]{64}$/.test(key)) {
      return key.toLowerCase();
    }
    
    // 检查是否是 base64 格式（44 字符）
    if (/^[A-Za-z0-9+/]{44}={0,2}$/.test(key)) {
      try {
        const buffer = Buffer.from(key, 'base64');
        if (buffer.length >= 32) {
          return buffer.slice(0, 32).toString('hex');
        }
      } catch (error) {
        console.warn('⚠️ 密钥格式无效：base64 解码失败');
        return null;
      }
    }
    
    // 检查是否是原始字符串（任意长度，都会哈希）
    if (key.length > 0) {
      // 使用 SHA-256 哈希转换为 32 字节
      const hash = crypto.createHash('sha256').update(key).digest('hex');
      console.log('⚠️ 密钥已使用 SHA-256 哈希处理');
      return hash;
    }
    
    console.warn('⚠️ 密钥格式无效：密钥为空');
    return null;
  }
  
  /**
   * 保存密钥到文件
   * 
   * @param {string} key - 密钥（hex 格式）
   * @param {string} filePath - 文件路径
   */
  static saveKeyToFile(key, filePath) {
    try {
      // 确保目录存在
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // 写入密钥文件（权限设置为 600，仅所有者可读写）
      fs.writeFileSync(filePath, key, { mode: 0o600 });
      console.log(`✅ 密钥已保存到：${filePath}`);
      console.log('⚠️  请妥善保管密钥文件，建议设置权限 chmod 600');
    } catch (error) {
      console.error('❌ 保存密钥文件失败:', error.message);
      throw error;
    }
  }
  
  /**
   * 从文件加载密钥
   * 
   * @param {string} filePath - 密钥文件路径
   * @returns {string|null} 密钥（hex 格式），失败返回 null
   */
  static loadKeyFromFile(filePath) {
    try {
      if (!fs.existsSync(filePath)) {
        console.warn(`⚠️ 密钥文件不存在：${filePath}`);
        return null;
      }
      
      const key = fs.readFileSync(filePath, 'utf8').trim();
      return this.validateKey(key);
    } catch (error) {
      console.error('❌ 加载密钥文件失败:', error.message);
      return null;
    }
  }
  
  /**
   * 轮换密钥（生成新密钥并重新加密数据库）
   * 
   * @param {Object} db - 数据库实例
   * @param {string} newKey - 新密钥
   * @param {string} oldKey - 旧密钥（可选，如果提供则先解密再加密）
   */
  static rotateKey(db, newKey, oldKey = null) {
    try {
      if (oldKey) {
        // 先用旧密钥解密
        db.pragma(`key='${oldKey}'`);
        
        // 验证旧密钥是否正确
        const result = db.pragma('cipher_version');
        if (!result || result.length === 0) {
          throw new Error('旧密钥验证失败，数据库可能已损坏或密钥错误');
        }
      }
      
      // 使用新密钥重新加密
      db.pragma(`rekey='${newKey}'`);
      
      console.log('✅ 密钥轮换成功');
      return true;
    } catch (error) {
      console.error('❌ 密钥轮换失败:', error.message);
      throw error;
    }
  }
  
  /**
   * 获取密钥信息（用于调试，不泄露密钥本身）
   * 
   * @returns {Object} 密钥信息
   */
  static getKeyInfo() {
    const key = process.env.DATABASE_ENCRYPTION_KEY;
    
    if (!key) {
      return {
        configured: false,
        message: '未配置加密密钥'
      };
    }
    
    const validated = this.validateKey(key);
    if (!validated) {
      return {
        configured: true,
        valid: false,
        message: '密钥格式无效'
      };
    }
    
    // 返回密钥信息（不泄露实际密钥）
    return {
      configured: true,
      valid: true,
      length: validated.length,
      prefix: validated.substring(0, 4) + '...',
      suffix: '...' + validated.substring(validated.length - 4),
      message: '密钥配置有效'
    };
  }
}

module.exports = KeyManager;
