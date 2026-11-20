(function () {
  window.App = window.App || {};
  var internal = App.authInternal;
  var TOKEN_KEY = internal.TOKEN_KEY;
  var USER_KEY = internal.USER_KEY;
  var read = internal.read;
  var write = internal.write;
  var remove = internal.remove;
  var stores = internal.stores;
  var activeStore = internal.activeStore;
  var decodePayload = internal.decodePayload;

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

  App.auth = auth;
  App.flash = internal.flash;
})();
