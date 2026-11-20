const fs = require('fs');
const path = require('path');
const { ROOT, DIST } = require('./paths');
const { read } = require('./fs-utils');

const JS = path.join(ROOT, 'js');
const MOCK = path.join(JS, 'mock');

// A folder in js/ that has an index.js is a module: its parts are joined into one dist file named after the
// folder (js/features/events/ -> dist/js/features/events.js). Parts go in alphabetical order, index.js last.
function bundleModule(dir) {
  const parts = fs.readdirSync(dir)
    .filter(function (n) { return n.endsWith('.js') && n !== 'index.js'; })
    .sort()
    .concat('index.js');
  return parts.map(function (n) {
    return '// --- ' + path.relative(JS, path.join(dir, n)) + ' ---\n' + read(path.join(dir, n));
  }).join('\n');
}

function copyJs(src, out, useMock) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(out, { recursive: true });
  fs.readdirSync(src, { withFileTypes: true }).forEach(function (entry) {
    const from = path.join(src, entry.name);
    if (entry.isDirectory()) {
      if (from === MOCK && !useMock) return;
      if (fs.existsSync(path.join(from, 'index.js'))) {
        fs.writeFileSync(path.join(out, entry.name + '.js'), bundleModule(from));
      } else {
        copyJs(from, path.join(out, entry.name), useMock);
      }
    } else if (entry.name.endsWith('.js')) {
      fs.copyFileSync(from, path.join(out, entry.name));
    }
  });
}

// js/mock is only shipped in mock builds.
function buildJs(useMock) {
  copyJs(JS, path.join(DIST, 'js'), useMock);
}

module.exports = { buildJs };
