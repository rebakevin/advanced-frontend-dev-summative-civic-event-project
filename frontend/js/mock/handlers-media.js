/* Mock API: /announcements/* and /promos/* (mirrors backend routes, controllers, models, upload middleware). */
(function () {
  window.App = window.App || {};
  App.mock = App.mock || {};

  var route = App.mock.route;
  var ok = App.mock.ok;
  var fail = App.mock.error;
  var now = App.mock.now;

  var AUDIO_EXT = ['.mp3', '.wav', '.m4a', '.ogg'];
  var VIDEO_EXT = ['.mp4', '.mov', '.avi', '.mkv'];
  var AUDIO_MAX = 5 * 1024 * 1024;
  var VIDEO_MAX = 8 * 1024 * 1024;

  function ext(file) {
    var name = String((file && file.name) || '');
    var i = name.lastIndexOf('.');
    return i < 0 ? '' : name.slice(i).toLowerCase();
  }

  // Multer runs after auth and before validation. Its errors reach the error handler without a
  // status, so the backend answers 500 with the multer message.
  function checkUpload(req, field, allowed, maxBytes, typeMessage) {
    var names = Object.keys(req.files || {});
    for (var i = 0; i < names.length; i++) {
      if (names[i] !== field) throw fail(500, 'Unexpected field');
    }
    var file = req.files[field];
    if (!file) return null;
    if (allowed.indexOf(ext(file)) < 0) throw fail(500, typeMessage);
    if (file.size > maxBytes) throw fail(500, 'File too large');
    return file;
  }

  function validate(req, rules) {
    var errors = [];
    rules.forEach(function (rule) {
      var v = req.body[rule.field];
      if (rule.check(v)) return;
      errors.push({ field: rule.field, message: rule.message });
    });
    if (errors.length) throw fail(400, 'Validation failed', errors);
  }

  function notEmpty(v) {
    return v !== undefined && v !== null && String(v) !== '';
  }

  var BOOL_TEXT = ['true', 'false', '1', '0'];

  function isBoolean(v) {
    return v === true || v === false || BOOL_TEXT.indexOf(String(v)) >= 0;
  }

  function toBool(v) {
    return v === true || v === 'true' || v === '1' || v === 1;
  }

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

  /* ---------------- Promos ---------------- */

  function promo(req) {
    return App.mock.db.require('promos', req.params.id, 'Promo');
  }

  var PROMO_RULES = [
    { field: 'title', check: notEmpty, message: 'Title is required' },
    { field: 'description', check: notEmpty, message: 'Description is required' },
    { field: 'caption_text', check: notEmpty, message: 'Caption text is required' },
  ];
  var VIDEO_TYPE_MESSAGE = 'Only video files are allowed (mp4, mov, avi, mkv)';

  // Like announcements, drafts are returned to every authenticated user.
  route('GET', '/promos', function (req) {
    App.mock.requireUser(req);
    var rows = App.mock.sortNewest(App.mock.db.get().promos.slice());
    var result = App.mock.paginate(rows, req.query);
    var body = ok(result.items, 'Promos fetched successfully');
    body.body.pagination = {
      total: result.total,
      page: result.page,
      limit: result.limit,
      pages: result.pages,
    };
    return body;
  });

  // The backend single GET has no message field.
  route('GET', '/promos/:id', function (req) {
    App.mock.requireUser(req);
    var res = ok(promo(req));
    delete res.body.message;
    return res;
  });

  route('POST', '/promos', function (req) {
    var user = App.mock.requireAdmin(req);
    var file = checkUpload(req, 'video', VIDEO_EXT, VIDEO_MAX, VIDEO_TYPE_MESSAGE);
    validate(req, PROMO_RULES);
    if (!file) throw fail(400, 'Video file is required');

    var db = App.mock.db;
    var stamp = now();
    // The create query does not set published, so the column default (true) applies.
    var row = {
      id: db.nextId('promos'),
      title: req.body.title,
      description: req.body.description,
      video_url: App.mock.fileUrl(file, 'video_url'),
      caption_text: req.body.caption_text,
      published: true,
      created_by: user.id,
      created_at: stamp,
      updated_at: stamp,
    };
    db.get().promos.push(row);
    App.mock.notify({
      title: 'New Promo Added!',
      message: 'A new promo titled "' + row.title + '" has been published.',
      type: 'promo',
      metadata: { promo_id: row.id },
      created_by: user.id,
    });
    return ok(row, 'Promo created successfully', 201);
  });

  route('PUT', '/promos/:id', function (req) {
    App.mock.requireAdmin(req);
    var file = checkUpload(req, 'video', VIDEO_EXT, VIDEO_MAX, VIDEO_TYPE_MESSAGE);
    validate(req, PROMO_RULES);
    var row = promo(req);
    row.title = req.body.title;
    row.description = req.body.description;
    row.caption_text = req.body.caption_text;
    if (req.body.published !== undefined) row.published = toBool(req.body.published);
    if (file) row.video_url = App.mock.fileUrl(file, 'video_url');
    row.updated_at = now();
    return ok(row, 'Promo updated successfully');
  });

  route('PATCH', '/promos/:id/publish', function (req) {
    var user = App.mock.requireAdmin(req);
    var row = promo(req);
    row.published = true;
    row.updated_at = now();
    App.mock.notify({
      title: 'Promo Published',
      message: 'The promo "' + row.title + '" is now live.',
      type: 'promo',
      metadata: { promo_id: row.id },
      created_by: user.id,
    });
    return ok(row, 'Promo published successfully');
  });

  route('PATCH', '/promos/:id/unpublish', function (req) {
    App.mock.requireAdmin(req);
    var row = promo(req);
    row.published = false;
    row.updated_at = now();
    return ok(row, 'Promo unpublished successfully');
  });

  route('DELETE', '/promos/:id', function (req) {
    App.mock.requireAdmin(req);
    App.mock.db.remove('promos', promo(req));
    return ok(undefined, 'Promo deleted successfully');
  });
})();
