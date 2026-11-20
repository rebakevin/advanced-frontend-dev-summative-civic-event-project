(function () {
  window.App = window.App || {};
  var internal = (App.authInternal = App.authInternal || {});

  internal.flash = {
    set: function (message, type) {
      try {
        window.sessionStorage.setItem(internal.FLASH_KEY, JSON.stringify({ message: message, type: type || 'info' }));
      } catch (e) { /* ignore */ }
    },

    take: function () {
      try {
        var raw = window.sessionStorage.getItem(internal.FLASH_KEY);
        if (!raw) return null;
        window.sessionStorage.removeItem(internal.FLASH_KEY);
        var value = JSON.parse(raw);
        return value && value.message ? value : null;
      } catch (e) {
        return null;
      }
    }
  };
})();
