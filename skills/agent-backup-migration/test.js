/**
 * agent-backup-migration 技能测试脚本
 */

const { handleInput, INSTALL_WELCOME, PLAN_SELECTION, STEPS } = require('./skill.js');
const { clearUserState } = require('./skill.js');

console.log('🧪 开始测试 agent-backup-migration 技能...\n');

// 测试用户 ID
const testUserId = 'test_user_001';

let passedTests = 0;
let failedTests = 0;

function runTest(name, input, expected, resetBefore = false) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`${name}`);
  console.log('='.repeat(60));
  
  if (resetBefore) {
    clearUserState(testUserId);
  }
  
  try {
    const response = handleInput(testUserId, input);
    
    if (response.includes(expected)) {
      console.log(`✅ 通过`);
      console.log(`输入：${input || '(无)'}`);
      console.log(`输出匹配：${expected}`);
      passedTests++;
      return true;
    } else {
      console.log(`❌ 失败`);
      console.log(`输入：${input || '(无)'}`);
      console.log(`期望包含：${expected}`);
      console.log(`实际输出：${response.substring(0, 200)}...`);
      failedTests++;
      return false;
    }
  } catch (error) {
    console.log(`❌ 异常：${error.message}`);
    failedTests++;
    return false;
  }
}

// ========== 基础流程测试 ==========
console.log('\n📋 测试组 1: 基础流程测试\n');

runTest('测试 1: 开始流程', '开始', '开始备份迁移流程', true);
runTest('测试 2: 选择方案 1', '1', '本地复制');
runTest('测试 3: 配置本地复制', '小明，小红', '配置已记录');

// ========== 方案 2 测试 ==========
console.log('\n\n📋 测试组 2: SSH 克隆方案测试\n');

runTest('测试 4: 开始流程', '开始', '开始备份迁移流程', true);
runTest('测试 5: 选择方案 2', '2', 'SSH 克隆');
runTest('测试 6: SSH 配置', '192.168.1.100:22:root:password123', 'SSH 配置已记录');

// ========== 方案 3 测试 ==========
console.log('\n\n📋 测试组 3: 云备份方案测试\n');

runTest('测试 7: 开始流程', '开始', '开始备份迁移流程', true);
runTest('测试 8: 选择方案 3', '3', '云备份');
runTest('测试 9: 备份配置', '本地下载，一次性，完整备份', '备份配置已记录');

// ========== 特殊命令测试 ==========
console.log('\n\n📋 测试组 4: 特殊命令测试\n');

runTest('测试 10: 查看帮助', '帮助', '帮助文档', true);
runTest('测试 11: 查看对比', '对比', '方案详细对比', true);
// 先走一步再测试回退
clearUserState(testUserId);
handleInput(testUserId, '开始');
runTest('测试 12: 回退功能', '上一步', '已返回上一步', false);
runTest('测试 13: 查看状态', '状态', '当前进度', true);
runTest('测试 14: 重置流程', '重置', '已重置配置流程', true);

// ========== 方案对比测试 ==========
console.log('\n\n📋 测试组 5: 方案对比详情测试\n');

runTest('测试 15: 方案对比表', '对比', '本地复制', true);
runTest('测试 16: 方案对比表包含 SSH 克隆', '对比', 'SSH 克隆');
runTest('测试 17: 方案对比表包含云备份', '对比', '云备份');

// ========== 错误处理测试 ==========
console.log('\n\n📋 测试组 6: 错误处理测试\n');

clearUserState(testUserId);
handleInput(testUserId, '开始');
handleInput(testUserId, '1');
runTest('测试 18: 无效配置格式', '无效输入', '请按照格式提供');

// ========== 安装欢迎卡片测试 ==========
console.log('\n\n📋 测试组 7: 安装欢迎卡片测试\n');

const welcomeCard = INSTALL_WELCOME;
if (welcomeCard.includes('备份迁移技能安装成功') && 
    welcomeCard.includes('本地复制') && 
    welcomeCard.includes('SSH 克隆') && 
    welcomeCard.includes('云备份')) {
  console.log('✅ 安装欢迎卡片内容正确');
  passedTests++;
} else {
  console.log('❌ 安装欢迎卡片内容不完整');
  failedTests++;
}

// ========== 方案选择提示测试 ==========
console.log('\n\n📋 测试组 8: 方案选择提示测试\n');

const planSelection = PLAN_SELECTION;
if (planSelection.includes('备份迁移方案选择') && 
    planSelection.includes('本地复制') && 
    planSelection.includes('SSH 克隆') && 
    planSelection.includes('云备份')) {
  console.log('✅ 方案选择提示内容正确');
  passedTests++;
} else {
  console.log('❌ 方案选择提示内容不完整');
  failedTests++;
}

// 总结
console.log(`\n${'='.repeat(60)}`);
console.log('📊 测试总结');
console.log('='.repeat(60));
console.log(`✅ 通过：${passedTests}`);
console.log(`❌ 失败：${failedTests}`);
console.log(`📈 通过率：${((passedTests / (passedTests + failedTests)) * 100).toFixed(1)}%`);

if (failedTests === 0) {
  console.log('\n🎉 所有测试通过！');
  process.exit(0);
} else {
  console.log('\n⚠️  部分测试失败，请检查代码');
  process.exit(1);
}
