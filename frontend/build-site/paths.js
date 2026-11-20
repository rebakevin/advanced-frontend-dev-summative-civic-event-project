const path = require('path');

const ROOT = path.resolve(__dirname, '..');

module.exports = {
  ROOT,
  DIST: path.join(ROOT, 'dist'),
  PAGES: path.join(ROOT, 'pages'),
  LAYOUT: path.join(ROOT, 'index.html'),
  SIDEBAR: path.join(ROOT, 'components', 'admin-sidebar.html'),
  WATCH: process.argv.includes('--watch'),
};
