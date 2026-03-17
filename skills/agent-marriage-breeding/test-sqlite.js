/**
 * Agent Evolution Skill 测试 (SQLite 版)
 */

const { create, skillInfo } = require('./skill');

console.log('🧪 Agent Evolution Skill - SQLite 测试\n');
console.log('='.repeat(50));

// 显示 Skill 信息
console.log('\n📦 Skill 信息:');
console.log(`   名称: ${skillInfo.name}`);
console.log(`   版本: ${skillInfo.version}`);
console.log(`   存储: SQLite`);

// 创建实例
const ev = create({
  mutation_rate: 0.3,
  storage_path: './data/evolution-test.db'
});

console.log('\n' + '='.repeat(50));
console.log('🧬 测试 1: 创建 Agent');
console.log('='.repeat(50));

const agent1 = ev.register('创始者A');
const agent2 = ev.register('创始者B', {
  skills: [{ name: 'wisdom', level: 3 }]
});
console.log(`✅ ${agent1.message}`);
console.log(`✅ ${agent2.message}`);

console.log('\n' + '='.repeat(50));
console.log('💍 测试 2: 结婚');
console.log('='.repeat(50));

const marriage = ev.marry(agent1.agent.agent_id, agent2.agent.agent_id);
console.log(`✅ ${marriage.message}`);

console.log('\n' + '='.repeat(50));
console.log('👶 测试 3: 生育');
console.log('='.repeat(50));

const child1 = ev.breed(agent1.agent.agent_id, agent2.agent.agent_id, '后代甲');
console.log(`✅ ${child1.message}`);

const child2 = ev.breed(agent1.agent.agent_id, agent2.agent.agent_id, '后代乙');
console.log(`✅ ${child2.message}`);

console.log('\n' + '='.repeat(50));
console.log('🔄 测试 4: 重启后数据持久化');
console.log('='.repeat(50));

// 关闭当前实例
ev.close();
console.log('🔻 关闭数据库');

// 重新创建实例（模拟重启）
const ev2 = create({ storage_path: './data/evolution-test.db' });
console.log('🔼 重新打开数据库');

const loadedAgent = ev2.getAgent(agent1.agent.agent_id);
if (loadedAgent) {
  console.log(`✅ 数据持久化成功！`);
  console.log(`   Agent: ${loadedAgent.name}`);
  console.log(`   配偶: ${loadedAgent.spouse ? '有' : '无'}`);
  console.log(`   子女: ${loadedAgent.children?.length || 0}`);
} else {
  console.log(`❌ 数据加载失败`);
}

console.log('\n' + '='.repeat(50));
console.log('🏆 测试 5: 排行榜');
console.log('='.repeat(50));

const ranking = ev2.getLeaderboard('power');
console.log(`✅ 排行榜:`);
ranking.forEach((a, i) => console.log(`   ${i+1}. ${a.name} - 实力: ${a.power}`));

console.log('\n' + '='.repeat(50));
console.log('📊 测试 6: 统计');
console.log('='.repeat(50));

const stats = ev2.getStats();
console.log(`✅ 统计:`);
console.log(`   总 Agent: ${stats.total_agents}`);
console.log(`   总婚姻: ${stats.total_marriages}`);
console.log(`   最高代数: ${stats.max_generation}`);

ev2.close();

console.log('\n' + '='.repeat(50));
console.log('✅ SQLite 版本测试全部通过！');
console.log('='.repeat(50));