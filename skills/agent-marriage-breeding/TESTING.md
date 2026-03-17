# 🧪 Agent Marriage Breeding - Test Suite

Complete unit test coverage for the agent-marriage-breeding skill.

## 📋 Test Coverage

### Core Module (`test-core.js`)
- ✅ Constructor and configuration
- ✅ Robot registration
- ✅ Marriage system
- ✅ Breeding system
- ✅ Family tree generation
- ✅ Leaderboard calculations
- ✅ Statistics
- ✅ Data persistence

### Storage Module (`test-storage.js`)
- ✅ Table initialization
- ✅ Robot CRUD operations
- ✅ Marriage operations
- ✅ Agent operations
- ✅ Mutation tracking
- ✅ Query performance

### Genetic Engine (`test-genetic-engine.js`)
- ✅ Gene creation
- ✅ Skill inheritance
- ✅ Mutation algorithms
- ✅ Power calculations
- ✅ Preset skills validation
- ✅ Edge cases

## 🚀 Running Tests

### Prerequisites

```bash
npm install --save-dev mocha chai better-sqlite3
```

### Run All Tests

```bash
npm test
# or
./run-tests.sh
```

### Run with Coverage

```bash
./run-tests.sh --coverage
```

### Run in Watch Mode

```bash
./run-tests.sh --watch
```

### Run Single Test File

```bash
./run-tests.sh --single tests/test-core.js
```

## 📊 Test Structure

```
tests/
├── test-core.js              # Core business logic tests
├── test-storage.js           # Database operation tests
├── test-genetic-engine.js    # Genetic algorithm tests
└── results.xml               # Test results (generated)
```

## 🎯 Test Guidelines

### Writing New Tests

1. Follow the existing pattern (describe/it blocks)
2. Use descriptive test names
3. Test both success and failure cases
4. Clean up after each test (database files)
5. Use assertions from Chai's expect API

### Example Test

```javascript
describe('Feature Name', function() {
  it('should do something specific', function() {
    const result = someFunction();
    expect(result).to.be.true;
  });
  
  it('should handle edge case', function() {
    expect(() => someFunction(null)).to.not.throw();
  });
});
```

## 📈 Coverage Goals

- **Target**: 80% code coverage
- **Critical Paths**: 100% (marriage, breeding, inheritance)
- **Edge Cases**: All error conditions tested

## 🔧 Configuration

### Mocha Configuration (`.mocharc.json`)

```json
{
  "timeout": 10000,
  "reporter": "spec",
  "exit": true
}
```

### Test Configuration (`test-config.yml`)

- Database path for tests
- Mutation rates
- Coverage settings

## 🐛 Troubleshooting

### Issue: Tests fail with "database locked"

**Solution**: Make sure all database connections are closed in afterEach hooks.

### Issue: Module not found

**Solution**: Run `npm install` to install dependencies.

### Issue: Tests timeout

**Solution**: Increase timeout in `.mocharc.json` or optimize slow tests.

## 📝 Test Reports

Test results are automatically generated in:
- Console output (spec reporter)
- `tests/results.xml` (JUnit format for CI/CD)

## 🔄 CI/CD Integration

The test suite integrates with GitHub Actions:

```yaml
- name: Run Tests
  run: ./run-tests.sh
```

---

**Maintainer**: OpenAgentLove Team  
**Last Updated**: 2026-03-18
