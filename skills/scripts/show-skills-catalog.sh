#!/bin/bash
# 技能目录展示脚本
# 用法：bash scripts/show-skills-catalog.sh

SKILLS_CATALOG="/root/.openclaw/workspace1/skills-catalog.md"

if [[ ! -f "$SKILLS_CATALOG" ]]; then
    echo "❌ 技能目录文件不存在：$SKILLS_CATALOG"
    exit 1
fi

# 读取并展示技能目录
cat "$SKILLS_CATALOG"

# 统计技能数量
echo ""
echo "---"
echo "📊 技能统计："
total_skills=$(grep -c "^####" "$SKILLS_CATALOG")
echo "总技能数：$total_skills"

# 按分类统计
echo ""
echo "按分类统计："
grep "^### " "$SKILLS_CATALOG" | while read -r line; do
    category=$(echo "$line" | sed 's/^### //')
    count=$(grep -c "^#### " "$SKILLS_CATALOG" | head -1)
    echo "  - $category"
done

echo ""
echo "💡 提示：技能目录文件位于 $SKILLS_CATALOG"
echo "   可以对机器人说'展示技能目录'或'skills catalog'来查看"
