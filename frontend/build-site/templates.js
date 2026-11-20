const fs = require('fs');
const path = require('path');
const { ROOT } = require('./paths');
const { read } = require('./fs-utils');

const INCLUDE_RE = /<!--\s*@include\s+(.+?)\s*-->/g;

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

module.exports = { resolveIncludes, fill };
