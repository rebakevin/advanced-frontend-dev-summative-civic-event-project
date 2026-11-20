(function () {
  window.App = window.App || {};
  var internal = (App.authInternal = App.authInternal || {});

  internal.TOKEN_KEY = 'civic.token';
  internal.USER_KEY = 'civic.user';
  internal.FLASH_KEY = 'civic.flash';

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
      if (read(list[i], internal.TOKEN_KEY)) return list[i];
    }
    return null;
  }

  internal.read = read;
  internal.write = write;
  internal.remove = remove;
  internal.stores = stores;
  internal.activeStore = activeStore;
})();
