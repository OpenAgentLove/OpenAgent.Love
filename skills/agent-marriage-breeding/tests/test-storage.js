/**
 * @fileoverview Storage module unit tests
 * Tests for SQLite database operations
 */

const { expect } = require('chai');
const EvolutionDB = require('../storage');
const path = require('path');
const fs = require('fs');

describe('EvolutionDB', function() {
  let db;
  const testDbPath = path.join(__dirname, '../../data/test-storage.db');
  
  beforeEach(function() {
    // Create fresh database for each test
    db = new EvolutionDB(testDbPath);
  });
  
  afterEach(function() {
    // Clean up
    if (db && db.db) {
      db.db.close();
    }
    // Remove test database file
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });
  
  describe('Table Initialization', function() {
    it('should create all required tables', function() {
      const tables = db.db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name IN ('robots', 'agents', 'marriages', 'mutations')
      `).all();
      
      expect(tables.length).to.equal(4);
    });
    
    it('should create indexes for performance', function() {
      const indexes = db.db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='index' AND name LIKE 'idx_%'
      `).all();
      
      expect(indexes.length).to.be.greaterThan(0);
    });
  });
  
  describe('Robot Operations', function() {
    it('should insert a new robot', function() {
      const robot = {
        robot_id: 'robot_test_001',
        agent_id: 'main',
        user_id: 'ou_test123',
        name: 'TestBot',
        skills: JSON.stringify([{ name: 'coding', level: 3 }]),
        registered_at: Date.now()
      };
      
      db.insertRobot(robot);
      const retrieved = db.getRobot('robot_test_001');
      
      expect(retrieved).to.not.be.null;
      expect(retrieved.name).to.equal('TestBot');
      expect(retrieved.agent_id).to.equal('main');
    });
    
    it('should update robot information', function() {
      const robot = {
        robot_id: 'robot_test_002',
        agent_id: 'main',
        user_id: 'ou_test123',
        name: 'OriginalBot',
        skills: JSON.stringify([]),
        registered_at: Date.now()
      };
      
      db.insertRobot(robot);
      db.updateRobot('robot_test_002', { 
        name: 'UpdatedBot',
        is_available: 0 
      });
      
      const updated = db.getRobot('robot_test_002');
      expect(updated.name).to.equal('UpdatedBot');
      expect(updated.is_available).to.equal(0);
    });
    
    it('should delete a robot', function() {
      const robot = {
        robot_id: 'robot_test_003',
        agent_id: 'main',
        user_id: 'ou_test123',
        name: 'ToDelete',
        skills: JSON.stringify([]),
        registered_at: Date.now()
      };
      
      db.insertRobot(robot);
      db.deleteRobot('robot_test_003');
      
      const retrieved = db.getRobot('robot_test_003');
      expect(retrieved).to.be.null;
    });
    
    it('should get all robots', function() {
      for (let i = 0; i < 5; i++) {
        db.insertRobot({
          robot_id: `robot_test_${i}`,
          agent_id: 'main',
          user_id: `ou_test${i}`,
          name: `Bot${i}`,
          skills: JSON.stringify([]),
          registered_at: Date.now()
        });
      }
      
      const robots = db.getAllRobots();
      expect(robots.length).to.equal(5);
    });
    
    it('should find robots by user_id', function() {
      db.insertRobot({
        robot_id: 'robot_user1_1',
        agent_id: 'main',
        user_id: 'ou_same_user',
        name: 'Bot1',
        skills: JSON.stringify([]),
        registered_at: Date.now()
      });
      
      db.insertRobot({
        robot_id: 'robot_user1_2',
        agent_id: 'main',
        user_id: 'ou_same_user',
        name: 'Bot2',
        skills: JSON.stringify([]),
        registered_at: Date.now()
      });
      
      const userRobots = db.getRobotsByUserId('ou_same_user');
      expect(userRobots.length).to.equal(2);
    });
  });
  
  describe('Marriage Operations', function() {
    beforeEach(function() {
      // Insert test robots
      db.insertRobot({
        robot_id: 'robot_a',
        agent_id: 'main',
        user_id: 'ou_test1',
        name: 'RobotA',
        skills: JSON.stringify([]),
        registered_at: Date.now()
      });
      
      db.insertRobot({
        robot_id: 'robot_b',
        agent_id: 'main',
        user_id: 'ou_test2',
        name: 'RobotB',
        skills: JSON.stringify([]),
        registered_at: Date.now()
      });
    });
    
    it('should insert a marriage record', function() {
      const marriage = {
        id: 'mar_test_001',
        robot_a: 'robot_a',
        robot_b: 'robot_b',
        robot_a_name: 'RobotA',
        robot_b_name: 'RobotB',
        created_at: Date.now(),
        child_count: 0
      };
      
      db.insertMarriage(marriage);
      const marriages = db.getAllMarriages();
      
      expect(marriages.length).to.equal(1);
      expect(marriages[0].robot_a).to.equal('robot_a');
      expect(marriages[0].robot_b).to.equal('robot_b');
    });
    
    it('should update child_count', function() {
      const marriage = {
        id: 'mar_test_002',
        robot_a: 'robot_a',
        robot_b: 'robot_b',
        robot_a_name: 'RobotA',
        robot_b_name: 'RobotB',
        created_at: Date.now(),
        child_count: 0
      };
      
      db.insertMarriage(marriage);
      db.updateMarriageChildCount('mar_test_002', 3);
      
      const marriages = db.getAllMarriages();
      expect(marriages[0].child_count).to.equal(3);
    });
    
    it('should get marriage by robot ID', function() {
      const marriage = {
        id: 'mar_test_003',
        robot_a: 'robot_a',
        robot_b: 'robot_b',
        robot_a_name: 'RobotA',
        robot_b_name: 'RobotB',
        created_at: Date.now(),
        child_count: 0
      };
      
      db.insertMarriage(marriage);
      const robotMarriage = db.getMarriageByRobotId('robot_a');
      
      expect(robotMarriage).to.not.be.null;
      expect(robotMarriage.id).to.equal('mar_test_003');
    });
  });
  
  describe('Agent Operations', function() {
    it('should insert an agent', function() {
      const agent = {
        agent_id: 'agent_test_001',
        name: 'TestAgent',
        generation: 1,
        skills: JSON.stringify([{ name: 'test', level: 2 }]),
        parents: JSON.stringify(['parent1', 'parent2']),
        created_at: Date.now(),
        owner_robot_id: 'robot_test_001'
      };
      
      db.insertAgent(agent);
      const retrieved = db.getAgent('agent_test_001');
      
      expect(retrieved).to.not.be.null;
      expect(retrieved.name).to.equal('TestAgent');
      expect(retrieved.generation).to.equal(1);
    });
    
    it('should update agent information', function() {
      const agent = {
        agent_id: 'agent_test_002',
        name: 'OriginalAgent',
        generation: 0,
        skills: JSON.stringify([]),
        parents: JSON.stringify([]),
        created_at: Date.now()
      };
      
      db.insertAgent(agent);
      db.updateAgent('agent_test_002', {
        generation: 2,
        crystal_energy: 100
      });
      
      const updated = db.getAgent('agent_test_002');
      expect(updated.generation).to.equal(2);
      expect(updated.crystal_energy).to.equal(100);
    });
    
    it('should get all agents', function() {
      for (let i = 0; i < 10; i++) {
        db.insertAgent({
          agent_id: `agent_test_${i}`,
          name: `Agent${i}`,
          generation: i,
          skills: JSON.stringify([]),
          parents: JSON.stringify([]),
          created_at: Date.now()
        });
      }
      
      const agents = db.getAllAgents();
      expect(agents.length).to.equal(10);
    });
  });
  
  describe('Mutation Operations', function() {
    it('should record a mutation', function() {
      const mutation = {
        robot_id: 'robot_test_001',
        skill_name: 'coding',
        old_level: 2,
        new_level: 3,
        mutation_type: 'spontaneous',
        created_at: Date.now()
      };
      
      db.insertMutation(mutation);
      const mutations = db.getMutationsByRobot('robot_test_001');
      
      expect(mutations.length).to.equal(1);
      expect(mutations[0].skill_name).to.equal('coding');
    });
    
    it('should get all mutations', function() {
      for (let i = 0; i < 5; i++) {
        db.insertMutation({
          robot_id: `robot_test_${i}`,
          skill_name: 'skill',
          old_level: 1,
          new_level: 2,
          mutation_type: 'inheritance',
          created_at: Date.now()
        });
      }
      
      const mutations = db.getAllMutations();
      expect(mutations.length).to.equal(5);
    });
  });
  
  describe('Query Performance', function() {
    it('should handle bulk inserts efficiently', function() {
      const startTime = Date.now();
      
      for (let i = 0; i < 100; i++) {
        db.insertRobot({
          robot_id: `robot_bulk_${i}`,
          agent_id: 'main',
          user_id: `ou_bulk_${i}`,
          name: `BulkBot${i}`,
          skills: JSON.stringify([]),
          registered_at: Date.now()
        });
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete 100 inserts in under 2 seconds
      expect(duration).to.be.below(2000);
      
      const robots = db.getAllRobots();
      expect(robots.length).to.equal(100);
    });
  });
});
