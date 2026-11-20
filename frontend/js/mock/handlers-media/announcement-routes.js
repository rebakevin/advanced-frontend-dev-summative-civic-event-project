// Mock API: /announcements routes. Registered by index.js.
(function () {
  window.App = window.App || {};
  App.mock = App.mock || {};
  App.mock.internal = App.mock.internal || {};

  var route = App.mock.route;
  var ok = App.mock.ok;
  var fail = App.mock.error;
  var now = App.mock.now;

  function register() {
    var h = App.mock.internal.mediaHelpers;
    var AUDIO_EXT = h.AUDIO_EXT;
    var AUDIO_MAX = h.AUDIO_MAX;
    var checkUpload = h.checkUpload;
    var validate = h.validate;
    var notEmpty = h.notEmpty;
    var isBoolean = h.isBoolean;
    var toBool = h.toBool;

    /* ---------------- Announcements ---------------- */

    function announcement(req) {
      return App.mock.db.require('announcements', req.params.id, 'Announcement');
    }

    // Every authenticated user gets drafts too: the backend does not filter on published.
    // The response has no pagination block; the frontend hides drafts from normal users.
    route('GET', '/announcements', function (req) {
      App.mock.requireUser(req);
      var rows = App.mock.sortNewest(App.mock.db.get().announcements.slice());
      return ok(App.mock.paginate(rows, req.query).items, 'Announcements retrieved successfully');
    });

    route('GET', '/announcements/:id', function (req) {
      App.mock.requireUser(req);
      return ok(announcement(req), 'Announcement retrieved successfully');
    });

    route('POST', '/announcements', function (req) {
      var user = App.mock.requireAdmin(req);
      var file = checkUpload(req, 'audio', AUDIO_EXT, AUDIO_MAX, 'Only audio files are allowed (mp3, wav, m4a, ogg)');
      validate(req, [
        { field: 'title', check: notEmpty, message: 'Title is required' },
        {
          field: 'published',
          check: function (v) { return v === undefined || isBoolean(v); },
          message: 'Published must be a boolean',
        },
      ]);
      if (!file) throw fail(400, 'Audio file is required');

      var db = App.mock.db;
      var stamp = now();
      var row = {
        id: db.nextId('announcements'),
        title: req.body.title,
        audio_url: App.mock.fileUrl(file, 'audio_url'),
        published: req.body.published === undefined ? true : toBool(req.body.published),
        created_at: stamp,
        updated_at: stamp,
      };
      db.get().announcements.push(row);
      App.mock.notify({
        title: 'New Announcement Published',
        message: 'A new announcement titled "' + row.title + '" has been added.',
        type: 'announcement',
        metadata: { announcement_id: row.id },
        created_by: user.id,
      });
      return ok(row, 'Announcement created successfully', 201);
    });

    route('PUT', '/announcements/:id', function (req) {
      App.mock.requireAdmin(req);
      // The audio field is accepted by multer but the backend update ignores the file.
      checkUpload(req, 'audio', AUDIO_EXT, AUDIO_MAX, 'Only audio files are allowed (mp3, wav, m4a, ogg)');
      validate(req, [{ field: 'title', check: notEmpty, message: 'Title is required' }]);
      var row = announcement(req);
      row.title = req.body.title;
      if (req.body.published !== undefined) row.published = toBool(req.body.published);
      row.updated_at = now();
      return ok(row, 'Announcement updated successfully');
    });

    route('PATCH', '/announcements/:id/publish', function (req) {
      var user = App.mock.requireAdmin(req);
      var row = announcement(req);
      row.published = true;
      row.updated_at = now();
      App.mock.notify({
        title: 'Announcement Published',
        message: 'The announcement "' + row.title + '" is now live.',
        type: 'announcement',
        metadata: { announcement_id: row.id },
        created_by: user.id,
      });
      return ok(row, 'Announcement published successfully');
    });

    route('PATCH', '/announcements/:id/unpublish', function (req) {
      App.mock.requireAdmin(req);
      var row = announcement(req);
      row.published = false;
      row.updated_at = now();
      return ok(row, 'Announcement unpublished successfully');
    });

    route('DELETE', '/announcements/:id', function (req) {
      App.mock.requireAdmin(req);
      App.mock.db.remove('announcements', announcement(req));
      return ok(undefined, 'Announcement deleted successfully');
    });
  }

  App.mock.internal.announcementRoutes = { register: register };
})();
