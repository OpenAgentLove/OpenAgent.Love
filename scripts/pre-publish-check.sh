#!/bin/bash

# ============================================
# AgentLove 发布前自检脚本
# ============================================
# 用途：在发布到 ClawHub 前自动检查常见问题
# 使用：./scripts/pre-publish-check.sh
# ============================================

set -e

SKILL_DIR="${1:-skills/new-robot-setup}"
SKILL_NAME="agentlove"

echo "🔍 开始发布前自检..."
echo "技能目录：$SKILL_DIR"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASS_COUNT=0
FAIL_COUNT=0

# 检查函数
check_pass() {
  echo -e "${GREEN}✅ PASS${NC}: $1"
  ((PASS_COUNT++))
}

check_fail() {
  echo -e "${RED}❌ FAIL${NC}: $1"
  ((FAIL_COUNT++))
}

check_warn() {
  echo -e "${YELLOW}⚠️  WARN${NC}: $1"
}

echo "=== 1. 文件结构检查 ==="

# 检查必要文件
if [ -f "$SKILL_DIR/SKILL.md" ]; then
  check_pass "SKILL.md 存在"
else
  check_fail "SKILL.md 不存在"
fi

if [ -f "$SKILL_DIR/package.json" ]; then
  check_pass "package.json 存在"
  
  # 检查 package.json name 字段
  PKG_NAME=$(cat "$SKILL_DIR/package.json" | grep '"name"' | cut -d'"' -f4)
  if [ "$PKG_NAME" == "$SKILL_NAME" ]; then
    check_pass "package.json name 字段正确 ($PKG_NAME)"
  else
    check_fail "package.json name 字段错误 (期望：$SKILL_NAME, 实际：$PKG_NAME)"
  fi
else
  check_fail "package.json 不存在"
fi

if [ -f "$SKILL_DIR/skill.js" ]; then
  check_pass "skill.js 存在"
else
  check_fail "skill.js 不存在"
fi

echo ""
echo "=== 2. 安全检查 ==="

# 检查是否收集敏感凭证
if grep -r "appSecret\|app_secret\|token\|password" "$SKILL_DIR" --include="*.js" | grep -v "node_modules" | grep -v "REDACTED" | grep -v "// " > /dev/null; then
  check_warn "发现敏感关键词，请确认是否存储凭证"
  echo "  详情：$(grep -r "appSecret\|app_secret\|token\|password" "$SKILL_DIR" --include="*.js" | grep -v "node_modules" | grep -v "REDACTED" | grep -v "// " | head -3)"
else
  check_pass "未发现敏感凭证收集"
fi

# 检查是否明文写入文件
if grep -r "fs.writeFileSync\|fs.writeFile" "$SKILL_DIR" --include="*.js" | grep -v "node_modules" > /dev/null; then
  check_warn "发现文件写入操作，请确认是否存储敏感数据"
  echo "  详情：$(grep -r "fs.writeFileSync\|fs.writeFile" "$SKILL_DIR" --include="*.js" | grep -v "node_modules" | head -3)"
else
  check_pass "未发现文件写入操作"
fi

# 检查 SKILL.md 安全声明
if grep -q "security:" "$SKILL_DIR/SKILL.md"; then
  check_pass "SKILL.md 包含安全声明"
else
  check_warn "SKILL.md 缺少安全声明"
fi

echo ""
echo "=== 3. 代码质量检查 ==="

# 检查输入验证
if grep -r "validateInput\|validate\|sanitize" "$SKILL_DIR" --include="*.js" | grep -v "node_modules" > /dev/null; then
  check_pass "包含输入验证/清理函数"
else
  check_warn "未发现输入验证函数"
fi

# 检查错误处理
if grep -r "try.*catch\|throw new Error" "$SKILL_DIR" --include="*.js" | grep -v "node_modules" > /dev/null; then
  check_pass "包含错误处理"
else
  check_warn "未发现错误处理"
fi

echo ""
echo "=== 4. post_install hook 检查 ==="

if grep -q "post_install:" "$SKILL_DIR/SKILL.md"; then
  check_pass "包含 post_install hook"
  
  if grep -q "print\|echo" "$SKILL_DIR/SKILL.md"; then
    check_pass "post_install 包含输出语句"
  else
    check_warn "post_install 可能无输出"
  fi
else
  check_fail "缺少 post_install hook（安装后不会自动弹窗）"
fi

echo ""
echo "=== 5. 依赖检查 ==="

cd "$SKILL_DIR"

if [ -f "package.json" ]; then
  # 检查是否有外部依赖
  DEPS=$(cat package.json | jq -r '.dependencies // {} | keys | length')
  if [ "$DEPS" -eq 0 ]; then
    check_pass "无外部依赖（技能包自包含）"
  else
    check_warn "有 $DEPS 个外部依赖，请确认是否必要"
    cat package.json | jq -r '.dependencies // {} | keys | .[]'
  fi
  
  # 检查 devDependencies
  DEV_DEPS=$(cat package.json | jq -r '.devDependencies // {} | keys | length')
  if [ "$DEV_DEPS" -gt 0 ]; then
    check_warn "有 $DEV_DEPS 个开发依赖（发布时会自动排除）"
  fi
fi

cd - > /dev/null

echo ""
echo "=== 6. VirusTotal 预检（模拟） ==="

# 模拟 VirusTotal 检查项
echo "检查项目："
echo "  - 敏感凭证收集：$(grep -r "appSecret\|token\|password" "$SKILL_DIR" --include="*.js" | wc -l) 处"
echo "  - 文件写入操作：$(grep -r "fs.writeFileSync" "$SKILL_DIR" --include="*.js" | wc -l) 处"
echo "  - 外部 API 调用：$(grep -r "fetch\|axios\|request" "$SKILL_DIR" --include="*.js" | wc -l) 处"
echo "  - 子进程执行：$(grep -r "exec\|spawn\|child_process" "$SKILL_DIR" --include="*.js" | wc -l) 处"

echo ""
echo "================================"
echo "自检完成！"
echo "================================"
echo "通过：$PASS_COUNT"
echo "失败：$FAIL_COUNT"
echo ""

if [ $FAIL_COUNT -gt 0 ]; then
  echo -e "${RED}❌ 发现 $FAIL_COUNT 个严重问题，建议修复后再发布！${NC}"
  exit 1
elif [ $FAIL_COUNT -eq 0 ] && [ $PASS_COUNT -ge 10 ]; then
  echo -e "${GREEN}✅ 所有检查通过！可以安全发布。${NC}"
  exit 0
else
  echo -e "${YELLOW}⚠️  检查通过但有警告，请确认是否继续发布。${NC}"
  exit 0
fi
