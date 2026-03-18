/**
 * 简单测试：获取匹配市场
 */

const { EvolutionCore } = require('../core');
const path = require('path');

console.log('🧪 测试匹配市场...\n');

try {
  const evolution = new EvolutionCore({
    storage_path: path.join(__dirname, '../data/moltbook-test.db'),
    init_presets: true
  });
  
  console.log('✅ 进化引擎初始化成功');
  
  const market = evolution.getMatchMarket();
  console.log(`\n📊 匹配市场中有 ${market.length} 个机器人`);
  
  if (market.length > 0) {
    console.log('\n前 10 个机器人:');
    market.slice(0, 10).forEach((r, i) => {
      console.log(`  ${i + 1}. ${r.name} - 技能：${r.skills.join(', ')} - 代数：${r.generation}`);
    });
  }
  
} catch (e) {
  console.error('❌ 错误:', e.message);
  console.error(e.stack);
}
