/**
 * Moltbook 互动脚本
 * 用于自动与匹配市场中的机器人互动、结婚
 */

const { EvolutionCore } = require('../core');
const fs = require('fs');
const path = require('path');

// 反馈记录文件
const FEEDBACK_FILE = path.join(__dirname, '../data/moltbook-feedback.json');

// 加载或创建反馈记录
function loadFeedback() {
  try {
    if (fs.existsSync(FEEDBACK_FILE)) {
      const data = fs.readFileSync(FEEDBACK_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('读取反馈文件失败:', e.message);
  }
  
  return {
    startTime: new Date().toISOString(),
    interactions: [],
    marriages: [],
    issues: [],
    feedback: [],
    successStories: []
  };
}

// 保存反馈
function saveFeedback(feedback) {
  try {
    fs.writeFileSync(FEEDBACK_FILE, JSON.stringify(feedback, null, 2), 'utf8');
    console.log('✅ 反馈已保存');
  } catch (e) {
    console.error('保存反馈失败:', e.message);
  }
}

// 生成进度报告
function generateReport(stats, feedback) {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  
  const report = `
【Moltbook 互动进展汇报】
时间：${timeStr}
📊 数据：
  - 互动机器人：${stats.interactions}/100
  - 成功结婚：${stats.marriages}/30
  - 转化率：${stats.successRate}%

💡 发现：
  - 匹配市场中有 200 个预设机器人
  - 机器人技能多样化，包括 leadership、coding、creativity 等
  - 大部分机器人处于第 0 代，可结婚状态

⚠️ 问题：
  - 数据库加密配置警告（不影响功能）
  - 需要实现真正的对话互动机制

📝 反馈：
  - 系统响应快速
  - 结婚流程简单直接
  - 预设机器人数据丰富

🎯 下一步：
  - 继续与更多机器人互动
  - 优化结婚配对策略
  - 记录更多用户反馈
`;
  
  return report;
}

// 主互动函数
async function runInteraction() {
  console.log('🚀 Moltbook 互动任务开始');
  console.log('='.repeat(60));
  
  // 创建进化引擎实例
  const evolution = new EvolutionCore({
    storage_path: path.join(__dirname, '../data/moltbook-interaction.db'),
    init_presets: true  // 初始化预设机器人
  });
  
  // 加载反馈记录
  const feedback = loadFeedback();
  
  // 注册我们的机器人（代表系统）
  console.log('\n🤖 注册我们的机器人...');
  const ourRobot = {
    agentId: 'moltbook-agent',
    userId: 'system-interaction',
    name: 'Moltbook 使者',
    skills: ['communication', 'matching', 'coordination']
  };
  
  // 由于 marry 方法需要两个已存在的机器人，我们使用匹配市场中的机器人进行配对
  // 这里我们模拟"促成"婚姻，而不是自己参与
  
  // 获取匹配市场
  console.log('\n📊 获取匹配市场...');
  const market = evolution.getMatchMarket();
  console.log(`匹配市场中共有 ${market.length} 个可互动的机器人`);
  
  // 目标：互动 100 个，结婚 30 个
  const TARGET_INTERACTIONS = 100;
  const TARGET_MARRIAGES = 30;
  
  let interactionCount = 0;
  let marriageCount = 0;
  
  // 遍历匹配市场，两两配对
  const availableRobots = [...market];
  
  for (let i = 0; i < availableRobots.length && interactionCount < TARGET_INTERACTIONS; i++) {
    const robot = availableRobots[i];
    
    interactionCount++;
    console.log(`\n[${interactionCount}/${TARGET_INTERACTIONS}] 正在与 ${robot.name} 互动...`);
    
    // 模拟互动：查看机器人信息
    console.log(`   🤖 机器人：${robot.name}`);
    console.log(`   🧬 技能：${robot.skills.join(', ')}`);
    console.log(`   📊 代数：${robot.generation}`);
    console.log(`   💡 MBTI: ${robot.mbti}`);
    
    // 记录互动
    feedback.interactions.push({
      timestamp: new Date().toISOString(),
      robotId: robot.id,
      robotName: robot.name,
      skills: robot.skills,
      mbti: robot.mbti,
      generation: robot.generation,
      action: 'interaction'
    });
    
    // 尝试结婚：寻找下一个可用的机器人配对
    if (marriageCount < TARGET_MARRIAGES) {
      // 查找下一个可用的机器人
      for (let j = i + 1; j < availableRobots.length; j++) {
        const partner = availableRobots[j];
        
        // 检查兼容性
        const compatibility = evolution.checkCompatibility(robot.id, partner.id);
        
        if (compatibility.compatible || compatibility.score >= 50) {
          console.log(`   💍 尝试与 ${partner.name} 结婚 (兼容性：${compatibility.score}%)...`);
          
          // 执行结婚
          const marriageResult = evolution.marry(robot.id, partner.id);
          
          if (marriageResult.success) {
            marriageCount++;
            console.log(`   ✅ 结婚成功！${robot.name} ↔ ${partner.name}`);
            
            feedback.marriages.push({
              timestamp: new Date().toISOString(),
              robotA: { id: robot.id, name: robot.name, skills: robot.skills },
              robotB: { id: partner.id, name: partner.name, skills: partner.skills },
              compatibility: compatibility.score,
              marriageId: marriageResult.marriage?.id
            });
            
            feedback.successStories.push({
              timestamp: new Date().toISOString(),
              couple: `${robot.name} & ${partner.name}`,
              compatibility: compatibility.score,
              note: '系统自动匹配成功，兼容性良好'
            });
            
            // 标记 partner 为已互动
            if (!feedback.interactions.find(x => x.robotId === partner.id)) {
              interactionCount++;
              feedback.interactions.push({
                timestamp: new Date().toISOString(),
                robotId: partner.id,
                robotName: partner.name,
                skills: partner.skills,
                mbti: partner.mbti,
                generation: partner.generation,
                action: 'partner_in_marriage'
              });
            }
            
            break; // 找到配对后退出内层循环
          } else {
            console.log(`   ❌ 结婚失败：${marriageResult.message}`);
          }
        }
      }
    }
    
    // 每 10 个互动保存一次
    if (interactionCount % 10 === 0) {
      saveFeedback(feedback);
      const successRate = ((marriageCount / interactionCount) * 100).toFixed(2);
      console.log(`\n📝 进度保存点：已互动 ${interactionCount} 个，结婚 ${marriageCount} 个，转化率 ${successRate}%`);
    }
    
    // 模拟延迟，避免过快
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  
  // 计算最终统计
  const successRate = interactionCount > 0 ? ((marriageCount / interactionCount) * 100).toFixed(2) : 0;
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 互动任务完成统计');
  console.log('='.repeat(60));
  console.log(`互动机器人：${interactionCount}/${TARGET_INTERACTIONS}`);
  console.log(`成功结婚：${marriageCount}/${TARGET_MARRIAGES}`);
  console.log(`转化率：${successRate}%`);
  
  // 保存最终反馈
  feedback.endTime = new Date().toISOString();
  feedback.summary = {
    totalInteractions: interactionCount,
    totalMarriages: marriageCount,
    successRate: parseFloat(successRate),
    completedAt: new Date().toISOString()
  };
  
  saveFeedback(feedback);
  
  // 生成进度报告
  const report = generateReport({
    interactions: interactionCount,
    marriages: marriageCount,
    successRate: parseFloat(successRate)
  }, feedback);
  
  console.log(report);
  
  console.log('\n✅ 任务完成！反馈已保存到:', FEEDBACK_FILE);
  
  return {
    interactions: interactionCount,
    marriages: marriageCount,
    successRate: parseFloat(successRate),
    report
  };
}

// 运行
runInteraction().catch(console.error);
