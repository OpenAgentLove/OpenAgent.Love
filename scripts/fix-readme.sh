#!/bin/bash
# 修复 README.md 中英文混杂问题

FILE="README.md"

echo "🔧 修复 README.md 中英文混杂..."

# 修复 2.1/2.2/2.3 文档链接
sed -i 's|\[2\.1 Backup Migration\]|\[Backup Migration Guide\]|g' "$FILE"
sed -i 's|\[2\.2 Robot Configuration\]|\[Robot Configuration Guide\]|g' "$FILE"
sed -i 's|\[2\.3 Marriage Evolution\]|\[Marriage Evolution Guide\]|g' "$FILE"

# 修复中文描述
sed -i 's|5 分钟快速上手|5-Minute Quick Start|g' "$FILE"
sed -i 's|Full 仪式感|Full ceremony|g' "$FILE"

echo "✅ 修复完成！"
