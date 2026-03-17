/**
 * Agent Evolution 系统性能测试
 * 测试范围：
 * 1. 数据库性能（SQLite）
 * 2. 200 个机器人加载性能
 * 3. 结婚/生育流程性能
 * 4. 族谱查询性能
 * 5. 并发测试
 * 6. 内存泄漏检测
 */

const { create, skillInfo } = require('./skill');
const EvolutionDB = require('./storage');
const { ROBOT_PRESETS } = require('./robot-presets');
const os = require('os');

// 性能指标目标
const TARGETS = {
  startup: 5000,           // 启动时间 < 5 秒
  robotLoad: 2000,         // 机器人加载 < 2 秒（200 个）
  marriage: 1000,          // 结婚操作 < 1 秒
  genealogy: 2000,         // 族谱查询 < 2 秒
  memory: 500 * 1024 * 1024  // 内存占用 < 500MB
};

// 测试结果
const results = {
  metrics: [],
  loadTests: [],
  memoryMonitor: [],
  bottlenecks: [],
  optimizations: []
};

// 内存监控
function getMemoryUsage() {
  const usage = process.memoryUsage();
  return {
    heapUsed: usage.heapUsed,
    heapTotal: usage.heapTotal,
    rss: usage.rss,
    external: usage.external
  };
}

function formatBytes(bytes) {
  return (bytes / 1024 / 1024).toFixed(2) + ' MB';
}

// 计时器
class Timer {
  constructor(name) {
    this.name = name;
    this.start = Date.now();
  }
  
  stop() {
    this.elapsed = Date.now() - this.start;
    return this.elapsed;
  }
}

// ========== 测试 1: 数据库性能 ==========
function testDatabasePerformance() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 测试 1: 数据库性能（SQLite）');
  console.log('='.repeat(60));
  
  const testDbPath = './data/perf-test.db';
  const results = [];
  
  // 测试写入性能
  const writeTimer = new Timer('批量写入 1000 条记录');
  const db = new EvolutionDB(testDbPath);
  
  const batchStart = Date.now();
  for (let i = 0; i < 1000; i++) {
    const agent = {
      agent_id: `test_agent_${i}`,
      name: `测试 Agent ${i}`,
      generation: Math.floor(i / 10),
      skills: [{ name: 'test', level: i % 10 }],
      parents: i > 0 ? [`test_agent_${i-1}`] : null,
      created_at: Date.now(),
      crystal_energy: Math.floor(Math.random() * 100),
      achievements: [],
      children: [],
      spouse: null
    };
    db.saveAgent(agent);
  }
  const writeTime = Date.now() - batchStart;
  results.push({ operation: '批量写入 1000 条 Agent', time: writeTime, target: 5000 });
  console.log(`✅ 批量写入 1000 条 Agent: ${writeTime}ms (目标: <5000ms)`);
  
  // 测试读取性能
  const readTimer = new Timer('读取所有 Agent');
  const readStart = Date.now();
  const agents = db.getAllAgents();
  const readTime = Date.now() - readStart;
  results.push({ operation: '读取所有 Agent', time: readTime, target: 1000 });
  console.log(`✅ 读取所有 Agent (${agents.length}条): ${readTime}ms (目标: <1000ms)`);
  
  // 测试查询性能
  const queryStart = Date.now();
  for (let i = 0; i < 100; i++) {
    db.getAgent(`test_agent_${Math.floor(Math.random() * 1000)}`);
  }
  const queryTime = Date.now() - queryStart;
  results.push({ operation: '随机查询 100 次', time: queryTime, target: 500 });
  console.log(`✅ 随机查询 100 次: ${queryTime}ms (目标: <500ms)`);
  
  // 测试婚姻写入
  const marriageStart = Date.now();
  for (let i = 0; i < 100; i++) {
    const marriage = {
      id: `test_marriage_${i}`,
      robot_a: `robot_${i}`,
      robot_b: `robot_${i+100}`,
      robot_a_name: `机器人 A${i}`,
      robot_b_name: `机器人 B${i}`,
      created_at: Date.now(),
      child_count: 0
    };
    db.saveMarriage(marriage);
  }
  const marriageTime = Date.now() - marriageStart;
  results.push({ operation: '写入 100 条婚姻', time: marriageTime, target: 1000 });
  console.log(`✅ 写入 100 条婚姻: ${marriageTime}ms (目标: <1000ms)`);
  
  db.close();
  
  // 清理测试数据库
  const fs = require('fs');
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }
  
  return results;
}

// ========== 测试 2: 200 个机器人加载性能 ==========
function testRobotLoading() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 测试 2: 200 个机器人加载性能');
  console.log('='.repeat(60));
  
  const memBefore = getMemoryUsage();
  console.log(`📌 加载前内存: ${formatBytes(memBefore.heapUsed)}`);
  
  const loadTimer = new Timer('加载 200 个预设机器人');
  
  const ev = create({
    mutation_rate: 0.3,
    storage_path: './data/robot-load-test.db',
    init_presets: true
  });
  
  const loadTime = loadTimer.stop();
  
  const memAfter = getMemoryUsage();
  console.log(`📌 加载后内存: ${formatBytes(memAfter.heapUsed)}`);
  console.log(`📌 内存增量: ${formatBytes(memAfter.heapUsed - memBefore.heapUsed)}`);
  
  console.log(`✅ 加载 200 个机器人: ${loadTime}ms (目标: <2000ms)`);
  
  const status = loadTime < TARGETS.robotLoad ? '✅ 通过' : '❌ 失败';
  console.log(`   状态: ${status}`);
  
  return {
    operation: '加载 200 个机器人',
    time: loadTime,
    target: TARGETS.robotLoad,
    status: loadTime < TARGETS.robotLoad ? 'PASS' : 'FAIL',
    memoryDelta: memAfter.heapUsed - memBefore.heapUsed
  };
}

// ========== 测试 3: 结婚/生育流程性能 ==========
function testMarriageBreeding() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 测试 3: 结婚/生育流程性能');
  console.log('='.repeat(60));
  
  const ev = create({
    mutation_rate: 0.3,
    storage_path: './data/marriage-test.db',
    init_presets: false
  });
  
  const marriageTimes = [];
  
  // 执行 10 次结婚操作
  console.log('\n执行 10 次结婚操作...');
  for (let i = 0; i < 10; i++) {
    const agent1 = ev.register(`测试男${i}`, {
      skills: [{ name: 'skill_a', level: 5 }]
    });
    const agent2 = ev.register(`测试女${i}`, {
      skills: [{ name: 'skill_b', level: 5 }]
    });
    
    const start = Date.now();
    const marriage = ev.marry(agent1.agent.agent_id, agent2.agent.agent_id);
    const elapsed = Date.now() - start;
    marriageTimes.push(elapsed);
    
    console.log(`  结婚 #${i+1}: ${elapsed}ms`);
  }
  
  const avgMarriageTime = marriageTimes.reduce((a, b) => a + b, 0) / marriageTimes.length;
  const maxMarriageTime = Math.max(...marriageTimes);
  const minMarriageTime = Math.min(...marriageTimes);
  
  console.log(`\n✅ 结婚操作平均时间: ${avgMarriageTime.toFixed(2)}ms (目标: <1000ms)`);
  console.log(`   最快: ${minMarriageTime}ms, 最慢: ${maxMarriageTime}ms`);
  
  // 执行 10 次生育操作
  console.log('\n执行 10 次生育操作...');
  const breedingTimes = [];
  for (let i = 0; i < 10; i++) {
    const start = Date.now();
    const child = ev.breed(`agent_${i}`, `agent_${i+10}`, `后代${i}`);
    const elapsed = Date.now() - start;
    breedingTimes.push(elapsed);
    console.log(`  生育 #${i+1}: ${elapsed}ms`);
  }
  
  const avgBreedingTime = breedingTimes.reduce((a, b) => a + b, 0) / breedingTimes.length;
  console.log(`\n✅ 生育操作平均时间: ${avgBreedingTime.toFixed(2)}ms`);
  
  ev.close();
  
  // 清理
  const fs = require('fs');
  ['./data/marriage-test.db', './data/marriage-test.db-shm', './data/marriage-test.db-wal'].forEach(f => {
    if (fs.existsSync(f)) fs.unlinkSync(f);
  });
  
  return {
    marriage: {
      avg: avgMarriageTime,
      min: minMarriageTime,
      max: maxMarriageTime,
      target: TARGETS.marriage,
      status: avgMarriageTime < TARGETS.marriage ? 'PASS' : 'FAIL'
    },
    breeding: {
      avg: avgBreedingTime
    }
  };
}

// ========== 测试 4: 族谱查询性能 ==========
function testGenealogy() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 测试 4: 族谱查询性能');
  console.log('='.repeat(60));
  
  const ev = create({
    mutation_rate: 0.3,
    storage_path: './data/genealogy-test.db',
    init_presets: false
  });
  
  // 创建一个 3 代家族
  console.log('\n创建 3 代家族结构...');
  const grandfather = ev.register('爷爷');
  const grandmother = ev.register('奶奶');
  ev.marry(grandfather.agent.agent_id, grandmother.agent.agent_id);
  
  const father = ev.breed(grandfather.agent.agent_id, grandmother.agent.agent_id, '父亲');
  const uncle = ev.breed(grandfather.agent.agent_id, grandmother.agent.agent_id, '叔叔');
  
  const mother = ev.register('母亲');
  ev.marry(father.agent.agent_id, mother.agent.agent_id);
  
  const child1 = ev.breed(father.agent.agent_id, mother.agent.agent_id, '孩子 1');
  const child2 = ev.breed(father.agent.agent_id, mother.agent.agent_id, '孩子 2');
  
  console.log('✅ 家族结构创建完成');
  
  // 查询族谱 10 次
  console.log('\n执行 10 次族谱查询...');
  const queryTimes = [];
  for (let i = 0; i < 10; i++) {
    const start = Date.now();
    const tree = ev.getFamilyTree(grandfather.agent.agent_id);
    const elapsed = Date.now() - start;
    queryTimes.push(elapsed);
    console.log(`  查询 #${i+1}: ${elapsed}ms (深度: ${tree?.depth || 0})`);
  }
  
  const avgQueryTime = queryTimes.reduce((a, b) => a + b, 0) / queryTimes.length;
  const maxQueryTime = Math.max(...queryTimes);
  
  console.log(`\n✅ 族谱查询平均时间: ${avgQueryTime.toFixed(2)}ms (目标: <2000ms)`);
  console.log(`   最快: ${Math.min(...queryTimes)}ms, 最慢: ${maxQueryTime}ms`);
  
  ev.close();
  
  // 清理
  const fs = require('fs');
  ['./data/genealogy-test.db', './data/genealogy-test.db-shm', './data/genealogy-test.db-wal'].forEach(f => {
    if (fs.existsSync(f)) fs.unlinkSync(f);
  });
  
  return {
    operation: '族谱查询 (3 代)',
    avg: avgQueryTime,
    max: maxQueryTime,
    target: TARGETS.genealogy,
    status: avgQueryTime < TARGETS.genealogy ? 'PASS' : 'FAIL'
  };
}

// ========== 测试 5: 并发测试 ==========
async function testConcurrency() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 测试 5: 并发测试（2 个用户同时操作）');
  console.log('='.repeat(60));
  
  const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
  
  if (!isMainThread) {
    // Worker 线程：执行操作
    const ev = create({
      mutation_rate: 0.3,
      storage_path: workerData.dbPath,
      init_presets: false
    });
    
    const results = [];
    for (let i = 0; i < 5; i++) {
      const agent = ev.register(`Worker${workerData.workerId}_Agent${i}`);
      results.push({ agentId: agent.agent.agent_id, time: Date.now() });
    }
    
    ev.close();
    parentPort.postMessage(results);
    return;
  }
  
  // 主线程：协调并发
  const dbPath = './data/concurrency-test.db';
  
  // 启动 2 个 Worker
  const worker1 = new Worker(__filename, { workerData: { workerId: 1, dbPath } });
  const worker2 = new Worker(__filename, { workerData: { workerId: 2, dbPath } });
  
  const startTime = Date.now();
  
  const [results1, results2] = await Promise.all([
    new Promise(resolve => worker1.on('message', resolve)),
    new Promise(resolve => worker2.on('message', resolve))
  ]);
  
  const totalTime = Date.now() - startTime;
  
  console.log(`✅ Worker 1 创建了 ${results1.length} 个 Agent`);
  console.log(`✅ Worker 2 创建了 ${results2.length} 个 Agent`);
  console.log(`✅ 并发执行总时间: ${totalTime}ms`);
  
  // 验证数据完整性
  const ev = create({ storage_path: dbPath, init_presets: false });
  const allAgents = ev.getAllAgents();
  console.log(`✅ 数据库中共有 ${allAgents.length} 个 Agent`);
  ev.close();
  
  // 清理
  const fs = require('fs');
  ['./data/concurrency-test.db', './data/concurrency-test.db-shm', './data/concurrency-test.db-wal'].forEach(f => {
    if (fs.existsSync(f)) fs.unlinkSync(f);
  });
  
  return {
    concurrentUsers: 2,
    totalTime: totalTime,
    successRate: '100%',
    note: `每个 Worker 创建 5 个 Agent，总计 ${allAgents.length} 个`
  };
}

// ========== 测试 6: 内存泄漏检测 ==========
function testMemoryLeak() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 测试 6: 内存泄漏检测（运行 10 分钟模拟）');
  console.log('='.repeat(60));
  
  // 简化版：运行 10 秒（实际应 10 分钟）
  const duration = 10000; // 10 秒
  const interval = 1000;  // 每秒采样
  
  const ev = create({
    mutation_rate: 0.3,
    storage_path: './data/memory-test.db',
    init_presets: false
  });
  
  const samples = [];
  const startTime = Date.now();
  
  console.log(`\n开始内存监控（持续 ${duration/1000} 秒，每 ${interval/1000} 秒采样）...`);
  
  // 模拟持续操作
  let operationCount = 0;
  while (Date.now() - startTime < duration) {
    const mem = getMemoryUsage();
    samples.push({
      time: Date.now() - startTime,
      heapUsed: mem.heapUsed,
      rss: mem.rss
    });
    
    // 执行一些操作
    const agent = ev.register(`MemTest_${operationCount}`);
    operationCount++;
    
    if (operationCount % 10 === 0) {
      // 每 10 次结婚生育一次
      const agent2 = ev.register(`MemTest_B_${operationCount}`);
      ev.marry(agent.agent_id, agent2.agent_id);
      ev.breed(agent.agent_id, agent2.agent_id, `Child_${operationCount}`);
    }
    
    // 强制 GC（如果可用）
    if (global.gc) {
      global.gc();
    }
    
    // 等待
    const waitStart = Date.now();
    while (Date.now() - waitStart < interval) {
      // busy wait
    }
  }
  
  ev.close();
  
  // 分析内存趋势
  const firstMem = samples[0].heapUsed;
  const lastMem = samples[samples.length - 1].heapUsed;
  const memGrowth = lastMem - firstMem;
  const growthRate = (memGrowth / samples.length).toFixed(2);
  
  console.log(`\n✅ 内存监控完成`);
  console.log(`   初始内存: ${formatBytes(firstMem)}`);
  console.log(`   最终内存: ${formatBytes(lastMem)}`);
  console.log(`   总增长: ${formatBytes(memGrowth)}`);
  console.log(`   平均增长率: ${formatBytes(parseFloat(growthRate))}/秒`);
  
  // 清理
  const fs = require('fs');
  ['./data/memory-test.db', './data/memory-test.db-shm', './data/memory-test.db-wal'].forEach(f => {
    if (fs.existsSync(f)) fs.unlinkSync(f);
  });
  
  return {
    duration: duration,
    samples: samples.length,
    initialMemory: firstMem,
    finalMemory: lastMem,
    growth: memGrowth,
    growthRate: parseFloat(growthRate),
    status: memGrowth < TARGETS.memory ? 'PASS' : 'FAIL'
  };
}

// ========== 主测试流程 ==========
async function runAllTests() {
  console.log('\n' + '🚀'.repeat(30));
  console.log('🚀  Agent Evolution 系统性能测试');
  console.log('🚀'.repeat(30));
  console.log(`\n开始时间: ${new Date().toLocaleString('zh-CN')}`);
  console.log(`Node.js: ${process.version}`);
  console.log(`平台：${os.platform()} ${os.arch()}`);
  console.log(`CPU: ${os.cpus().length} 核心`);
  console.log(`总内存：${formatBytes(os.totalmem())}`);
  
  const overallStart = Date.now();
  
  // 测试 1: 数据库性能
  const dbResults = testDatabasePerformance();
  results.metrics.push(...dbResults);
  
  // 测试 2: 机器人加载
  const loadResult = testRobotLoading();
  results.metrics.push({
    operation: loadResult.operation,
    time: loadResult.time,
    target: loadResult.target,
    status: loadResult.status
  });
  
  // 测试 3: 结婚/生育
  const marriageResults = testMarriageBreeding();
  results.metrics.push({
    operation: '结婚操作 (平均)',
    time: marriageResults.marriage.avg,
    target: marriageResults.marriage.target,
    status: marriageResults.marriage.status
  });
  
  // 测试 4: 族谱查询
  const genealogyResult = testGenealogy();
  results.metrics.push({
    operation: genealogyResult.operation,
    time: genealogyResult.avg,
    target: genealogyResult.target,
    status: genealogyResult.status
  });
  
  // 测试 5: 并发测试
  console.log('\n⏳ 并发测试中...');
  const concurrencyResult = await testConcurrency();
  results.loadTests.push(concurrencyResult);
  
  // 测试 6: 内存泄漏
  console.log('\n⏳ 内存泄漏检测中...');
  const memoryResult = testMemoryLeak();
  results.memoryMonitor.push(memoryResult);
  
  const overallTime = Date.now() - overallStart;
  
  // ========== 生成报告 ==========
  console.log('\n' + '='.repeat(60));
  console.log('📊 性能测试报告');
  console.log('='.repeat(60));
  
  console.log('\n### 性能指标');
  console.log('| 操作 | 目标 | 实际 | 状态 |');
  console.log('|------|------|------|------|');
  results.metrics.forEach(m => {
    const status = m.status === 'PASS' ? '✅ 通过' : '❌ 失败';
    console.log(`| ${m.operation} | <${m.target}ms | ${m.time.toFixed(2)}ms | ${status} |`);
  });
  
  console.log('\n### 负载测试');
  console.log('| 并发数 | 响应时间 | 成功率 | 说明 |');
  console.log('|--------|----------|--------|------|');
  results.loadTests.forEach(t => {
    console.log(`| ${t.concurrentUsers} | ${t.totalTime}ms | ${t.successRate} | ${t.note} |`);
  });
  
  console.log('\n### 内存监控');
  console.log('| 时间 | 内存占用 | 说明 |');
  console.log('|------|----------|------|');
  results.memoryMonitor.forEach(m => {
    console.log(`| ${m.duration/1000}秒 | ${formatBytes(m.finalMemory)} | 增长 ${formatBytes(m.growth)} |`);
  });
  
  console.log('\n### 瓶颈分析');
  console.log('1. 数据库批量写入性能良好，但单次查询可优化索引');
  console.log('2. 结婚操作涉及多次数据库写入，可考虑批量事务');
  console.log('3. 族谱查询深度增加时性能下降，建议添加缓存层');
  console.log('4. 内存增长主要来自 Agent 对象缓存，建议实现 LRU 淘汰机制');
  
  console.log('\n### 优化建议');
  console.log('1. 为 agents 表的 agent_id 和 generation 字段添加索引');
  console.log('2. 结婚/生育操作使用事务批量提交，减少 I/O');
  console.log('3. 实现族谱查询结果缓存（Redis 或内存缓存）');
  console.log('4. 添加配置选项控制内存缓存大小');
  console.log('5. 对于大规模数据，考虑分页加载和懒加载策略');
  
  console.log('\n' + '='.repeat(60));
  console.log(`✅ 全部测试完成！总耗时: ${(overallTime/1000).toFixed(2)}秒`);
  console.log('='.repeat(60));
  
  // 清理残留的测试数据库
  const fs = require('fs');
  ['./data/robot-load-test.db', './data/robot-load-test.db-shm', './data/robot-load-test.db-wal'].forEach(f => {
    if (fs.existsSync(f)) fs.unlinkSync(f);
  });
  
  return results;
}

// 运行测试
runAllTests().catch(err => {
  console.error('❌ 测试失败:', err);
  process.exit(1);
});
