/**
 * 数据库批量写入性能测试（独立版）
 * 不依赖外部模块，直接测试 SQLite 事务性能
 * 
 * 测试场景：
 * 1. 单条写入（每条一个事务）
 * 2. 批量写入（一个事务包裹所有插入）
 * 
 * 验收标准：
 * - 批量写入 1000 条 < 5000ms
 * - 性能提升 50% 以上
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// 确保测试数据目录存在
const testDataDir = path.join(__dirname, 'data', 'test');
if (!fs.existsSync(testDataDir)) {
  fs.mkdirSync(testDataDir, { recursive: true });
}

/**
 * 初始化测试数据库
 */
function initTestDB(dbPath) {
  const db = new Database(dbPath);
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS agents (
      agent_id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      generation INTEGER DEFAULT 0,
      skills TEXT,
      parents TEXT,
      created_at INTEGER,
      crystal_energy INTEGER DEFAULT 0,
      achievements TEXT,
      children TEXT,
      spouse TEXT
    )
  `);
  
  return db;
}

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
      skills: JSON.stringify(skills.slice(0, Math.floor(Math.random() * skills.length) + 1)),
      parents: Math.random() > 0.5 ? JSON.stringify({
        father: `agent_${Math.floor(Math.random() * 100)}`,
        mother: `agent_${Math.floor(Math.random() * 100)}`
      }) : null,
      created_at: Date.now(),
      crystal_energy: Math.floor(Math.random() * 1000),
      achievements: JSON.stringify(['测试成就']),
      children: JSON.stringify([]),
      spouse: null
    });
  }
  
  return agents;
}

/**
 * 测试单条写入性能（优化前 - 每条一个事务）
 */
function testSingleInsert(dbPath, agents) {
  console.log('\n📊 测试单条写入性能（优化前 - 每条一个事务）...');
  
  const db = initTestDB(dbPath);
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO agents 
    (agent_id, name, generation, skills, parents, created_at, crystal_energy, achievements, children, spouse)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const startTime = Date.now();
  
  // 每条记录独立事务（模拟优化前的行为）
  for (const agent of agents) {
    stmt.run(
      agent.agent_id,
      agent.name,
      agent.generation,
      agent.skills,
      agent.parents,
      agent.created_at,
      agent.crystal_energy,
      agent.achievements,
      agent.children,
      agent.spouse
    );
  }
  
  const duration = Date.now() - startTime;
  db.close();
  
  console.log(`✅ 单条写入 ${agents.length} 条记录，耗时: ${duration}ms`);
  console.log(`   平均每条: ${(duration / agents.length).toFixed(2)}ms`);
  
  return duration;
}

/**
 * 测试批量写入性能（优化后 - 单个事务包裹所有插入）
 */
function testBatchInsert(dbPath, agents) {
  console.log('\n📊 测试批量写入性能（优化后 - 单个事务）...');
  
  const db = initTestDB(dbPath);
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO agents 
    (agent_id, name, generation, skills, parents, created_at, crystal_energy, achievements, children, spouse)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const startTime = Date.now();
  
  // 使用事务包裹所有插入（优化后的行为）
  const saveTransaction = db.transaction((agentList) => {
    for (const agent of agentList) {
      stmt.run(
        agent.agent_id,
        agent.name,
        agent.generation,
        agent.skills,
        agent.parents,
        agent.created_at,
        agent.crystal_energy,
        agent.achievements,
        agent.children,
        agent.spouse
      );
    }
  });
  
  saveTransaction(agents);
  
  const duration = Date.now() - startTime;
  db.close();
  
  console.log(`✅ 批量写入 ${agents.length} 条记录，耗时: ${duration}ms`);
  console.log(`   平均每条: ${(duration / agents.length).toFixed(2)}ms`);
  
  return duration;
}

/**
 * 运行性能测试
 */
function runPerformanceTest() {
  console.log('🚀 数据库批量写入性能测试');
  console.log('=' .repeat(50));
  console.log(`测试时间：${new Date().toLocaleString('zh-CN')}`);
  console.log(`测试数据量：1000 条 Agents\n`);
  
  const testCount = 1000;
  const testAgents = generateTestAgents(testCount);
  
  // 测试 1: 单条写入（优化前）
  const db1Path = path.join(testDataDir, 'test_single.db');
  const singleDuration = testSingleInsert(db1Path, testAgents);
  
  // 清理数据库
  if (fs.existsSync(db1Path)) {
    fs.unlinkSync(db1Path);
  }
  
  // 测试 2: 批量写入（优化后）
  const db2Path = path.join(testDataDir, 'test_batch.db');
  const batchDuration = testBatchInsert(db2Path, testAgents);
  
  // 清理数据库
  if (fs.existsSync(db2Path)) {
    fs.unlinkSync(db2Path);
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
      avg_per_record_ms: parseFloat((singleDuration / testCount).toFixed(3))
    },
    batch_insert: {
      duration_ms: batchDuration,
      avg_per_record_ms: parseFloat((batchDuration / testCount).toFixed(3))
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
  
  // 打印优化建议
  console.log('\n💡 优化说明:');
  console.log('  - 优化前：每条记录独立事务，每次写入都要刷盘');
  console.log('  - 优化后：单个事务包裹所有写入，批量提交，减少 I/O');
  console.log('  - 关键技术：better-sqlite3 的 transaction() API');
  
  // 返回测试结果
  return {
    passed: check1 && check2,
    singleDuration,
    batchDuration,
    improvement: parseFloat(improvement),
    report
  };
}

// 运行测试
if (require.main === module) {
  try {
    const result = runPerformanceTest();
    console.log('\n' + '=' .repeat(50));
    if (result.passed) {
      console.log('🎉 所有测试通过！性能优化成功！');
      process.exit(0);
    } else {
      console.log('⚠️  部分测试未通过，需要进一步优化');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ 测试失败:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

module.exports = { runPerformanceTest, generateTestAgents };
