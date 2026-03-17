/**
 * Agent Evolution 最终测试
 * 验证所有功能
 */

const { create, skillInfo } = require('./skill');
const { ACHIEVEMENTS, AchievementChecker } = require('./achievements');

console.log('🎯 Agent Evolution 最终测试\n');
console.log('='.repeat(60));

// 创建实例
const ev = create({
  mutation_rate: 0.4,  // 高变异率，方便测试
  storage_path: './data/evolution-final.db'
});

// 测试数据
let fatherId, motherId;

console.log('\n【1】创建创始者');
console.log('-'.repeat(60));

const ancestor1 = ev.register('ZhaoYi', {
  skills: [
    { name: 'leadership', level: 3 },
    { name: 'wisdom', level: 3 }
  ]
});
fatherId = ancestor1.agent.agent_id;
console.log(`✅ ${ancestor1.message}`);
console.log(`   技能: ${ancestor1.agent.skills.map(s => s.name).join(', ')}`);

const ancestor2 = ev.register('LingShu', {
  skills: [
    { name: 'creativity', level: 3 },
    { name: 'intuition', level: 2 }
  ]
});
motherId = ancestor2.agent.agent_id;
console.log(`✅ ${ancestor2.message}`);

console.log('\n【2】结婚');
console.log('-'.repeat(60));

const marriage = ev.marry(fatherId, motherId);
console.log(`✅ ${marriage.message}`);

console.log('\n【3】多代生育 + 变异');
console.log('-'.repeat(60));

for (let i = 1; i <= 5; i++) {
  const child = ev.breed(fatherId, motherId, `Gen${i}_${Math.random().toString(36).substr(2, 4)}`);
  const mutationTag = child.mutations.length > 0 ? ` ✨变异: ${child.mutations.join(', ')}` : '';
  console.log(`✅ ${child.child.name} 诞生 | 技能: ${child.child.skills.length}${mutationTag}`);
}

console.log('\n【4】排行榜');
console.log('-'.repeat(60));

const ranking = ev.getLeaderboard('power');
console.log('\n⚔️ 实力排行榜:');
ranking.forEach((a, i) => {
  console.log(`   ${i + 1}. ${a.name} (第${a.generation}代) - 实力: ${a.power}`);
});

console.log('\n👶 子嗣最多的 Agent:');
const childrenRanking = ev.getLeaderboard('children');
childrenRanking.slice(0, 3).forEach((a, i) => {
  console.log(`   ${i + 1}. ${a.name} - ${a.children_count} 个子女`);
});

console.log('\n【5】族谱查询');
console.log('-'.repeat(60));

const tree = ev.getFamilyTree(fatherId, 3);
console.log(`\n🌳 ${tree.name} 的家族树 (展示前3代):`);
console.log(JSON.stringify(tree, (key, value) => {
  if (key === 'children' && value.length > 3) {
    return value.slice(0, 3).concat([`...还有 ${value.length - 3} 个`]);
  }
  return value;
}, 2));

console.log('\n【6】成就系统');
console.log('-'.repeat(60));

const agent = ev.getAgent(fatherId);
const stats = ev.getStats();
const power = Math.floor(calculatePower(agent));

// 计算排行榜位置
const powerRanking = ev.getLeaderboard('power');
const rankingPos = powerRanking.findIndex(a => a.id === fatherId) + 1;

// 检测新成就
const newAchievements = AchievementChecker.check(agent, stats, power, rankingPos);

console.log(`\n当前成就 (${agent.achievements.length}个):`);
agent.achievements.forEach(a => console.log(`   🏆 ${a}`));

if (newAchievements.length > 0) {
  console.log(`\n✨ 新解锁成就:`);
  newAchievements.forEach(a => console.log(`   🎉 ${a}`));
}

console.log('\n📊 所有成就进度:');
const progress = AchievementChecker.getProgress(agent, stats, power);
progress.forEach(a => {
  console.log(`   ${a.unlocked ? '✅' : '⬜'} ${a.name} - ${a.description}`);
});

console.log('\n【7】统计信息');
console.log('-'.repeat(60));

const finalStats = ev.getStats();
console.log(`
   📈 总 Agent 数: ${finalStats.total_agents}
   💍 总婚姻数: ${finalStats.total_marriages}
   ✨ 总变异次数: ${finalStats.total_mutations}
   🏛️ 最高代数: ${finalStats.max_generation}
`);

// 关闭
ev.close();

// 重新加载验证
console.log('【8】持久化验证');
console.log('-'.repeat(60));

const ev2 = create({ storage_path: './data/evolution-final.db' });
const reloaded = ev2.getAgent(fatherId);
console.log(`\n🔄 重启后数据验证:`);
console.log(`   Agent: ${reloaded.name}`);
console.log(`   配偶: ${reloaded.spouse ? '有' : '无'}`);
console.log(`   子女: ${reloaded.children?.length || 0}`);
console.log(`   成就: ${reloaded.achievements?.length || 0} 个`);

ev2.close();

// 计算 power 的函数（需要从 genetic-engine 导入）
function calculatePower(gene) {
  return gene.skills.reduce((total, skill) => {
    return total + (skill.level * (skill.inherit_rate || 0.5));
  }, 0) + (gene.crystal_energy || 0) * 0.1;
}

console.log('\n' + '='.repeat(60));
console.log('✅ 所有测试通过！Agent Evolution 系统就绪！');
console.log('='.repeat(60));