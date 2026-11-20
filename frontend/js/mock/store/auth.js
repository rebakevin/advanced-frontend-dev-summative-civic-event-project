(function () {
  window.App = window.App || {};
  App.mock = App.mock || {};
  App.mock.internal = App.mock.internal || {};

  // Fake JWT: base64url header.payload.signature. auth.js only reads exp.
  function b64url(text) {
    return btoa(unescape(encodeURIComponent(text))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function fromB64url(text) {
    var b64 = text.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    return decodeURIComponent(escape(atob(b64)));
  }

  App.mock.internal.makeToken = function (user) {
    var now = Math.floor(Date.now() / 1000);
    var header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    var payload = b64url(JSON.stringify({ id: user.id, role: user.role, iat: now, exp: now + 3600 }));
    return header + '.' + payload + '.mock-signature';
  };

  // Returns the user row for a valid Bearer token, else null.
  App.mock.internal.userFromToken = function (token) {
    try {
      var parts = String(token).split('.');
      if (parts.length !== 3) return null;
      var payload = JSON.parse(fromB64url(parts[1]));
      if (!payload || typeof payload.exp !== 'number' || payload.exp <= Math.floor(Date.now() / 1000)) return null;
      var users = App.mock.internal.load().users;
      for (var i = 0; i < users.length; i++) {
        if (users[i].id === payload.id) return users[i];
      }
    } catch (e) { /* invalid token */ }
    return null;
  };

  // Same messages as the backend's authenticate / authorize middleware.
  App.mock.internal.requireUser = function (req) {
    if (!req.authHeader || req.authHeader.indexOf('Bearer ') !== 0) {
      throw App.mock.error(401, 'Authorization header missing');
    }
    if (!req.user) throw App.mock.error(401, 'Invalid or expired token');
    return req.user;
  };

  App.mock.internal.requireAdmin = function (req) {
    var user = App.mock.requireUser(req);
    if (user.role !== 'admin') throw App.mock.error(403, 'Forbidden: insufficient permissions');
    return user;
  };
})();
