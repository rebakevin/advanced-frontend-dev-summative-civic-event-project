const fs = require('fs');
const path = require('path');
const { ROOT, DIST } = require('./paths');
const { copy } = require('./fs-utils');

const VENDOR_FILES = [
  ['node_modules/jquery/dist/jquery.min.js', 'vendor/jquery.min.js'],
  ['node_modules/chart.js/dist/chart.umd.js', 'vendor/chart.umd.js'],
];

function writeRootRedirect() {
  fs.writeFileSync(
    path.join(DIST, 'index.html'),
    '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n' +
      '<meta http-equiv="refresh" content="0; url=login/">\n<title>CivicEvents</title>\n</head>\n' +
      '<body><a href="login/">Continue to CivicEvents</a></body>\n</html>\n'
  );
}

function copyAssets() {
  copy(path.join(ROOT, 'assets'), path.join(DIST, 'assets'));
}

function copyVendor() {
  VENDOR_FILES.forEach(function (pair) {
    const from = path.join(ROOT, pair[0]);
    if (!fs.existsSync(from)) throw new Error('Missing ' + pair[0] + '. Run npm install.');
    fs.mkdirSync(path.join(DIST, 'vendor'), { recursive: true });
    fs.copyFileSync(from, path.join(DIST, pair[1]));
  });
}

module.exports = { writeRootRedirect, copyAssets, copyVendor };
