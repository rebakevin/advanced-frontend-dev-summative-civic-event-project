(function ($) {
  window.App = window.App || {};

  var UPCOMING_LIMIT = 5;
  var NOTIF_LIMIT = 3;

  function initMyDashboard() {
    var $upcoming = $('#dashboard-upcoming');
    if (!$upcoming.length) return;
    var $notifs = $('#dashboard-notifs');

    var user = App.auth.getUser();
    if (user && user.full_name) $('#dashboard-greeting').text('Welcome back, ' + user.full_name);
    $('#view-all-registrations').attr('href', App.pageUrl('my-registrations'));
    $('#view-all-notifications').attr('href', App.pageUrl('notifications'));

    function startTime(reg) {
      var t = new Date(reg.starts_at).getTime();
      return isNaN(t) ? null : t;
    }

    function buildUpcomingItem(reg) {
      var title = reg.title || 'Event #' + reg.event_id;
      var $link = $('<a class="card card-pad card-link"></a>')
        .attr('href', App.pageUrl('event-detail', { id: reg.event_id }));
      $('<h3 class="card-title"></h3>').text(title).appendTo($link);
      $('<p class="card-meta"></p>').text(App.events.formatDateTime(reg.starts_at)).appendTo($link);
      if (reg.location) $('<p class="card-meta"></p>').text(reg.location).appendTo($link);
      return $link;
    }

    function loadRegistrations() {
      $('#stat-registered').text('-');
      App.skeleton.show($upcoming, { count: 3 });
      App.events.loadActiveRegistrations({ inline: true })
        .done(function (active) {
          $('#stat-registered').text(String(active.length));

          var now = Date.now();
          var upcoming = $.grep(active, function (r) {
            var t = startTime(r);
            return t !== null && t >= now;
          }).sort(function (a, b) { return startTime(a) - startTime(b); }).slice(0, UPCOMING_LIMIT);

          if (!upcoming.length) {
            App.skeleton.empty($upcoming, {
              title: 'No upcoming registrations',
              text: 'Register for an event and it will show up here.',
              actionLabel: 'Browse events',
              href: App.pageUrl('events'),
            });
            return;
          }
          $upcoming.removeAttr('aria-busy').empty();
          $.each(upcoming, function (i, reg) { $upcoming.append(buildUpcomingItem(reg)); });
        })
        .fail(function (err) {
          App.skeleton.error($upcoming, { message: err && err.message, onRetry: loadRegistrations });
        });
    }

    function loadFeedback() {
      $('#stat-feedback').text('-');
      App.api.get('/dashboard/me', null, { inline: true, silent: true })
        .done(function (data) {
          var total = parseInt(data && data.feedbacks && data.feedbacks.total_feedbacks, 10);
          $('#stat-feedback').text(isNaN(total) ? '0' : String(total));
        });
    }

    // Unread comes from the client-side read state, not from the server count.
    var painted = false;

    function paintNotifications(list) {
      $('#stat-unread').text(String(App.notifications.unreadCount(list)));
      var items = (list || []).slice(0, NOTIF_LIMIT);
      painted = true;
      if (!items.length) {
        App.skeleton.empty($notifs, {
          title: 'No notifications yet',
          text: 'New updates will show up here.',
        });
        return;
      }
      $notifs.removeAttr('aria-busy').empty();
      $.each(items, function (i, n) {
        $notifs.append(App.notifications.buildLink(n));
      });
    }

    function loadNotifications() {
      $('#stat-unread').text('-');
      painted = false;
      App.skeleton.show($notifs, { count: 3 });
      App.notifications.load({ force: true })
        .done(paintNotifications)
        .fail(function (err) {
          painted = false;
          App.skeleton.error($notifs, { message: err && err.message, onRetry: loadNotifications });
        });
    }

    $(document).on('notifications:change', function (e, list) {
      if (painted) paintNotifications(list);
    });

    loadRegistrations();
    loadFeedback();
    loadNotifications();
  }

  $(function () {
    initMyDashboard();
  });
})(jQuery);
