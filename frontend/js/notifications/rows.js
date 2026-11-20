(function ($) {
  window.App = window.App || {};
  var N = (App.notificationsInternal = App.notificationsInternal || {});

  // Shared row markup (chip, title, preview, time, unread dot). Returns a jQuery <div class="notif">.
  function buildRow(n) {
    var unread = !N.isRead(n.id);
    var $row = $('<div class="notif"></div>').toggleClass('is-unread', unread);
    $('<span aria-hidden="true"></span>').addClass(N.chipClass(n.type)).text(N.typeLabel(n.type).charAt(0)).appendTo($row);
    var $body = $('<div class="notif-body"></div>').appendTo($row);
    $('<p class="notif-title"></p>').text(n.title).appendTo($body);
    $('<p class="notif-text"></p>').text(N.preview(n.message)).appendTo($body);
    var $time = $('<span class="notif-time"></span>').appendTo($body);
    $time.text(N.typeLabel(n.type) + ' · ' + N.timeAgo(n.created_at));
    if (unread) $('<span class="sr-only"></span>').text(' (unread)').appendTo($time);
    $('<span class="notif-dot" aria-hidden="true"></span>').appendTo($row);
    return $row;
  }

  // Link to the notification detail wrapping a row. Clicking it marks it read (see index).
  function buildLink(n) {
    var $link = $('<a class="notif-link"></a>').attr('href', App.pageUrl('notifications', { id: n.id })).data('id', n.id);
    buildRow(n).appendTo($link);
    return $link;
  }

  function paintBell() {
    var $count = $('#notif-count');
    var $bell = $('#notif-bell');
    if (!$count.length) return;
    var n = N.unreadCount();
    $count.text(n > 9 ? '9+' : String(n)).prop('hidden', n === 0);
    $bell.attr('aria-label', n ? 'Notifications, ' + n + ' unread' : 'Notifications');
  }

  N.buildRow = buildRow;
  N.buildLink = buildLink;
  N.paintBell = paintBell;
})(jQuery);
