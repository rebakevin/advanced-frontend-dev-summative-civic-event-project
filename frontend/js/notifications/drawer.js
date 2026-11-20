(function ($) {
  window.App = window.App || {};
  var N = (App.notificationsInternal = App.notificationsInternal || {});

  var DRAWER_LIMIT = 8;

  function renderDrawer() {
    var $list = $('#drawer-list');
    if (!$list.length) return;
    var items = (N.state.cache || []).slice(0, DRAWER_LIMIT);
    $list.empty().removeAttr('aria-busy');
    if (!items.length) {
      $('<li class="drawer-empty"></li>').text('No notifications yet.').appendTo($list);
      return;
    }
    $.each(items, function (i, n) {
      var $li = $('<li class="drawer-item drawer-item-flush"></li>').appendTo($list);
      N.buildLink(n).appendTo($li);
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
    if (N.state.cache) renderDrawer();
    else {
      $list.empty().attr('aria-busy', 'true');
      $('<li class="drawer-empty"></li>').text('Loading…').appendTo($list);
    }
    N.load({ force: true, silent: true }).done(renderDrawer).fail(drawerError);
  }

  function initBellAndDrawer() {
    if (!$('#notif-bell').length || !App.auth.isLoggedIn()) return;
    N.paintBell();
    N.load({ silent: true });

    $(document).on('drawer:open', loadDrawer);
    $(document).on('notifications:change', function () {
      if (App.drawer.isOpen()) renderDrawer();
    });

  }

  N.initBellAndDrawer = initBellAndDrawer;
})(jQuery);
