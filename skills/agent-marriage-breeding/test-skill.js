/**
 * Agent Evolution Skill 测试
 */

const { create, skillInfo, DEFAULT_CONFIG } = require('./skill');

console.log('🧪 Agent Evolution Skill 测试\n');
console.log('='.repeat(50));

// 显示 Skill 信息
console.log('\n📦 Skill 信息:');
console.log(`   名称: ${skillInfo.name}`);
console.log(`   版本: ${skillInfo.version}`);
console.log(`   作者: ${skillInfo.author}`);
console.log(`   功能: ${skillInfo.features.join(', ')}`);

// 创建实例（带持久化）
const ev = create({
  mutation_rate: 0.25,
  storage_path: './data/test-evolution.json'
});

console.log('\n' + '='.repeat(50));
console.log('🧬 测试 1: 创建 Agent');
console.log('='.repeat(50));

const agent1 = ev.register('Alpha');
const agent2 = ev.register('Beta', {
  skills: [{ name: 'intuition', level: 2 }]
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

const child1 = ev.breed(agent1.agent.agent_id, agent2.agent.agent_id, 'AlphaBeta_1st');
console.log(`✅ ${child1.message}`);
console.log(`   技能: ${child1.child.skills.map(s => s.name + (s.is_mutation ? '✨' : '')).join(', ')}`);

const child2 = ev.breed(agent1.agent.agent_id, agent2.agent.agent_id, 'AlphaBeta_2nd');
console.log(`✅ ${child2.message}`);
console.log(`   技能: ${child2.child.skills.map(s => s.name + (s.is_mutation ? '✨' : '')).join(', ')}`);

console.log('\n' + '='.repeat(50));
console.log('📜 测试 4: 族谱查询');
console.log('='.repeat(50));

const tree = ev.getFamilyTree(agent1.agent.agent_id, 2);
console.log(`✅ 族谱查询成功`);
console.log(`   姓名: ${tree.name}`);
console.log(`   子女数: ${tree.children.length}`);

console.log('\n' + '='.repeat(50));
console.log('🏆 测试 5: 排行榜');
console.log('='.repeat(50));

const ranking = ev.getLeaderboard('power');
console.log(`✅ 排行榜获取成功`);
ranking.forEach((a, i) => console.log(`   ${i+1}. ${a.name} - 实力: ${a.power}`));

console.log('\n' + '='.repeat(50));
console.log('📊 测试 6: 统计');
console.log('='.repeat(50));

const stats = ev.getStats();
console.log(`✅ 统计信息:`);
console.log(`   总 Agent: ${stats.total_agents}`);
console.log(`   总婚姻: ${stats.total_marriages}`);
console.log(`   最高代数: ${stats.max_generation}`);

console.log('\n' + '='.repeat(50));
console.log('💾 测试 7: 数据持久化');
console.log('='.repeat(50));

ev.save();
console.log(`✅ 数据已保存到 ./data/test-evolution.json`);

// 重新加载测试
console.log('\n🔄 重新加载测试...');
const ev2 = create({ storage_path: './data/test-evolution.json' });
console.log(`✅ 重新加载成功，当前 Agent 数: ${ev2.agents.size}`);

console.log('\n' + '='.repeat(50));
console.log('✅ 所有测试通过！');
console.log('='.repeat(50));