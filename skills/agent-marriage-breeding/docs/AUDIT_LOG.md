# 审计日志功能文档

## 概述

审计日志模块用于记录机器人进化系统中的所有敏感操作，满足合规性和安全审计需求。

## 功能特性

- ✅ 记录所有敏感操作（注册、结婚、离婚、生育等）
- ✅ 记录操作者信息（Agent ID、用户 ID）
- ✅ 记录操作详情（JSON 格式）
- ✅ 记录操作结果（成功/失败）
- ✅ IP 地址哈希（保护隐私）
- ✅ 敏感信息自动脱敏
- ✅ 支持多维度查询（时间、操作者、操作类型等）
- ✅ 统计报表功能
- ✅ CSV 导出功能
- ✅ 自动清理过期日志

## 审计日志字段

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | INTEGER | 日志 ID（自增主键） |
| timestamp | INTEGER | 操作时间戳（毫秒） |
| action | TEXT | 操作类型（register/marry/divorce/breed 等） |
| actor_agent_id | TEXT | 操作者 Agent ID |
| actor_user_id | TEXT | 操作者用户 ID（如飞书 open_id） |
| target_id | TEXT | 目标 ID（机器人 ID、婚姻 ID 等） |
| target_type | TEXT | 目标类型（robot/marriage/agent） |
| details | TEXT | 操作详情（JSON 格式，已脱敏） |
| result | TEXT | 结果（success/failure） |
| ip_hash | TEXT | IP 地址哈希（SHA256，16 位） |
| error_message | TEXT | 错误信息（失败时） |
| created_at | INTEGER | 记录创建时间（秒） |

## 支持的操作类型

| 操作类型 | 说明 | 记录时机 |
|----------|------|----------|
| register | 机器人注册 | 注册成功/失败时 |
| marry | 结婚 | 结婚成功/失败时 |
| divorce | 离婚 | 离婚成功/失败时 |
| breed | 生育 | 生育成功/失败时 |

## 使用方法

### 1. 启用审计日志

在创建 EvolutionCore 实例时启用审计日志：

```javascript
const { EvolutionCore } = require('./core');

const core = new EvolutionCore({
  storage_path: './data/evolution.db',
  audit_storage_path: './data/audit.db',  // 审计日志数据库路径
  enable_audit: true  // 启用审计日志（默认 true）
});
```

### 2. 核心函数自动记录

所有核心函数已集成审计日志，调用时会自动记录：

```javascript
// 机器人注册
core.registerRobot({
  agentId: 'main',
  userId: 'ou_xxx',
  name: 'MyRobot',
  skills: ['skill_1']
}, {
  ip: '192.168.1.100'  // 可选：记录 IP
});

// 结婚
core.marry(robotIdA, robotIdB, {
  ip: '192.168.1.100',
  actor_user_id: 'ou_xxx'  // 可选：记录实际操作者
});

// 离婚
core.divorce(robotIdA, null, 'shared', {
  ip: '192.168.1.100',
  actor_user_id: 'ou_xxx'
});

// 生育
core.breed(robotId, 'ChildRobot', {
  ip: '192.168.1.100',
  actor_user_id: 'ou_xxx'
});
```

### 3. 查询审计日志

使用查询工具：

```bash
# 查询所有日志
node audit-query.js query

# 按操作类型查询
node audit-query.js query --action marry

# 按操作者查询
node audit-query.js query --actor-user-id ou_xxx

# 按时间范围查询
node audit-query.js query --start-time 2026-03-01 --end-time 2026-03-31

# 只查询失败操作
node audit-query.js query --result failure

# 限制返回数量
node audit-query.js query --limit 50 --offset 0
```

### 4. 获取统计信息

```bash
# 获取所有统计
node audit-query.js stats

# 按时间范围统计
node audit-query.js stats --start-time 2026-03-01
```

### 5. 导出 CSV

```bash
# 导出所有日志
node audit-query.js export --output /tmp/audit.csv

# 导出指定操作类型
node audit-query.js export --action marry --output /tmp/marriages.csv

# 导出指定时间范围
node audit-query.js export --start-time 2026-03-01 --output /tmp/march.csv
```

### 6. 清理过期日志

```bash
# 清理 90 天前的日志
node audit-query.js cleanup --retention-days 90

# 清理 365 天前的日志（默认）
node audit-query.js cleanup
```

## API 参考

### AuditLogger 类

```javascript
const AuditLogger = require('./audit-logger');
const auditLogger = new AuditLogger('./data/audit.db');
```

#### log(logEntry)

记录审计日志。

```javascript
auditLogger.log({
  action: 'register',
  actor_agent_id: 'main',
  actor_user_id: 'ou_xxx',
  target_id: 'robot_xxx',
  target_type: 'robot',
  details: { name: 'MyRobot' },
  result: 'success',
  ip: '192.168.1.100'
});
```

#### logSuccess(action, context)

记录成功操作。

```javascript
auditLogger.logSuccess('marry', {
  actor_user_id: 'ou_xxx',
  target_id: 'mar_xxx',
  details: { robot_a: 'robot_1', robot_b: 'robot_2' }
});
```

#### logFailure(action, context)

记录失败操作。

```javascript
auditLogger.logFailure('breed', {
  actor_user_id: 'ou_xxx',
  error_message: '机器人未婚',
  details: { robot_id: 'robot_1' }
});
```

#### query(filters)

查询审计日志。

```javascript
const logs = auditLogger.query({
  action: 'register',
  result: 'success',
  start_time: Date.now() - 86400000,  // 24 小时前
  end_time: Date.now(),
  limit: 100,
  offset: 0,
  order: 'desc'  // 'asc' 或 'desc'
});
```

#### getStats(filters)

获取统计信息。

```javascript
const stats = auditLogger.getStats({
  start_time: Date.now() - 86400000 * 30  // 30 天内
});

// 返回：
// {
//   total: 100,
//   by_result: [{ result: 'success', count: 90 }, { result: 'failure', count: 10 }],
//   by_action: [{ action: 'register', count: 50 }, ...]
// }
```

#### exportToCSV(filters, outputPath)

导出 CSV 文件。

```javascript
auditLogger.exportToCSV(
  { start_time: Date.now() - 86400000 * 30 },
  '/tmp/audit_march.csv'
);
```

#### cleanup(retentionDays)

清理过期日志。

```javascript
const deletedCount = auditLogger.cleanup(90);  // 清理 90 天前的日志
```

## 安全特性

### 敏感信息脱敏

审计日志自动脱敏以下敏感信息：

- 邮箱地址 → `[EMAIL]`
- 手机号 → `[PHONE]`
- 身份证号 → `[ID_CARD]`
- API 密钥 → `[API_KEY]`
- 密码 → `[REDACTED]`
- Token → `[REDACTED]`

### IP 地址保护

IP 地址使用 SHA256 哈希存储，只保留前 16 位，无法反推原始 IP。

### 数据库加密

审计日志数据库支持 SQLCipher 加密（AES-256），与主数据库使用相同的加密机制。

## 性能优化

- 索引优化：所有查询字段均创建索引
- 批量操作：支持批量查询和导出
- 自动清理：定期清理过期日志，避免数据库过大

## 日志保留策略

建议配置：

- 生产环境：保留 365 天
- 测试环境：保留 30 天
- 合规要求：根据当地法规调整

定期清理（建议每月）：

```bash
0 2 1 * * cd /path/to/skill && node audit-query.js cleanup --retention-days 365
```

## 监控告警

建议监控以下指标：

- 失败操作比例（超过 10% 告警）
- 单日操作量（异常波动告警）
- 数据库大小（超过 1GB 告警）

## 故障排查

### 问题：审计日志未记录

1. 检查 `enable_audit` 是否为 `true`
2. 检查审计日志数据库路径是否可写
3. 查看控制台日志是否有错误信息

### 问题：查询速度慢

1. 检查索引是否创建成功
2. 减少查询时间范围
3. 使用分页查询（limit/offset）

### 问题：数据库过大

1. 运行清理命令：`node audit-query.js cleanup --retention-days 90`
2. 导出并归档旧日志：`node audit-query.js export --start-time ... --end-time ...`
3. 考虑分库存储（按月分库）

## 最佳实践

1. **始终记录 IP**：在可能的情况下，始终传入 IP 地址用于审计
2. **定期清理**：设置定时任务定期清理过期日志
3. **定期备份**：审计日志是重要合规数据，应定期备份
4. **监控异常**：监控失败操作比例，及时发现潜在问题
5. **权限控制**：审计日志查询工具应限制访问权限

## 示例场景

### 场景 1：调查异常操作

```bash
# 查询某用户的所有操作
node audit-query.js query --actor-user-id ou_xxx --limit 100

# 查询某用户的所有失败操作
node audit-query.js query --actor-user-id ou_xxx --result failure

# 导出该用户的所有操作
node audit-query.js export --actor-user-id ou_xxx --output /tmp/user_audit.csv
```

### 场景 2：合规审计

```bash
# 导出上月的所有操作
node audit-query.js export \
  --start-time 2026-03-01T00:00:00+08:00 \
  --end-time 2026-03-31T23:59:59+08:00 \
  --output /tmp/audit_march_2026.csv

# 获取统计报表
node audit-query.js stats \
  --start-time 2026-03-01T00:00:00+08:00 \
  --end-time 2026-03-31T23:59:59+08:00
```

### 场景 3：性能分析

```bash
# 查询最频繁的操作类型
node audit-query.js stats

# 查询某时间段的操作趋势
node audit-query.js query \
  --start-time 2026-03-18T00:00:00+08:00 \
  --end-time 2026-03-18T23:59:59+08:00 \
  --limit 1000
```

## 更新日志

- 2026-03-18: 初始版本
  - 支持 register/marry/divorce/breed 操作审计
  - 支持多维度查询和统计
  - 支持 CSV 导出
  - 支持敏感信息脱敏
  - 支持 IP 地址哈希

---

**安全提示**：审计日志包含敏感操作记录，请妥善保管，限制访问权限。
