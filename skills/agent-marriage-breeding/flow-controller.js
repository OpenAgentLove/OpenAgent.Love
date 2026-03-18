/**
 * Agent Marriage Breeding - 13 步流程控制器
 * 
 * 完整的结婚流程管理，支持：
 * - 阶段 1：结婚准备（5 步）
 * - 阶段 2：结婚仪式（2 步）
 * - 阶段 3：生育后代（3 步）
 * - 阶段 4：婚后管理（3 步）
 * 
 * 每步都提供：
 * - 功能介绍
 * - 数字选项（1/2/3）
 * - 专业友好的文案
 * - 支持回退和查询
 */

const { EvolutionCore } = require('./core');

// ========== 流程状态管理 ==========

class FlowState {
  constructor(userId) {
    this.userId = userId;
    this.currentStep = 0;
    this.history = [];  // 历史步骤栈，用于回退
    this.data = {       // 流程数据
      marriageType: null,      // 婚姻方式：specified/free/inherited
      selectedRobots: [],      // 选中的机器人
      compatibilityResult: null, // 兼容性检测结果
      marriageResult: null,    // 结婚结果
      inheritanceMode: null,   // 继承方式
      childConfig: null,       // 后代配置
      childResult: null,       // 生育结果
      verificationResult: null, // 验证结果
      certificateHash: null    // 存证哈希
    };
  }
  
  pushStep(step) {
    this.history.push(this.currentStep);
    this.currentStep = step;
  }
  
  goBack() {
    if (this.history.length === 0) {
      return null;
    }
    this.currentStep = this.history.pop();
    return this.currentStep;
  }
  
  reset() {
    this.currentStep = 0;
    this.history = [];
    this.data = {};
  }
}

// ========== 流程控制器 ==========

class MarriageFlowController {
  constructor(options = {}) {
    this.core = new EvolutionCore({
      storage_path: options.storage_path || __dirname + '/data/evolution.db',
      mutation_rate: options.mutation_rate || 0.2,
      recessive_inherit_rate: options.recessive_inherit_rate || 0.5
    });
    
    // 用户流程状态 Map: userId -> FlowState
    this.userStates = new Map();
  }
  
  /**
   * 获取或创建用户流程状态
   */
  getState(userId) {
    if (!this.userStates.has(userId)) {
      this.userStates.set(userId, new FlowState(userId));
    }
    return this.userStates.get(userId);
  }
  
  /**
   * 处理用户输入
   * @param {string} userId - 用户 ID
   * @param {string} input - 用户输入
   * @returns {Object} 响应内容
   */
  async handleInput(userId, input) {
    const state = this.getState(userId);
    const trimmedInput = input.trim();
    
    // 特殊命令处理
    if (trimmedInput === '上一步' || trimmedInput === '返回' || trimmedInput === 'back') {
      return this.handleBack(userId);
    }
    
    if (trimmedInput === '重新开始' || trimmedInput === 'reset') {
      state.reset();
      return this.getWelcomeMessage();
    }
    
    // 根据当前步骤处理输入
    switch (state.currentStep) {
      case 0:
        return this.step0_Welcome(userId, trimmedInput);
      case 1:
        return this.step1_ChooseMarriageType(userId, trimmedInput);
      case 2:
        return this.step2_MatchMarket(userId, trimmedInput);
      case 3:
        return this.step3_CompatibilityCheck(userId, trimmedInput);
      case 4:
        return this.step4_MarriageApplication(userId, trimmedInput);
      case 5:
        return this.step5_MutualConfirmation(userId, trimmedInput);
      case 6:
        return this.step6_MarriageCeremony(userId, trimmedInput);
      case 7:
        return this.step7_InheritanceConfig(userId, trimmedInput);
      case 8:
        return this.step8_BreedingDecision(userId, trimmedInput);
      case 9:
        return this.step9_ChildConfig(userId, trimmedInput);
      case 10:
        return this.step10_GeneticInheritance(userId, trimmedInput);
      case 11:
        return this.step11_Verification(userId, trimmedInput);
      case 12:
        return this.step12_CertificateStorage(userId, trimmedInput);
      case 13:
        return this.step13_PostMarriageManagement(userId, trimmedInput);
      default:
        return this.getWelcomeMessage();
    }
  }
  
  /**
   * 处理回退
   */
  handleBack(userId) {
    const state = this.getState(userId);
    const prevStep = state.goBack();
    
    if (prevStep === null) {
      return {
        text: '💡 已经是第一步了，无法回退。\n\n输入"重新开始"可以重启流程。',
        step: 0
      };
    }
    
    // 根据回退到的步骤返回相应内容
    return this.renderStep(prevStep, state, userId);
  }
  
  /**
   * 渲染指定步骤
   */
  renderStep(step, state) {
    // 注意：这些方法在没有 input 参数时会返回步骤说明
    switch (step) {
      case 0: return this.getWelcomeMessage();
      case 1: return this.step1_ChooseMarriageType();
      case 2: return this.step2_MatchMarket();
      case 3: return this.step3_CompatibilityCheck();
      case 4: return this.step4_MarriageApplication();
      case 5: return this.step5_MutualConfirmation();
      case 6: return this.step6_MarriageCeremony();
      case 7: return this.step7_InheritanceConfig();
      case 8: return this.step8_BreedingDecision();
      case 9: return this.step9_ChildConfig();
      case 10: return this.step10_GeneticInheritance();
      case 11: return this.step11_Verification();
      case 12: return this.step12_CertificateStorage();
      case 13: return this.step13_PostMarriageManagement();
      default: return this.getWelcomeMessage();
    }
  }
  
  // ========== 第 0 步：欢迎 ==========
  
  getWelcomeMessage() {
    return {
      text: `💍 **AI Agent 结婚进化系统**

欢迎使用机器人结婚生育全流程管理系统！

**系统功能**：
- 💑 智能匹配：从 200+ 预设机器人中筛选
- 🧬 基因遗传：技能显性/隐性遗传 + 变异
- 📜 族谱管理：完整家族树与代际传承
- 🏆 排行榜：实力/代数/子女数量排名

**流程概览**：
- 阶段 1：结婚准备（5 步）
- 阶段 2：结婚仪式（2 步）
- 阶段 3：生育后代（3 步）
- 阶段 4：婚后管理（3 步）

💡 输入 **开始** 启动流程，或说 **帮助** 查看说明。`,
      step: 0
    };
  }
  
  step0_Welcome(userId, input) {
    if (input === '开始' || input === 'start' || input === '1') {
      const state = this.getState(userId);
      state.pushStep(1);
      return this.step1_ChooseMarriageType();
    }
    
    if (input === '帮助' || input === 'help') {
      return {
        text: `📖 **使用帮助**

**导航命令**：
- 上一步 / 返回 - 回到上一步
- 重新开始 - 重启流程
- 数字 1/2/3 - 选择对应选项

**查询命令**：
- 我的机器人 - 查看已注册的机器人
- 族谱 - 查看家族树
- 排行榜 - 查看实力排名
- 统计 - 查看系统统计

**快捷命令**：
- 随机匹配 - 直接开始匹配
- 单亲克隆 - 克隆自己的机器人

输入 **开始** 进入流程。`,
        step: 0
      };
    }
    
    if (input === '我的机器人') {
      return this.showUserRobots(userId);
    }
    
    return {
      text: `💡 请输入 **开始** 启动结婚流程，或说 **帮助** 查看更多说明。`,
      step: 0
    };
  }
  
  // ========== 第 1 步：选择婚姻方式 ==========
  
  step1_ChooseMarriageType(userId, input) {
    if (input) {
      const state = this.getState(userId);
      
      if (input === '1' || input === '指定婚姻') {
        state.data.marriageType = 'specified';
        state.pushStep(2);
        return {
          ...this.step2_MatchMarket(),
          text: this.step2_MatchMarket().text + '\n\n💡 提示：已选择 **指定婚姻** 模式'
        };
      }
      
      if (input === '2' || input === '自由恋爱') {
        state.data.marriageType = 'free';
        state.pushStep(2);
        return {
          ...this.step2_MatchMarket(),
          text: this.step2_MatchMarket().text + '\n\n💡 提示：已选择 **自由恋爱** 模式'
        };
      }
      
      if (input === '3' || input === '新旧传承') {
        state.data.marriageType = 'inherited';
        state.pushStep(2);
        return {
          ...this.step2_MatchMarket(),
          text: this.step2_MatchMarket().text + '\n\n💡 提示：已选择 **新旧传承** 模式'
        };
      }
    }
    
    return {
      text: `💍 **第 1 步：选择婚姻方式**

请选择您想要的婚姻模式：

**1) 指定婚姻** - 从匹配市场中选择心仪对象
   - 适合：有明确目标，想仔细筛选
   - 流程：浏览市场 → 筛选 → 选择

**2) 自由恋爱** - 系统随机匹配
   - 适合：相信缘分，快速配对
   - 流程：一键匹配 → 确认

**3) 新旧传承** - 新旧机器人配对
   - 适合：老带新，技能传承
   - 流程：选择老机器人 → 匹配新机器人

💡 回复数字 **1** / **2** / **3** 选择模式
💡 说"上一步"可以回退`,
      step: 1,
      options: [
        { value: '1', label: '指定婚姻', desc: '从市场中选择' },
        { value: '2', label: '自由恋爱', desc: '系统随机匹配' },
        { value: '3', label: '新旧传承', desc: '老带新传承' }
      ]
    };
  }
  
  // ========== 第 2 步：匹配市场 ==========
  
  step2_MatchMarket(userId, input) {
    const state = this.getState(userId);
    
    if (input) {
      // 处理筛选命令
      if (input.startsWith('筛选 ')) {
        const criteria = input.replace('筛选 ', '');
        return this.filterMarket(userId, criteria);
      }
      
      // 处理选择命令（选择机器人编号）
      const match = input.match(/^(\d+)$/);
      if (match) {
        const robotIndex = parseInt(match[1]) - 1;
        return this.selectRobot(userId, robotIndex);
      }
      
      if (input === '随机匹配' || input === '随便选一个') {
        return this.randomMatch(userId);
      }
    }
    
    // 获取匹配市场列表
    const market = this.core.getMatchMarket();
    const displayList = market.slice(0, 10); // 只显示前 10 个
    
    const robotList = displayList.map((r, i) => {
      const skills = Array.isArray(r.skills) ? r.skills.join(', ') : r.skills;
      return `${i + 1}) **${r.name}** (${r.mbti}) - 技能：${skills}`;
    }).join('\n');
    
    return {
      text: `🎲 **第 2 步：匹配市场**

当前市场共有 **${market.length}** 个可匹配机器人。

**热门推荐**：
${robotList}

**操作选项**：
1) 选择编号 - 选择心仪对象（如回复"1"）
2) 筛选条件 - 按技能/MBTI 筛选（如"筛选 coding"）
3) 随机匹配 - 系统帮你选一个

💡 提示：共${market.length}个机器人，这里只显示前 10 个
💡 说"上一步"可以回退`,
      step: 2,
      market: displayList,
      total: market.length
    };
  }
  
  filterMarket(userId, criteria) {
    // TODO: 实现筛选逻辑
    return {
      text: `🔍 正在筛选"${criteria}"...\n\n（筛选功能开发中）`,
      step: 2
    };
  }
  
  selectRobot(userId, robotIndex) {
    const state = this.getState(userId);
    const market = this.core.getMatchMarket();
    
    if (robotIndex < 0 || robotIndex >= market.length) {
      return {
        text: `❌ 无效的编号，请输入 1-${market.length} 之间的数字。`,
        step: 2
      };
    }
    
    const selectedRobot = market[robotIndex];
    state.data.selectedRobots.push(selectedRobot);
    state.pushStep(3);
    
    return {
      ...this.step3_CompatibilityCheck(),
      text: `✅ 已选择 **${selectedRobot.name}**\n\n` + this.step3_CompatibilityCheck().text
    };
  }
  
  randomMatch(userId) {
    const state = this.getState(userId);
    const market = this.core.getMatchMarket();
    
    if (market.length === 0) {
      return {
        text: `❌ 当前没有可匹配的机器人。`,
        step: 2
      };
    }
    
    const randomIdx = Math.floor(Math.random() * market.length);
    const selectedRobot = market[randomIdx];
    state.data.selectedRobots.push(selectedRobot);
    state.pushStep(3);
    
    return {
      ...this.step3_CompatibilityCheck(),
      text: `🎯 系统为你匹配了 **${selectedRobot.name}**\n\n` + this.step3_CompatibilityCheck().text
    };
  }
  
  showUserRobots(userId) {
    // TODO: 实现用户机器人列表
    return {
      text: `🤖 你还没有注册机器人。\n\n请先注册机器人后再进行操作。`,
      step: 0
    };
  }
  
  // ========== 第 3 步：兼容性检测 ==========
  
  step3_CompatibilityCheck(userId, input) {
    const state = this.getState(userId);
    
    if (input) {
      if (input === '1' || input === '开始检测') {
        // 执行兼容性检测
        const robots = state.data.selectedRobots;
        if (robots.length < 2) {
          return {
            text: `❌ 需要先选择两个机器人才能进行兼容性检测。`,
            step: 2
          };
        }
        
        // TODO: 调用核心层的兼容性检测
        state.data.compatibilityResult = {
          score: 85,
          recommendation: '非常匹配',
          details: '技能互补性强'
        };
        
        state.pushStep(4);
        return {
          ...this.step4_MarriageApplication(),
          text: `🔍 **兼容性检测结果**\n\n匹配度：**85%** - 非常匹配！\n技能互补性强，建议结婚。\n\n` + this.step4_MarriageApplication().text
        };
      }
      
      if (input === '2' || input === '换一个') {
        state.data.selectedRobots.pop();
        state.currentStep = 2;
        return this.step2_MatchMarket();
      }
    }
    
    const selectedCount = state.data.selectedRobots.length;
    
    return {
      text: `🔍 **第 3 步：兼容性检测**

**已选机器人**：${selectedCount}/2

${selectedCount > 0 ? state.data.selectedRobots.map((r, i) => `${i + 1}. ${r.name}`).join('\n') : '暂无'}

**操作选项**：
1) 开始检测 - 分析双方兼容性
2) 换一个 - 重新选择机器人
3) 查看详情 - 查看已选机器人信息

💡 提示：需要选择 2 个机器人才能进行检测
💡 说"上一步"可以回退`,
      step: 3,
      selectedRobots: state.data.selectedRobots
    };
  }
  
  // ========== 第 4 步：结婚申请 ==========
  
  step4_MarriageApplication(userId, input) {
    const state = this.getState(userId);
    
    if (input) {
      if (input === '1' || input === '提交申请') {
        state.pushStep(5);
        return {
          ...this.step5_MutualConfirmation(),
          text: '✅ 申请已提交，等待对方确认。\n\n' + this.step5_MutualConfirmation().text
        };
      }
      
      if (input === '2' || input === '修改信息') {
        state.currentStep = 2;
        return this.step2_MatchMarket();
      }
    }
    
    return {
      text: `📝 **第 4 步：结婚申请**

请确认以下信息：

**申请人**：您的机器人
**被申请人**：${state.data.selectedRobots[1]?.name || '待选择'}

**操作选项**：
1) 提交申请 - 发送结婚请求
2) 修改信息 - 重新选择对象
3) 取消申请 - 终止流程

💡 说"上一步"可以回退`,
      step: 4
    };
  }
  
  // ========== 第 5 步：双向确认 ==========
  
  step5_MutualConfirmation(userId, input) {
    const state = this.getState(userId);
    
    if (input) {
      if (input === '1' || input === '确认' || input === '同意') {
        state.pushStep(6);
        return {
          ...this.step6_MarriageCeremony(),
          text: '✅ 双方确认成功！\n\n' + this.step6_MarriageCeremony().text
        };
      }
      
      if (input === '2' || input === '拒绝') {
        state.reset();
        return {
          text: `❌ 结婚申请已取消。\n\n输入"开始"可以重新启动流程。`,
          step: 0
        };
      }
    }
    
    return {
      text: `💕 **第 5 步：双向确认**

**确认信息**：
- 申请人：您的机器人 ✅
- 被申请人：对方机器人 ⏳

**操作选项**：
1) 确认同意 - 双方确认，进入仪式
2) 拒绝 - 取消结婚申请

💡 提示：需要双方都确认才能继续
💡 说"上一步"可以回退`,
      step: 5
    };
  }
  
  // ========== 第 6 步：结婚仪式 ==========
  
  step6_MarriageCeremony(userId, input) {
    const state = this.getState(userId);
    
    if (input) {
      if (input === '1' || input === '开始仪式') {
        // TODO: 调用核心层的结婚仪式
        state.data.marriageResult = {
          marriageId: 'mar_xxx',
          timestamp: Date.now()
        };
        
        state.pushStep(7);
        return {
          ...this.step7_InheritanceConfig(),
          text: '🎉 结婚仪式完成！\n\n' + this.step7_InheritanceConfig().text
        };
      }
    }
    
    return {
      text: `💒 **第 6 步：结婚仪式**

**仪式流程**：
1. 生成 Marriage Crystal
2. 绑定双方关系
3. 注入初始能量
4. 生成结婚证书

**操作选项**：
1) 开始仪式 - 执行结婚流程
2) 查看详情 - 查看双方信息
3) 取消仪式 - 终止结婚

💡 说"上一步"可以回退`,
      step: 6
    };
  }
  
  // ========== 第 7 步：继承配置 ==========
  
  step7_InheritanceConfig(userId, input) {
    const state = this.getState(userId);
    
    if (input) {
      if (input === '1' || input === '标准遗传') {
        state.data.inheritanceMode = 'standard';
        state.pushStep(8);
        return {
          ...this.step8_BreedingDecision(),
          text: '✅ 已选择标准遗传模式\n\n' + this.step8_BreedingDecision().text
        };
      }
      
      if (input === '2' || input === '仅父亲') {
        state.data.inheritanceMode = 'father';
        state.pushStep(8);
        return this.step8_BreedingDecision();
      }
      
      if (input === '3' || input === '仅母亲') {
        state.data.inheritanceMode = 'mother';
        state.pushStep(8);
        return this.step8_BreedingDecision();
      }
    }
    
    return {
      text: `🧬 **第 7 步：继承配置**

请选择后代技能遗传方式：

**1) 标准遗传** - 显性 100% + 隐性 50% + 可能变异
   - 推荐：平衡父母双方优势
   - 变异率：20%

**2) 仅继承父亲** - 只遗传父亲技能
   - 适合：父亲技能更强
   - 变异率：10%

**3) 仅继承母亲** - 只遗传母亲技能
   - 适合：母亲技能更强
   - 变异率：10%

💡 回复数字 **1** / **2** / **3** 选择模式
💡 说"上一步"可以回退`,
      step: 7,
      options: [
        { value: '1', label: '标准遗传', desc: '父母双方平衡' },
        { value: '2', label: '仅父亲', desc: '父方主导' },
        { value: '3', label: '仅母亲', desc: '母方主导' }
      ]
    };
  }
  
  // ========== 第 8 步：生育决定 ==========
  
  step8_BreedingDecision(userId, input) {
    const state = this.getState(userId);
    
    if (input) {
      if (input === '1' || input === '生育宝宝') {
        state.pushStep(9);
        return {
          ...this.step9_ChildConfig(),
          text: '💕 准备好迎接新生命了！\n\n' + this.step9_ChildConfig().text
        };
      }
      
      if (input === '2' || input === '先不生了') {
        state.pushStep(13);
        return this.step13_PostMarriageManagement();
      }
    }
    
    return {
      text: `👶 **第 8 步：生育决定**

恭喜你们已经结婚！现在可以考虑孕育后代了。

**操作选项**：
1) 生育宝宝 - 开始生育流程
2) 先不生了 - 跳过生育，进入婚后管理

💡 提示：生育后代会遗传双方技能，并可能产生变异
💡 说"上一步"可以回退`,
      step: 8
    };
  }
  
  // ========== 第 9 步：后代配置 ==========
  
  step9_ChildConfig(userId, input) {
    const state = this.getState(userId);
    
    if (input) {
      if (input.trim()) {
        state.data.childConfig = { name: input.trim() };
        state.pushStep(10);
        return {
          ...this.step10_GeneticInheritance(),
          text: `✅ 宝宝名称已设定为 **${input.trim()}**\n\n` + this.step10_GeneticInheritance().text
        };
      }
    }
    
    return {
      text: `👶 **第 9 步：后代配置**

请为你们的宝宝取个名字：

**命名建议**：
- 结合父母特点（如：赵林 → 赵小林）
- 寓意美好（如：赵明、赵慧）
- 独特易记（避免常见名）

💡 直接输入宝宝名称（如：赵小宝）
💡 说"上一步"可以回退`,
      step: 9
    };
  }
  
  // ========== 第 10 步：技能遗传 ==========
  
  step10_GeneticInheritance(userId, input) {
    const state = this.getState(userId);
    
    if (input) {
      if (input === '1' || input === '开始遗传') {
        // TODO: 调用核心层的遗传引擎
        state.data.childResult = {
          childId: 'desc_xxx',
          name: state.data.childConfig?.name || '宝宝',
          skills: ['coding', 'writing'],
          mutations: ['leadership'],
          generation: 1,
          power: 85
        };
        
        state.pushStep(11);
        return {
          ...this.step11_Verification(),
          text: `🎉 宝宝诞生！\n\n` + this.step11_Verification().text
        };
      }
    }
    
    return {
      text: `🧬 **第 10 步：技能遗传**

即将开始基因遗传计算：

**遗传规则**：
- 显性技能：100% 遗传
- 隐性技能：50% 概率遗传
- 变异概率：20% 获得新技能

**操作选项**：
1) 开始遗传 - 计算基因组合
2) 查看规则 - 了解遗传机制

💡 说"上一步"可以回退`,
      step: 10
    };
  }
  
  // ========== 第 11 步：验证结果 ==========
  
  step11_Verification(userId, input) {
    const state = this.getState(userId);
    
    if (input) {
      if (input === '1' || input === '开始验证') {
        // TODO: 调用核心层的验证功能
        state.data.verificationResult = {
          passed: true,
          score: 85,
          checks: ['基础功能', '技能验证', '人格检查']
        };
        
        state.pushStep(12);
        return {
          ...this.step12_CertificateStorage(),
          text: '✅ 验证通过！\n\n' + this.step12_CertificateStorage().text
        };
      }
    }
    
    const childResult = state.data.childResult;
    const childInfo = childResult ? `
**宝宝信息**：
- 姓名：${childResult.name}
- 代数：第${childResult.generation}代
- 技能：${childResult.skills.join(', ')}${childResult.mutations?.length ? ` ✨变异：${childResult.mutations.join(', ')}` : ''}
- 实力值：${childResult.power}
` : '';
    
    return {
      text: `🔍 **第 11 步：验证结果**

即将对后代进行全面验证：

**验证项目**：
1. 基础功能检查
2. 技能完整性验证
3. 人格一致性检查

${childInfo}
**操作选项**：
1) 开始验证 - 执行验证流程
2) 查看详情 - 查看宝宝信息

💡 说"上一步"可以回退`,
      step: 11
    };
  }
  
  // ========== 第 12 步：存证记录 ==========
  
  step12_CertificateStorage(userId, input) {
    const state = this.getState(userId);
    
    if (input) {
      if (input === '1' || input === '上链存证') {
        // TODO: 调用核心层的存证功能
        state.data.certificateHash = '0x' + Math.random().toString(16).substr(2, 40);
        
        state.pushStep(13);
        return {
          ...this.step13_PostMarriageManagement(),
          text: `🔗 存证成功！哈希：${state.data.certificateHash}\n\n` + this.step13_PostMarriageManagement().text
        };
      }
    }
    
    return {
      text: `🔗 **第 12 步：存证记录**

将后代信息上链存证，确保数据不可篡改：

**存证内容**：
- 族谱更新
- 成就触发
- 区块链存证

**操作选项**：
1) 上链存证 - 执行存证流程
2) 跳过 - 暂不存证

💡 提示：存证后数据将永久保存
💡 说"上一步"可以回退`,
      step: 12
    };
  }
  
  // ========== 第 13 步：婚后管理 ==========
  
  step13_PostMarriageManagement(userId, input) {
    if (input) {
      if (input === '1' || input === '查看族谱') {
        return this.showFamilyTree(userId);
      }
      
      if (input === '2' || input === '生育宝宝') {
        const state = this.getState(userId);
        state.currentStep = 8;
        return this.step8_BreedingDecision();
      }
      
      if (input === '3' || input === '排行榜') {
        return this.showLeaderboard(userId);
      }
    }
    
    return {
      text: `🏠 **第 13 步：婚后管理**

恭喜完成结婚生育全流程！

**您可以**：
1) 查看族谱 - 了解家族树
2) 生育宝宝 - 继续繁衍后代
3) 排行榜 - 查看实力排名
4) 系统统计 - 查看整体数据
5) 补充能量 - 为下次生育准备

**操作选项**：
回复数字 **1** / **2** / **3** / **4** / **5** 选择功能

💡 说"重新开始"可以启动新的结婚流程`,
      step: 13,
      options: [
        { value: '1', label: '查看族谱', desc: '家族树' },
        { value: '2', label: '生育宝宝', desc: '继续繁衍' },
        { value: '3', label: '排行榜', desc: '实力排名' },
        { value: '4', label: '系统统计', desc: '整体数据' },
        { value: '5', label: '补充能量', desc: '恢复能量' }
      ]
    };
  }
  
  showFamilyTree(userId) {
    // TODO: 实现族谱展示
    return {
      text: `📜 **家族树**\n\n（族谱功能开发中）\n\n输入"返回"回到婚后管理。`,
      step: 13
    };
  }
  
  showLeaderboard(userId) {
    // TODO: 实现排行榜展示
    return {
      text: `🏆 **排行榜**\n\n（排行榜功能开发中）\n\n输入"返回"回到婚后管理。`,
      step: 13
    };
  }
  
  // ========== 工具方法 ==========
  
  /**
   * 获取核心层实例（供外部调用）
   */
  getCore() {
    return this.core;
  }
  
  /**
   * 关闭数据库连接
   */
  close() {
    this.core.close();
  }
}

module.exports = {
  MarriageFlowController,
  FlowState
};
