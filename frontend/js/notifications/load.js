(function ($) {
  window.App = window.App || {};
  var N = (App.notificationsInternal = App.notificationsInternal || {});

  var FRESH_MS = 30000;

  // Resolves with the list. Concurrent callers share one request, and opts.force
  // still reuses a list fetched in the last FRESH_MS (the bell loads it on page load).
  // opts.inline / opts.silent go to App.api.get.
  function load(opts) {
    var s = N.state;
    opts = opts || {};
    var fresh = s.cache && Date.now() - s.fetchedAt < FRESH_MS;
    if (s.cache && (!opts.force || fresh)) return $.Deferred().resolve(s.cache).promise();
    if (s.loading) return s.loading;
    s.loading = App.api.get('/notifications', null, { inline: opts.inline !== false, silent: !!opts.silent })
      .then(function (list) {
        s.cache = $.isArray(list) ? list : [];
        s.fetchedAt = Date.now();
        N.changed();
        return s.cache;
      })
      .always(function () { s.loading = null; });
    return s.loading;
  }

  // Drops a deleted notification from the cache (admin delete) and refreshes the bell.
  function forget(id) {
    var s = N.state;
    if (!s.cache) return;
    s.cache = $.grep(s.cache, function (n) { return n.id !== id; });
    N.changed();
  }

  N.load = load;
  N.forget = forget;
})(jQuery);
