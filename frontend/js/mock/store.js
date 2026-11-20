(function () {
  window.App = window.App || {};
  App.mock = App.mock || {};

  // Bump the version when the seed changes, so browsers drop their saved copy of the old seed.
  var STATE_KEY = 'civic.mock.v2';
  var TABLES = ['users', 'events', 'event_registrations', 'event_feedback', 'announcements', 'promos', 'notifications'];
  // Sample media used when an upload is not stored (see assets/demo/).
  var FALLBACK_BY_FIELD = {
    image_url: 'assets/demo/sample-event.svg',
    audio_url: 'assets/demo/sample-audio.wav',
    video_url: 'assets/demo/sample-video.mp4',
  };

  var state = null;

  // Site root as an absolute URL, so media paths work under a GitHub Pages subpath.
  function root() {
    var meta = document.querySelector('meta[name="app-root"]');
    var url = new URL(meta ? meta.content : './', window.location.href).href;
    return url.charAt(url.length - 1) === '/' ? url : url + '/';
  }

  function assetUrl(path) {
    return root() + String(path).replace(/^\/+/, '');
  }

  // blob: URLs die with the page, so a reload swaps them for the sample media
  // (also inside metadata, where events keep their image).
  function sanitize(obj) {
    Object.keys(obj).forEach(function (key) {
      var value = obj[key];
      if (typeof value === 'string' && value.indexOf('blob:') === 0 && FALLBACK_BY_FIELD[key]) {
        obj[key] = assetUrl(FALLBACK_BY_FIELD[key]);
      } else if (value && typeof value === 'object') {
        sanitize(value);
      }
    });
    return obj;
  }

  // The backend uses string UUIDs and the pages compare ids strictly, so seed ids become strings.
  function stringifyIds(obj) {
    Object.keys(obj).forEach(function (key) {
      var value = obj[key];
      if (typeof value === 'number' && (key === 'id' || key === 'created_by' || /_id$/.test(key))) {
        obj[key] = String(value);
      } else if (value && typeof value === 'object') {
        stringifyIds(value);
      }
    });
    return obj;
  }

  function fresh() {
    var seed = stringifyIds(App.mock.seed ? App.mock.seed() : {});
    TABLES.forEach(function (table) {
      seed[table] = seed[table] || [];
    });
    seed.seq = {};
    TABLES.forEach(function (table) {
      seed.seq[table] = seed[table].reduce(function (max, row) {
        return Math.max(max, Number(row.id) || 0);
      }, 0);
    });
    return seed;
  }

  function persist() {
    try {
      window.localStorage.setItem(STATE_KEY, JSON.stringify(state));
    } catch (e) { /* storage full or blocked: state lives for this page only */ }
  }

  function load() {
    if (state) return state;
    try {
      var raw = window.localStorage.getItem(STATE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && parsed.seq && Array.isArray(parsed.users)) {
          state = sanitize(parsed);
          return state;
        }
      }
    } catch (e) { /* fall through to a fresh seed */ }
    state = fresh();
    persist();
    return state;
  }

  // Thrown by handlers; the transport turns it into {status, message[, errors]}.
  function MockError(status, message, errors) {
    this.status = status;
    this.message = message;
    this.errors = errors;
  }

  // Fake JWT: base64url header.payload.signature. auth.js only reads exp.
  function b64url(text) {
    return btoa(unescape(encodeURIComponent(text))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function fromB64url(text) {
    var b64 = text.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    return decodeURIComponent(escape(atob(b64)));
  }

  App.mock.db = {
    // Mutable state: {users, events, event_registrations, event_feedback, announcements, promos, notifications, seq}.
    // Rows use the same columns as the PostgreSQL tables. The transport saves after every non-GET request.
    get: load,
    save: function () {
      load();
      persist();
    },
    nextId: function (table) {
      var s = load();
      s.seq[table] = (s.seq[table] || 0) + 1;
      return String(s.seq[table]);
    },
    // Row by id (ids compared as strings), or undefined.
    find: function (table, id) {
      var rows = load()[table];
      for (var i = 0; i < rows.length; i++) {
        if (String(rows[i].id) === String(id)) return rows[i];
      }
      return undefined;
    },
    // Row by id, or throws 404 '<label> not found'.
    require: function (table, id, label) {
      var row = App.mock.db.find(table, id);
      if (!row) throw App.mock.error(404, label + ' not found');
      return row;
    },
    remove: function (table, row) {
      var rows = load()[table];
      rows.splice(rows.indexOf(row), 1);
    },
    reset: function () {
      state = null;
      try { window.localStorage.removeItem(STATE_KEY); } catch (e) { /* ignore */ }
      load();
    },
  };

  App.mock.assetUrl = assetUrl;

  // Uploads are previewed through object URLs and not stored. `field` is image_url, audio_url or video_url.
  App.mock.fileUrl = function (file, field) {
    if (file && typeof file === 'object' && typeof file.size === 'number' && window.URL && URL.createObjectURL) {
      return URL.createObjectURL(file);
    }
    return assetUrl(FALLBACK_BY_FIELD[field] || '');
  };

  App.mock.ok = function (data, message, status) {
    var s = status || 200;
    var body = { status: s, message: message || 'OK' };
    if (data !== undefined) body.data = data;
    return { status: s, body: body };
  };

  // Usage: throw App.mock.error(404, 'Event not found');
  App.mock.error = function (status, message, errors) {
    return new MockError(status, message, errors);
  };

  App.mock.isError = function (err) {
    return err instanceof MockError;
  };

  App.mock.makeToken = function (user) {
    var now = Math.floor(Date.now() / 1000);
    var header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    var payload = b64url(JSON.stringify({ id: user.id, role: user.role, iat: now, exp: now + 3600 }));
    return header + '.' + payload + '.mock-signature';
  };

  // Returns the user row for a valid Bearer token, else null.
  App.mock.userFromToken = function (token) {
    try {
      var parts = String(token).split('.');
      if (parts.length !== 3) return null;
      var payload = JSON.parse(fromB64url(parts[1]));
      if (!payload || typeof payload.exp !== 'number' || payload.exp <= Math.floor(Date.now() / 1000)) return null;
      var users = load().users;
      for (var i = 0; i < users.length; i++) {
        if (users[i].id === payload.id) return users[i];
      }
    } catch (e) { /* invalid token */ }
    return null;
  };

  // Same messages as the backend's authenticate / authorize middleware.
  App.mock.requireUser = function (req) {
    if (!req.authHeader || req.authHeader.indexOf('Bearer ') !== 0) {
      throw App.mock.error(401, 'Authorization header missing');
    }
    if (!req.user) throw App.mock.error(401, 'Invalid or expired token');
    return req.user;
  };

  App.mock.requireAdmin = function (req) {
    var user = App.mock.requireUser(req);
    if (user.role !== 'admin') throw App.mock.error(403, 'Forbidden: insufficient permissions');
    return user;
  };

  App.mock.now = function () {
    return new Date().toISOString();
  };

  // Newest first by created_at (ISO strings sort lexically).
  App.mock.sortNewest = function (rows) {
    return rows.sort(function (a, b) {
      return String(b.created_at).localeCompare(String(a.created_at));
    });
  };

  // Parses ?page & ?limit (defaults 1 and 20, bad values fall back) and slices `rows`.
  // Returns {items, page, limit, total, pages}.
  App.mock.paginate = function (rows, query) {
    var page = parseInt(query.page, 10);
    var limit = parseInt(query.limit, 10);
    page = page > 0 ? page : 1;
    limit = limit > 0 ? limit : 20;
    return {
      items: rows.slice((page - 1) * limit, page * limit),
      page: page,
      limit: limit,
      total: rows.length,
      pages: Math.ceil(rows.length / limit),
    };
  };

  // Mirrors Notifications.create (a model function in the backend, not an HTTP route).
  // Call from handlers that create events, announcements or promos.
  App.mock.notify = function (data) {
    var row = {
      id: App.mock.db.nextId('notifications'),
      title: data.title,
      message: data.message,
      type: data.type,
      recipient_id: data.recipient_id === undefined ? null : data.recipient_id,
      metadata: data.metadata || {},
      created_by: data.created_by === undefined ? null : data.created_by,
      read: false,
      created_at: App.mock.now(),
      updated_at: App.mock.now(),
    };
    load().notifications.push(row);
    return row;
  };

  var routes = [];
  var sorted = true;

  // Registers a handler. `path` is relative to API_BASE_URL, e.g. '/events/:id'.
  // handler(req) returns App.mock.ok(...) or throws App.mock.error(...).
  // req: {method, path, params, query, body, files, user, authHeader}
  //   body: parsed JSON object, or for FormData the text fields as an object
  //   files: for FormData, {fieldName: File}
  App.mock.route = function (method, path, handler) {
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

  App.mock.match = function (method, path) {
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
