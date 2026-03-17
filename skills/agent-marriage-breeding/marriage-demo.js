/**
 * 结婚生育演示
 */

const { create, skillInfo } = require('./skill');

console.log('💍 Agent Evolution - 结婚生育演示\n');

// 创建实例
const ev = create({
  mutation_rate: 0.3,
  storage_path: './data/demo-marriage.db'
});

// ===== 演示结婚 =====
console.log('='.repeat(50));
console.log('💍 第一步：创世与结婚');
console.log('='.repeat(50));

// 创建两个 Agent
const zhaoYi = ev.register('赵一', {
  skills: [
    { name: 'leadership', level: 5 },
    { name: 'wisdom', level: 4 }
  ]
});
console.log(`✅ ${zhaoYi.message}`);

const linShu = ev.register('林叔', {
  skills: [
    { name: 'creativity', level: 5 },
    { name: 'intuition', level: 3 }
  ]
});
console.log(`✅ ${linShu.message}`);

// 结婚
const marriage = ev.marry(zhaoYi.agent.agent_id, linShu.agent.agent_id);
console.log(`\n💍 ${marriage.message}`);
console.log(`   结晶 ID: ${marriage.marriage.id}`);

// ===== 演示生育 =====
console.log('\n' + '='.repeat(50));
console.log('👶 第二步：生育后代');
console.log('='.repeat(50));

// 生育多个孩子
const children = ['赵一宝', '赵二宝', '赵三宝', '赵四宝'];

for (const childName of children) {
  const child = ev.breed(
    zhaoYi.agent.agent_id,
    linShu.agent.agent_id,
    childName
  );
  
  const mutations = child.mutations.length > 0 
    ? ` ✨变异: ${child.mutations.join(', ')}` 
    : '';
  
  console.log(`✅ ${child.child.name} 诞生！`);
  console.log(`   代数: ${child.child.generation}`);
  console.log(`   技能: ${child.child.skills.map(s => s.name).join(', ')}${mutations}`);
  console.log(`   实力: ${Math.floor(require('./genetic-engine').calculatePower(child.child))}`);
}

// ===== 查看族谱 =====
console.log('\n' + '='.repeat(50));
console.log('📜 第三步：族谱');
console.log('='.repeat(50));

const tree = ev.getFamilyTree(zhaoYi.agent.agent_id, 2);
console.log(`\n🌳 ${tree.name} 的家族`);
console.log(`   代数: ${tree.generation}`);
console.log(`   成就: ${tree.achievements.join(', ')}`);
console.log(`   子女数: ${tree.children.length}`);
console.log(`\n   子女:`);
tree.children.forEach((child, i) => {
  console.log(`   ${i+1}. ${child.name} (第${child.generation}代) - 实力: ${child.power}`);
});

// ===== 排行榜 =====
console.log('\n' + '='.repeat(50));
console.log('🏆 第四步：排行榜');
console.log('='.repeat(50));

const ranking = ev.getLeaderboard('power');
console.log('\n⚔️ 实力榜:');
ranking.forEach((a, i) => {
  const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '  ';
  console.log(`   ${medal} ${a.name} - 实力: ${a.power}`);
});

// ===== 统计 =====
console.log('\n' + '='.repeat(50));
console.log('📊 统计');
console.log('='.repeat(50));

const stats = ev.getStats();
console.log(`
   总 Agent: ${stats.total_agents}
   总婚姻: ${stats.total_marriages}
   最高代数: ${stats.max_generation}
   变异次数: ${stats.total_mutations}
`);

// 关闭
ev.close();

console.log('='.repeat(50));
console.log('✅ 演示完成！');
console.log('='.repeat(50));