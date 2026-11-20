(function ($) {
  window.App = window.App || {};
  var N = App.notificationsInternal;

  App.notifications = {
    load: N.load,
    unreadCount: N.unreadCount,
    markRead: N.markRead,
    markAllRead: N.markAllRead,
    forget: N.forget,
    typeLabel: N.typeLabel,
    chipClass: N.chipClass,
    preview: N.preview,
    relatedLink: N.relatedLink,
    buildRow: N.buildRow,
    buildLink: N.buildLink,
  };

  // Clicking any notification link marks it read (optimistic) and then follows the link.
  $(document).on('click', '.notif-link', function () {
    N.markRead($(this).data('id'));
  });

  $(function () {
    if (App.guard && App.guard.redirected) return;
    N.initBellAndDrawer();
  });
})(jQuery);
