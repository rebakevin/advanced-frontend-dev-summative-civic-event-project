(function ($) {
  window.App = window.App || {};

  var KEY_PREFIX = 'civic.readNotifications.';
  var PREVIEW_LENGTH = 90;
  var DRAWER_LIMIT = 8;

  var cache = null; // latest list from GET /notifications
  var loading = null; // in-flight promise
  var readIds = null; // {id: true}, loaded lazily per signed-in user

  function storageKey() {
    var user = App.auth.getUser();
    return KEY_PREFIX + (user ? user.id : 'anonymous');
  }

  // The API has no endpoint to mark a notification read, so read ids live in
  // localStorage, one list per user.
  function loadRead() {
    if (readIds) return readIds;
    readIds = {};
    try {
      var list = JSON.parse(window.localStorage.getItem(storageKey()) || '[]');
      $.each($.isArray(list) ? list : [], function (i, id) { readIds[id] = true; });
    } catch (e) { /* storage blocked: everything counts as unread */ }
    return readIds;
  }

  function saveRead() {
    try {
      window.localStorage.setItem(storageKey(), JSON.stringify(Object.keys(readIds)));
      return true;
    } catch (e) {
      return false;
    }
  }

  function isRead(id) {
    return !!loadRead()[id];
  }

  function unreadCount(list) {
    return $.grep(list || cache || [], function (n) { return !isRead(n.id); }).length;
  }

  function changed() {
    paintBell();
    $(document).trigger('notifications:change', [cache || []]);
  }

  // Optimistic: the UI updates first; if the write fails the change is reverted.
  function markRead(id) {
    loadRead();
    if (readIds[id]) return true;
    readIds[id] = true;
    changed();
    if (!saveRead()) {
      delete readIds[id];
      changed();
      App.toast.error('Could not save this change in your browser.');
      return false;
    }
    return true;
  }

  function markAllRead() {
    loadRead();
    var added = [];
    $.each(cache || [], function (i, n) {
      if (!readIds[n.id]) {
        readIds[n.id] = true;
        added.push(n.id);
      }
    });
    if (!added.length) return true;
    changed();
    if (!saveRead()) {
      $.each(added, function (i, id) { delete readIds[id]; });
      changed();
      App.toast.error('Could not save this change in your browser.');
      return false;
    }
    return true;
  }

  // Resolves with the list. Concurrent callers share one request.
  // opts.force refetches; opts.inline / opts.silent go to App.api.get.
  function load(opts) {
    opts = opts || {};
    if (!opts.force && cache) return $.Deferred().resolve(cache).promise();
    if (loading) return loading;
    var dfd = $.Deferred();
    loading = dfd.promise();
    App.api.get('/notifications', null, { inline: opts.inline !== false, silent: !!opts.silent })
      .done(function (list) {
        cache = $.isArray(list) ? list : [];
        changed();
        dfd.resolve(cache);
      })
      .fail(function (err) { dfd.reject(err); })
      .always(function () { loading = null; });
    return loading;
  }

  // Drops a deleted notification from the cache (admin delete) and refreshes the bell.
  function forget(id) {
    if (!cache) return;
    cache = $.grep(cache, function (n) { return n.id !== id; });
    changed();
  }

  function typeLabel(type) {
    var t = String(type || 'system').toLowerCase();
    return t.charAt(0).toUpperCase() + t.slice(1);
  }

  function chipClass(type) {
    var t = String(type || '').toLowerCase();
    return 'notif-chip notif-chip-' + (t === 'event' || t === 'announcement' || t === 'promo' ? t : 'system');
  }

  function preview(message) {
    var text = String(message || '');
    return text.length > PREVIEW_LENGTH ? text.slice(0, PREVIEW_LENGTH).replace(/\s+\S*$/, '') + '…' : text;
  }

  function timeAgo(value) {
    var date = new Date(value);
    if (isNaN(date.getTime())) return '';
    var seconds = Math.round((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return Math.floor(seconds / 60) + ' min ago';
    if (seconds < 86400) return Math.floor(seconds / 3600) + ' h ago';
    if (seconds < 7 * 86400) return Math.floor(seconds / 86400) + ' d ago';
    return App.events.formatDate(value);
  }

  // The related resource comes from metadata (event_id, announcement_id, promo_id).
  // Returns {label, href} or null.
  function relatedLink(n) {
    var meta = n && n.metadata;
    if (!meta || typeof meta !== 'object') return null;
    if (meta.event_id) return { label: 'View event', href: App.pageUrl('event-detail', { id: meta.event_id }) };
    if (meta.announcement_id) return { label: 'View announcement', href: App.pageUrl('announcement-detail', { id: meta.announcement_id }) };
    if (meta.promo_id) return { label: 'View promo', href: App.pageUrl('promo-detail', { id: meta.promo_id }) };
    return null;
  }

  // Shared row markup (chip, title, preview, time, unread dot). Returns a jQuery <div class="notif">.
  function buildRow(n) {
    var unread = !isRead(n.id);
    var $row = $('<div class="notif"></div>').toggleClass('is-unread', unread);
    $('<span aria-hidden="true"></span>').addClass(chipClass(n.type)).text(typeLabel(n.type).charAt(0)).appendTo($row);
    var $body = $('<div class="notif-body"></div>').appendTo($row);
    $('<p class="notif-title"></p>').text(n.title).appendTo($body);
    $('<p class="notif-text"></p>').text(preview(n.message)).appendTo($body);
    var $time = $('<span class="notif-time"></span>').appendTo($body);
    $time.text(typeLabel(n.type) + ' · ' + timeAgo(n.created_at));
    if (unread) $('<span class="sr-only"></span>').text(' (unread)').appendTo($time);
    $('<span class="notif-dot" aria-hidden="true"></span>').appendTo($row);
    return $row;
  }

  function paintBell() {
    var $count = $('#notif-count');
    var $bell = $('#notif-bell');
    if (!$count.length) return;
    var n = unreadCount();
    $count.text(n > 9 ? '9+' : String(n)).prop('hidden', n === 0);
    $bell.attr('aria-label', n ? 'Notifications, ' + n + ' unread' : 'Notifications');
  }

  // ---- Drawer ----

  function renderDrawer() {
    var $list = $('#drawer-list');
    if (!$list.length) return;
    var items = (cache || []).slice(0, DRAWER_LIMIT);
    $list.empty().removeAttr('aria-busy');
    if (!items.length) {
      $('<li class="drawer-empty"></li>').text('No notifications yet.').appendTo($list);
      return;
    }
    $.each(items, function (i, n) {
      var $li = $('<li class="drawer-item drawer-item-flush"></li>').appendTo($list);
      var $link = $('<a class="drawer-notif"></a>')
        .attr('href', App.pageUrl('notifications', { id: n.id }))
        .data('id', n.id).appendTo($li);
      buildRow(n).appendTo($link);
    });
  }

  function drawerError() {
    var $list = $('#drawer-list').empty().removeAttr('aria-busy');
    var $li = $('<li class="drawer-empty" role="alert"></li>').appendTo($list);
    $('<p></p>').text('We could not load your notifications.').appendTo($li);
    $('<button class="btn btn-secondary" type="button"></button>').text('Retry').on('click', loadDrawer).appendTo($li);
  }

  function loadDrawer() {
    var $list = $('#drawer-list');
    if (cache) renderDrawer();
    else {
      $list.empty().attr('aria-busy', 'true');
      $('<li class="drawer-empty"></li>').text('Loading…').appendTo($list);
    }
    load({ force: true, silent: true }).done(renderDrawer).fail(drawerError);
  }

  function initBellAndDrawer() {
    if (!$('#notif-bell').length || !App.auth.isLoggedIn()) return;
    paintBell();
    load({ silent: true });

    $(document).on('drawer:open', loadDrawer);
    $(document).on('notifications:change', function () {
      if (App.drawer.isOpen()) renderDrawer();
    });

    // Clicking a notification marks it read (optimistic) and then follows the link.
    $('#drawer-list').on('click', '.drawer-notif', function () {
      markRead($(this).data('id'));
    });
  }

  App.notifications = {
    load: load,
    list: function () { return cache || []; },
    isRead: isRead,
    unreadCount: unreadCount,
    markRead: markRead,
    markAllRead: markAllRead,
    forget: forget,
    typeLabel: typeLabel,
    chipClass: chipClass,
    preview: preview,
    timeAgo: timeAgo,
    relatedLink: relatedLink,
    buildRow: buildRow,
  };

  $(function () {
    if (App.guard && App.guard.redirected) return;
    initBellAndDrawer();
  });
})(jQuery);
