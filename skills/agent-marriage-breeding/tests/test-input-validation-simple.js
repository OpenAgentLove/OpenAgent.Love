/**
 * Input Validator Simple Test
 * 简单测试输入验证功能（不需要测试框架）
 */

const {
  validateName,
  validateId,
  validateUserId,
  validateSkills,
  validateRobotInfo,
  sanitizeXSS
} = require('../input-validator');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (error) {
    console.log(`✗ ${name}`);
    console.log(`  Error: ${error.message}`);
    failed++;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

console.log('🧪 输入验证测试开始\n');

// validateName 测试
test('validateName: 接受有效的中文名称', () => {
  const result = validateName('赵一');
  assert(result.valid === true, '应该验证通过');
  assert(result.value === '赵一', '值应该保持不变');
});

test('validateName: 接受有效的英文名称', () => {
  const result = validateName('ZhaoYi');
  assert(result.valid === true);
});

test('validateName: 拒绝空名称', () => {
  const result = validateName('');
  assert(result.valid === false);
  assert(result.error.includes('不能为空'));
});

test('validateName: 拒绝空白名称', () => {
  const result = validateName('   ');
  assert(result.valid === false);
});

test('validateName: 过滤 XSS 攻击', () => {
  const result = validateName('<script>alert("xss")</script>');
  assert(result.valid === false, 'XSS 攻击应该被拒绝');
});

test('validateName: 过滤 HTML 标签', () => {
  const result = validateName('<b>测试</b>');
  // HTML 标签会被移除，剩下的有效文本会被接受
  assert(result.valid === true, '清理后的有效文本应该被接受');
  assert(result.value === '测试', '应该只保留清理后的文本');
});

test('validateName: 拒绝过长名称', () => {
  const result = validateName('a'.repeat(51));
  assert(result.valid === false);
  assert(result.error.includes('长度不能超过'));
});

test('validateName: 清理特殊字符', () => {
  const result = validateName('测试@#名称');
  assert(result.valid === true);
  assert(result.value === '测试名称', `特殊字符应该被清理，实际得到：${result.value}`);
});

// validateId 测试
test('validateId: 接受有效的机器人 ID', () => {
  const result = validateId('robot_main_ou_12345678');
  assert(result.valid === true);
});

test('validateId: 拒绝空 ID', () => {
  const result = validateId('');
  assert(result.valid === false);
});

test('validateId: 拒绝特殊字符', () => {
  const result = validateId('robot<script>');
  assert(result.valid === false);
});

test('validateId: 拒绝过短 ID', () => {
  const result = validateId('abc');
  assert(result.valid === false);
});

// validateUserId 测试
test('validateUserId: 接受有效的飞书 open_id', () => {
  const result = validateUserId('ou_53229832be4b6bd9e43acd3896a11de7');
  assert(result.valid === true);
});

test('validateUserId: 拒绝空用户 ID', () => {
  const result = validateUserId('');
  assert(result.valid === false);
});

// validateSkills 测试
test('validateSkills: 接受有效的技能列表', () => {
  const result = validateSkills(['coding', 'testing', 'debugging']);
  assert(result.valid === true);
  assert(result.value.length === 3);
});

test('validateSkills: 接受空技能列表', () => {
  const result = validateSkills([]);
  assert(result.valid === true);
});

test('validateSkills: 拒绝非数组', () => {
  const result = validateSkills('not-an-array');
  assert(result.valid === false);
});

test('validateSkills: 拒绝过多技能', () => {
  const result = validateSkills(Array(21).fill('skill'));
  assert(result.valid === false);
});

test('validateSkills: 拒绝包含 XSS 的技能名', () => {
  const result = validateSkills(['coding', '<script>xss</script>']);
  assert(result.valid === false);
});

// validateRobotInfo 测试
test('validateRobotInfo: 接受有效的机器人信息', () => {
  const robotInfo = {
    agentId: 'main',
    userId: 'ou_53229832be4b6bd9e43acd3896a11de7',
    name: '赵一',
    skills: ['coding', 'testing']
  };
  const result = validateRobotInfo(robotInfo);
  assert(result.valid === true, `应该验证通过：${result.error}`);
});

test('validateRobotInfo: 拒绝缺少必填字段', () => {
  const robotInfo = {
    agentId: 'main',
    userId: 'ou_53229832be4b6bd9e43acd3896a11de7'
    // 缺少 name
  };
  const result = validateRobotInfo(robotInfo);
  assert(result.valid === false);
});

test('validateRobotInfo: 过滤名称中的 XSS', () => {
  const robotInfo = {
    agentId: 'main',
    userId: 'ou_53229832be4b6bd9e43acd3896a11de7',
    name: '<script>evil</script>'
  };
  const result = validateRobotInfo(robotInfo);
  assert(result.valid === false);
});

// sanitizeXSS 测试
test('sanitizeXSS: 移除 script 标签', () => {
  const result = sanitizeXSS('<script>alert("xss")</script>Hello');
  assert(!result.includes('script'), '应该移除 script 标签');
  assert(result.includes('Hello'), '应该保留正常文本');
});

test('sanitizeXSS: 移除所有 HTML 标签', () => {
  const result = sanitizeXSS('<b>Bold</b> <i>Italic</i>');
  assert(!result.includes('<'), '应该移除 <');
  assert(!result.includes('>'), '应该移除 >');
});

test('sanitizeXSS: 移除 javascript: 协议', () => {
  const result = sanitizeXSS('javascript:alert(1)');
  assert(!result.includes('javascript:'));
});

test('sanitizeXSS: 处理 HTML 实体编码', () => {
  const result = sanitizeXSS('&lt;script&gt;alert(1)&lt;/script&gt;');
  assert(!result.includes('script'), '应该解码并过滤');
});

// 总结
console.log('\n' + '='.repeat(50));
console.log(`测试结果：${passed} 通过，${failed} 失败`);
console.log('='.repeat(50));

if (failed > 0) {
  console.log('\n❌ 部分测试失败');
  process.exit(1);
} else {
  console.log('\n✅ 所有测试通过！');
  process.exit(0);
}
