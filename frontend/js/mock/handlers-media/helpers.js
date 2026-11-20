// Shared helpers for the /announcements and /promos mock handlers (upload checks, validation, booleans).
(function () {
  window.App = window.App || {};
  App.mock = App.mock || {};
  App.mock.internal = App.mock.internal || {};

  var fail = App.mock.error;

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

  App.mock.internal.mediaHelpers = {
    AUDIO_EXT: AUDIO_EXT,
    VIDEO_EXT: VIDEO_EXT,
    AUDIO_MAX: AUDIO_MAX,
    VIDEO_MAX: VIDEO_MAX,
    checkUpload: checkUpload,
    validate: validate,
    notEmpty: notEmpty,
    isBoolean: isBoolean,
    toBool: toBool,
  };
})();
