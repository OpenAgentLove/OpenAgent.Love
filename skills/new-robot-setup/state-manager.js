/**
 * 对话状态管理器
 * 用于管理 new-robot-setup 技能的对话状态，支持回退、保存、加载等功能
 */

const fs = require('fs');
const path = require('path');

class StateManager {
  /**
   * 构造函数
   * @param {string} statePath - 状态文件存储路径
   */
  constructor(statePath = './data/setup-states') {
    // 解析路径（相对于技能目录）
    const skillDir = __dirname;
    this.statePath = path.join(skillDir, statePath);
    
    // 确保目录存在
    if (!fs.existsSync(this.statePath)) {
      fs.mkdirSync(this.statePath, { recursive: true });
    }
  }
  
  /**
   * 生成唯一的 session ID
   * @returns {string} - session ID
   */
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }
  
  /**
   * 创建新的状态
   * @param {string} userId - 用户 ID
   * @returns {object} - 初始状态对象
   */
  createState(userId) {
    return {
      session_id: this.generateSessionId(),
      user_id: userId,
      current_step: 0,  // 从第 0 步（功能介绍）开始
      step_data: {},
      created_at: Date.now(),
      updated_at: Date.now()
    };
  }
  
  /**
   * 保存状态
   * @param {string} userId - 用户 ID
   * @param {object} state - 状态对象
   */
  saveState(userId, state) {
    const filePath = path.join(this.statePath, `${userId}.json`);
    state.updated_at = Date.now();
    fs.writeFileSync(filePath, JSON.stringify(state, null, 2), 'utf-8');
  }
  
  /**
   * 加载状态
   * @param {string} userId - 用户 ID
   * @returns {object|null} - 状态对象，不存在则返回 null
   */
  loadState(userId) {
    const filePath = path.join(this.statePath, `${userId}.json`);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content);
    }
    return null;
  }
  
  /**
   * 初始化或获取状态
   * @param {string} userId - 用户 ID
   * @returns {object} - 状态对象
   */
  getOrCreateState(userId) {
    let state = this.loadState(userId);
    if (!state) {
      state = this.createState(userId);
      this.saveState(userId, state);
    }
    return state;
  }
  
  /**
   * 更新当前步骤
   * @param {string} userId - 用户 ID
   * @param {number} step - 步骤编号
   * @returns {object} - 更新后的状态
   */
  updateStep(userId, step) {
    const state = this.getOrCreateState(userId);
    state.current_step = step;
    this.saveState(userId, state);
    return state;
  }
  
  /**
   * 保存步骤数据
   * @param {string} userId - 用户 ID
   * @param {number} step - 步骤编号
   * @param {object} data - 步骤数据
   * @returns {object} - 更新后的状态
   */
  saveStepData(userId, step, data) {
    const state = this.getOrCreateState(userId);
    state.step_data[`step_${step}`] = {
      ...data,
      completed_at: Date.now()
    };
    this.saveState(userId, state);
    return state;
  }
  
  /**
   * 获取步骤数据
   * @param {string} userId - 用户 ID
   * @param {number} step - 步骤编号
   * @returns {object|null} - 步骤数据
   */
  getStepData(userId, step) {
    const state = this.loadState(userId);
    if (state && state.step_data[`step_${step}`]) {
      return state.step_data[`step_${step}`];
    }
    return null;
  }
  
  /**
   * 回退到上一步
   * @param {string} userId - 用户 ID
   * @returns {object} - 结果对象 {success: boolean, step?: number, message?: string}
   */
  goBack(userId) {
    const state = this.loadState(userId);
    if (!state) {
      return { 
        success: false, 
        message: '未找到会话状态，请重新开始' 
      };
    }
    
    if (state.current_step > 0) {
      state.current_step--;
      this.saveState(userId, state);
      return { 
        success: true, 
        step: state.current_step,
        message: `已返回到第 ${state.current_step} 步`
      };
    }
    
    return { 
      success: false, 
      message: '已经是第一步，无法回退' 
    };
  }
  
  /**
   * 前进到下一步
   * @param {string} userId - 用户 ID
   * @returns {object} - 结果对象 {success: boolean, step?: number, message?: string}
   */
  goNext(userId) {
    const state = this.loadState(userId);
    if (!state) {
      return { 
        success: false, 
        message: '未找到会话状态，请重新开始' 
      };
    }
    
    // 总共 10 步（0-10）
    if (state.current_step < 10) {
      state.current_step++;
      this.saveState(userId, state);
      return { 
        success: true, 
        step: state.current_step,
        message: `已进入第 ${state.current_step} 步`
      };
    }
    
    return { 
      success: false, 
      message: '已经是最后一步' 
    };
  }
  
  /**
   * 清除状态
   * @param {string} userId - 用户 ID
   * @returns {boolean} - 是否成功清除
   */
  clearState(userId) {
    const filePath = path.join(this.statePath, `${userId}.json`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  }
  
  /**
   * 获取所有活跃会话
   * @returns {array} - 会话列表
   */
  getAllSessions() {
    const sessions = [];
    if (fs.existsSync(this.statePath)) {
      const files = fs.readdirSync(this.statePath);
      for (const file of files) {
        if (file.endsWith('.json')) {
          const userId = file.replace('.json', '');
          const state = this.loadState(userId);
          if (state) {
            sessions.push({
              userId,
              sessionId: state.session_id,
              currentStep: state.current_step,
              createdAt: state.created_at,
              updatedAt: state.updated_at
            });
          }
        }
      }
    }
    return sessions;
  }
  
  /**
   * 清理过期会话（超过 24 小时未更新）
   * @param {number} expireHours - 过期时间（小时）
   * @returns {number} - 清理的会话数量
   */
  cleanupExpiredSessions(expireHours = 24) {
    const expireTime = Date.now() - (expireHours * 60 * 60 * 1000);
    let count = 0;
    
    const sessions = this.getAllSessions();
    for (const session of sessions) {
      if (session.updatedAt < expireTime) {
        this.clearState(session.userId);
        count++;
      }
    }
    
    return count;
  }
}

module.exports = StateManager;
