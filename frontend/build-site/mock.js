const fs = require('fs');
const path = require('path');
const { ROOT } = require('./paths');

const MOCK_SCRIPTS = ['store', 'seed', 'transport', 'handlers-users', 'handlers-events', 'handlers-media', 'handlers-notifications', 'demo-ui'];

// Mock mode is on when USE_MOCK=true, or when USE_MOCK is unset and config.js has USE_MOCK: true.
function isMockOn() {
  if (process.env.USE_MOCK !== undefined && process.env.USE_MOCK !== '') return process.env.USE_MOCK === 'true';
  const src = path.join(ROOT, 'config.js');
  return fs.existsSync(src) && /^\s*USE_MOCK:\s*true\b/m.test(fs.readFileSync(src, 'utf8'));
}

module.exports = { MOCK_SCRIPTS, isMockOn };
