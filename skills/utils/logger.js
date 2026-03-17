/**
 * 日志脱敏工具
 * 用于过滤日志中的敏感信息，确保安全性
 */

const SENSITIVE_PATTERNS = [
  { 
    name: 'email', 
    regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, 
    replacement: '[EMAIL]' 
  },
  { 
    name: 'phone', 
    regex: /\b1[3-9]\d{9}\b/g, 
    replacement: '[PHONE]' 
  },
  { 
    name: 'id_card', 
    regex: /\b\d{17}[\dXx]\b/g, 
    replacement: '[ID_CARD]' 
  },
  { 
    name: 'api_key', 
    regex: /\b[a-zA-Z0-9]{20,}\b/g, 
    replacement: '[API_KEY]' 
  },
  { 
    name: 'password', 
    regex: /password["']?\s*[:=]\s*["']?[^"'\s]+/gi, 
    replacement: 'password: [REDACTED]' 
  },
  {
    name: 'secret',
    regex: /secret["']?\s*[:=]\s*["']?[^"'\s]+/gi,
    replacement: 'secret: [REDACTED]'
  },
  {
    name: 'token',
    regex: /token["']?\s*[:=]\s*["']?[^"'\s]+/gi,
    replacement: 'token: [REDACTED]'
  },
  {
    name: 'appid',
    regex: /appid["']?\s*[:=]\s*["']?[^"'\s]+/gi,
    replacement: 'appid: [REDACTED]'
  }
];

/**
 * 脱敏单个字符串
 * @param {string} message - 需要脱敏的消息
 * @returns {string} - 脱敏后的消息
 */
function sanitizeLog(message) {
  if (typeof message !== 'string') {
    return message;
  }
  
  let sanitized = message;
  for (const pattern of SENSITIVE_PATTERNS) {
    sanitized = sanitized.replace(pattern.regex, pattern.replacement);
  }
  return sanitized;
}

/**
 * 深度脱敏对象
 * @param {any} obj - 需要脱敏的对象
 * @returns {any} - 脱敏后的对象
 */
function sanitizeObject(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return sanitizeLog(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    // 敏感字段名直接替换值
    const lowerKey = key.toLowerCase();
    if (['password', 'secret', 'token', 'appid', 'app_secret', 'bot_token', 'api_key', 'apikey'].includes(lowerKey)) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = sanitizeObject(value);
    }
  }
  return sanitized;
}

// 包装 console.log
const originalLog = console.log;
console.log = function(...args) {
  const sanitized = args.map(arg => {
    if (typeof arg === 'string') {
      return sanitizeLog(arg);
    } else if (typeof arg === 'object' && arg !== null) {
      return sanitizeObject(arg);
    }
    return arg;
  });
  originalLog.apply(console, sanitized);
};

// 包装 console.error
const originalError = console.error;
console.error = function(...args) {
  const sanitized = args.map(arg => {
    if (typeof arg === 'string') {
      return sanitizeLog(arg);
    } else if (typeof arg === 'object' && arg !== null) {
      return sanitizeObject(arg);
    }
    return arg;
  });
  originalError.apply(console, sanitized);
};

// 包装 console.warn
const originalWarn = console.warn;
console.warn = function(...args) {
  const sanitized = args.map(arg => {
    if (typeof arg === 'string') {
      return sanitizeLog(arg);
    } else if (typeof arg === 'object' && arg !== null) {
      return sanitizeObject(arg);
    }
    return arg;
  });
  originalWarn.apply(console, sanitized);
};

module.exports = { 
  sanitizeLog, 
  sanitizeObject,
  SENSITIVE_PATTERNS 
};
