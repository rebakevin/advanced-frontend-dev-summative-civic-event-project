(function () {
  window.App = window.App || {};
  var internal = (App.apiInternal = App.apiInternal || {});

  var DEDUPE_MS = 1000;
  var lastToast = { message: '', at: 0 };

  function show(opts) {
    var now = Date.now();
    if (opts.message === lastToast.message && now - lastToast.at < DEDUPE_MS) return;
    lastToast = { message: opts.message, at: now };
    if (App.toast && typeof App.toast.show === 'function') {
      App.toast.show(opts);
    } else {
      console.error(opts.message);
    }
  }

  function buildRetry(settings) {
    return function () {
      // Fresh copy: the prefilter re-adds the current token, flags avoid re-wrapping.
      var again = $.extend({}, settings, { isRetry: true });
      again.headers = $.extend({}, settings.headers);
      delete again.headers.Authorization;
      var req = $.ajax(again);
      if (typeof settings.onRetrySuccess === 'function') {
        req.done(function (body) {
          settings.onRetrySuccess(body && body.data, body);
        });
      }
    };
  }

  internal.show = show;
  internal.buildRetry = buildRetry;
})();
