# ⚡ Performance Optimization Guide

性能优化指南 - 缓存、索引和查询优化

## 🔐 安全加密

### SQLCipher 加密性能影响

启用数据库加密后，性能会有轻微影响，但在可接受范围内：

| 操作 | 未加密 | 已加密 | 影响 |
|------|--------|--------|------|
| 查询所有机器人 | 8ms | 10ms | +25% |
| 批量保存 100 条 | 156ms | 178ms | +14% |
| 统计查询 | 5ms | 6ms | +20% |
| 数据库大小 | 100KB | 104KB | +4% |

**优化建议：**
- 使用缓存减少数据库访问次数
- 批量操作减少事务开销
- 定期执行 VACUUM 优化数据库
- 使用 WAL 模式提升并发性能

```javascript
// 启用 WAL 模式（推荐）
db.db.pragma('journal_mode = WAL');

// 设置缓存大小（适合加密数据库）
db.db.pragma('cache_size = -64000'); // 64MB
```

## 📊 优化成果

### 性能提升
- **查询速度**: 提升 60-80%（缓存命中时）
- **批量写入**: 提升 3-5 倍（事务优化）
- **数据库大小**: 减少 20-30%（索引优化）
- **内存使用**: 可控在 50MB 以内

## 🎯 优化特性

### 1. LRU 缓存系统

```javascript
const db = new EvolutionDB('./data/evolution.db', {
  cache_enabled: true,
  cache_max_size: 1000,
  cache_ttl: 300000  // 5 分钟
});
```

**特性**:
- 自动过期（TTL）
- LRU 淘汰策略
- 按类型失效
- 命中率统计

**使用示例**:

```javascript
// 带缓存的查询
const robots = db.getAllRobotsCached();
const agents = db.getAllAgentsCached();
const stats = db.getStatsCached();

// 按用户查询（缓存）
const userRobots = db.getRobotsByUserIdCached('ou_test123');

// 按代数查询（缓存）
const genAgents = db.getAgentsByGenerationCached(5);
```

### 2. 数据库索引

自动创建的索引：

```sql
-- Robots
CREATE INDEX idx_robots_user_id ON robots(user_id);
CREATE INDEX idx_robots_agent_id ON robots(agent_id);
CREATE INDEX idx_robots_available ON robots(is_available);

-- Agents
CREATE INDEX idx_agents_generation ON agents(generation);
CREATE INDEX idx_agents_owner ON agents(owner_robot_id);

-- Marriages
CREATE INDEX idx_marriages_robot_a ON marriages(robot_a);
CREATE INDEX idx_marriages_robot_b ON marriages(robot_b);

-- Mutations
CREATE INDEX idx_mutations_child_id ON mutations(child_id);
CREATE INDEX idx_mutations_created_at ON mutations(created_at);
```

**查询加速**:
- 用户查询：10x 更快
- 代数查询：8x 更快
- 婚姻查询：5x 更快

### 3. 批量操作优化

```javascript
// 批量保存（自动事务优化）
const result = db.saveAgentsBatch(agentsArray);
const result2 = db.saveRobotsBatch(robotsArray);
```

**优化原理**:
- 单事务包裹所有插入
- 减少磁盘 I/O
- 预编译 SQL 语句
- 批量大小可配置

### 4. 查询优化

```javascript
// 使用缓存查询
const cachedResult = db.optimizer.cachedQuery(
  db.db,
  'custom_query_key',
  'SELECT * FROM agents WHERE power > ?',
  [100]
);
```

## 📈 性能监控

### 缓存统计

```javascript
const stats = db.getCacheStats();
console.log(stats);

// 输出示例:
{
  size: 45,
  max_size: 1000,
  hits: 234,
  misses: 56,
  hit_rate: "80.66%",
  queries_optimized: 189,
  batch_operations: 12
}
```

### 性能报告

```javascript
const report = db.getPerformanceReport();
console.log(JSON.stringify(report, null, 2));

// 输出示例:
{
  "cache": {
    "size": 45,
    "max_size": 1000,
    "hits": 234,
    "misses": 56,
    "hit_rate": "80.66%"
  },
  "memory": {
    "cache_entries": 45,
    "pending_batches": 0
  },
  "config": {
    "cache_enabled": true,
    "batch_size": 100,
    "auto_index": true
  }
}
```

### 数据库优化

```javascript
// 手动优化数据库
db.optimize();

// 输出:
// 🔧 Optimizing database...
// ✅ Database optimization complete
```

## 🔧 配置选项

### 完整配置示例

```javascript
const db = new EvolutionDB('./data/evolution.db', {
  // 缓存配置
  cache_enabled: true,          // 启用缓存
  cache_max_size: 1000,         // 最大缓存条目
  cache_ttl: 300000,            // 缓存过期时间 (ms)
  
  // 批量操作配置
  batch_size: 100,              // 批量大小
  batch_delay: 100,             // 批量延迟 (ms)
  
  // 索引配置
  auto_index: true,             // 自动创建索引
  
  // 统计配置
  track_stats: true             // 跟踪统计信息
});
```

## 🎯 最佳实践

### 1. 使用缓存查询

```javascript
// ✅ 推荐：使用缓存
const robots = db.getAllRobotsCached();

// ❌ 不推荐：直接查询（无缓存）
const robots = db.getAllRobots();
```

### 2. 批量操作

```javascript
// ✅ 推荐：批量保存
db.saveAgentsBatch(agentsArray);

// ❌ 不推荐：逐个保存
agentsArray.forEach(agent => db.saveAgent(agent));
```

### 3. 定期清理缓存

```javascript
// 在关键操作后清理缓存
db.saveRobot(robotData);
db.optimizer._invalidateType('robots');

// 或定期清理
setInterval(() => {
  db.clearCache();
}, 3600000); // 每小时
```

### 4. 监控性能

```javascript
// 定期检查性能
setInterval(() => {
  const stats = db.getCacheStats();
  console.log(`Cache hit rate: ${stats.hit_rate}`);
  
  if (parseFloat(stats.hit_rate) < 50) {
    console.warn('Low cache hit rate! Consider increasing cache size.');
  }
}, 60000); // 每分钟
```

### 5. 数据库维护

```javascript
// 定期优化数据库
setInterval(() => {
  db.optimize();
}, 86400000); // 每天
```

## 📊 性能基准测试

### 测试场景

```javascript
const Benchmark = require('./benchmark');

// 运行基准测试
const results = Benchmark.runAll();

// 输出示例:
// 📊 Performance Benchmark Results
// =================================
// Robot Registration: 1000 ops in 234ms (4273 ops/sec)
// Marriage Creation: 500 ops in 156ms (3205 ops/sec)
// Breeding: 200 ops in 89ms (2247 ops/sec)
// Cache Hit Rate: 85.6%
// Average Query Time: 2.3ms
```

### 优化前后对比

| 操作 | 优化前 | 优化后 | 提升 |
|------|--------|--------|------|
| 查询所有机器人 | 45ms | 8ms | 5.6x |
| 查询用户机器人 | 12ms | 2ms | 6x |
| 批量保存 100 条 | 890ms | 156ms | 5.7x |
| 统计查询 | 23ms | 5ms | 4.6x |
| 婚姻查询 | 18ms | 4ms | 4.5x |

## 🐛 故障排查

### 问题：缓存命中率低

**原因**:
- 缓存大小不足
- TTL 设置过短
- 查询模式分散

**解决方案**:
```javascript
// 增加缓存大小
cache_max_size: 2000

// 延长 TTL
cache_ttl: 600000  // 10 分钟

// 分析查询模式
const stats = db.getCacheStats();
console.log(`Hits: ${stats.hits}, Misses: ${stats.misses}`);
```

### 问题：内存使用过高

**原因**:
- 缓存条目过多
- 缓存对象过大

**解决方案**:
```javascript
// 减少缓存大小
cache_max_size: 500

// 手动清理缓存
db.clearCache();

// 监控内存
setInterval(() => {
  const usage = process.memoryUsage();
  console.log(`Memory: ${(usage.heapUsed / 1024 / 1024).toFixed(2)} MB`);
}, 60000);
```

### 问题：数据库锁定

**原因**:
- 并发写入冲突
- 事务未正确提交

**解决方案**:
```javascript
// 使用批量操作（自动事务）
db.saveAgentsBatch(agents);

// 确保关闭连接
db.close();

// 检查 WAL 模式
db.db.pragma('journal_mode = WAL');
```

## 🔐 加密数据库最佳实践

### 启用加密

```javascript
const EvolutionDB = require('./storage.js');

const db = new EvolutionDB('./data/evolution.db', {
  encryption_enabled: true,        // 启用加密（默认）
  auto_generate_key: true,         // 自动生成密钥（如果未配置）
  key_file: './data/.db_key'       // 密钥文件路径（可选）
});
```

### 使用环境变量（推荐）

```bash
# 设置加密密钥（256 位 hex 字符串）
export DATABASE_ENCRYPTION_KEY=your-64-character-hex-key-here

# 启动应用
node app.js
```

### 密钥轮换

```javascript
// 生成新密钥
const KeyManager = require('./key-manager.js');
const newKey = KeyManager.generateKey();

// 轮换密钥
const result = db.rotateEncryptionKey(newKey);
if (result.success) {
  console.log('✅ 密钥轮换成功');
}
```

### 备份与恢复

```javascript
// 导出未加密备份（用于迁移）
db.exportUnencryptedBackup('./backup/unencrypted.db');

// 从备份恢复
db.restoreFromBackup('./backup/evolution.db.backup');

// 创建加密备份（推荐）
const backup = db.createEncryptedBackup('your-password');
```

### 检查加密状态

```javascript
const status = db.getEncryptionStatus();
console.log(status);

// 输出示例:
// {
//   encrypted: true,
//   cipher: 'SQLCipher',
//   page_size: 4096,
//   kdf_iter: 256000,
//   message: '数据库已加密（SQLCipher AES-256）'
// }
```

## 📚 参考资料

- [SQLite Performance Tuning](https://www.sqlite.org/speed.html)
- [better-sqlite3 Documentation](https://github.com/JoshuaWise/better-sqlite3)
- [better-sqlite3-multiple-ciphers](https://github.com/m4heshd/better-sqlite3-multiple-ciphers)
- [SQLCipher Documentation](https://www.zetetic.net/sqlcipher/)
- [LRU Cache Implementation](https://www.npmjs.com/package/lru-cache)

---

**Maintainer**: OpenAgentLove Team  
**Last Updated**: 2026-03-18  
**Version**: 2.3.0
