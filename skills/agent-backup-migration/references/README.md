# 参考文档

本技能的对话流程和方案细节参考以下文档：

1. **对话式操作指南**：`~/.openclaw/workspace1/memory/agent-backup-migration-dialogue.md`
2. **方案详情**：`~/.openclaw/workspace1/memory/agent-backup-migration.md`

## 整合的技能

本技能整合了以下两个现有技能：

1. **agent-pack-n-go** - SSH克隆方案
   - 位置：`~/.openclaw/workspace1/skills/agent-pack-n-go/`
   - 触发词：帮我克隆到新设备

2. **myclaw-backup** - 文件备份方案
   - 位置：`~/.openclaw/workspace1/skills/myclaw-backup/`
   - 触发词：帮我创建一个备份

## 依赖

本技能依赖以下工具：
- OpenClaw CLI
- clawhub（用于安装子技能）
- SSH（方案2需要）