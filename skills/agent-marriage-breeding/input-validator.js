/**
 * Input Validator - 输入验证和 XSS 过滤工具
 * 为 Agent Marriage Breeding 系统提供安全输入验证
 * 
 * @module InputValidator
 * @author ZhaoYi
 * @created 2026-03-18
 */

const crypto = require('crypto');

/**
 * 验证字符串是否为空或只包含空白字符
 * @param {string} value - 待验证的值
 * @param {string} fieldName - 字段名称（用于错误消息）
 * @returns {Object} 验证结果 { valid: boolean, error?: string }
 */
function validateNotEmpty(value, fieldName = '字段') {
  if (value === undefined || value === null) {
    return { valid: false, error: `${fieldName} 不能为空` };
  }
  
  if (typeof value !== 'string') {
    return { valid: false, error: `${fieldName} 必须是字符串类型` };
  }
  
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: `${fieldName} 不能为空或只包含空白字符` };
  }
  
  return { valid: true };
}

/**
 * 验证字符串长度
 * @param {string} value - 待验证的值
 * @param {number} minLength - 最小长度
 * @param {number} maxLength - 最大长度
 * @param {string} fieldName - 字段名称
 * @returns {Object} 验证结果
 */
function validateLength(value, minLength, maxLength, fieldName = '字段') {
  if (typeof value !== 'string') {
    return { valid: false, error: `${fieldName} 必须是字符串类型` };
  }
  
  const length = value.length;
  if (length < minLength) {
    return { valid: false, error: `${fieldName} 长度不能少于 ${minLength} 个字符` };
  }
  
  if (length > maxLength) {
    return { valid: false, error: `${fieldName} 长度不能超过 ${maxLength} 个字符` };
  }
  
  return { valid: true };
}

/**
 * 过滤 XSS 攻击（HTML 标签和 script 注入）
 * @param {string} value - 待过滤的值
 * @returns {string} 过滤后的值
 */
function sanitizeXSS(value) {
  if (typeof value !== 'string') {
    return String(value);
  }
  
  let sanitized = value;
  
  // 1. 移除 script 标签及其内容
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // 2. 移除其他 HTML 标签
  sanitized = sanitized.replace(/<[^>]*>/g, '');
  
  // 3. 移除 javascript: 协议
  sanitized = sanitized.replace(/javascript:/gi, '');
  
  // 4. 移除 on* 事件处理器（如 onclick, onerror 等）
  sanitized = sanitized.replace(/on\w+\s*=/gi, '');
  
  // 5. 移除 data: 协议（可能用于 XSS）
  sanitized = sanitized.replace(/data:/gi, '');
  
  // 6. 移除 vbscript: 协议
  sanitized = sanitized.replace(/vbscript:/gi, '');
  
  // 7. 解码 HTML 实体后再次检查（防止双重编码攻击）
  const decoded = decodeHTMLEntities(sanitized);
  if (decoded !== sanitized) {
    return sanitizeXSS(decoded);
  }
  
  return sanitized;
}

/**
 * 解码 HTML 实体
 * @param {string} str - 包含 HTML 实体的字符串
 * @returns {string} 解码后的字符串
 */
function decodeHTMLEntities(str) {
  const entities = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&#x27;': "'",
    '&#x2F;': '/',
    '&#x60;': '`',
    '&nbsp;': ' '
  };
  
  return str.replace(/&[^;]+;/g, (match) => {
    return entities[match.toLowerCase()] || match;
  });
}

/**
 * 验证并清理名称（用于机器人名称、Agent 名称等）
 * @param {string} name - 名称
 * @param {Object} options - 验证选项
 * @param {number} options.minLength - 最小长度（默认 1）
 * @param {number} options.maxLength - 最大长度（默认 50）
 * @param {boolean} options.allowEmoji - 是否允许 emoji（默认 true）
 * @returns {Object} 验证结果 { valid: boolean, value?: string, error?: string }
 */
function validateName(name, options = {}) {
  const {
    minLength = 1,
    maxLength = 50,
    allowEmoji = true
  } = options;
  
  // 1. 检查是否为空
  const notEmptyResult = validateNotEmpty(name, '名称');
  if (!notEmptyResult.valid) {
    return notEmptyResult;
  }
  
  // 2. 过滤 XSS
  let cleaned = sanitizeXSS(name.trim());
  
  // 3. 检查长度
  const lengthResult = validateLength(cleaned, minLength, maxLength, '名称');
  if (!lengthResult.valid) {
    return lengthResult;
  }
  
  // 4. 检查特殊字符（可选）
  if (!allowEmoji) {
    // 移除 emoji
    cleaned = cleaned.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
  }
  
  // 5. 检查是否包含危险字符
  const dangerousChars = /[`~!@#$%^&*()_|+\-=?;:'",.<>{}[\]\\/]/g;
  if (dangerousChars.test(cleaned)) {
    // 移除危险字符，但保留中文、英文、数字、空格、连字符、下划线
    cleaned = cleaned.replace(/[^a-zA-Z0-9\u4e00-\u9fa5\s\-_]/g, '');
  }
  
  // 6. 最终检查
  if (cleaned.trim().length === 0) {
    return { valid: false, error: '名称包含无效字符，请使用中文、英文、数字或下划线' };
  }
  
  return { valid: true, value: cleaned.trim() };
}

/**
 * 验证 ID 格式（robotId, agentId, marriageId 等）
 * @param {string} id - ID 值
 * @param {string} idType - ID 类型（'robot', 'agent', 'marriage' 等）
 * @returns {Object} 验证结果
 */
function validateId(id, idType = 'ID') {
  // 1. 检查是否为空
  const notEmptyResult = validateNotEmpty(id, idType);
  if (!notEmptyResult.valid) {
    return notEmptyResult;
  }
  
  // 2. 检查格式（应该只包含字母、数字、下划线）
  const idPattern = /^[a-zA-Z0-9_]+$/;
  if (!idPattern.test(id)) {
    return { valid: false, error: `${idType} 格式不正确，只能包含字母、数字和下划线` };
  }
  
  // 3. 检查长度
  const lengthResult = validateLength(id, 5, 100, idType);
  if (!lengthResult.valid) {
    return lengthResult;
  }
  
  return { valid: true };
}

/**
 * 验证用户 ID（如飞书 open_id）
 * @param {string} userId - 用户 ID
 * @returns {Object} 验证结果
 */
function validateUserId(userId) {
  // 1. 检查是否为空
  const notEmptyResult = validateNotEmpty(userId, '用户 ID');
  if (!notEmptyResult.valid) {
    return notEmptyResult;
  }
  
  // 2. 验证格式（飞书 open_id 格式：ou_xxx）
  const userIdPattern = /^ou_[a-zA-Z0-9]{32}$/;
  if (!userIdPattern.test(userId)) {
    // 允许其他格式的用户 ID，但至少要有基本格式
    if (userId.length < 5 || !/^[a-zA-Z0-9_]+$/.test(userId)) {
      return { valid: false, error: '用户 ID 格式不正确' };
    }
  }
  
  return { valid: true };
}

/**
 * 验证技能列表
 * @param {Array} skills - 技能列表
 * @param {Object} options - 验证选项
 * @param {number} options.maxSkills - 最大技能数量（默认 20）
 * @returns {Object} 验证结果
 */
function validateSkills(skills, options = {}) {
  const { maxSkills = 20 } = options;
  
  // 1. 检查是否为数组
  if (!Array.isArray(skills)) {
    return { valid: false, error: '技能必须是数组类型' };
  }
  
  // 2. 检查数量
  if (skills.length > maxSkills) {
    return { valid: false, error: `技能数量不能超过 ${maxSkills} 个` };
  }
  
  // 3. 验证每个技能
  const validSkills = [];
  for (let i = 0; i < skills.length; i++) {
    const skill = skills[i];
    
    // 检查类型
    if (typeof skill !== 'string') {
      return { valid: false, error: `第 ${i + 1} 个技能必须是字符串` };
    }
    
    // 过滤 XSS
    const cleaned = sanitizeXSS(skill.trim());
    
    // 检查格式
    if (!/^[a-zA-Z0-9_\-]+$/.test(cleaned)) {
      return { valid: false, error: `技能 "${skill}" 包含无效字符` };
    }
    
    // 检查长度
    if (cleaned.length > 50) {
      return { valid: false, error: `技能 "${skill}" 名称过长` };
    }
    
    validSkills.push(cleaned);
  }
  
  return { valid: true, value: validSkills };
}

/**
 * 验证数字范围
 * @param {number} value - 数字值
 * @param {number} min - 最小值
 * @param {number} max - 最大值
 * @param {string} fieldName - 字段名称
 * @returns {Object} 验证结果
 */
function validateNumberRange(value, min, max, fieldName = '数字') {
  // 1. 检查类型
  if (typeof value !== 'number') {
    return { valid: false, error: `${fieldName} 必须是数字类型` };
  }
  
  // 2. 检查 NaN
  if (isNaN(value)) {
    return { valid: false, error: `${fieldName} 不能是 NaN` };
  }
  
  // 3. 检查范围
  if (value < min || value > max) {
    return { valid: false, error: `${fieldName} 必须在 ${min} 到 ${max} 之间` };
  }
  
  return { valid: true };
}

/**
 * 验证对象结构
 * @param {Object} obj - 待验证的对象
 * @param {Object} schema - 验证模式
 * @returns {Object} 验证结果
 */
function validateObject(obj, schema) {
  if (typeof obj !== 'object' || obj === null) {
    return { valid: false, error: '必须是对象类型' };
  }
  
  const errors = [];
  
  for (const [field, rules] of Object.entries(schema)) {
    const value = obj[field];
    
    // 检查必填字段
    if (rules.required && (value === undefined || value === null)) {
      errors.push(`${field} 是必填字段`);
      continue;
    }
    
    // 如果字段不存在且非必填，跳过
    if (value === undefined || value === null) {
      continue;
    }
    
    // 检查类型
    if (rules.type) {
      if (rules.type === 'array' && !Array.isArray(value)) {
        errors.push(`${field} 必须是数组类型`);
        continue;
      } else if (rules.type !== 'array' && typeof value !== rules.type) {
        errors.push(`${field} 必须是 ${rules.type} 类型`);
        continue;
      }
    }
    
    // 检查字符串长度
    if (rules.type === 'string' && rules.minLength !== undefined) {
      const lengthResult = validateLength(value, rules.minLength, rules.maxLength || Infinity, field);
      if (!lengthResult.valid) {
        errors.push(lengthResult.error);
      }
    }
    
    // 检查数字范围
    if (rules.type === 'number' && (rules.min !== undefined || rules.max !== undefined)) {
      const min = rules.min !== undefined ? rules.min : -Infinity;
      const max = rules.max !== undefined ? rules.max : Infinity;
      const rangeResult = validateNumberRange(value, min, max, field);
      if (!rangeResult.valid) {
        errors.push(rangeResult.error);
      }
    }
  }
  
  if (errors.length > 0) {
    return { valid: false, error: errors.join('; ') };
  }
  
  return { valid: true };
}

/**
 * 生成安全的哈希值（用于数据完整性校验）
 * @param {Object} data - 待哈希的数据
 * @returns {string} 哈希值
 */
function generateHash(data) {
  const str = JSON.stringify(data);
  return crypto.createHash('sha256').update(str).digest('hex').substring(0, 16);
}

/**
 * 验证数据完整性
 * @param {Object} data - 数据对象
 * @param {string} expectedHash - 期望的哈希值
 * @returns {Object} 验证结果
 */
function verifyDataIntegrity(data, expectedHash) {
  const actualHash = generateHash(data);
  if (actualHash !== expectedHash) {
    return { valid: false, error: '数据完整性校验失败，数据可能已被篡改' };
  }
  return { valid: true };
}

/**
 * 清理 Unicode 控制字符
 * @param {string} str - 待清理的字符串
 * @returns {string} 清理后的字符串
 */
function sanitizeUnicode(str) {
  if (typeof str !== 'string') {
    return String(str);
  }
  
  // 移除 Unicode 控制字符（但保留正常的空白字符）
  return str.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '');
}

/**
 * 综合验证机器人信息
 * @param {Object} robotInfo - 机器人信息对象
 * @returns {Object} 验证结果
 */
function validateRobotInfo(robotInfo) {
  // 验证对象结构
  const schemaResult = validateObject(robotInfo, {
    agentId: { type: 'string', required: true, minLength: 1, maxLength: 50 },
    userId: { type: 'string', required: true, minLength: 5, maxLength: 100 },
    name: { type: 'string', required: true, minLength: 1, maxLength: 50 },
    skills: { type: 'array', required: false }
  });
  
  if (!schemaResult.valid) {
    return schemaResult;
  }
  
  // 验证名称
  const nameResult = validateName(robotInfo.name);
  if (!nameResult.valid) {
    return nameResult;
  }
  
  // 验证用户 ID
  const userIdResult = validateUserId(robotInfo.userId);
  if (!userIdResult.valid) {
    return userIdResult;
  }
  
  // 验证技能列表（如果提供）
  if (robotInfo.skills !== undefined) {
    const skillsResult = validateSkills(robotInfo.skills);
    if (!skillsResult.valid) {
      return skillsResult;
    }
    // 更新技能列表为清理后的值
    robotInfo.skills = skillsResult.value;
  }
  
  // 清理 agentId 和 userId
  robotInfo.agentId = sanitizeXSS(robotInfo.agentId.trim());
  robotInfo.userId = sanitizeXSS(robotInfo.userId.trim());
  robotInfo.name = nameResult.value;
  
  return { valid: true, value: robotInfo };
}

module.exports = {
  // 基础验证
  validateNotEmpty,
  validateLength,
  validateNumberRange,
  validateObject,
  
  // 专用验证
  validateName,
  validateId,
  validateUserId,
  validateSkills,
  validateRobotInfo,
  
  // 清理函数
  sanitizeXSS,
  sanitizeUnicode,
  decodeHTMLEntities,
  
  // 完整性校验
  generateHash,
  verifyDataIntegrity
};
