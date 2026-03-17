/**
 * @fileoverview Genetic engine unit tests
 * Tests for gene inheritance and mutation algorithms
 */

const { expect } = require('chai');
const { 
  createAgentGene, 
  inheritGenes, 
  calculatePower, 
  PRESET_SKILLS 
} = require('../genetic-engine');

describe('GeneticEngine', function() {
  
  describe('createAgentGene', function() {
    it('should create agent with default skills', function() {
      const gene = createAgentGene('TestAgent');
      
      expect(gene).to.have.property('name', 'TestAgent');
      expect(gene).to.have.property('skills');
      expect(gene.skills).to.be.an('array');
      expect(gene.skills.length).to.be.greaterThan(0);
    });
    
    it('should create agent with custom skills', function() {
      const customSkills = [
        { name: 'coding', level: 3 },
        { name: 'design', level: 2 }
      ];
      
      const gene = createAgentGene('CustomBot', customSkills);
      
      expect(gene.skills).to.deep.equal(customSkills);
    });
    
    it('should assign unique agent_id', function() {
      const gene1 = createAgentGene('Bot1');
      const gene2 = createAgentGene('Bot2');
      
      expect(gene1.agent_id).to.exist;
      expect(gene2.agent_id).to.exist;
      expect(gene1.agent_id).to.not.equal(gene2.agent_id);
    });
    
    it('should calculate initial power', function() {
      const gene = createAgentGene('PowerBot', [
        { name: 'strength', level: 5 },
        { name: 'intelligence', level: 4 }
      ]);
      
      expect(gene).to.have.property('power');
      expect(gene.power).to.be.a('number');
      expect(gene.power).to.be.greaterThan(0);
    });
  });
  
  describe('inheritGenes', function() {
    it('should inherit skills from both parents', function() {
      const parent1 = createAgentGene('Parent1', [
        { name: 'skill_a', level: 3, is_mutation: false },
        { name: 'skill_b', level: 2, is_mutation: false }
      ]);
      
      const parent2 = createAgentGene('Parent2', [
        { name: 'skill_c', level: 4, is_mutation: false },
        { name: 'skill_d', level: 1, is_mutation: false }
      ]);
      
      const child = inheritGenes(parent1, parent2, 'Child1', {
        mutation_rate: 0, // Disable mutation for predictable test
        recessive_inherit_rate: 1.0
      });
      
      expect(child.skills).to.be.an('array');
      // Child should inherit some skills from each parent
      expect(child.skills.length).to.be.greaterThan(0);
    });
    
    it('should apply mutation to skills', function() {
      const parent1 = createAgentGene('Parent1', [
        { name: 'skill_a', level: 3, is_mutation: false }
      ]);
      
      const parent2 = createAgentGene('Parent2', [
        { name: 'skill_b', level: 2, is_mutation: false }
      ]);
      
      // Test with 100% mutation rate to ensure mutation occurs
      const child = inheritGenes(parent1, parent2, 'MutantChild', {
        mutation_rate: 1.0,
        recessive_inherit_rate: 0.5
      });
      
      expect(child).to.have.property('skills');
      // At least some skills should be mutated
      const mutatedSkills = child.skills.filter(s => s.is_mutation);
      expect(mutatedSkills.length).to.be.greaterThan(0);
    });
    
    it('should increment generation number', function() {
      const parent1 = createAgentGene('Parent1');
      const parent2 = createAgentGene('Parent2');
      
      const child = inheritGenes(parent1, parent2, 'Child1');
      
      expect(child.generation).to.equal(1);
    });
    
    it('should handle parents with different generation numbers', function() {
      const parent1 = createAgentGene('Parent1');
      parent1.generation = 2;
      
      const parent2 = createAgentGene('Parent2');
      parent2.generation = 3;
      
      const child = inheritGenes(parent1, parent2, 'Child1');
      
      // Child generation should be max(parents) + 1
      expect(child.generation).to.equal(4);
    });
    
    it('should create child with unique ID', function() {
      const parent1 = createAgentGene('Parent1');
      const parent2 = createAgentGene('Parent2');
      
      const child1 = inheritGenes(parent1, parent2, 'Child1');
      const child2 = inheritGenes(parent1, parent2, 'Child2');
      
      expect(child1.agent_id).to.not.equal(child2.agent_id);
    });
  });
  
  describe('calculatePower', function() {
    it('should calculate power based on skill levels', function() {
      const agent = {
        skills: [
          { name: 'skill1', level: 3 },
          { name: 'skill2', level: 4 },
          { name: 'skill3', level: 5 }
        ]
      };
      
      const power = calculatePower(agent);
      
      expect(power).to.be.a('number');
      expect(power).to.be.greaterThan(0);
    });
    
    it('should give higher power to higher skill levels', function() {
      const agent1 = {
        skills: [
          { name: 'skill1', level: 1 },
          { name: 'skill2', level: 1 }
        ]
      };
      
      const agent2 = {
        skills: [
          { name: 'skill1', level: 5 },
          { name: 'skill2', level: 5 }
        ]
      };
      
      const power1 = calculatePower(agent1);
      const power2 = calculatePower(agent2);
      
      expect(power2).to.be.greaterThan(power1);
    });
    
    it('should handle empty skills array', function() {
      const agent = {
        skills: []
      };
      
      const power = calculatePower(agent);
      
      expect(power).to.equal(0);
    });
    
    it('should consider skill diversity', function() {
      const specialized = {
        skills: [
          { name: 'coding', level: 10 }
        ]
      };
      
      const diverse = {
        skills: [
          { name: 'coding', level: 5 },
          { name: 'design', level: 5 },
          { name: 'communication', level: 5 }
        ]
      };
      
      const power1 = calculatePower(specialized);
      const power2 = calculatePower(diverse);
      
      // Diverse skills should provide bonus
      expect(power2).to.be.greaterThan(power1);
    });
  });
  
  describe('PRESET_SKILLS', function() {
    it('should contain predefined skills', function() {
      expect(PRESET_SKILLS).to.be.an('array');
      expect(PRESET_SKILLS.length).to.be.greaterThan(0);
    });
    
    it('should have valid skill structure', function() {
      PRESET_SKILLS.forEach(skill => {
        expect(skill).to.have.property('name');
        expect(skill).to.have.property('category');
        expect(skill.name).to.be.a('string');
        expect(skill.category).to.be.a('string');
      });
    });
    
    it('should include common skill categories', function() {
      const categories = PRESET_SKILLS.map(s => s.category);
      
      expect(categories).to.include('technical');
      expect(categories).to.include('social');
      expect(categories).to.include('creative');
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle null/undefined inputs gracefully', function() {
      expect(() => createAgentGene(null)).to.not.throw();
      expect(() => createAgentGene(undefined)).to.not.throw();
    });
    
    it('should handle invalid skill levels', function() {
      const gene = createAgentGene('TestBot', [
        { name: 'skill', level: -1 },
        { name: 'skill2', level: 100 }
      ]);
      
      expect(gene).to.be.an('object');
    });
    
    it('should handle very large generation numbers', function() {
      const parent1 = createAgentGene('Parent1');
      parent1.generation = 999;
      
      const parent2 = createAgentGene('Parent2');
      parent2.generation = 1000;
      
      const child = inheritGenes(parent1, parent2, 'Child1');
      
      expect(child.generation).to.equal(1001);
    });
  });
});
