// Mock API: /event-feedback routes. Registered by index.js.
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
    var userById = h.userById;
    var requireEvent = h.requireEvent;
    var requireField = h.requireField;
    var present = h.present;

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
  }

  App.mock.internal.eventFeedbackRoutes = { register: register };
})();
