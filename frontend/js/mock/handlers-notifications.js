(function () {
  window.App = window.App || {};
  App.mock = App.mock || {};

  function time(v) {
    var t = new Date(v).getTime();
    return isNaN(t) ? null : t;
  }

  function visibleTo(row, userId) {
    return row.recipient_id === null || row.recipient_id === undefined || row.recipient_id === userId;
  }

  // GET /notifications: broadcast rows plus the caller's own, newest first, no pagination.
  App.mock.route('GET', '/notifications', function (req) {
    var user = App.mock.requireUser(req);
    var rows = App.mock.db.get().notifications.filter(function (n) {
      return visibleTo(n, user.id);
    });
    rows = App.mock.sortNewest(rows);
    return App.mock.ok(rows, 'Notifications fetched successfully');
  });

  // The backend does not check ownership here.
  App.mock.route('GET', '/notifications/:id', function (req) {
    App.mock.requireUser(req);
    var row = App.mock.db.require('notifications', req.params.id, 'Notification');
    return App.mock.ok(row, 'Notification fetched successfully');
  });

  App.mock.route('DELETE', '/notifications/:id', function (req) {
    App.mock.requireAdmin(req);
    var row = App.mock.db.require('notifications', req.params.id, 'Notification');
    App.mock.db.remove('notifications', row);
    return App.mock.ok(undefined, 'Notification deleted successfully');
  });

  App.mock.route('GET', '/dashboard/admin', function (req) {
    App.mock.requireAdmin(req);
    var s = App.mock.db.get();
    var now = Date.now();

    var active = s.users.filter(function (u) { return u.is_active === true; }).length;
    var inactive = s.users.filter(function (u) { return u.is_active === false; }).length;
    var upcoming = 0;
    var past = 0;
    s.events.forEach(function (e) {
      var st = time(e.starts_at);
      var en = time(e.ends_at);
      if (st !== null && st > now) upcoming++;
      if (en !== null && en < now) past++;
    });

    var cutoff = new Date(now);
    cutoff.setMonth(cutoff.getMonth() - 6);
    var buckets = {};
    s.users.forEach(function (u) {
      var t = time(u.created_at);
      if (t === null || t <= cutoff.getTime()) return;
      var month = new Date(t).toISOString().slice(0, 7);
      buckets[month] = (buckets[month] || 0) + 1;
    });
    var growth = Object.keys(buckets).sort().map(function (m) {
      return { month: m, new_users: String(buckets[m]) };
    });

    return App.mock.ok({
      users: { total_users: String(s.users.length), active_users: String(active), inactive_users: String(inactive) },
      events: { total_events: String(s.events.length), upcoming_events: String(upcoming), past_events: String(past) },
      registrations: { total_registrations: String(s.event_registrations.length) },
      feedbacks: { total_feedback: String(s.event_feedback.length) },
      promos: { total_promos: String(s.promos.length) },
      announcements: { total_announcements: String(s.announcements.length) },
      notifications: { total_notifications: String(s.notifications.length) },
      user_growth: growth,
    }, 'Admin dashboard data fetched successfully');
  });

  App.mock.route('GET', '/dashboard/me', function (req) {
    var user = App.mock.requireUser(req);
    var s = App.mock.db.get();
    var regs = s.event_registrations.filter(function (r) { return r.user_id === user.id; }).length;
    var fbs = s.event_feedback.filter(function (f) { return f.user_id === user.id; }).length;
    var notifTotal = 0;
    var unread = 0;
    s.notifications.forEach(function (n) {
      if (!visibleTo(n, user.id)) return;
      notifTotal++;
      if (!n.read) unread++;
    });
    return App.mock.ok({
      registrations: { total_registered_events: String(regs) },
      feedbacks: { total_feedbacks: String(fbs) },
      notifications: { total_notifications: String(notifTotal), unread_notifications: String(unread) },
      announcements: { total_announcements: String(s.announcements.length) },
      promos: { total_promos: String(s.promos.length) },
    }, 'User dashboard data fetched successfully');
  });
})();
