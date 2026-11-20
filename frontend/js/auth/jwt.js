(function () {
  window.App = window.App || {};
  var internal = (App.authInternal = App.authInternal || {});

  // JWT payload is base64url, not plain base64: swap the alphabet and restore padding.
  function decodePayload(token) {
    try {
      var parts = String(token).split('.');
      if (parts.length !== 3) return null;
      var b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      while (b64.length % 4) b64 += '=';
      var json = decodeURIComponent(atob(b64).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      var payload = JSON.parse(json);
      return payload && typeof payload === 'object' ? payload : null;
    } catch (e) {
      return null;
    }
  }

  internal.decodePayload = decodePayload;
})();
