# ESLint Configuration

This project uses ESLint to maintain code quality and consistency.

## 📋 Rules Overview

### Code Style
- **Indentation**: 2 spaces
- **Quotes**: Single quotes
- **Semicolons**: Required
- **Line length**: 120 characters max
- **Line breaks**: Unix style (LF)

### Best Practices
- **Variables**: Use `const` and `let`, no `var`
- **Equality**: Use `===` and `!==` (no type coercion)
- **Curly braces**: Required for all blocks
- **Arrow functions**: Preferred for callbacks

### Documentation
- **JSDoc**: Required for functions, methods, and classes
- **Comments**: Encouraged for complex logic

## 🚀 Usage

### Install Dependencies

```bash
npm install --save-dev eslint
```

### Run Linter

```bash
# Check all files
npm run lint

# Auto-fix issues
npm run lint:fix

# Check specific file
npx eslint skills/agent-marriage-breeding/core.js

# Check with detailed output
npx eslint skills/agent-marriage-breeding/**/*.js --format table
```

## 🔧 Configuration

### Rules Categories

#### Errors (Must Fix)
- `no-unused-vars`: Unused variables
- `no-undef`: Undefined variables
- `eqeqeq`: Type-safe equality
- `semi`: Missing semicolons
- `quotes`: Incorrect quotes

#### Warnings (Should Fix)
- `no-shadow`: Variable shadowing
- `max-len`: Line too long
- `max-lines-per-function`: Function too long
- `complexity`: Cyclomatic complexity too high
- `valid-jsdoc`: JSDoc format issues

#### Disabled
- `no-console`: Allowed (needed for logging)
- `no-debugger`: Warning only (useful for development)

## 📝 JSDoc Examples

### Function Documentation

```javascript
/**
 * Calculate agent power based on skills
 * @param {Object} agent - Agent object with skills array
 * @param {Array} agent.skills - List of skills with levels
 * @returns {number} Calculated power score
 * @throws {Error} If agent has no skills
 */
function calculatePower(agent) {
  if (!agent.skills || agent.skills.length === 0) {
    throw new Error('Agent must have skills');
  }
  // Implementation...
}
```

### Class Documentation

```javascript
/**
 * Evolution Database Manager
 * Handles all SQLite operations for agent evolution
 * 
 * @example
 * const db = new EvolutionDB('./data/evolution.db');
 * db.insertRobot(robotData);
 */
class EvolutionDB {
  /**
   * Create database instance
   * @param {string} dbPath - Path to SQLite database file
   */
  constructor(dbPath) {
    // Implementation...
  }
}
```

## 🎯 Code Quality Metrics

### Complexity Limits
- **Function complexity**: Max 15 (cyclomatic)
- **Function length**: Max 100 lines
- **File length**: No hard limit (use judgment)

### Performance Considerations
- Avoid deep nesting (> 3 levels)
- Break large functions into smaller ones
- Use early returns to reduce complexity

## 🔍 Common Issues & Fixes

### Issue: Missing semicolon
```javascript
// ❌ Bad
const x = 1

// ✅ Good
const x = 1;
```

### Issue: Using var instead of const/let
```javascript
// ❌ Bad
var count = 0;

// ✅ Good
const count = 0;
```

### Issue: Type coercion
```javascript
// ❌ Bad
if (x == 5) {}

// ✅ Good
if (x === 5) {}
```

### Issue: Missing JSDoc
```javascript
// ❌ Bad
function calculate(a, b) {
  return a + b;
}

// ✅ Good
/**
 * Add two numbers
 * @param {number} a - First number
 * @param {number} b - Second number
 * @returns {number} Sum of a and b
 */
function calculate(a, b) {
  return a + b;
}
```

## 🔄 CI/CD Integration

ESLint runs automatically in GitHub Actions on every push:

```yaml
- name: Lint Code
  run: npm run lint
```

## 📚 Resources

- [ESLint Documentation](https://eslint.org/docs/)
- [JSDoc Documentation](https://jsdoc.app/)
- [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)

---

**Last Updated**: 2026-03-18  
**Maintainer**: OpenAgentLove Team
