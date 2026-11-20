(function () {
  window.App = window.App || {};
  var ns = (App.promoCommon = App.promoCommon || {});

  var CACHE_TTL_MS = 5 * 60 * 1000;
  var memory = null;

  // The API has no published filter for promos. Missing flag counts as published.
  function isPublished(promo) {
    return promo.published !== false;
  }

  // Cache is keyed by user id and capped in age, so a different user (after logout and
  // login) never sees another user's list, and nothing stays stale for long.
  function cacheKey() {
    var user = App.auth && App.auth.getUser();
    return 'promos:list:' + (user ? user.id : 'anon');
  }

  function readCache() {
    var key = cacheKey();
    if (memory && memory.key === key && Date.now() - memory.at < CACHE_TTL_MS) return memory.data;
    try {
      var raw = window.sessionStorage.getItem(key);
      if (!raw) return null;
      var entry = JSON.parse(raw);
      if (!entry || !$.isArray(entry.data) || Date.now() - entry.at >= CACHE_TTL_MS) return null;
      memory = { key: key, at: entry.at, data: entry.data };
      return entry.data;
    } catch (e) {
      return null;
    }
  }

  function writeCache(data) {
    var key = cacheKey();
    memory = { key: key, at: Date.now(), data: data };
    try {
      window.sessionStorage.setItem(key, JSON.stringify({ at: memory.at, data: data }));
    } catch (e) { /* storage unavailable or full: the in-memory copy is enough */ }
  }

  // Call after every write (create, update, publish, unpublish, delete).
  function invalidate() {
    memory = null;
    try {
      window.sessionStorage.removeItem(cacheKey());
    } catch (e) { /* ignore */ }
  }

  // Shallow copies, so callers can edit their list without touching the cached one.
  function copies(list) {
    return $.map(list, function (p) { return $.extend({}, p); });
  }

  // Resolves with a fresh copy of the promo array. Served from the cache when fresh.
  function loadList() {
    var cached = readCache();
    if (cached) return $.Deferred().resolve(copies(cached)).promise();
    // The list is paginated (default 20), so ask for a large page to get everything.
    return App.api.get('/promos', { limit: 100 }, { inline: true }).then(function (data) {
      var list = $.isArray(data) ? data : [];
      writeCache(list);
      return copies(list);
    });
  }

  ns.isPublished = isPublished;
  ns.invalidate = invalidate;
  ns.loadList = loadList;
})();
