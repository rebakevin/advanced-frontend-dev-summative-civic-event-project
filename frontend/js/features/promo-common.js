(function () {
  window.App = window.App || {};

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

  // Each call invalidates the cache on success. Resolves with the API data.
  function setPublished(promo, publish) {
    var path = '/promos/' + encodeURIComponent(promo.id) + (publish ? '/publish' : '/unpublish');
    return App.api.patch(path, null, { inline: true }).then(function (data) {
      invalidate();
      return data;
    });
  }

  function remove(promo) {
    return App.api.del('/promos/' + encodeURIComponent(promo.id), { inline: true }).then(function (data) {
      invalidate();
      return data;
    });
  }

  // Confirm, then delete. Calls onDone() after success; errors show as a toast.
  function confirmDelete(promo, $btn, onDone) {
    App.modal.confirm({
      title: 'Delete promo?',
      message: 'Delete "' + promo.title + '"? This cannot be undone.',
      confirmLabel: 'Delete',
      danger: true,
    }).done(function () {
      App.ui.withLoading($btn, remove(promo))
        .done(onDone)
        .fail(function (err) {
          App.toast.error(err.message);
        });
    });
  }

  function pad(n, len) {
    var s = String(n);
    while (s.length < len) s = '0' + s;
    return s;
  }

  function timestamp(seconds) {
    var ms = Math.round(seconds * 1000);
    var h = Math.floor(ms / 3600000);
    var m = Math.floor((ms % 3600000) / 60000);
    var s = Math.floor((ms % 60000) / 1000);
    return pad(h, 2) + ':' + pad(m, 2) + ':' + pad(s, 2) + '.' + pad(ms % 1000, 3);
  }

  function escapeCue(text) {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // Splits caption text into sentences (and lines) that become one cue each.
  function splitCues(text) {
    var cues = [];
    $.each(String(text || '').split(/\r?\n/), function (i, line) {
      var parts = $.trim(line).match(/[^.!?]+[.!?]*/g) || [];
      $.each(parts, function (j, part) {
        part = $.trim(part);
        if (part) cues.push(part);
      });
    });
    return cues;
  }

  // WebVTT from caption_text. Cues are spread over the video duration in proportion to
  // their length. Without a usable duration each cue gets a fixed 4 seconds.
  function buildVtt(text, duration) {
    var cues = splitCues(text);
    var total = 0;
    $.each(cues, function (i, c) { total += c.length; });
    var known = isFinite(duration) && duration > 0;
    var out = ['WEBVTT', ''];
    var at = 0;
    $.each(cues, function (i, c) {
      var len = known ? (c.length / total) * duration : 4;
      out.push(String(i + 1));
      out.push(timestamp(at) + ' --> ' + timestamp(at + len));
      out.push(escapeCue(c));
      out.push('');
      at += len;
    });
    return out.join('\n');
  }

  App.promos = {
    isPublished: isPublished,
    loadList: loadList,
    invalidate: invalidate,
    setPublished: setPublished,
    remove: remove,
    confirmDelete: confirmDelete,
    buildVtt: buildVtt,
  };
})();
