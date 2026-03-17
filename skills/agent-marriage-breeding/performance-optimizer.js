/**
 * @fileoverview Performance Optimization Module
 * Provides caching, indexing, and query optimization for EvolutionDB
 * 
 * Features:
 * - In-memory LRU cache for frequently accessed data
 * - Query result caching
 * - Batch operation optimization
 * - Index management
 */

const EventEmitter = require('events');

class PerformanceOptimizer extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      // Cache settings
      cache_enabled: options.cache_enabled !== false,
      cache_max_size: options.cache_max_size || 1000,
      cache_ttl: options.cache_ttl || 300000, // 5 minutes
      
      // Batch settings
      batch_size: options.batch_size || 100,
      batch_delay: options.batch_delay || 100, // ms
      
      // Index settings
      auto_index: options.auto_index !== false,
      
      // Stats
      track_stats: options.track_stats !== false
    };
    
    // LRU Cache implementation
    this.cache = new Map();
    this.cacheKeys = [];
    
    // Statistics
    this.stats = {
      cache_hits: 0,
      cache_misses: 0,
      queries_optimized: 0,
      batch_operations: 0
    };
    
    // Pending batch operations
    this.pendingBatches = {
      robots: [],
      agents: [],
      marriages: []
    };
    
    // Batch timers
    this.batchTimers = {};
    
    console.log('⚡ Performance Optimizer initialized');
    console.log(`   Cache: ${this.config.cache_enabled ? 'enabled' : 'disabled'} (max: ${this.config.cache_max_size})`);
    console.log(`   TTL: ${this.config.cache_ttl}ms`);
    console.log(`   Batch size: ${this.config.batch_size}`);
  }
  
  /**
   * Get value from cache
   * @param {string} key - Cache key
   * @returns {*} Cached value or null
   */
  get(key) {
    if (!this.config.cache_enabled) return null;
    
    const item = this.cache.get(key);
    
    if (!item) {
      this.stats.cache_misses++;
      return null;
    }
    
    // Check TTL
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      this._removeKeyFromOrder(key);
      this.stats.cache_misses++;
      return null;
    }
    
    // Update access order (move to end)
    this._updateAccessOrder(key);
    this.stats.cache_hits++;
    
    return item.value;
  }
  
  /**
   * Set value in cache
   * @param {string} key - Cache key
   * @param {*} value - Value to cache
   * @param {number} ttl - Time to live in ms (optional)
   */
  set(key, value, ttl) {
    if (!this.config.cache_enabled) return;
    
    const expiry = Date.now() + (ttl || this.config.cache_ttl);
    
    // If key exists, update it
    if (this.cache.has(key)) {
      this.cache.set(key, { value, expiry });
      this._updateAccessOrder(key);
      return;
    }
    
    // Check cache size limit
    if (this.cache.size >= this.config.cache_max_size) {
      this._evictOldest();
    }
    
    // Add new item
    this.cache.set(key, { value, expiry });
    this.cacheKeys.push(key);
    
    this.emit('cache:set', { key, size: this.cache.size });
  }
  
  /**
   * Delete value from cache
   * @param {string} key - Cache key
   */
  delete(key) {
    if (this.cache.delete(key)) {
      this._removeKeyFromOrder(key);
      this.emit('cache:delete', { key });
    }
  }
  
  /**
   * Clear entire cache
   */
  clear() {
    this.cache.clear();
    this.cacheKeys = [];
    this.emit('cache:clear');
  }
  
  /**
   * Get cache statistics
   * @returns {Object} Cache stats
   */
  getCacheStats() {
    const total = this.stats.cache_hits + this.stats.cache_misses;
    const hitRate = total > 0 ? (this.stats.cache_hits / total * 100).toFixed(2) : 0;
    
    return {
      size: this.cache.size,
      max_size: this.config.cache_max_size,
      hits: this.stats.cache_hits,
      misses: this.stats.cache_misses,
      hit_rate: `${hitRate}%`,
      queries_optimized: this.stats.queries_optimized,
      batch_operations: this.stats.batch_operations
    };
  }
  
  /**
   * Batch insert with automatic flushing
   * @param {string} type - Type of data (robots, agents, marriages)
   * @param {Object} data - Data to insert
   * @param {Function} flushFn - Function to flush batch to database
   */
  batchInsert(type, data, flushFn) {
    if (!this.pendingBatches[type]) {
      this.pendingBatches[type] = [];
    }
    
    this.pendingBatches[type].push(data);
    
    // Clear existing timer
    if (this.batchTimers[type]) {
      clearTimeout(this.batchTimers[type]);
    }
    
    // Set timer to flush batch
    this.batchTimers[type] = setTimeout(() => {
      this._flushBatch(type, flushFn);
    }, this.config.batch_delay);
    
    // Flush immediately if batch is full
    if (this.pendingBatches[type].length >= this.config.batch_size) {
      clearTimeout(this.batchTimers[type]);
      this._flushBatch(type, flushFn);
    }
  }
  
  /**
   * Flush pending batch to database
   * @param {string} type - Type of data
   * @param {Function} flushFn - Flush function
   * @private
   */
  _flushBatch(type, flushFn) {
    const batch = this.pendingBatches[type];
    
    if (batch.length === 0) return;
    
    try {
      flushFn(batch);
      this.stats.batch_operations++;
      
      // Invalidate cache for this type
      this._invalidateType(type);
      
      this.emit('batch:flush', { type, count: batch.length });
    } catch (error) {
      console.error(`Batch flush failed for ${type}:`, error.message);
      this.emit('batch:error', { type, error });
    } finally {
      this.pendingBatches[type] = [];
    }
  }
  
  /**
   * Create database indexes for performance
   * @param {Object} db - Database instance
   */
  createIndexes(db) {
    if (!this.config.auto_index) return;
    
    console.log('📊 Creating database indexes...');
    
    const indexes = [
      // Robots indexes
      'CREATE INDEX IF NOT EXISTS idx_robots_user_id ON robots(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_robots_agent_id ON robots(agent_id)',
      'CREATE INDEX IF NOT EXISTS idx_robots_available ON robots(is_available)',
      'CREATE INDEX IF NOT EXISTS idx_robots_spouse ON robots(spouse)',
      
      // Agents indexes
      'CREATE INDEX IF NOT EXISTS idx_agents_generation ON agents(generation)',
      'CREATE INDEX IF NOT EXISTS idx_agents_owner ON agents(owner_robot_id)',
      'CREATE INDEX IF NOT EXISTS idx_agents_spouse ON agents(spouse)',
      
      // Marriages indexes
      'CREATE INDEX IF NOT EXISTS idx_marriages_robot_a ON marriages(robot_a)',
      'CREATE INDEX IF NOT EXISTS idx_marriages_robot_b ON marriages(robot_b)',
      
      // Mutations indexes
      'CREATE INDEX IF NOT EXISTS idx_mutations_child_id ON mutations(child_id)',
      'CREATE INDEX IF NOT EXISTS idx_mutations_created_at ON mutations(created_at)',
      
      // Achievements indexes
      'CREATE INDEX IF NOT EXISTS idx_achievements_agent_id ON achievements(agent_id)'
    ];
    
    for (const sql of indexes) {
      try {
        db.exec(sql);
      } catch (error) {
        console.warn(`Index creation warning: ${error.message}`);
      }
    }
    
    console.log('✅ Database indexes created');
  }
  
  /**
   * Optimize database with ANALYZE and VACUUM
   * @param {Object} db - Database instance
   */
  optimizeDatabase(db) {
    console.log('🔧 Optimizing database...');
    
    try {
      // Update statistics for query optimizer
      db.exec('ANALYZE');
      
      // Reclaim space and defragment
      db.exec('VACUUM');
      
      console.log('✅ Database optimization complete');
      this.emit('optimize:complete');
    } catch (error) {
      console.error('Database optimization failed:', error.message);
      this.emit('optimize:error', { error });
    }
  }
  
  /**
   * Get query with caching
   * @param {Object} db - Database instance
   * @param {string} queryKey - Cache key for query
   * @param {string} sql - SQL query
   * @param {Array} params - Query parameters
   * @returns {Array} Query results
   */
  cachedQuery(db, queryKey, sql, params = []) {
    // Try cache first
    const cached = this.get(queryKey);
    if (cached) {
      this.stats.queries_optimized++;
      return cached;
    }
    
    // Execute query
    const stmt = db.prepare(sql);
    const results = params.length > 0 ? stmt.all(...params) : stmt.all();
    
    // Cache results
    this.set(queryKey, results);
    
    return results;
  }
  
  /**
   * Invalidate cache entries by type
   * @param {string} type - Data type to invalidate
   * @private
   */
  _invalidateType(type) {
    const patterns = {
      robots: ['robot:', 'all_robots', 'user_robots:'],
      agents: ['agent:', 'all_agents', 'generation:'],
      marriages: ['marriage:', 'all_marriages']
    };
    
    const keys = patterns[type] || [];
    
    for (const key of this.cacheKeys) {
      if (keys.some(pattern => key.startsWith(pattern))) {
        this.delete(key);
      }
    }
  }
  
  /**
   * Evict oldest cache entry
   * @private
   */
  _evictOldest() {
    if (this.cacheKeys.length === 0) return;
    
    const oldestKey = this.cacheKeys.shift();
    this.cache.delete(oldestKey);
    
    this.emit('cache:evict', { key: oldestKey });
  }
  
  /**
   * Update access order for LRU
   * @param {string} key - Cache key
   * @private
   */
  _updateAccessOrder(key) {
    this._removeKeyFromOrder(key);
    this.cacheKeys.push(key);
  }
  
  /**
   * Remove key from access order
   * @param {string} key - Cache key
   * @private
   */
  _removeKeyFromOrder(key) {
    const index = this.cacheKeys.indexOf(key);
    if (index > -1) {
      this.cacheKeys.splice(index, 1);
    }
  }
  
  /**
   * Flush all pending batches
   */
  flushAll() {
    console.log('💾 Flushing all pending batches...');
    
    for (const type of Object.keys(this.pendingBatches)) {
      if (this.batchTimers[type]) {
        clearTimeout(this.batchTimers[type]);
        this.batchTimers[type] = null;
      }
      
      // Note: This requires the actual flush function from storage
      // which should be passed when calling batchInsert
    }
  }
  
  /**
   * Get performance report
   * @returns {Object} Performance metrics
   */
  getReport() {
    return {
      cache: this.getCacheStats(),
      memory: {
        cache_entries: this.cache.size,
        pending_batches: Object.values(this.pendingBatches).reduce((sum, arr) => sum + arr.length, 0)
      },
      config: {
        cache_enabled: this.config.cache_enabled,
        batch_size: this.config.batch_size,
        auto_index: this.config.auto_index
      }
    };
  }
}

module.exports = PerformanceOptimizer;
