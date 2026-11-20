const fs = require('fs');
const path = require('path');
const { DIST, PAGES, SIDEBAR } = require('./paths');
const { read } = require('./fs-utils');
const { resolveIncludes, fill } = require('./templates');
const { MOCK_SCRIPTS } = require('./mock');

function listPages() {
  return fs.existsSync(PAGES)
    ? fs.readdirSync(PAGES).filter(function (n) { return fs.statSync(path.join(PAGES, n)).isDirectory(); })
    : [];
}

function readMeta(name, dir) {
  const metaFile = path.join(dir, 'page.json');
  if (!fs.existsSync(metaFile)) {
    console.warn('Warning: pages/' + name + ' has no page.json, using defaults.');
    return {};
  }
  try {
    return JSON.parse(read(metaFile));
  } catch (err) {
    throw new Error('Invalid JSON in pages/' + name + '/page.json: ' + err.message);
  }
}

// Fills the layout slots for one page and writes dist/<page>/. Returns false if the page was skipped.
function buildPage(name, layoutSource, useMock) {
  const dir = path.join(PAGES, name);
  const indexFile = path.join(dir, 'index.html');
  if (!fs.existsSync(indexFile)) {
    console.warn('Warning: pages/' + name + ' has no index.html, skipped.');
    return false;
  }
  const meta = readMeta(name, dir);

  const hasCss = fs.existsSync(path.join(dir, 'index.css'));
  const content = resolveIncludes(read(indexFile), indexFile);
  let html = layoutSource
    .replace('<!-- @page-css -->', function () {
      return hasCss ? '<link rel="stylesheet" href="{{root}}' + name + '/index.css">' : '';
    })
    .replace('<!-- @mock -->', function () {
      return useMock ? MOCK_SCRIPTS.map(function (file) {
        return '<script defer src="{{root}}js/mock/' + file + '.js"></script>';
      }).join('\n  ') : '';
    })
    .replace('<!-- @scripts -->', function () {
      return (meta.scripts || []).map(function (file) {
        return '<script defer src="{{root}}js/' + file + '"></script>';
      }).join('\n  ');
    })
    .replace('<!-- @admin-sidebar -->', function () {
      return meta.sidebar ? resolveIncludes(read(SIDEBAR), SIDEBAR) : '';
    })
    .replace('<!-- @content -->', function () { return content; });
  html = fill(html, {
    root: '../',
    title: meta.title || name,
    guard: meta.guard || 'user',
    page: name,
    sidebar: meta.sidebar ? 'true' : 'false',
  });

  const out = path.join(DIST, name);
  fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(path.join(out, 'index.html'), html);
  if (hasCss) fs.copyFileSync(path.join(dir, 'index.css'), path.join(out, 'index.css'));
  return true;
}

function buildPages(layoutSource, useMock) {
  return listPages().filter(function (name) {
    return buildPage(name, layoutSource, useMock);
  }).length;
}

module.exports = { buildPages };
