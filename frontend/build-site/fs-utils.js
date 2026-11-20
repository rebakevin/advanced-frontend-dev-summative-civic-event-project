const fs = require('fs');
const path = require('path');
const { ROOT } = require('./paths');

function read(file) {
  if (!fs.existsSync(file)) throw new Error('Missing file: ' + path.relative(ROOT, file));
  return fs.readFileSync(file, 'utf8');
}

function copy(from, to, filter) {
  if (!fs.existsSync(from)) return;
  fs.cpSync(from, to, { recursive: true, filter: filter });
}

module.exports = { read, copy };
