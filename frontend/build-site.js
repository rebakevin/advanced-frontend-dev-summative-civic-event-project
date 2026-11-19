// Joins the shared layout (index.html) with each pages/<page>/ folder into dist/.
// Usage: node build-site.js [--watch]
// Env: USE_MOCK, API_BASE_URL override the values in dist/config.js (source config.js is never edited).
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const DIST = path.join(ROOT, 'dist');
const PAGES = path.join(ROOT, 'pages');
const LAYOUT = path.join(ROOT, 'index.html');
const WATCH = process.argv.includes('--watch');
const INCLUDE_RE = /<!--\s*@include\s+(.+?)\s*-->/g;

function read(file) {
  if (!fs.existsSync(file)) throw new Error('Missing file: ' + path.relative(ROOT, file));
  return fs.readFileSync(file, 'utf8');
}

// Replaces <!-- @include path --> with the file contents, relative to the including file.
function resolveIncludes(html, file, stack) {
  stack = stack || [file];
  return html.replace(INCLUDE_RE, function (match, rel) {
    const target = path.resolve(path.dirname(file), rel);
    if (!fs.existsSync(target)) {
      throw new Error('Include not found: "' + rel + '" (included from ' + path.relative(ROOT, file) + ')');
    }
    if (stack.includes(target)) {
      throw new Error('Circular include: ' + path.relative(ROOT, target) + ' (from ' + path.relative(ROOT, file) + ')');
    }
    return resolveIncludes(read(target), target, stack.concat(target));
  });
}

function fill(html, values) {
  return Object.keys(values).reduce(function (out, key) {
    return out.split('{{' + key + '}}').join(values[key]);
  }, html);
}

// In watch mode dist/styles.css belongs to the tailwind watcher, so keep it.
function cleanDist() {
  fs.mkdirSync(DIST, { recursive: true });
  fs.readdirSync(DIST).forEach(function (name) {
    if (WATCH && name === 'styles.css') return;
    fs.rmSync(path.join(DIST, name), { recursive: true, force: true });
  });
}

function copy(from, to, filter) {
  if (!fs.existsSync(from)) return;
  fs.cpSync(from, to, { recursive: true, filter: filter });
}

function writeConfig() {
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
  if (process.env.USE_MOCK) {
    text = text.replace(/^(\s*USE_MOCK:\s*).*$/m, function (m, head) {
      return head + (process.env.USE_MOCK === 'true' ? 'true' : 'false') + ',';
    });
  }
  fs.writeFileSync(path.join(DIST, 'config.js'), text);
}

function build() {
  const started = Date.now();
  const layoutSource = resolveIncludes(read(LAYOUT), LAYOUT);
  cleanDist();

  const pageNames = fs.existsSync(PAGES)
    ? fs.readdirSync(PAGES).filter(function (n) { return fs.statSync(path.join(PAGES, n)).isDirectory(); })
    : [];
  let built = 0;

  pageNames.forEach(function (name) {
    const dir = path.join(PAGES, name);
    const indexFile = path.join(dir, 'index.html');
    if (!fs.existsSync(indexFile)) {
      console.warn('Warning: pages/' + name + ' has no index.html, skipped.');
      return;
    }
    let meta = {};
    const metaFile = path.join(dir, 'page.json');
    if (fs.existsSync(metaFile)) {
      try {
        meta = JSON.parse(read(metaFile));
      } catch (err) {
        throw new Error('Invalid JSON in pages/' + name + '/page.json: ' + err.message);
      }
    } else {
      console.warn('Warning: pages/' + name + ' has no page.json, using defaults.');
    }

    const hasCss = fs.existsSync(path.join(dir, 'index.css'));
    const content = resolveIncludes(read(indexFile), indexFile);
    let html = layoutSource
      .replace('<!-- @page-css -->', function () {
        return hasCss ? '<link rel="stylesheet" href="{{root}}' + name + '/index.css">' : '';
      })
      .replace('<!-- @content -->', function () { return content; });
    html = fill(html, {
      root: '../',
      title: meta.title || name,
      guard: meta.guard || 'user',
      page: name,
    });

    const out = path.join(DIST, name);
    fs.mkdirSync(out, { recursive: true });
    fs.writeFileSync(path.join(out, 'index.html'), html);
    if (hasCss) fs.copyFileSync(path.join(dir, 'index.css'), path.join(out, 'index.css'));
    built++;
  });

  fs.writeFileSync(
    path.join(DIST, 'index.html'),
    '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n' +
      '<meta http-equiv="refresh" content="0; url=login/">\n<title>CivicEvents</title>\n</head>\n' +
      '<body><a href="login/">Continue to CivicEvents</a></body>\n</html>\n'
  );

  const useMock = process.env.USE_MOCK === 'true';
  const mockDir = path.join(ROOT, 'js', 'mock');
  copy(path.join(ROOT, 'js'), path.join(DIST, 'js'), function (src) {
    return useMock || (src !== mockDir && !src.startsWith(mockDir + path.sep));
  });
  copy(path.join(ROOT, 'assets'), path.join(DIST, 'assets'));
  writeConfig();

  [
    ['node_modules/jquery/dist/jquery.min.js', 'vendor/jquery.min.js'],
    ['node_modules/chart.js/dist/chart.umd.js', 'vendor/chart.umd.js'],
  ].forEach(function (pair) {
    const from = path.join(ROOT, pair[0]);
    if (!fs.existsSync(from)) throw new Error('Missing ' + pair[0] + '. Run npm install.');
    fs.mkdirSync(path.join(DIST, 'vendor'), { recursive: true });
    fs.copyFileSync(from, path.join(DIST, pair[1]));
  });

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

safeBuild();

if (WATCH) {
  let timer = null;
  const rebuild = function () {
    clearTimeout(timer);
    timer = setTimeout(safeBuild, 100);
  };
  ['pages', 'js', 'assets', 'index.html', 'config.js'].forEach(function (name) {
    const target = path.join(ROOT, name);
    if (fs.existsSync(target)) fs.watch(target, { recursive: true }, rebuild);
  });
  console.log('Watching for changes...');
}
