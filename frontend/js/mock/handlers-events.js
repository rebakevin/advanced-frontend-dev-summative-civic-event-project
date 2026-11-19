(function () {
  window.App = window.App || {};
  App.mock = App.mock || {};

  var route = App.mock.route;
  var ok = App.mock.ok;
  var fail = App.mock.error;
  var db = App.mock.db;

  function same(a, b) {
    return String(a) === String(b);
  }

  function userById(id) {
    return db.find('users', id) || {};
  }

  function copy(row) {
    return $.extend(true, {}, row);
  }

  function sortBy(rows, key, dir) {
    return rows.slice().sort(function (a, b) {
      var x = new Date(a[key]).getTime();
      var y = new Date(b[key]).getTime();
      return dir * (x - y);
    });
  }

  function requireEvent(id) {
    return db.require('events', id, 'Event');
  }

  // Postgres would answer a missing uuid with a database error (500).
  function requireField(value) {
    if (value === undefined || value === null || value === '') {
      throw fail(500, 'Internal Server Error');
    }
  }

  function present(value) {
    return value !== undefined && value !== null && value !== '';
  }

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

  // ---------- /event-feedback ----------

  function checkRating(rating) {
    // CHECK (rating >= 1 AND rating <= 5) fails as a database error. NULL passes.
    if (present(rating)) {
      var n = Number(rating);
      if (isNaN(n) || n < 1 || n > 5) {
        throw fail(500, 'new row for relation "event_feedback" violates check constraint "event_feedback_rating_check"');
      }
    }
  }

  function ratingValue(rating) {
    return present(rating) ? Math.trunc(Number(rating)) : null;
  }

  function feedbackWithEvent(userId) {
    var rows = [];
    db.get().event_feedback.forEach(function (f) {
      if (!same(f.user_id, userId)) return;
      var e = db.find('events', f.event_id);
      if (!e) return;
      var row = copy(f);
      row.title = e.title;
      row.starts_at = e.starts_at;
      rows.push(row);
    });
    return sortBy(rows, 'created_at', -1);
  }

  route('POST', '/event-feedback', function (req) {
    var user = App.mock.requireUser(req);
    var b = req.body || {};
    requireField(b.event_id);
    var event = requireEvent(b.event_id);
    // No validation in the backend: only the DB constraints apply.
    checkRating(b.rating);
    var rows = db.get().event_feedback;
    var dup = rows.some(function (f) { return same(f.user_id, user.id) && same(f.event_id, event.id); });
    if (dup) throw fail(409, 'Duplicate entry');
    var stamp = App.mock.now();
    var fb = {
      id: db.nextId('event_feedback'),
      user_id: user.id,
      event_id: event.id,
      rating: ratingValue(b.rating),
      comment: b.comment === undefined ? null : b.comment,
      created_at: stamp,
      updated_at: stamp,
    };
    rows.push(fb);
    return ok(copy(fb), 'Feedback submitted', 201);
  });

  route('GET', '/event-feedback/my-feedback', function (req) {
    var user = App.mock.requireUser(req);
    // No message field in the backend response.
    return { status: 200, body: { status: 200, data: feedbackWithEvent(user.id) } };
  });

  route('GET', '/event-feedback/event/:event_id', function (req) {
    App.mock.requireAdmin(req);
    var event = requireEvent(req.params.event_id);
    var rows = [];
    db.get().event_feedback.forEach(function (f) {
      if (!same(f.event_id, event.id)) return;
      var u = userById(f.user_id);
      var row = copy(f);
      row.full_name = u.full_name;
      row.email = u.email;
      rows.push(row);
    });
    return { status: 200, body: { status: 200, data: sortBy(rows, 'created_at', -1) } };
  });

  route('PUT', '/event-feedback/:id', function (req) {
    var user = App.mock.requireUser(req);
    var b = req.body || {};
    var mine = null;
    db.get().event_feedback.forEach(function (f) {
      if (same(f.user_id, user.id) && same(f.id, req.params.id)) mine = f;
    });
    if (!mine) throw fail(403, 'Cannot update this feedback');
    checkRating(b.rating);
    // The UPDATE always overwrites both columns, so a missing field becomes NULL.
    mine.rating = ratingValue(b.rating);
    mine.comment = b.comment === undefined ? null : b.comment;
    mine.updated_at = App.mock.now();
    return ok(copy(mine), 'Feedback updated');
  });
})();
