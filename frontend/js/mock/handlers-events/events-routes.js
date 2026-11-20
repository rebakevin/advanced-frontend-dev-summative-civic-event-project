// Mock API: /events routes. Registered by index.js.
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
    var sortBy = h.sortBy;
    var requireEvent = h.requireEvent;
    var present = h.present;

    // ---------- /events ----------

    route('GET', '/events', function (req) {
      App.mock.requireUser(req);
      var rows = sortBy(db.get().events, 'starts_at', 1).map(copy);
      return ok(rows, 'Events fetched successfully');
    });

    route('GET', '/events/:id', function (req) {
      App.mock.requireUser(req);
      return ok(copy(requireEvent(req.params.id)), 'Event fetched successfully');
    });

    route('POST', '/events', function (req) {
      var user = App.mock.requireAdmin(req);
      var b = req.body || {};
      var errors = [];
      if (!present(b.title)) errors.push({ field: 'title', message: 'Title is required' });
      if (!present(b.location)) errors.push({ field: 'location', message: 'Location is required' });
      if (!present(b.starts_at)) errors.push({ field: 'starts_at', message: 'Start date/time is required' });
      if (!present(b.ends_at)) errors.push({ field: 'ends_at', message: 'End date/time is required' });
      if (errors.length) throw fail(400, 'Validation failed', errors);

      var stamp = App.mock.now();
      var event = {
        id: db.nextId('events'),
        title: b.title,
        description: b.description === undefined ? null : b.description,
        location: b.location,
        starts_at: b.starts_at,
        ends_at: b.ends_at,
        published: true,
        metadata: {},
        created_at: stamp,
        updated_at: stamp,
      };
      if (req.files && req.files.image) {
        event.metadata.image_url = App.mock.fileUrl(req.files.image, 'image_url');
      }
      db.get().events.push(event);

      App.mock.notify({
        title: 'New Event Published',
        message: 'A new event titled "' + event.title + '" has been added!',
        type: 'event',
        recipient_id: null,
        metadata: { event_id: event.id },
        created_by: user.id,
      });

      return ok(copy(event), 'Event created successfully and notification sent', 201);
    });

    route('PUT', '/events/:id', function (req) {
      App.mock.requireAdmin(req);
      var event = requireEvent(req.params.id);
      var b = req.body || {};
      // Backend uses `??`: only missing values keep the old one.
      ['title', 'description', 'location', 'starts_at', 'ends_at'].forEach(function (key) {
        if (b[key] !== undefined && b[key] !== null) event[key] = b[key];
      });
      if (req.files && req.files.image) {
        event.metadata = event.metadata || {};
        event.metadata.image_url = App.mock.fileUrl(req.files.image, 'image_url');
      }
      event.updated_at = App.mock.now();
      return ok(copy(event), 'Event updated successfully');
    });

    route('DELETE', '/events/:id', function (req) {
      App.mock.requireAdmin(req);
      var event = requireEvent(req.params.id);
      var state = db.get();
      // event_registrations.event_id has no ON DELETE CASCADE, so Postgres refuses.
      var blocked = state.event_registrations.some(function (r) { return same(r.event_id, event.id); });
      if (blocked) {
        throw fail(500, 'update or delete on table "events" violates foreign key constraint "event_registrations_event_id_fkey" on table "event_registrations"');
      }
      db.remove('events', event);
      // event_feedback cascades.
      state.event_feedback = state.event_feedback.filter(function (f) { return !same(f.event_id, event.id); });
      return ok({ id: req.params.id, title: event.title }, 'Event deleted successfully');
    });
  }

  App.mock.internal.eventsRoutes = { register: register };
})();
