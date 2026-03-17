# Skills 安装指南

## ⚠️ 重要提示

**不要使用 `git clone` 直接克隆 skills 到 `skills/` 目录！**

这会导致 git submodule 问题，因为克隆的仓库包含 `.git` 目录。

---

## ✅ 正确的安装方法

### 方法 1：使用 ClawHub（推荐）

```bash
# 安装官方技能
clawhub install agent-marriage-breeding
clawhub install agent-backup-migration
clawhub install new-robot-setup

# 安装社区技能
clawhub install <skill-name>
```

### 方法 2：手动复制

1. 下载技能的 ZIP 文件
2. 解压到 `skills/` 目录
3. 确保**没有** `.git` 子目录

```bash
# 错误示例（会创建 submodule）
cd skills/
git clone https://github.com/xxx/skill-name.git

# 正确示例（作为普通目录）
cd skills/
wget https://github.com/xxx/skill-name/archive/main.zip
unzip main.zip
mv skill-name-main skill-name
rm main.zip
# 确保删除 .git 目录（如果有）
rm -rf skill-name/.git
```

---

## 🔍 如何检查 submodule 问题

```bash
# 检查是否有嵌套的 .git 目录
find skills/ -type d -name ".git"

# 检查是否有 submodule 引用
git ls-tree -r HEAD | grep "^160000"

# 检查 submodule 状态
git submodule status
```

如果输出不为空，说明存在 submodule 问题。

---

## 🛠️ 修复 submodule 问题

```bash
# 1. 删除所有 skills 的 .git 子目录
find skills/ -maxdepth 2 -type d -name ".git" -exec rm -rf {} \;

# 2. 移除 submodule 引用（如果有）
git rm --cached skills/<skill-name>

# 3. 重新添加为普通目录
git add -f skills/<skill-name>/

# 4. 提交
git commit -m "fix: 移除 <skill-name> submodule 引用"
git push origin main
```

---

## 📋 已安装的 Skills 列表

查看当前安装的 skills：

```bash
ls -la skills/
```

查看技能目录文档：
- [技能目录（347 个技能）](../skills-catalog.md)

---

## 🚫 常见错误

### 错误 1：GitHub Actions 失败

```
No url found for submodule path 'skills/xxx' in .gitmodules
```

**原因**：skills 目录包含 `.git` 子目录

**解决**：删除 `.git` 目录并重新提交

### 错误 2：Git 状态显示 submodule

```bash
git status
# 显示：modified: skills/xxx (new commits)
```

**原因**：git 将该目录识别为 submodule

**解决**：删除 `.git` 目录，使用 `git add -f` 强制添加

---

## 📚 相关文档

- [v2.3.0 里程碑](../memory/MILESTONE_v2.3.0.md)
- [技能目录](../skills-catalog.md)
- [快速入门](../QUICKSTART.md)

---

_更新时间：2026-03-18_  
_作者：赵一 🤖_
