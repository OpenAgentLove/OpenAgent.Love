/**
 * new-robot-setup 技能主文件
 * 新生机器人一键配置向导
 */

const StateManager = require('./state-manager');
const { sanitizeLog, sanitizeObject } = require('../utils/logger');
const fs = require('fs');
const path = require('path');

// 初始化状态管理器
const stateManager = new StateManager();

// 步骤配置
const STEPS = {
  1: '基础层配置',
  2: '渠道增强层',
  3: 'Skills 推荐',
  4: '平台配置',
  5: '人格设定',
  6: '相关 Skills',
  7: '生成 Agent',
  8: '完成配置'
};

/**
 * 处理用户输入
 * @param {string} userId - 用户 ID
 * @param {string} input - 用户输入
 * @returns {string} - 回复消息
 */
function handleInput(userId, input) {
  // 加载或创建状态
  const state = stateManager.getOrCreateState(userId);
  
  console.log(`[用户 ${userId}] 输入：${input}`);
  console.log(`[状态] 当前步骤：${state.current_step}`);
  
  // 处理特殊命令
  if (input === '上一步' || input === '返回') {
    const result = stateManager.goBack(userId);
    if (result.success) {
      console.log(`[状态] 回退到第 ${result.step} 步`);
      return `✅ ${result.message}\n\n正在返回第 ${result.step} 步：${STEPS[result.step]}...\n\n${getStepPrompt(result.step)}`;
    } else {
      return `⚠️ ${result.message}`;
    }
  }
  
  if (input === '重新开始' || input === '重置') {
    stateManager.clearState(userId);
    stateManager.getOrCreateState(userId);
    return '🔄 已重置配置流程，让我们从头开始。\n\n' + getStepPrompt(1);
  }
  
  if (input === '状态' || input === '进度') {
    return `📊 当前进度：第 ${state.current_step} 步/${Object.keys(STEPS).length}\n步骤名称：${STEPS[state.current_step]}\n\n继续配置请回复相应选项，或说"上一步"回退`;
  }
  
  // 处理当前步骤的输入
  const response = processStep(userId, state.current_step, input);
  
  // 如果步骤完成，自动进入下一步
  if (response.completed) {
    const nextStepResult = stateManager.goNext(userId);
    if (nextStepResult.success && nextStepResult.step <= 8) {
      response.message += `\n\n➡️ 自动进入下一步...\n\n${getStepPrompt(nextStepResult.step)}`;
    } else if (nextStepResult.step === 8) {
      response.message += '\n\n🎉 所有步骤已完成！';
    }
  }
  
  return response.message;
}

/**
 * 获取步骤提示语
 * @param {number} step - 步骤编号
 * @returns {string} - 提示语
 */
function getStepPrompt(step) {
  const prompts = {
    1: `🛠️ **第一步：基础功能设置**

请选择以下功能开关：

| 功能 | 选项 |
|------|------|
| 1. 流式输出 | 开启 / 关闭 |
| 2. 记忆功能 | 关闭 / 记忆增强 / 记忆增强 + 每天归档 |
| 3. 消息回执 | 开启 / 关闭 |
| 4. 联网搜索 | 开启 / 关闭 |
| 5. 权限模式 | 维持现状 / 完全开放 / 最小安全 |

请回复选项编号和内容，如：1 开，2 记忆增强，3 开，4 开，5 最小安全

💡 提示：说"上一步"可以回退修改`,

    2: `🔗 **第二步：渠道增强设置**

你使用哪些平台？（可多选）

| 平台 | 专属功能 |
|------|----------|
| 1. 飞书 | 审批功能、限额优化 |
| 2. Discord | 免@、审批、审批按钮 |
| 3. Telegram | 审批功能 |

请回复平台编号，如：1,2

💡 提示：说"上一步"可以回退修改`,

    3: `🧩 **第三步：技能安装**

推荐以下官方 Skills（可选）：

| # | Skill | 用途 |
|---|------|------|
| 1 | OpenClaw Backup | 备份恢复 |
| 2 | Agent Reach | 跨 Agent 通信 |
| 3 | 安全防御矩阵 | 安全防护 |
| 4 | Find Skills | 查找技能 |
| 5 | Awesome OpenClaw Usecases | 实战案例 |
| 6 | Awesome OpenClaw Skills | 技能库 |

请回复编号安装（如：1,3,4），或回复"跳过"

💡 提示：说"上一步"可以回退修改`,

    4: `🌐 **第四步：平台绑定**

请选择要绑定的平台：

| 平台 | 说明 |
|------|------|
| 1. 飞书 | 需要 AppID 和 Secret |
| 2. 钉钉 | 需要 AgentID 和 Secret |
| 3. Discord | 需要 Bot Token |
| 4. Telegram | 需要 Bot Token |

请回复编号（如：1），并提供对应凭证信息

⚠️ 安全提示：敏感信息会自动脱敏处理

💡 提示：说"上一步"可以回退修改`,

    5: `👤 **第五步：人格设定**

这是最重要的步骤，包含 4 个子步骤。

**Step 5.1: 名称称呼**

**机器人叫什么名字？**
- 方式 1：你自己取名（直接输入名字）
- 方式 2：随机中文名
- 方式 3：随机英文名

请回复：方式 + 名字，如"2"或"1 小明"

💡 提示：说"上一步"可以回退修改`,

    6: `🧩 **第六步：智能技能推荐**

根据你选择的人格，我推荐以下技能：

[根据人格配置动态生成推荐技能列表]

请确认安装，或说"跳过"

💡 提示：说"上一步"可以回退修改`,

    7: `🤖 **第七步：生成机器人**

正在创建你的新机器人...

⚠️ **提醒**：如果选择"子 Agent 模式"，机器人会以子 Agent 形式存在，主 Agent 可以调度它执行任务。

请选择模式：
1. 独立模式 - 独立运行的机器人
2. 子 Agent 模式 - 可被主 Agent 调度

确认生成吗？请回复"是"或"1"/"2"选择模式

💡 提示：说"上一步"可以回退修改`,

    8: `🎉 **完成！**

✅ 你的新机器人已经配置完成！

---

**配置摘要**：
- 名字：XXX
- 性格：XXX
- 技能：XXX 个
- 模式：XXX 模式

---

现在可以开始使用了！有什么需要调整的吗？`
  };
  
  return prompts[step] || '未知步骤';
}

/**
 * 处理具体步骤
 * @param {string} userId - 用户 ID
 * @param {number} step - 步骤编号
 * @param {string} input - 用户输入
 * @returns {object} - {message: string, completed: boolean}
 */
function processStep(userId, step, input) {
  switch (step) {
    case 1:
      return processStep1(userId, input);
    case 2:
      return processStep2(userId, input);
    case 3:
      return processStep3(userId, input);
    case 4:
      return processStep4(userId, input);
    case 5:
      return processStep5(userId, input);
    case 6:
      return processStep6(userId, input);
    case 7:
      return processStep7(userId, input);
    case 8:
      return processStep8(userId, input);
    default:
      return { message: '未知步骤，请重新开始', completed: false };
  }
}

/**
 * 处理步骤 1：基础层配置
 */
function processStep1(userId, input) {
  // 解析用户输入
  const config = parseStep1Input(input);
  
  if (!config.valid) {
    return { 
      message: '⚠️ 格式不正确，请按格式回复，如：1 开，2 记忆增强，3 开，4 开，5 最小安全', 
      completed: false 
    };
  }
  
  // 保存步骤数据
  stateManager.saveStepData(userId, 1, config);
  
  console.log(`[步骤 1] 用户配置：${JSON.stringify(sanitizeObject(config))}`);
  
  return {
    message: `✅ 好的，你的基础配置是：
- 流式输出：${config.streaming ? '开启' : '关闭'}
- 记忆功能：${config.memory}
- 消息回执：${config.receipt ? '开启' : '关闭'}
- 联网搜索：${config.search ? '开启' : '关闭'}
- 权限模式：${config.permission}

确认请回复"是"，修改请回复具体项目`,
    completed: true
  };
}

/**
 * 解析步骤 1 的输入
 */
function parseStep1Input(input) {
  const result = {
    valid: false,
    streaming: true,
    memory: 'enhanced',
    receipt: true,
    search: true,
    permission: 'default'
  };
  
  // 简单解析逻辑（实际应该更复杂）
  if (input.includes('1 开') || input.includes('1 开启')) {
    result.streaming = true;
  } else if (input.includes('1 关') || input.includes('1 关闭')) {
    result.streaming = false;
  }
  
  if (input.includes('记忆增强')) {
    result.memory = 'enhanced';
  } else if (input.includes('关闭')) {
    result.memory = 'disabled';
  }
  
  result.valid = true;
  return result;
}

/**
 * 处理步骤 2：渠道增强层
 */
function processStep2(userId, input) {
  const channels = input.split(',').map(s => s.trim());
  
  stateManager.saveStepData(userId, 2, { channels });
  
  console.log(`[步骤 2] 用户选择渠道：${channels}`);
  
  return {
    message: `✅ 已选择渠道：${channels.join(', ')}\n\n进入下一步...`,
    completed: true
  };
}

/**
 * 处理步骤 3：Skills 推荐
 */
function processStep3(userId, input) {
  if (input === '跳过') {
    stateManager.saveStepData(userId, 3, { skills: [] });
    return {
      message: '✅ 已跳过技能安装',
      completed: true
    };
  }
  
  const skills = input.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
  stateManager.saveStepData(userId, 3, { skills });
  
  console.log(`[步骤 3] 用户选择技能：${skills}`);
  
  return {
    message: `✅ 已选择安装 ${skills.length} 个技能：${skills.join(', ')}\n\n进入下一步...`,
    completed: true
  };
}

/**
 * 处理步骤 4：平台配置
 */
function processStep4(userId, input) {
  // 注意：这里会包含敏感信息，日志会自动脱敏
  const platformConfig = {
    platform: input,
    credentials: '用户提供的凭证' // 实际应该解析用户输入
  };
  
  stateManager.saveStepData(userId, 4, platformConfig);
  
  console.log(`[步骤 4] 用户平台配置：${JSON.stringify(sanitizeObject(platformConfig))}`);
  
  return {
    message: '✅ 平台配置已保存（敏感信息已加密处理）\n\n进入下一步...',
    completed: true
  };
}

/**
 * 处理步骤 5：人格设定
 */
function processStep5(userId, input) {
  const personality = {
    name: input,
    userTitle: '用户'
  };
  
  stateManager.saveStepData(userId, 5, personality);
  
  console.log(`[步骤 5] 人格设定：${JSON.stringify(sanitizeObject(personality))}`);
  
  return {
    message: `✅ 人格设定完成\n\n进入下一步...`,
    completed: true
  };
}

/**
 * 处理步骤 6：相关 Skills
 */
function processStep6(userId, input) {
  stateManager.saveStepData(userId, 6, { confirmed: input !== '跳过' });
  
  return {
    message: '✅ 技能推荐已处理\n\n进入下一步...',
    completed: true
  };
}

/**
 * 处理步骤 7：生成 Agent
 */
function processStep7(userId, input) {
  const mode = input === '2' ? 'subagent' : 'independent';
  stateManager.saveStepData(userId, 7, { mode });
  
  console.log(`[步骤 7] Agent 模式：${mode}`);
  
  return {
    message: '✅ 正在生成机器人...\n\n进入完成步骤...',
    completed: true
  };
}

/**
 * 处理步骤 8：完成配置
 */
function processStep8(userId, input) {
  // 获取所有步骤数据生成摘要
  const state = stateManager.loadState(userId);
  
  console.log(`[步骤 8] 配置完成，会话 ID: ${state.session_id}`);
  
  return {
    message: '🎉 配置完成！你的新机器人已经可以使用了。',
    completed: false
  };
}

// 导出接口
module.exports = {
  handleInput,
  getStepPrompt,
  stateManager
};
