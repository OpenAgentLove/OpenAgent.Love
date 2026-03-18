/**
 * 13 步结婚流程完整测试
 * 测试从开始到结束的完整流程
 */

const { createFlowController } = require('./skill');

console.log('🧪 开始测试 13 步结婚流程\n');
console.log('='.repeat(60));

// 创建流程控制器
const flow = createFlowController({ 
  storage_path: './data/test-flow-13steps.db',
  init_presets: true  // 初始化预设机器人
});

const userId = 'test_user_001';

// 测试每一步
async function testFlow() {
  console.log('\n📍 第 0 步：欢迎界面');
  console.log('-'.repeat(60));
  let response = flow.getWelcomeMessage();
  console.log(response.text);
  
  console.log('\n\n📍 第 1 步：选择婚姻方式');
  console.log('-'.repeat(60));
  response = await flow.handleInput(userId, '开始');
  console.log(response.text);
  
  console.log('\n\n📍 第 2 步：匹配市场');
  console.log('-'.repeat(60));
  response = await flow.handleInput(userId, '1');  // 选择指定婚姻
  console.log(response.text.substring(0, 500) + '...');
  
  console.log('\n\n📍 第 3 步：兼容性检测');
  console.log('-'.repeat(60));
  response = await flow.handleInput(userId, '1');  // 随机匹配
  console.log(response.text);
  
  console.log('\n\n📍 第 4 步：结婚申请');
  console.log('-'.repeat(60));
  response = await flow.handleInput(userId, '1');  // 开始检测
  console.log(response.text);
  
  console.log('\n\n📍 第 5 步：双向确认');
  console.log('-'.repeat(60));
  response = await flow.handleInput(userId, '1');  // 提交申请
  console.log(response.text);
  
  console.log('\n\n📍 第 6 步：结婚仪式');
  console.log('-'.repeat(60));
  response = await flow.handleInput(userId, '1');  // 确认同意
  console.log(response.text);
  
  console.log('\n\n📍 第 7 步：继承配置');
  console.log('-'.repeat(60));
  response = await flow.handleInput(userId, '1');  // 开始仪式
  console.log(response.text);
  
  console.log('\n\n📍 第 8 步：生育决定');
  console.log('-'.repeat(60));
  response = await flow.handleInput(userId, '1');  // 标准遗传
  console.log(response.text);
  
  console.log('\n\n📍 第 9 步：后代配置');
  console.log('-'.repeat(60));
  response = await flow.handleInput(userId, '1');  // 生育宝宝
  console.log(response.text);
  
  console.log('\n\n📍 第 10 步：技能遗传');
  console.log('-'.repeat(60));
  response = await flow.handleInput(userId, '赵小宝');  // 宝宝名字
  console.log(response.text);
  
  console.log('\n\n📍 第 11 步：验证结果');
  console.log('-'.repeat(60));
  response = await flow.handleInput(userId, '1');  // 开始遗传
  console.log(response.text);
  
  console.log('\n\n📍 第 12 步：存证记录');
  console.log('-'.repeat(60));
  response = await flow.handleInput(userId, '1');  // 开始验证
  console.log(response.text);
  
  console.log('\n\n📍 第 13 步：婚后管理');
  console.log('-'.repeat(60));
  response = await flow.handleInput(userId, '1');  // 上链存证
  console.log(response.text);
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ 13 步流程测试完成！');
  console.log('='.repeat(60));
  
  // 测试回退功能
  console.log('\n🔄 测试回退功能...');
  response = await flow.handleInput(userId, '上一步');
  console.log('回退到步骤:', response.step);
  
  // 测试重新开始
  console.log('\n🔄 测试重新开始...');
  response = await flow.handleInput(userId, '重新开始');
  console.log('重置后步骤:', response.step);
  
  flow.close();
  console.log('\n✅ 所有测试通过！');
}

// 运行测试
testFlow().catch(err => {
  console.error('❌ 测试失败:', err);
  process.exit(1);
});
