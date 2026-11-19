(function () {
  window.App = window.App || {};

  var AUTH_URL = /\/auth\/(login|signup)\/?(\?.*)?$/;
  var DEDUPE_MS = 1000;
  var redirecting = false;
  var lastToast = { message: '', at: 0 };

  function isAuthUrl(url) {
    return AUTH_URL.test(url || '');
  }

  function fallbackMessage(status) {
    if (status === 0) return 'Cannot reach the server. Check your connection and try again.';
    if (status >= 500) return 'Something went wrong on our side. Please try again.';
    if (status === 401) return 'Your session expired. Please sign in again.';
    if (status === 403) return "You don't have permission to do this.";
    if (status === 404) return 'We could not find what you were looking for.';
    if (status === 409) return 'This conflicts with existing data.';
    return 'Something went wrong. Please try again.';
  }

  // Backend bodies: {status, message}, {status, message, errors: [{field, message}]},
  // or plain text from a proxy. Always returns {status, message, data}.
  function normalizeError(jqXHR) {
    var status = jqXHR.status;
    var body = jqXHR.responseJSON;
    // A 2xx with an unparseable body is a server problem, not success.
    if (status >= 200 && status < 400) status = 500;
    var message = '';
    var data = null;

    if (body && typeof body === 'object') {
      data = body.errors || body.data || null;
      message = typeof body.message === 'string' ? body.message : '';
      if (Array.isArray(body.errors) && body.errors.length) {
        var details = $.map(body.errors, function (e) {
          return e && e.message ? e.message : null;
        });
        if (details.length) {
          message = message && message !== 'Validation failed' ? message + ': ' + details.join(' ') : details.join(' ');
        }
      }
    } else if (typeof jqXHR.responseText === 'string' && status !== 0) {
      var text = $.trim(jqXHR.responseText);
      // Ignore HTML error pages; keep short plain text only.
      if (text && text.charAt(0) !== '<' && text.length <= 200) message = text;
    }

    // Raw server internals are not friendly: use our own text for 5xx / network.
    if (status === 0 || status >= 500 || !message) message = fallbackMessage(status);
    return { status: status, message: message, data: data };
  }

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

  function request(method, path, data, opts) {
    opts = opts || {};
    var dfd = $.Deferred();
    var ajaxOpts = {
      url: /^https?:\/\//i.test(path) ? path : App.config.API_BASE_URL + path,
      method: method,
      dataType: 'json',
      // Custom flags travel in the settings so the global handler can read them.
      inline: !!opts.inline,
      silent: !!opts.silent,
      onRetrySuccess: opts.onRetrySuccess,
    };
    if (data !== undefined && data !== null) {
      if (method === 'GET') {
        ajaxOpts.data = data;
      } else if (data instanceof FormData) {
        ajaxOpts.data = data;
        ajaxOpts.processData = false;
        ajaxOpts.contentType = false;
      } else {
        ajaxOpts.data = JSON.stringify(data);
        ajaxOpts.contentType = 'application/json';
      }
    }
    if (opts.timeout) ajaxOpts.timeout = opts.timeout;
    if (opts.xhr) ajaxOpts.xhr = opts.xhr;

    var jqXHR = $.ajax(ajaxOpts)
      .done(function (body) {
        dfd.resolve(body && body.data, body);
      })
      .fail(function (xhr) {
        dfd.reject(normalizeError(xhr));
      });

    var promise = dfd.promise();
    promise.abort = function () {
      jqXHR.abort();
    };
    return promise;
  }

  // The `inline` and `silent` flags are only honoured through the wrapper, so
  // they are plain data here.
  $.ajaxPrefilter(function (options, original, jqXHR) {
    if (isAuthUrl(options.url)) return;
    var token = App.auth && App.auth.getToken();
    if (token) jqXHR.setRequestHeader('Authorization', 'Bearer ' + token);
  });

  $(document).ajaxError(function (event, jqXHR, settings) {
    // One failed request gets one reaction.
    if (jqXHR.errorHandled) return;
    jqXHR.errorHandled = true;

    if (settings.silent || jqXHR.statusText === 'abort') return;
    // Only react to our own API; other ajax users are not ours to toast.
    if (String(settings.url).indexOf(App.config.API_BASE_URL) !== 0) return;

    var err = normalizeError(jqXHR);
    var status = err.status;

    if (status === 401) {
      if (isAuthUrl(settings.url) || redirecting) return;
      redirecting = true;
      App.auth.logout();
      App.flash.set('Your session expired. Please sign in again.', 'error');
      window.location.href = App.pageUrl('login');
      return;
    }

    if (status === 403) {
      show({
        type: 'error',
        message: "You don't have permission to do this",
        actionLabel: 'Contact an admin',
        onAction: function () {
          window.location.href = App.pageUrl('forbidden');
        },
      });
      return;
    }

    if (status === 400 || status === 404 || status === 409) {
      if (!settings.inline) show({ type: 'error', message: err.message });
      return;
    }

    if (status === 0 || status >= 500) {
      show({
        type: 'error',
        message: err.message,
        actionLabel: 'Retry',
        onAction: buildRetry(settings),
      });
      return;
    }

    show({ type: 'error', message: err.message });
  });

  App.api = {
    get: function (path, params, opts) {
      return request('GET', path, params, opts);
    },
    post: function (path, body, opts) {
      return request('POST', path, body, opts);
    },
    put: function (path, body, opts) {
      return request('PUT', path, body, opts);
    },
    patch: function (path, body, opts) {
      return request('PATCH', path, body, opts);
    },
    del: function (path, opts) {
      return request('DELETE', path, null, opts);
    },
    // opts: {method: 'POST'|'PUT', onProgress(percent), inline, silent}
    upload: function (path, formData, opts) {
      opts = opts || {};
      var callOpts = $.extend({}, opts);
      if (typeof opts.onProgress === 'function') {
        callOpts.xhr = function () {
          var xhr = $.ajaxSettings.xhr();
          if (xhr.upload) {
            xhr.upload.addEventListener('progress', function (e) {
              if (e.lengthComputable) opts.onProgress(Math.round((e.loaded / e.total) * 100));
            });
          }
          return xhr;
        };
      }
      return request(opts.method || 'POST', path, formData, callOpts);
    },
    normalizeError: normalizeError,
  };
})();
