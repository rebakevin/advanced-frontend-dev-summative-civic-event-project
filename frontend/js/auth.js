(function () {
  window.App = window.App || {};

  var TOKEN_KEY = 'civic.token';
  var USER_KEY = 'civic.user';
  var FLASH_KEY = 'civic.flash';

  // Every storage access is wrapped: storage can throw (private mode, blocked site data).
  function read(store, key) {
    try {
      return store.getItem(key);
    } catch (e) {
      return null;
    }
  }

  function write(store, key, value) {
    try {
      store.setItem(key, value);
    } catch (e) { /* ignore */ }
  }

  function remove(store, key) {
    try {
      store.removeItem(key);
    } catch (e) { /* ignore */ }
  }

  function stores() {
    var list = [];
    try { list.push(window.localStorage); } catch (e) { /* unavailable */ }
    try { list.push(window.sessionStorage); } catch (e) { /* unavailable */ }
    return list;
  }

  // Returns the storage that currently holds the session, or null.
  function activeStore() {
    var list = stores();
    for (var i = 0; i < list.length; i++) {
      if (read(list[i], TOKEN_KEY)) return list[i];
    }
    return null;
  }

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

  var auth = {
    setSession: function (token, user, remember) {
      auth.logout();
      var store;
      try {
        store = remember ? window.localStorage : window.sessionStorage;
      } catch (e) {
        return;
      }
      write(store, TOKEN_KEY, token);
      write(store, USER_KEY, JSON.stringify(user));
    },

    getToken: function () {
      var store = activeStore();
      return store ? read(store, TOKEN_KEY) : null;
    },

    getUser: function () {
      var store = activeStore();
      if (!store) return null;
      try {
        return JSON.parse(read(store, USER_KEY));
      } catch (e) {
        return null;
      }
    },

    updateUser: function (partial) {
      var store = activeStore();
      var user = auth.getUser();
      if (!store || !user) return null;
      user = $.extend({}, user, partial);
      write(store, USER_KEY, JSON.stringify(user));
      return user;
    },

    // A token with no readable exp is treated as expired.
    isExpired: function () {
      var token = auth.getToken();
      if (!token) return true;
      var payload = decodePayload(token);
      if (!payload || typeof payload.exp !== 'number') return true;
      return payload.exp <= Math.floor(Date.now() / 1000);
    },

    isLoggedIn: function () {
      return !!auth.getToken() && !auth.isExpired();
    },

    hasRole: function (role) {
      var user = auth.getUser();
      return !!user && user.role === role;
    },

    logout: function () {
      stores().forEach(function (store) {
        remove(store, TOKEN_KEY);
        remove(store, USER_KEY);
      });
    },

    landingPage: function (role) {
      return role === 'admin' ? 'admin-dashboard' : 'my-dashboard';
    }
  };

  var flash = {
    set: function (message, type) {
      try {
        window.sessionStorage.setItem(FLASH_KEY, JSON.stringify({ message: message, type: type || 'info' }));
      } catch (e) { /* ignore */ }
    },

    take: function () {
      try {
        var raw = window.sessionStorage.getItem(FLASH_KEY);
        if (!raw) return null;
        window.sessionStorage.removeItem(FLASH_KEY);
        var value = JSON.parse(raw);
        return value && value.message ? value : null;
      } catch (e) {
        return null;
      }
    }
  };

  App.auth = auth;
  App.flash = flash;
})();
