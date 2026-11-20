const fs = require('fs');
const path = require('path');
const { ROOT, DIST } = require('./paths');
const { read } = require('./fs-utils');

function writeConfig(useMock) {
  const src = path.join(ROOT, 'config.js');
  if (!fs.existsSync(src)) {
    console.warn('Warning: config.js not found, skipping.');
    return;
  }
  let text = read(src);
  if (process.env.API_BASE_URL) {
    text = text.replace(/^(\s*API_BASE_URL:\s*).*$/m, function (m, head) {
      return head + JSON.stringify(process.env.API_BASE_URL) + ',';
    });
  }
  text = text.replace(/^(\s*USE_MOCK:\s*).*$/m, function (m, head) {
    return head + (useMock ? 'true' : 'false') + ',';
  });
  fs.writeFileSync(path.join(DIST, 'config.js'), text);
}

module.exports = { writeConfig };
