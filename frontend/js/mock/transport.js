(function () {
  window.App = window.App || {};
  App.mock = App.mock || {};

  var LATENCY_MS = [120, 320];

  function delay() {
    return LATENCY_MS[0] + Math.random() * (LATENCY_MS[1] - LATENCY_MS[0]);
  }

  function parseQuery(search) {
    var out = {};
    if (!search) return out;
    search.replace(/^\?/, '').split('&').forEach(function (pair) {
      if (!pair) return;
      var idx = pair.indexOf('=');
      var key = decodeURIComponent((idx < 0 ? pair : pair.slice(0, idx)).replace(/\+/g, ' '));
      var val = idx < 0 ? '' : decodeURIComponent(pair.slice(idx + 1).replace(/\+/g, ' '));
      out[key] = val;
    });
    return out;
  }

  // Splits a request body into {body, files}. FormData text fields become body, File values become files.
  function parseBody(data) {
    var body = {};
    var files = {};
    if (!data) return { body: body, files: files };
    if (typeof FormData !== 'undefined' && data instanceof FormData) {
      data.forEach(function (value, key) {
        if (typeof value === 'object' && value !== null && typeof value.size === 'number') {
          files[key] = value;
        } else {
          body[key] = value;
        }
      });
      return { body: body, files: files };
    }
    if (typeof data === 'string') {
      try {
        body = JSON.parse(data) || {};
      } catch (e) {
        body = {};
      }
    } else if (typeof data === 'object') {
      body = data;
    }
    return { body: body, files: files };
  }

  function apiPath(url) {
    var base = App.config.API_BASE_URL.replace(/\/+$/, '');
    if (String(url).indexOf(base) !== 0) return null;
    var rest = String(url).slice(base.length);
    var q = rest.indexOf('?');
    return { path: q < 0 ? rest : rest.slice(0, q), search: q < 0 ? '' : rest.slice(q) };
  }

  function run(options, headers) {
    var target = apiPath(options.url);
    var method = String(options.type || 'GET').toUpperCase();
    var authHeader = headers.Authorization || '';
    var parsed = parseBody(options.data);
    var query = parseQuery(target.search);
    if (method === 'GET' && options.data && typeof options.data === 'object') $.extend(query, options.data);
    if (method === 'GET' && typeof options.data === 'string') $.extend(query, parseQuery(options.data));

    var match = App.mock.match(method, target.path);
    if (!match.handler) {
      return match.pathMatched
        ? { status: 405, body: { status: 405, message: 'Method not allowed' } }
        : { status: 404, body: { status: 404, message: 'Route not found' } };
    }

    var req = {
      method: method,
      path: target.path,
      params: match.params,
      query: query,
      body: parsed.body,
      files: parsed.files,
      authHeader: authHeader,
      user: authHeader.indexOf('Bearer ') === 0 ? App.mock.userFromToken(authHeader.slice(7)) : null,
    };

    try {
      var result = match.handler(req);
      if (method !== 'GET') App.mock.db.save();
      return result;
    } catch (err) {
      if (App.mock.isError(err)) {
        var body = { status: err.status, message: err.message };
        if (err.errors) body.errors = err.errors;
        return { status: err.status, body: body };
      }
      if (window.console) console.error(err);
      return { status: 500, body: { status: 500, message: 'Internal Server Error' } };
    }
  }

  // Answers API calls from the seeded localStorage state; everything else goes to the network.
  $.ajaxTransport('+*', function (options) {
    if (!apiPath(options.url)) return undefined;
    var timers = [];

    return {
      send: function (headers, complete) {
        var wait = delay();
        // Upload progress is simulated (FormData only) so progress bars show something in demo mode.
        if (options.data instanceof FormData && options.xhr) {
          var upload = options.xhr().upload;
          [0.3, 0.7, 1].forEach(function (fraction, i) {
            timers.push(setTimeout(function () {
              upload.dispatchEvent(new ProgressEvent('progress', { lengthComputable: true, loaded: fraction * 100, total: 100 }));
            }, wait * (i + 1) / 4));
          });
        }
        timers.push(setTimeout(function () {
          var res = run(options, headers);
          var text = JSON.stringify(res.body);
          complete(res.status, res.status >= 200 && res.status < 300 ? 'success' : 'error', { json: res.body, text: text }, 'Content-Type: application/json');
        }, wait));
      },
      abort: function () {
        timers.forEach(clearTimeout);
      },
    };
  });
})();
