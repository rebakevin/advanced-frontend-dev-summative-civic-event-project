const { LAYOUT, WATCH } = require('./paths');
const { read } = require('./fs-utils');
const { resolveIncludes } = require('./templates');
const { isMockOn } = require('./mock');
const { writeConfig } = require('./config');
const { cleanDist } = require('./dist');
const { buildPages } = require('./pages');
const { buildJs } = require('./js-modules');
const { writeRootRedirect, copyAssets, copyVendor } = require('./static-files');

function build() {
  const started = Date.now();
  const useMock = isMockOn();
  const layoutSource = resolveIncludes(read(LAYOUT), LAYOUT);
  cleanDist();

  const built = buildPages(layoutSource, useMock);
  writeRootRedirect();
  buildJs(useMock);
  copyAssets();
  writeConfig(useMock);
  copyVendor();

  console.log('Built ' + built + ' pages in ' + (Date.now() - started) + 'ms' + (useMock ? ' (mock mode)' : ''));
}

function safeBuild() {
  try {
    build();
  } catch (err) {
    console.error('Build failed: ' + err.message);
    if (!WATCH) process.exit(1);
  }
}

module.exports = { safeBuild };
