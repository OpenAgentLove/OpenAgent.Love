/**
 * Input Validator Test Suite
 * 测试输入验证和 XSS 过滤功能
 */

const assert = require('assert');
const {
  validateName,
  validateId,
  validateUserId,
  validateSkills,
  validateRobotInfo,
  sanitizeXSS,
  sanitizeUnicode,
  validateNotEmpty,
  validateLength
} = require('../input-validator');

describe('Input Validator', () => {
  describe('validateName', () => {
    it('应该接受有效的名称', () => {
      const result = validateName('赵一');
      assert.strictEqual(result.valid, true);
      assert.strictEqual(result.value, '赵一');
    });

    it('应该拒绝空名称', () => {
      const result = validateName('');
      assert.strictEqual(result.valid, false);
      assert.ok(result.error.includes('不能为空'));
    });

    it('应该拒绝只包含空白的名称', () => {
      const result = validateName('   ');
      assert.strictEqual(result.valid, false);
    });

    it('应该过滤 XSS 攻击', () => {
      const result = validateName('<script>alert("xss")</script>');
      assert.strictEqual(result.valid, false);
    });

    it('应该过滤 HTML 标签', () => {
      const result = validateName('<b>坏蛋</b>');
      assert.strictEqual(result.valid, false);
    });

    it('应该拒绝过长的名称', () => {
      const longName = 'a'.repeat(51);
      const result = validateName(longName);
      assert.strictEqual(result.valid, false);
      assert.ok(result.error.includes('长度不能超过'));
    });

    it('应该清理特殊字符', () => {
      const result = validateName('测试@#$名称');
      assert.strictEqual(result.valid, true);
      assert.strictEqual(result.value, '测试名称');
    });
  });

  describe('validateId', () => {
    it('应该接受有效的 ID', () => {
      const result = validateId('robot_main_ou_12345678');
      assert.strictEqual(result.valid, true);
    });

    it('应该拒绝空 ID', () => {
      const result = validateId('');
      assert.strictEqual(result.valid, false);
    });

    it('应该拒绝包含特殊字符的 ID', () => {
      const result = validateId('robot<script>');
      assert.strictEqual(result.valid, false);
    });

    it('应该拒绝过短的 ID', () => {
      const result = validateId('abc');
      assert.strictEqual(result.valid, false);
    });
  });

  describe('validateUserId', () => {
    it('应该接受有效的飞书 open_id', () => {
      const result = validateUserId('ou_53229832be4b6bd9e43acd3896a11de7');
      assert.strictEqual(result.valid, true);
    });

    it('应该拒绝空用户 ID', () => {
      const result = validateUserId('');
      assert.strictEqual(result.valid, false);
    });

    it('应该拒绝格式错误的用户 ID', () => {
      const result = validateUserId('invalid<script>');
      assert.strictEqual(result.valid, false);
    });
  });

  describe('validateSkills', () => {
    it('应该接受有效的技能列表', () => {
      const result = validateSkills(['coding', 'testing', 'debugging']);
      assert.strictEqual(result.valid, true);
      assert.strictEqual(result.value.length, 3);
    });

    it('应该接受空技能列表', () => {
      const result = validateSkills([]);
      assert.strictEqual(result.valid, true);
    });

    it('应该拒绝非数组输入', () => {
      const result = validateSkills('not-an-array');
      assert.strictEqual(result.valid, false);
    });

    it('应该拒绝过多的技能', () => {
      const manySkills = Array(21).fill('skill');
      const result = validateSkills(manySkills);
      assert.strictEqual(result.valid, false);
    });

    it('应该过滤技能名称中的 XSS', () => {
      const result = validateSkills(['coding', '<script>xss</script>']);
      assert.strictEqual(result.valid, false);
    });
  });

  describe('validateRobotInfo', () => {
    it('应该接受有效的机器人信息', () => {
      const robotInfo = {
        agentId: 'main',
        userId: 'ou_53229832be4b6bd9e43acd3896a11de7',
        name: '赵一',
        skills: ['coding', 'testing']
      };
      const result = validateRobotInfo(robotInfo);
      assert.strictEqual(result.valid, true);
    });

    it('应该拒绝缺少必填字段的机器人信息', () => {
      const robotInfo = {
        agentId: 'main',
        userId: 'ou_53229832be4b6bd9e43acd3896a11de7'
        // 缺少 name
      };
      const result = validateRobotInfo(robotInfo);
      assert.strictEqual(result.valid, false);
    });

    it('应该过滤机器人名称中的 XSS', () => {
      const robotInfo = {
        agentId: 'main',
        userId: 'ou_53229832be4b6bd9e43acd3896a11de7',
        name: '<script>evil</script>'
      };
      const result = validateRobotInfo(robotInfo);
      assert.strictEqual(result.valid, false);
    });

    it('应该清理并验证技能列表', () => {
      const robotInfo = {
        agentId: 'main',
        userId: 'ou_53229832be4b6bd9e43acd3896a11de7',
        name: '赵一',
        skills: ['coding', '<b>bad</b>']
      };
      const result = validateRobotInfo(robotInfo);
      assert.strictEqual(result.valid, false);
    });
  });

  describe('sanitizeXSS', () => {
    it('应该移除 script 标签', () => {
      const input = '<script>alert("xss")</script>Hello';
      const result = sanitizeXSS(input);
      assert.strictEqual(result.includes('script'), false);
      assert.strictEqual(result.includes('Hello'), true);
    });

    it('应该移除所有 HTML 标签', () => {
      const input = '<b>Bold</b> <i>Italic</i>';
      const result = sanitizeXSS(input);
      assert.strictEqual(result.includes('<'), false);
      assert.strictEqual(result.includes('>'), false);
    });

    it('应该移除 javascript: 协议', () => {
      const input = 'javascript:alert(1)';
      const result = sanitizeXSS(input);
      assert.strictEqual(result.includes('javascript:'), false);
    });

    it('应该移除 on* 事件处理器', () => {
      const input = '<img src=x onerror=alert(1)>';
      const result = sanitizeXSS(input);
      assert.strictEqual(result.includes('onerror'), false);
    });

    it('应该处理 HTML 实体编码', () => {
      const input = '&lt;script&gt;alert(1)&lt;/script&gt;';
      const result = sanitizeXSS(input);
      assert.strictEqual(result.includes('script'), false);
    });
  });

  describe('validateNotEmpty', () => {
    it('应该接受非空字符串', () => {
      const result = validateNotEmpty('hello', '测试字段');
      assert.strictEqual(result.valid, true);
    });

    it('应该拒绝 null', () => {
      const result = validateNotEmpty(null, '测试字段');
      assert.strictEqual(result.valid, false);
    });

    it('应该拒绝 undefined', () => {
      const result = validateNotEmpty(undefined, '测试字段');
      assert.strictEqual(result.valid, false);
    });

    it('应该拒绝空字符串', () => {
      const result = validateNotEmpty('', '测试字段');
      assert.strictEqual(result.valid, false);
    });

    it('应该拒绝只包含空白的字符串', () => {
      const result = validateNotEmpty('   ', '测试字段');
      assert.strictEqual(result.valid, false);
    });
  });

  describe('validateLength', () => {
    it('应该接受在长度范围内的字符串', () => {
      const result = validateLength('hello', 1, 10, '测试字段');
      assert.strictEqual(result.valid, true);
    });

    it('应该拒绝过短的字符串', () => {
      const result = validateLength('hi', 5, 10, '测试字段');
      assert.strictEqual(result.valid, false);
    });

    it('应该拒绝过长的字符串', () => {
      const result = validateLength('hello world', 1, 5, '测试字段');
      assert.strictEqual(result.valid, false);
    });
  });
});

console.log('\n✅ 所有输入验证测试用例已定义');
