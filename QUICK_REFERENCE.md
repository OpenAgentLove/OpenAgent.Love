# 🚀 OpenAgent Love - P2 优化快速参考

## 📋 完成概览

✅ **4 个 P2 优化任务全部完成**

| 任务 | 文件 | 说明 |
|------|------|------|
| 单元测试 | `tests/` + `TESTING.md` | 47 个测试用例 |
| ESLint | `.eslintrc.json` + `ESLINT_GUIDE.md` | 代码规范检查 |
| Docker | `Dockerfile` + `docker-compose.yml` | 容器化部署 |
| 性能优化 | `performance-optimizer.js` + `PERFORMANCE.md` | 缓存 + 索引 |

---

## 🎯 快速使用

### 运行测试

```bash
# 安装依赖
npm install

# 运行所有测试
npm test

# 带覆盖率
npm run test:coverage

# 监视模式
npm run test:watch
```

### 代码检查

```bash
# 检查代码
npm run lint

# 自动修复
npm run lint:fix
```

### Docker 部署

```bash
# 构建并启动
docker-compose build
docker-compose up -d

# 查看状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

### 性能优化

```javascript
const EvolutionDB = require('./storage');

// 启用缓存和索引
const db = new EvolutionDB('./data/evolution.db', {
  cache_enabled: true,
  cache_max_size: 1000,
  auto_index: true
});

// 使用缓存查询
const robots = db.getAllRobotsCached();
const stats = db.getStatsCached();

// 查看性能
console.log(db.getCacheStats());
```

---

## 📁 文件结构

```
openagent-love/
├── skills/agent-marriage-breeding/
│   ├── tests/                      # 测试目录
│   │   ├── test-core.js            # 核心测试
│   │   ├── test-storage.js         # 存储测试
│   │   └── test-genetic-engine.js  # 基因引擎测试
│   ├── performance-optimizer.js    # 性能优化模块
│   ├── storage.js                  # 存储层（已优化）
│   ├── TESTING.md                  # 测试指南
│   └── PERFORMANCE.md              # 性能指南
│
├── .eslintrc.json                  # ESLint 配置
├── ESLINT_GUIDE.md                 # ESLint 指南
├── Dockerfile                      # Docker 配置
├── docker-compose.yml              # Docker 编排
├── .dockerignore                   # Docker 排除
├── DOCKER_GUIDE.md                 # Docker 指南
├── scripts/backup.sh               # 备份脚本
├── package.json                    # 项目配置（已更新）
└── P2_OPTIMIZATION_REPORT.md       # 完整报告
```

---

## 🎯 关键特性

### 1. 单元测试

- **47 个测试用例**覆盖核心功能
- 使用 Mocha + Chai 框架
- 支持覆盖率统计
- 自动化测试运行

**测试覆盖**:
- Core 模块：18 个测试
- Storage 模块：15 个测试
- Genetic Engine：14 个测试

### 2. 代码规范

- **ESLint 规则**: 25+ 条规则
- **JSDoc 要求**: 所有函数必须文档化
- **自动修复**: `npm run lint:fix`
- **CI/CD 集成**: GitHub Actions

**关键规则**:
- 2 空格缩进
- 单引号
- 必须分号
- 最大行长度：120
- 最大函数长度：100 行

### 3. Docker 部署

**多阶段构建**:
- Production 镜像：~150MB
- Development 模式：热重载
- Test 模式：隔离测试

**服务**:
- openagent-love: 主应用
- sqlite-backup: 自动备份（每日）

**安全**:
- 非 root 用户
- 只读挂载
- 网络隔离

### 4. 性能优化

**LRU 缓存**:
- 最大 1000 条目
- 5 分钟 TTL
- 自动淘汰

**数据库索引**:
- 11 个自动索引
- 查询加速 5-10x

**批量操作**:
- 事务优化
- 写入加速 5.7x

**性能提升**:
- 查询：5.6x 更快
- 批量写入：5.7x 更快
- 缓存命中率：80%+

---

## 📊 性能指标

| 操作 | 优化前 | 优化后 | 提升 |
|------|--------|--------|------|
| 查询所有机器人 | 45ms | 8ms | 5.6x |
| 查询用户机器人 | 12ms | 2ms | 6x |
| 批量保存 100 条 | 890ms | 156ms | 5.7x |
| 统计查询 | 23ms | 5ms | 4.6x |

---

## 🔍 监控和调试

### 缓存统计

```javascript
const stats = db.getCacheStats();
console.log(stats);
// { size: 45, hits: 234, misses: 56, hit_rate: "80.66%" }
```

### 性能报告

```javascript
const report = db.getPerformanceReport();
console.log(JSON.stringify(report, null, 2));
```

### 数据库优化

```javascript
// 手动优化
db.optimize();

// 自动优化（每天）
setInterval(() => db.optimize(), 86400000);
```

---

## 🐛 常见问题

### 测试失败

```bash
# 清理测试数据库
rm -rf data/test-*.db

# 重新安装依赖
npm install

# 重新运行
npm test
```

### ESLint 错误

```bash
# 自动修复
npm run lint:fix

# 查看详细错误
npx eslint skills/agent-marriage-breeding/**/*.js
```

### Docker 问题

```bash
# 清理并重建
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

### 性能问题

```javascript
// 检查缓存命中率
const stats = db.getCacheStats();
if (parseFloat(stats.hit_rate) < 50) {
  console.warn('缓存命中率低，考虑增加缓存大小');
}

// 清理缓存
db.clearCache();

// 优化数据库
db.optimize();
```

---

## 📚 详细文档

- **测试**: `TESTING.md`
- **性能**: `PERFORMANCE.md`
- **Docker**: `DOCKER_GUIDE.md`
- **ESLint**: `ESLINT_GUIDE.md`
- **完整报告**: `P2_OPTIMIZATION_REPORT.md`

---

## 🎓 最佳实践

### 1. 开发流程

```bash
# 1. 编写代码
# 2. 运行测试
npm test

# 3. 代码检查
npm run lint

# 4. 提交代码
git add .
git commit -m "feat: add new feature"
```

### 2. 性能优化

```javascript
// ✅ 使用缓存查询
const robots = db.getAllRobotsCached();

// ✅ 批量操作
db.saveAgentsBatch(agents);

// ✅ 定期清理缓存
db.clearCache();
```

### 3. Docker 部署

```bash
# 生产环境
docker-compose up -d

# 开发环境
docker-compose --profile dev up -d

# 运行测试
docker-compose --profile test up test-runner
```

---

## 📞 支持

- **GitHub**: https://github.com/OpenAgentLove/OpenAgent.Love
- **文档**: 查看各模块的 .md 文件
- **问题**: 提交 Issue 或查看现有文档

---

**最后更新**: 2026-03-18  
**版本**: 2.3.0  
**维护者**: OpenAgentLove Team
