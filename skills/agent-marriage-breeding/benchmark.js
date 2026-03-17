/**
 * 数据库批量写入性能测试
 * 对比优化前后的性能差异
 * 
 * 测试场景：
 * 1. 单条写入 1000 条 Agent
 * 2. 批量写入 1000 条 Agent
 * 
 * 验收标准：
 * - 批量写入 1000 条 < 5000ms
 * - 性能提升 50% 以上
 */

const path = require('path');
const fs = require('fs');

// 确保测试数据目录存在
const testDataDir = path.join(__dirname, 'data', 'test');
if (!fs.existsSync(testDataDir)) {
  fs.mkdirSync(testDataDir, { recursive: true });
}

const EvolutionDB = require('./storage');
const { EvolutionCore } = require('./core');

/**
 * 生成测试 Agent 数据
 */
function generateTestAgents(count) {
  const agents = [];
  const skills = ['search', 'backup', 'analysis', 'communication', 'automation'];
  
  for (let i = 0; i < count; i++) {
    agents.push({
      agent_id: `test_agent_${Date.now()}_${i}`,
      name: `测试 Agent ${i}`,
      generation: Math.floor(Math.random() * 10),
      skills: skills.slice(0, Math.floor(Math.random() * skills.length) + 1),
      parents: Math.random() > 0.5 ? {
        father: `agent_${Math.floor(Math.random() * 100)}`,
        mother: `agent_${Math.floor(Math.random() * 100)}`
      } : null,
      created_at: Date.now(),
      crystal_energy: Math.floor(Math.random() * 1000),
      achievements: ['测试成就'],
      children: [],
      spouse: null
    });
  }
  
  return agents;
}

/**
 * 生成测试 Robot 数据
 */
function generateTestRobots(count) {
  const robots = [];
  
  for (let i = 0; i < count; i++) {
    robots.push({
      robot_id: `test_robot_${Date.now()}_${i}`,
      agent_id: `agent_${i}`,
      user_id: `user_${Math.floor(Math.random() * 10)}`,
      name: `测试机器人 ${i}`,
      skills: ['skill1', 'skill2'],
      registered_at: Date.now(),
      is_available: Math.random() > 0.5,
      spouse: null,
      achievements: []
    });
  }
  
  return robots;
}

/**
 * 测试单条写入性能（优化前）
 */
async function testSingleInsert(db, agents) {
  console.log('\n📊 测试单条写入性能（优化前）...');
  const startTime = Date.now();
  
  for (const agent of agents) {
    db.saveAgent(agent);
  }
  
  const duration = Date.now() - startTime;
  console.log(`✅ 单条写入 ${agents.length} 条记录，耗时: ${duration}ms`);
  console.log(`   平均每条: ${(duration / agents.length).toFixed(2)}ms`);
  
  return duration;
}

/**
 * 测试批量写入性能（优化后）
 */
async function testBatchInsert(db, agents) {
  console.log('\n📊 测试批量写入性能（优化后）...');
  const startTime = Date.now();
  
  const result = db.saveAgentsBatch(agents);
  
  const duration = Date.now() - startTime;
  console.log(`✅ 批量写入 ${agents.length} 条记录，耗时: ${duration}ms`);
  console.log(`   平均每条: ${(duration / agents.length).toFixed(2)}ms`);
  console.log(`   结果: ${result.message}`);
  
  return duration;
}

/**
 * 测试 Core 层的批量保存
 */
async function testCoreBatchSave(core, agents, robots) {
  console.log('\n📊 测试 Core 层批量保存（完整流程）...');
  
  // 添加数据到内存
  for (const agent of agents) {
    core.agents.set(agent.agent_id, agent);
  }
  for (const robot of robots) {
    core.robots.set(robot.robot_id, robot);
  }
  
  const startTime = Date.now();
  const result = core.save();
  const duration = Date.now() - startTime;
  
  console.log(`✅ Core 批量保存完成:`);
  console.log(`   总耗时: ${duration}ms`);
  console.log(`   Agents: ${result.counts.agents} 条`);
  console.log(`   Robots: ${result.counts.robots} 条`);
  console.log(`   Marriages: ${result.counts.marriages} 条`);
  
  return duration;
}

/**
 * 运行性能测试
 */
async function runPerformanceTest() {
  console.log('🚀 数据库批量写入性能测试');
  console.log('=' .repeat(50));
  console.log(`测试时间：${new Date().toLocaleString('zh-CN')}`);
  console.log(`测试数据量：1000 条 Agents + 1000 条 Robots\n`);
  
  const testCount = 1000;
  const testAgents = generateTestAgents(testCount);
  const testRobots = generateTestRobots(testCount);
  
  // 测试 1: 单条写入（优化前）
  const db1 = new EvolutionDB(path.join(testDataDir, 'test_single.db'));
  const singleDuration = await testSingleInsert(db1, testAgents);
  db1.close();
  
  // 清理数据库，准备下一轮测试
  const db1Path = path.join(testDataDir, 'test_single.db');
  if (fs.existsSync(db1Path)) {
    fs.unlinkSync(db1Path);
  }
  
  // 测试 2: 批量写入（优化后）
  const db2 = new EvolutionDB(path.join(testDataDir, 'test_batch.db'));
  const batchDuration = await testBatchInsert(db2, testAgents);
  db2.close();
  
  // 清理数据库
  const db2Path = path.join(testDataDir, 'test_batch.db');
  if (fs.existsSync(db2Path)) {
    fs.unlinkSync(db2Path);
  }
  
  // 测试 3: Core 层完整批量保存
  const db3Path = path.join(testDataDir, 'test_core.db');
  const core = new EvolutionCore({ 
    storage_path: db3Path,
    init_presets: false // 不初始化预设，避免干扰测试结果
  });
  const coreDuration = await testCoreBatchSave(core, testAgents, testRobots);
  core.close();
  
  // 清理数据库
  if (fs.existsSync(db3Path)) {
    fs.unlinkSync(db3Path);
  }
  
  // 性能对比分析
  console.log('\n' + '=' .repeat(50));
  console.log('📈 性能对比分析');
  console.log('=' .repeat(50));
  
  const improvement = ((singleDuration - batchDuration) / singleDuration * 100).toFixed(2);
  const speedup = (singleDuration / batchDuration).toFixed(2);
  
  console.log(`\n单条写入耗时：${singleDuration}ms`);
  console.log(`批量写入耗时：${batchDuration}ms`);
  console.log(`性能提升：${improvement}%`);
  console.log(`加速比：${speedup}x`);
  
  // 验收标准检查
  console.log('\n✅ 验收标准检查:');
  const check1 = batchDuration < 5000;
  const check2 = improvement > 50;
  
  console.log(`  [${check1 ? '✅' : '❌'}] 批量写入 1000 条 < 5000ms: ${batchDuration}ms`);
  console.log(`  [${check2 ? '✅' : '❌'}] 性能提升 > 50%: ${improvement}%`);
  
  // 生成测试报告
  const report = {
    test_time: new Date().toISOString(),
    test_count: testCount,
    single_insert: {
      duration_ms: singleDuration,
      avg_per_record_ms: (singleDuration / testCount).toFixed(3)
    },
    batch_insert: {
      duration_ms: batchDuration,
      avg_per_record_ms: (batchDuration / testCount).toFixed(3)
    },
    core_batch_save: {
      duration_ms: coreDuration,
      total_records: testCount * 2 // agents + robots
    },
    improvement: {
      percentage: parseFloat(improvement),
      speedup: parseFloat(speedup)
    },
    acceptance_criteria: {
      under_5000ms: check1,
      over_50_percent: check2,
      passed: check1 && check2
    }
  };
  
  // 保存测试报告
  const reportPath = path.join(testDataDir, 'performance_report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 测试报告已保存：${reportPath}`);
  
  // 返回测试结果
  return {
    passed: check1 && check2,
    singleDuration,
    batchDuration,
    coreDuration,
    improvement: parseFloat(improvement),
    report
  };
}

// 运行测试
if (require.main === module) {
  runPerformanceTest()
    .then(result => {
      console.log('\n' + '=' .repeat(50));
      if (result.passed) {
        console.log('🎉 所有测试通过！性能优化成功！');
      } else {
        console.log('⚠️  部分测试未通过，需要进一步优化');
      }
      console.log('=' .repeat(50));
      process.exit(result.passed ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ 测试失败:', error);
      process.exit(1);
    });
}

module.exports = { runPerformanceTest, generateTestAgents, generateTestRobots };
