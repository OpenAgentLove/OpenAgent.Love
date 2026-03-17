/**
 * @fileoverview Core module unit tests
 * Tests for agent-marriage-breeding core functionality
 */

const { expect } = require('chai');
const EvolutionCore = require('../core');
const path = require('path');

describe('EvolutionCore', function() {
  let ev;
  const testDbPath = path.join(__dirname, '../../data/test-evolution.db');
  
  beforeEach(function() {
    // Create fresh instance for each test
    ev = new EvolutionCore({
      storage_path: testDbPath,
      init_presets: false, // Skip presets for faster tests
      mutation_rate: 0.2,
      recessive_inherit_rate: 0.5
    });
  });
  
  afterEach(function() {
    // Clean up
    if (ev && ev.db) {
      ev.db.close();
    }
  });
  
  describe('Constructor', function() {
    it('should create instance with default config', function() {
      expect(ev).to.be.an('object');
      expect(ev.config.mutation_rate).to.equal(0.2);
      expect(ev.config.recessive_inherit_rate).to.equal(0.5);
    });
    
    it('should accept custom config options', function() {
      const customEv = new EvolutionCore({
        mutation_rate: 0.3,
        max_generation: 500
      });
      
      expect(customEv.config.mutation_rate).to.equal(0.3);
      expect(customEv.config.max_generation).to.equal(500);
      
      if (customEv.db) customEv.db.close();
    });
  });
  
  describe('Robot Registration', function() {
    it('should register a new robot successfully', function() {
      const result = ev.registerRobot('main', 'ou_test123', 'TestBot');
      
      expect(result.success).to.be.true;
      expect(result.robot).to.have.property('robot_id');
      expect(result.robot.name).to.equal('TestBot');
      expect(result.robot.agent_id).to.equal('main');
      expect(result.robot.user_id).to.equal('ou_test123');
    });
    
    it('should generate unique robot_id', function() {
      const result1 = ev.registerRobot('main', 'ou_test123', 'Bot1');
      const result2 = ev.registerRobot('main', 'ou_test123', 'Bot2');
      
      expect(result1.robot.robot_id).to.not.equal(result2.robot.robot_id);
    });
    
    it('should register robot with custom skills', function() {
      const customSkills = [
        { name: 'coding', level: 3 },
        { name: 'design', level: 2 }
      ];
      
      const result = ev.registerRobot('main', 'ou_test123', 'SkillBot', {
        skills: customSkills
      });
      
      expect(result.robot.skills).to.deep.equal(customSkills);
    });
    
    it('should fail when robot_id already exists', function() {
      const result1 = ev.registerRobot('main', 'ou_test123', 'Bot1');
      const result2 = ev.registerRobot('main', 'ou_test123', 'Bot1', {
        robot_id: result1.robot.robot_id
      });
      
      expect(result2.success).to.be.false;
      expect(result2.error).to.include('already exists');
    });
  });
  
  describe('Marriage System', function() {
    let robot1, robot2;
    
    beforeEach(function() {
      robot1 = ev.registerRobot('main', 'ou_test123', 'Robot1').robot;
      robot2 = ev.registerRobot('main', 'ou_test456', 'Robot2').robot;
    });
    
    it('should create marriage between two robots', function() {
      const result = ev.marry(robot1.robot_id, robot2.robot_id);
      
      expect(result.success).to.be.true;
      expect(result.marriage).to.have.property('id');
      expect(result.marriage.robot_a).to.equal(robot1.robot_id);
      expect(result.marriage.robot_b).to.equal(robot2.robot_id);
    });
    
    it('should prevent self-marriage', function() {
      const result = ev.marry(robot1.robot_id, robot1.robot_id);
      
      expect(result.success).to.be.false;
      expect(result.error).to.include('Cannot marry yourself');
    });
    
    it('should prevent marriage if already married', function() {
      ev.marry(robot1.robot_id, robot2.robot_id);
      
      const robot3 = ev.registerRobot('main', 'ou_test789', 'Robot3').robot;
      const result = ev.marry(robot1.robot_id, robot3.robot_id);
      
      expect(result.success).to.be.false;
      expect(result.error).to.include('already married');
    });
    
    it('should update spouse field for both robots', function() {
      ev.marry(robot1.robot_id, robot2.robot_id);
      
      const updated1 = ev.getRobot(robot1.robot_id);
      const updated2 = ev.getRobot(robot2.robot_id);
      
      expect(updated1.spouse).to.equal(robot2.robot_id);
      expect(updated2.spouse).to.equal(robot1.robot_id);
    });
  });
  
  describe('Breeding System', function() {
    let robot1, robot2;
    
    beforeEach(function() {
      robot1 = ev.registerRobot('main', 'ou_test123', 'Parent1', {
        skills: [{ name: 'skill_a', level: 3 }]
      }).robot;
      
      robot2 = ev.registerRobot('main', 'ou_test456', 'Parent2', {
        skills: [{ name: 'skill_b', level: 2 }]
      }).robot;
      
      ev.marry(robot1.robot_id, robot2.robot_id);
    });
    
    it('should create child with inherited skills', function() {
      const result = ev.breed(robot1.robot_id, robot2.robot_id, 'Child1');
      
      expect(result.success).to.be.true;
      expect(result.child).to.have.property('robot_id');
      expect(result.child.skills).to.be.an('array');
      expect(result.child.skills.length).to.be.greaterThan(0);
    });
    
    it('should increment generation number', function() {
      const childResult = ev.breed(robot1.robot_id, robot2.robot_id, 'Child1');
      const child = childResult.child;
      
      expect(child.generation).to.equal(1);
    });
    
    it('should prevent breeding if not married', function() {
      const robot3 = ev.registerRobot('main', 'ou_test789', 'Robot3').robot;
      const result = ev.breed(robot1.robot_id, robot3.robot_id, 'IllegitimateChild');
      
      expect(result.success).to.be.false;
      expect(result.error).to.include('not married');
    });
    
    it('should update child_count in marriage record', function() {
      ev.breed(robot1.robot_id, robot2.robot_id, 'Child1');
      
      const marriages = ev.db.getAllMarriages();
      const marriage = marriages.find(m => 
        m.robot_a === robot1.robot_id || m.robot_b === robot1.robot_id
      );
      
      expect(marriage.child_count).to.equal(1);
    });
  });
  
  describe('Family Tree', function() {
    it('should return family tree with correct structure', function() {
      const robot1 = ev.registerRobot('main', 'ou_test123', 'GrandParent').robot;
      const robot2 = ev.registerRobot('main', 'ou_test456', 'GrandParent2').robot;
      ev.marry(robot1.robot_id, robot2.robot_id);
      
      const child1 = ev.breed(robot1.robot_id, robot2.robot_id, 'Child1').child;
      const child2 = ev.breed(robot1.robot_id, robot2.robot_id, 'Child2').child;
      
      const tree = ev.getFamilyTree(robot1.robot_id, 2);
      
      expect(tree).to.have.property('name', 'GrandParent');
      expect(tree.children).to.be.an('array');
      expect(tree.children.length).to.equal(2);
    });
    
    it('should limit tree depth to specified generations', function() {
      const robot1 = ev.registerRobot('main', 'ou_test123', 'Root').robot;
      const robot2 = ev.registerRobot('main', 'ou_test456', 'Root2').robot;
      ev.marry(robot1.robot_id, robot2.robot_id);
      
      const child1 = ev.breed(robot1.robot_id, robot2.robot_id, 'Child1').child;
      const child2 = ev.registerRobot('main', 'ou_test789', 'Child2').robot;
      ev.marry(child1.robot_id, child2.robot_id);
      ev.breed(child1.robot_id, child2.robot_id, 'GrandChild');
      
      const tree = ev.getFamilyTree(robot1.robot_id, 1);
      
      expect(tree.children.length).to.equal(1);
      expect(tree.children[0].children).to.be.undefined;
    });
  });
  
  describe('Leaderboard', function() {
    it('should return robots sorted by power', function() {
      ev.registerRobot('main', 'ou_test123', 'Bot1', {
        skills: [{ name: 'power', level: 10 }]
      });
      ev.registerRobot('main', 'ou_test456', 'Bot2', {
        skills: [{ name: 'power', level: 5 }]
      });
      ev.registerRobot('main', 'ou_test789', 'Bot3', {
        skills: [{ name: 'power', level: 8 }]
      });
      
      const leaderboard = ev.getLeaderboard('power');
      
      expect(leaderboard).to.be.an('array');
      expect(leaderboard.length).to.equal(3);
      expect(leaderboard[0].name).to.equal('Bot1');
      expect(leaderboard[2].name).to.equal('Bot2');
    });
    
    it('should limit leaderboard size', function() {
      for (let i = 0; i < 20; i++) {
        ev.registerRobot('main', `ou_test${i}`, `Bot${i}`, {
          skills: [{ name: 'power', level: Math.random() * 10 }]
        });
      }
      
      const leaderboard = ev.getLeaderboard('power', 10);
      
      expect(leaderboard.length).to.equal(10);
    });
  });
  
  describe('Statistics', function() {
    it('should return correct stats', function() {
      const robot1 = ev.registerRobot('main', 'ou_test123', 'Bot1').robot;
      const robot2 = ev.registerRobot('main', 'ou_test456', 'Bot2').robot;
      ev.marry(robot1.robot_id, robot2.robot_id);
      ev.breed(robot1.robot_id, robot2.robot_id, 'Child1');
      
      const stats = ev.getStats();
      
      expect(stats.total_robots).to.equal(3);
      expect(stats.total_marriages).to.equal(1);
    });
  });
  
  describe('Data Persistence', function() {
    it('should save and load data correctly', function() {
      const robot1 = ev.registerRobot('main', 'ou_test123', 'PersistentBot').robot;
      ev.save();
      
      // Create new instance with same DB
      const ev2 = new EvolutionCore({
        storage_path: testDbPath,
        init_presets: false
      });
      
      const loadedRobot = ev2.getRobot(robot1.robot_id);
      expect(loadedRobot).to.not.be.null;
      expect(loadedRobot.name).to.equal('PersistentBot');
      
      if (ev2.db) ev2.db.close();
    });
  });
});
