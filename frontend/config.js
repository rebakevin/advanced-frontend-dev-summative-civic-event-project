window.App = window.App || {};
App.config = {
  API_BASE_URL: 'http://localhost:4000/api',
  USE_MOCK: false,
};

// Builds the URL of a page folder. The layout's <meta name="app-root"> holds the
// relative path to the site root, so this works under a GitHub Pages subpath.
App.pageUrl = function (name, query) {
  var meta = document.querySelector('meta[name="app-root"]');
  var root = new URL(meta ? meta.content : './', window.location.href).href;
  if (root.charAt(root.length - 1) !== '/') root += '/';
  var url = root + name + '/';
  if (query && !$.isEmptyObject(query)) url += '?' + $.param(query);
  return url;
};
