(function () {
  window.App = window.App || {};
  App.mock = App.mock || {};
  App.mock.internal = App.mock.internal || {};

  var routes = [];
  var sorted = true;

  // Registers a handler. `path` is relative to API_BASE_URL, e.g. '/events/:id'.
  // handler(req) returns App.mock.ok(...) or throws App.mock.error(...).
  // req: {method, path, params, query, body, files, user, authHeader}
  //   body: parsed JSON object, or for FormData the text fields as an object
  //   files: for FormData, {fieldName: File}
  App.mock.internal.route = function (method, path, handler) {
    var names = [];
    var pattern = path.replace(/\/+$/, '').split('/').map(function (seg) {
      if (seg.charAt(0) === ':') {
        names.push(seg.slice(1));
        return '([^/]+)';
      }
      return seg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }).join('/');
    routes.push({
      method: method.toUpperCase(),
      regex: new RegExp('^' + pattern + '/?$'),
      names: names,
      params: names.length,
      handler: handler,
    });
    sorted = false;
  };

  App.mock.internal.match = function (method, path) {
    // Static routes win over parameter routes (/users/profile/me before /users/:id).
    if (!sorted) {
      routes.sort(function (a, b) { return a.params - b.params; });
      sorted = true;
    }
    var pathMatched = false;
    for (var i = 0; i < routes.length; i++) {
      var m = routes[i].regex.exec(path);
      if (!m) continue;
      pathMatched = true;
      if (routes[i].method !== method.toUpperCase()) continue;
      var params = {};
      routes[i].names.forEach(function (name, idx) {
        params[name] = decodeURIComponent(m[idx + 1]);
      });
      return { handler: routes[i].handler, params: params };
    }
    return { handler: null, pathMatched: pathMatched };
  };
})();
