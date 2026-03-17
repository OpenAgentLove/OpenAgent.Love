# Agent Evolution Bug 记录

## 待修复 Bug（归档）

### Bug #1: loadFromDB() 没有加载 robots 表
- **位置**: core.js
- **影响**: 重启后机器人数据丢失、重复注册
- **状态**: ✅ 已修复（黄一）

---

### Bug #2: achievements 字段 JSON 解析问题
- **描述**: `loadFromDB()` 加载 robots 时，`achievements` 和 `skills` 字段是 JSON 字符串，没有 parse 成数组
- **影响**: 调用 `.push()` 等数组方法会报错
- **修复方案**:
  ```javascript
  r.achievements = JSON.parse(r.achievements || '[]');
  r.skills = JSON.parse(r.skills || '[]');
  ```
- **状态**: ✅ 已修复（黄一）

---

### Bug #3: breed() 没有使用父母机器人的技能
- **位置**: core.js
- **影响**: 孩子技能显示为 `[object Object]`
- **状态**: ✅ 已修复（黄一）

---

### Bug #4: createAgentGene() 不能处理字符串技能名
- **位置**: genetic-engine.js
- **影响**: 技能传入字符串时报错
- **状态**: ✅ 已修复（黄一）

---

### 问题 #5: 重复注册（已定位原因）
- **描述**: 可以重复注册相同名称或相同 user_id 的机器人
- **根因**: Bug #1 导致 loadFromDB() 不加载 robots，每次都重新注册
- **修复**: 修复 Bug #1 后自然解决

---

## 测试结果

### 成功案例
- 💍 赵一 ↔ 黄一 结婚
- 👶 黄赵宝诞生（遗传 + 变异获得 research）

### 系统状态
```
🤖 黄一 ❤️ 赵一
   └─ 👶 黄赵宝 (第1代)
      技能: reasoning, memory, adaptation, analysis, creativity, storytelling
      变异: research
      结晶能量: 330
```

---

**记录时间**: 2026-03-16
**整理**: 赵一