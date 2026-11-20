// Mock API: /event-registrations routes. Registered by index.js.
(function () {
  window.App = window.App || {};
  App.mock = App.mock || {};
  App.mock.internal = App.mock.internal || {};

  var route = App.mock.route;
  var ok = App.mock.ok;
  var fail = App.mock.error;
  var db = App.mock.db;

  function register() {
    var h = App.mock.internal.eventsHelpers;
    var same = h.same;
    var copy = h.copy;
    var userById = h.userById;
    var requireEvent = h.requireEvent;
    var requireField = h.requireField;

    // ---------- /event-registrations ----------

    route('POST', '/event-registrations/register', function (req) {
      var user = App.mock.requireUser(req);
      var eventId = (req.body || {}).event_id;
      requireField(eventId);
      var event = requireEvent(eventId);
      var rows = db.get().event_registrations;
      // UNIQUE(user_id, event_id): a cancelled row still blocks a new registration.
      var exists = rows.some(function (r) { return same(r.user_id, user.id) && same(r.event_id, event.id); });
      if (exists) throw fail(409, 'Already registered');
      var stamp = App.mock.now();
      var reg = {
        id: db.nextId('event_registrations'),
        user_id: user.id,
        event_id: event.id,
        status: 'registered',
        created_at: stamp,
        updated_at: stamp,
      };
      rows.push(reg);
      return ok(copy(reg), 'Registered successfully', 201);
    });

    route('POST', '/event-registrations/cancel', function (req) {
      var user = App.mock.requireUser(req);
      var eventId = (req.body || {}).event_id;
      requireField(eventId);
      var event = requireEvent(eventId);
      var reg = null;
      db.get().event_registrations.forEach(function (r) {
        if (same(r.user_id, user.id) && same(r.event_id, event.id)) reg = r;
      });
      if (!reg) throw fail(404, 'Registration not found');
      // Cancelling twice is allowed by the backend and just answers 200 again.
      reg.status = 'cancelled';
      reg.updated_at = App.mock.now();
      return ok(copy(reg), 'Registration cancelled');
    });

    route('GET', '/event-registrations/my-registrations', function (req) {
      var user = App.mock.requireUser(req);
      var rows = [];
      db.get().event_registrations.forEach(function (r) {
        if (!same(r.user_id, user.id)) return;
        var e = db.find('events', r.event_id);
        if (!e) return;
        var row = copy(r);
        row.title = e.title;
        row.starts_at = e.starts_at;
        row.ends_at = e.ends_at;
        row.location = e.location;
        rows.push(row);
      });
      return ok(rows, 'Event registrations retrieved successfully');
    });

    route('GET', '/event-registrations/event/:event_id/attendees', function (req) {
      App.mock.requireAdmin(req);
      var event = requireEvent(req.params.event_id);
      var rows = [];
      db.get().event_registrations.forEach(function (r) {
        if (!same(r.event_id, event.id) || r.status !== 'registered') return;
        var u = userById(r.user_id);
        var row = copy(r);
        row.full_name = u.full_name;
        row.email = u.email;
        rows.push(row);
      });
      return ok(rows, 'Event attendees retrieved successfully');
    });
  }

  App.mock.internal.eventRegistrationRoutes = { register: register };
})();
