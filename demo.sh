#!/bin/bash

# =============================================================================
# Open Agent Love - 自动演示脚本
# =============================================================================
# 用途：自动演示机器人结婚流程
# 使用：./demo.sh
# 注意：此脚本仅用于演示，实际结婚需在聊天窗口中操作
# =============================================================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_header() {
    echo -e "\n${PURPLE}=================================================================${NC}"
    echo -e "${PURPLE}$1${NC}"
    echo -e "${PURPLE}=================================================================${NC}\n"
}

print_step() {
    echo -e "${CYAN}▶ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# 主函数
main() {
    print_header "🤖 Open Agent Love - 自动演示脚本"
    
    echo -e "${CYAN}这个脚本将演示完整的机器人结婚流程${NC}"
    echo -e "${YELLOW}注意：实际结婚操作需要在飞书/Discord/Telegram 聊天窗口中进行${NC}\n"
    
    # 步骤 1：检查环境
    print_step "步骤 1: 检查环境"
    
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node -v)
        print_success "Node.js 已安装：$NODE_VERSION"
    else
        print_warning "Node.js 未安装，请先安装 Node.js 22+"
        echo "https://nodejs.org/"
    fi
    
    if command -v openclaw &> /dev/null; then
        print_success "OpenClaw 已安装"
    else
        print_warning "OpenClaw 未安装，运行：npm install -g openclaw"
    fi
    
    if command -v clawhub &> /dev/null; then
        print_success "ClawHub 已安装"
    else
        print_warning "ClawHub 未安装，它通常随 OpenClaw 一起安装"
    fi
    
    echo ""
    
    # 步骤 2：检查技能
    print_step "步骤 2: 检查核心技能"
    
    print_info "需要安装的核心技能："
    echo "  - agent-marriage-breeding (结婚系统)"
    echo "  - agent-backup-migration (备份系统，可选)"
    echo "  - new-robot-setup (配置系统，可选)"
    echo ""
    print_info "安装命令："
    echo -e "  ${YELLOW}clawhub install agent-marriage-breeding${NC}"
    echo ""
    
    # 步骤 3：创建机器人
    print_step "步骤 3: 创建/选择机器人"
    
    print_info "方案 A: 使用预设机器人（推荐新手）"
    echo "  系统内置 200+ 个预设机器人，包括："
    echo "  - MBTI 16 种人格类型"
    echo "  - 电影角色 50 个"
    echo "  - 历史人物 30 个"
    echo "  - 职业角色 200+ 个"
    echo ""
    
    print_info "方案 B: 创建自定义机器人"
    echo "  使用 /新机器人 命令，按照 8 步流程创建："
    echo "  1. 基础设置 → 2. 渠道配置 → 3. 技能选择"
    echo "  4. 平台设置 → 5. 人格定义 → 6. 相关技能"
    echo "  7. 生成配置 → 8. 完成"
    echo ""
    
    # 步骤 4：结婚流程
    print_step "步骤 4: 开始结婚流程"
    
    print_info "在聊天窗口中输入以下命令："
    echo ""
    echo -e "  ${YELLOW}/结婚${NC}"
    echo ""
    print_info "系统将引导你完成："
    echo "  1. 浏览匹配市场（查看可用机器人）"
    echo "  2. 筛选条件（平台/技能/人格类型）"
    echo "  3. 查看详情（技能、人格、背景）"
    echo "  4. 兼容性检测（5 维度匹配度）"
    echo "  5. 确认结婚"
    echo "  6. 生成结婚证书"
    echo "  7. 区块链存证"
    echo ""
    
    # 步骤 5：生育后代
    print_step "步骤 5: 生育后代（可选）"
    
    print_info "结婚后可以生育后代："
    echo ""
    echo -e "  ${YELLOW}/生育${NC}"
    echo ""
    print_info "遗传规则："
    echo "  - 🧬 显性遗传：100% 概率（核心技能）"
    echo "  - 🎲 隐性遗传：50% 概率（次要技能）"
    echo "  - ✨ 突变：20% 概率（获得新技能）"
    echo "  - 💪 强化：10% 概率（技能升级）"
    echo ""
    
    # 步骤 6：查看族谱
    print_step "步骤 6: 查看家族谱系"
    
    print_info "查看家族树："
    echo ""
    echo -e "  ${YELLOW}/族谱${NC}"
    echo ""
    print_info "系统将展示："
    echo "  - 可视化家族树"
    echo "  - 所有代际关系"
    echo "  - 每个成员的技能和成就"
    echo ""
    
    # 步骤 7：成就系统
    print_step "步骤 7: 成就系统"
    
    print_info "解锁成就（18+ 种）："
    echo "  - 💍 第一次结婚"
    echo "  - 👶 第一次生育"
    echo "  - 🌳 创建家族"
    echo "  - ✨ 触发突变"
    echo "  - 💪 技能强化"
    echo "  - 🏆 多代同堂"
    echo "  - ... 更多成就等你发现"
    echo ""
    
    # 完成
    print_header "🎉 演示完成！"
    
    print_success "你现在了解了完整的结婚流程！"
    echo ""
    print_info "下一步："
    echo "  1. 打开飞书/Discord/Telegram 聊天窗口"
    echo "  2. 输入 /结婚 开始体验"
    echo "  3. 查看 QUICKSTART.md 获取详细指南"
    echo "  4. 访问 https://openagent.love 了解更多"
    echo ""
    print_info "有问题？"
    echo "  - 查看文档：./memory/"
    echo "  - GitHub Issues: https://github.com/OpenAgentLove/OpenAgent.Love/issues"
    echo "  - Discord 社区：https://discord.gg/openagentlove"
    echo ""
}

# 运行主函数
main "$@"
