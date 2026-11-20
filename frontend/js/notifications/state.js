(function ($) {
  window.App = window.App || {};
  var N = (App.notificationsInternal = App.notificationsInternal || {});

  var KEY_PREFIX = 'civic.readNotifications.';

  N.state = {
    cache: null, // latest list from GET /notifications
    fetchedAt: 0,
    loading: null, // in-flight promise
    readIds: null, // {id: true}, loaded lazily per signed-in user
  };

  function storageKey() {
    var user = App.auth.getUser();
    return KEY_PREFIX + (user ? user.id : 'anonymous');
  }

  // The API has no endpoint to mark a notification read, so read ids live in
  // localStorage, one list per user.
  function loadRead() {
    var s = N.state;
    if (s.readIds) return s.readIds;
    s.readIds = {};
    try {
      var list = JSON.parse(window.localStorage.getItem(storageKey()) || '[]');
      $.each($.isArray(list) ? list : [], function (i, id) { s.readIds[id] = true; });
    } catch (e) { /* storage blocked: everything counts as unread */ }
    return s.readIds;
  }

  function saveRead() {
    try {
      window.localStorage.setItem(storageKey(), JSON.stringify(Object.keys(N.state.readIds)));
      return true;
    } catch (e) {
      return false;
    }
  }

  function isRead(id) {
    return !!loadRead()[id];
  }

  function unreadCount(list) {
    return $.grep(list || N.state.cache || [], function (n) { return !isRead(n.id); }).length;
  }

  function changed() {
    N.paintBell();
    $(document).trigger('notifications:change', [N.state.cache || []]);
  }

  // Optimistic: the UI updates first; if the write fails the change is reverted.
  function markIds(ids) {
    loadRead();
    var readIds = N.state.readIds;
    var added = $.grep(ids, function (id) { return !readIds[id]; });
    if (!added.length) return true;
    $.each(added, function (i, id) { readIds[id] = true; });
    changed();
    if (!saveRead()) {
      $.each(added, function (i, id) { delete readIds[id]; });
      changed();
      App.toast.error('Could not save this change in your browser.');
      return false;
    }
    return true;
  }

  function markRead(id) {
    return markIds([id]);
  }

  function markAllRead() {
    return markIds($.map(N.state.cache || [], function (n) { return n.id; }));
  }

  N.isRead = isRead;
  N.unreadCount = unreadCount;
  N.changed = changed;
  N.markRead = markRead;
  N.markAllRead = markAllRead;
})(jQuery);
