const fs = require('fs');
const path = require('path');
const { ROOT } = require('./paths');

function watch(onChange) {
  let timer = null;
  const rebuild = function () {
    clearTimeout(timer);
    timer = setTimeout(onChange, 100);
  };
  ['pages', 'js', 'assets', 'index.html', 'config.js'].forEach(function (name) {
    const target = path.join(ROOT, name);
    if (fs.existsSync(target)) fs.watch(target, { recursive: true }, rebuild);
  });
  console.log('Watching for changes...');
}

module.exports = { watch };
