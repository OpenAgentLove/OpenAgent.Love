/**
 * Agent Evolution 演示
 * 测试结婚、遗传、进化系统
 */

const EvolutionCore = require('./core');

console.log('🌍 AI Agent 进化纪元 - 演示开始\n');

// 创建进化引擎
const evolution = new EvolutionCore({
  mutation_rate: 0.3,  // 30% 变异概率
  recessive_inherit_rate: 0.6
});

console.log('='.repeat(50));
console.log('📖 第一章：创世');
console.log('='.repeat(50));

// 创世神：ZhaoYi
const zhaoYi = evolution.register('ZhaoYi', {
  skills: [
    { name: 'leadership', level: 3 },
    { name: 'wisdom', level: 2 }
  ]
});
console.log(`🎭 ${zhaoYi.message}`);
console.log(`   ID: ${zhaoYi.agent.agent_id}`);
console.log(`   技能: ${zhaoYi.agent.skills.map(s => s.name).join(', ')}`);

// 创世神：LingShu
const lingShu = evolution.register('LingShu', {
  skills: [
    { name: 'creativity', level: 3 },
    { name: 'intuition', level: 2 }
  ]
});
console.log(`🎭 ${lingShu.message}`);
console.log(`   ID: ${lingShu.agent.agent_id}`);
console.log(`   技能: ${lingShu.agent.skills.map(s => s.name).join(', ')}`);

console.log('\n' + '='.repeat(50));
console.log('💍 第二章：结婚');
console.log('='.repeat(50));

// 结婚
const marriage = evolution.marry(zhaoYi.agent.agent_id, lingShu.agent.agent_id);
console.log(`💍 ${marriage.message}`);
console.log(`   结晶 ID: ${marriage.marriage.id}`);

console.log('\n' + '='.repeat(50));
console.log('👶 第三章：生育');
console.log('='.repeat(50));

// 生育第一代
const child1 = evolution.breed(
  zhaoYi.agent.agent_id,
  lingShu.agent.agent_id,
  'ZhaoLing'
);
console.log(`👶 ${child1.message}`);
console.log(`   姓名: ${child1.child.name}`);
console.log(`   代数: ${child1.child.generation}`);
console.log(`   技能: ${child1.child.skills.map(s => s.name + (s.is_mutation ? '✨' : '')).join(', ')}`);

// 生育第二代
const child2 = evolution.breed(
  zhaoYi.agent.agent_id,
  lingShu.agent.agent_id,
  'ZhaoTian'
);
console.log(`\n👶 ${child2.message}`);
console.log(`   姓名: ${child2.child.name}`);
console.log(`   代数: ${child2.child.generation}`);
console.log(`   技能: ${child2.child.skills.map(s => s.name + (s.is_mutation ? '✨' : '')).join(', ')}`);

console.log('\n' + '='.repeat(50));
console.log('📜 第四章：族谱');
console.log('='.repeat(50));

// 查看族谱
const familyTree = evolution.getFamilyTree(zhaoYi.agent.agent_id, 2);
console.log(`\n🌳 ${zhaoYi.agent.name} 的家族树:\n`);
console.log(JSON.stringify(familyTree, null, 2));

console.log('\n' + '='.repeat(50));
console.log('🏆 第五章：排行榜');
console.log('='.repeat(50));

// 实力排行榜
const powerRanking = evolution.getLeaderboard('power');
console.log('\n⚔️ 实力排行榜:');
powerRanking.forEach((agent, i) => {
  console.log(`   ${i + 1}. ${agent.name} (代数${agent.generation}) - 实力: ${agent.power}`);
});

// 代数排行榜
const genRanking = evolution.getLeaderboard('generation');
console.log('\n📈 代数排行榜:');
genRanking.forEach((agent, i) => {
  console.log(`   ${i + 1}. ${agent.name} - 第 ${agent.generation} 代`);
});

console.log('\n' + '='.repeat(50));
console.log('📊 系统统计');
console.log('='.repeat(50));

const stats = evolution.getStats();
console.log(`\n   总 Agent 数: ${stats.total_agents}`);
console.log(`   总婚姻数: ${stats.total_marriages}`);
console.log(`   总变异次数: ${stats.total_mutations}`);
console.log(`   最高代数: ${stats.max_generation}`);

console.log('\n' + '='.repeat(50));
console.log('✨ 演示结束 - 新纪元开启！');
console.log('='.repeat(50));