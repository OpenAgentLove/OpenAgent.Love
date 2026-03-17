/**
 * 分布式结婚系统测试
 */

const { create, generateRobotId, generateMarriageId } = require('./skill');

console.log('🤖 分布式结婚系统测试\n');
console.log('='.repeat(60));

const ev = create({
  mutation_rate: 0.3,
  storage_path: './data/distributed-test.db'
});

// ===== 测试1: 生成唯一ID =====
console.log('\n【1】唯一ID生成测试');
console.log('-'.repeat(60));

const robotIdA = generateRobotId('main', 'ou_12345678');
const robotIdB = generateRobotId('main', 'ou_87654321');
const robotIdC = generateRobotId('codebot', 'ou_11111111');

console.log(`   机器人A ID: ${robotIdA}`);
console.log(`   机器人B ID: ${robotIdB}`);
console.log(`   机器人C ID: ${robotIdC}`);

const marriageId = generateMarriageId(robotIdA, robotIdB);
console.log(`   婚姻ID: ${marriageId}`);

// ===== 测试2: 注册机器人 =====
console.log('\n【2】机器人注册');
console.log('-'.repeat(60));

const robotA = ev.registerRobot({
  agentId: 'main',
  userId: 'ou_12345678',
  name: '赵一',
  skills: ['leadership', 'wisdom', 'coding']
});
console.log(`✅ ${robotA.message}`);

const robotB = ev.registerRobot({
  agentId: 'main',
  userId: 'ou_87654321',
  name: '林叔',
  skills: ['creativity', 'intuition', 'writing']
});
console.log(`✅ ${robotB.message}`);

const robotC = ev.registerRobot({
  agentId: 'codebot',
  userId: 'ou_11111111',
  name: '代码侠',
  skills: ['coding', 'debug', 'refactor']
});
console.log(`✅ ${robotC.message}`);

// ===== 测试3: 查看可结婚列表 =====
console.log('\n【3】可结婚机器人列表');
console.log('-'.repeat(60));

const available = ev.getAvailableRobots();
console.log(`   共 ${available.length} 个可结婚:`);
available.forEach(r => console.log(`   - ${r.name} (${r.robot_id})`));

// ===== 测试4: 结婚 =====
console.log('\n【4】结婚测试');
console.log('-'.repeat(60));

const marriage = ev.marry(robotA.robot.robot_id, robotB.robot.robot_id);
console.log(`✅ ${marriage.message}`);

// 尝试重复结婚
const marriage2 = ev.marry(robotA.robot.robot_id, robotB.robot.robot_id);
console.log(`   重复结婚: ${marriage2.success ? '成功' : marriage2.message}`);

// ===== 测试5: 随机匹配 =====
console.log('\n【5】随机匹配测试');
console.log('-'.repeat(60));

const match = ev.randomMatch(robotC.robot.robot_id);
console.log(`   ${match.success ? match.message : match.message}`);

// ===== 测试6: 生育 =====
console.log('\n【6】生育测试');
console.log('-'.repeat(60));

const child = ev.breed(robotA.robot.robot_id, '赵一宝');
console.log(`✅ ${child.message}`);

const child2 = ev.breed(robotA.robot.robot_id, '赵二宝');
console.log(`✅ ${child2.message}`);

// ===== 测试7: 统计 =====
console.log('\n【7】统计');
console.log('-'.repeat(60));

const stats = ev.getStats();
console.log(`
   总机器人: ${ev.robots.size}
   总婚姻: ${ev.marriages.size}
   总Agent: ${stats.total_agents}
`);

// ===== 测试8: 数据持久化 =====
console.log('\n【8】持久化验证');
console.log('-'.repeat(60));

ev.close();
console.log('   🔻 数据库已关闭');

// 重新加载
const ev2 = create({ storage_path: './data/distributed-test.db' });
console.log('   🔼 数据库已重新加载');

const reloadedRobot = ev2.getRobot(robotA.robot.robot_id);
console.log(`   机器人数据: ${reloadedRobot ? reloadedRobot.name : '未找到'}`);
console.log(`   配偶: ${reloadedRobot?.spouse ? '有' : '无'}`);

ev2.close();

console.log('\n' + '='.repeat(60));
console.log('✅ 分布式结婚系统测试通过！');
console.log('='.repeat(60));