# 🐳 Docker Deployment Guide

Complete guide for deploying OpenAgent Love using Docker.

## 📋 Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- 512MB RAM minimum
- 1GB disk space

## 🚀 Quick Start

### Build and Run

```bash
# Build the image
docker-compose build

# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### Stop Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ deletes data)
docker-compose down -v
```

## 🎯 Service Architecture

```
┌─────────────────────────────────────┐
│     openagent-network (bridge)      │
│                                     │
│  ┌──────────────────┐              │
│  │ openagent-love   │              │
│  │ (Main App)       │◄─────────────┤
│  │ Port: 3000       │              │
│  └────────┬─────────┘              │
│           │                        │
│           ▼                        │
│  ┌──────────────────┐              │
│  │ sqlite-backup    │              │
│  │ (Auto Backup)    │              │
│  │ Daily backups    │              │
│  └──────────────────┘              │
└─────────────────────────────────────┘
```

## 📦 Docker Compose Services

### Production Services (default)

1. **openagent-love**: Main application
2. **sqlite-backup**: Automated database backups

### Optional Profiles

#### Development Mode

```bash
docker-compose --profile dev up -d
```

- Hot reload enabled
- Source code mounted
- Test watcher running

#### Test Mode

```bash
docker-compose --profile test up test-runner
```

- Runs test suite
- Isolated test database
- Results in `./test-results/`

## 🔧 Configuration

### Environment Variables

```yaml
environment:
  - NODE_ENV=production
  - DB_PATH=/app/data/evolution.db
  - LOG_LEVEL=info
  
  # 数据库加密（推荐生产环境启用）
  - DATABASE_ENCRYPTION_KEY=your-256-bit-hex-key-here
```

### 🔐 数据库加密配置

**为什么需要加密？**
- 保护敏感数据（用户信息、机器人配置等）
- 符合安全合规要求
- 防止数据泄露风险

**启用加密步骤：**

1. **生成加密密钥**
   ```bash
   # 在服务器上生成密钥
   node skills/agent-marriage-breeding/scripts/generate-key.js ./data/.db_key
   
   # 设置文件权限
   chmod 600 ./data/.db_key
   ```

2. **在 docker-compose.yml 中配置**
   ```yaml
   services:
     openagent-love:
       environment:
         - DATABASE_ENCRYPTION_KEY=${DATABASE_ENCRYPTION_KEY}
   ```

3. **使用 .env 文件（推荐）**
   ```bash
   # 创建 .env 文件
   echo "DATABASE_ENCRYPTION_KEY=$(cat ./data/.db_key)" > .env
   
   # Docker Compose 会自动加载
   docker-compose up -d
   ```

**密钥管理最佳实践：**
- ✅ 使用环境变量或密钥文件，不要硬编码
- ✅ 设置密钥文件权限为 600（仅所有者可读写）
- ✅ 不要将密钥提交到 Git（已自动添加到 .gitignore）
- ✅ 定期轮换密钥（建议每 90 天）
- ✅ 生产环境使用密钥管理服务（如 AWS Secrets Manager）

**迁移现有数据库：**
```bash
# 检查当前加密状态
node skills/agent-marriage-breeding/scripts/migrate-encryption.js --check

# 迁移未加密数据库到加密
node skills/agent-marriage-breeding/scripts/migrate-encryption.js ./data/evolution.db --backup --verify
```

**验证加密状态：**
```bash
# 在容器内检查
docker exec openagent-love-app node -e "
const EvolutionDB = require('./skills/agent-marriage-breeding/storage.js');
const db = new EvolutionDB('./data/evolution.db');
console.log(db.getEncryptionStatus());
db.close();
"
```

### Volumes

```yaml
volumes:
  # Persistent database storage
  - openagent-data:/app/data
  
  # Mount skills (read-only)
  - ./skills:/app/skills:ro
```

### Networks

- **Network Name**: `openagent-network`
- **Subnet**: `172.28.0.0/16`
- **Driver**: Bridge

## 📊 Health Checks

### Application Health

```bash
# Check container health
docker inspect --format='{{.State.Health.Status}}' openagent-love-app

# View health logs
docker inspect --format='{{json .State.Health.Log}}' openagent-love-app | jq
```

### Manual Health Check

```bash
docker exec openagent-love-app node -e "console.log('Healthy')"
```

## 💾 Data Persistence

### Database Location

- **Container**: `/app/data/evolution.db`
- **Host**: Docker volume `openagent-data`

### Access Database from Host

```bash
# Find volume mount point
docker volume inspect openagent-data

# Copy database to host
docker cp openagent-love-app:/app/data/evolution.db ./backup.db
```

### Backup Management

```bash
# List backups
ls -la ./backups/

# Restore from backup
docker cp ./backup.db openagent-love-app:/app/data/evolution.db

# Manual backup
docker exec openagent-love-app cp /app/data/evolution.db /app/data/evolution.backup.db
```

## 🔍 Logging

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f openagent-love

# Last 100 lines
docker-compose logs --tail=100 openagent-love
```

### Log Configuration

- **Driver**: json-file
- **Max Size**: 10MB per file
- **Max Files**: 3 (rotation)

## 🛠️ Common Operations

### Update Application

```bash
# Pull latest code
git pull

# Rebuild and restart
docker-compose build
docker-compose up -d --force-recreate
```

### Run Tests in Docker

```bash
docker-compose --profile test up test-runner
```

### Development Mode

```bash
docker-compose --profile dev up -d

# View dev logs
docker-compose logs -f dev
```

### Execute Commands

```bash
# Run npm command
docker exec openagent-love-app npm run test

# Open shell
docker exec -it openagent-love-app sh

# Check database
docker exec openagent-love-app sqlite3 /app/data/evolution.db ".tables"
```

## 🐛 Troubleshooting

### Issue: Container won't start

```bash
# Check logs
docker-compose logs openagent-love

# Verify build
docker-compose build --no-cache
```

### Issue: Database locked

```bash
# Stop all services
docker-compose down

# Remove volume (⚠️ backup first!)
docker volume rm openagent-data

# Restart
docker-compose up -d
```

### Issue: Permission errors

```bash
# Fix permissions
docker exec openagent-love-app chown -R nodejs:nodejs /app
```

### Issue: Out of disk space

```bash
# Clean up unused containers
docker system prune -a

# Remove old images
docker image prune

# Check volume size
docker system df -v
```

## 📈 Performance Optimization

### Resource Limits (optional)

Add to `docker-compose.yml`:

```yaml
services:
  openagent-love:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 128M
```

### Build Optimization

```bash
# Use build cache
docker-compose build --parallel

# Multi-stage build (already configured)
# Reduces final image size by ~60%
```

## 🔐 Security

### Non-root User

The application runs as `nodejs` user (UID 1001) inside the container.

### Read-only Volumes

Skills directory is mounted as read-only:

```yaml
- ./skills:/app/skills:ro
```

### Network Isolation

Services communicate via isolated bridge network.

## 📝 Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure log rotation
- [ ] Enable health checks
- [ ] Set up backup retention policy
- [ ] Configure resource limits
- [ ] Review security settings
- [ ] Test disaster recovery

## 🎓 Advanced Usage

### Multi-host Deployment

```bash
# Use Docker Swarm
docker swarm init
docker stack deploy -c docker-compose.yml openagent
```

### Kubernetes

See `k8s/` directory for Kubernetes manifests.

### Custom Network

```bash
# Create custom network
docker network create --subnet=172.28.0.0/16 openagent-network

# Update docker-compose.yml to use external network
```

---

**Maintainer**: OpenAgentLove Team  
**Last Updated**: 2026-03-18  
**Version**: 2.3.0
