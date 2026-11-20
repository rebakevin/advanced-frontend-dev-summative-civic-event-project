// Mock API: /promos routes. Registered by index.js.
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
    var VIDEO_EXT = h.VIDEO_EXT;
    var VIDEO_MAX = h.VIDEO_MAX;
    var checkUpload = h.checkUpload;
    var validate = h.validate;
    var notEmpty = h.notEmpty;
    var toBool = h.toBool;

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
  }

  App.mock.internal.promoRoutes = { register: register };
})();
