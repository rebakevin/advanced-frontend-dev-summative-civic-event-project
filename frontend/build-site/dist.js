const fs = require('fs');
const path = require('path');
const { DIST, WATCH } = require('./paths');

// In watch mode dist/styles.css belongs to the tailwind watcher, so keep it.
function cleanDist() {
  fs.mkdirSync(DIST, { recursive: true });
  fs.readdirSync(DIST).forEach(function (name) {
    if (WATCH && name === 'styles.css') return;
    fs.rmSync(path.join(DIST, name), { recursive: true, force: true });
  });
}

module.exports = { cleanDist };
