// Joins the shared layout (index.html) with each pages/<page>/ folder into dist/.
// JS modules (folders in js/ with an index.js) are joined into single files, see js-modules.js.
// Usage: node build-site [--watch]
// Env: USE_MOCK, API_BASE_URL override the values in dist/config.js (source config.js is never edited).
const { WATCH } = require('./paths');
const { safeBuild } = require('./build');
const { watch } = require('./watch');

safeBuild();

if (WATCH) watch(safeBuild);
