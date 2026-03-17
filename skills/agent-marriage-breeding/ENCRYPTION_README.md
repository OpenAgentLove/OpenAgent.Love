# 🔐 数据库加密快速指南

## 一分钟快速启用

### 1. 生成密钥

```bash
# 生成密钥并保存到文件
node skills/agent-marriage-breeding/scripts/generate-key.js ./data/.db_key

# 设置环境变量
export DATABASE_ENCRYPTION_KEY=$(cat ./data/.db_key)
```

### 2. 迁移现有数据库（如需要）

```bash
# 检查当前状态
node skills/agent-marriage-breeding/scripts/migrate-encryption.js --check

# 迁移（自动备份）
node skills/agent-marriage-breeding/scripts/migrate-encryption.js ./data/evolution.db
```

### 3. 验证

```bash
# 检查加密状态
node skills/agent-marriage-breeding/scripts/migrate-encryption.js --check
```

---

## Docker 部署

### docker-compose.yml

```yaml
services:
  openagent-love:
    environment:
      - DATABASE_ENCRYPTION_KEY=${DATABASE_ENCRYPTION_KEY}
    volumes:
      - openagent-data:/app/data
```

### .env 文件

```bash
DATABASE_ENCRYPTION_KEY=your-64-character-hex-key-here
```

---

## 常用命令

```bash
# 生成密钥
npm run db:generate-key

# 检查加密状态
npm run db:check-encryption

# 迁移数据库
npm run db:migrate-encryption
```

---

## 密钥管理

### 安全提示

- ✅ 密钥文件权限设置为 600：`chmod 600 ./data/.db_key`
- ✅ 不要将密钥提交到 Git（已自动添加到 .gitignore）
- ✅ 生产环境使用密钥管理服务
- ✅ 定期轮换密钥（建议每 90 天）

### 密钥轮换

```javascript
const KeyManager = require('./key-manager.js');
const EvolutionDB = require('./storage.js');

const db = new EvolutionDB('./data/evolution.db');

// 生成新密钥
const newKey = KeyManager.generateKey();

// 轮换密钥
const result = db.rotateEncryptionKey(newKey, oldKey);
console.log(result.success ? '✅ 成功' : '❌ 失败');
```

---

## 故障排查

### 问题：提示"密钥未配置"

**解决**: 设置环境变量
```bash
export DATABASE_ENCRYPTION_KEY=your-key-here
```

### 问题：提示"密钥验证失败"

**解决**: 检查密钥是否正确
```bash
# 检查密钥配置
node scripts/migrate-encryption.js --check
```

### 问题：迁移失败

**解决**: 从备份恢复
```bash
cp ./data/evolution.db.backup.* ./data/evolution.db
```

---

## 更多信息

- 详细文档：`../../DOCKER_GUIDE.md`
- 性能指南：`./PERFORMANCE.md`
- 实现报告：`./ENCRYPTION_IMPLEMENTATION_REPORT.md`
