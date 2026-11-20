(function () {
  window.App = window.App || {};
  var internal = (App.apiInternal = App.apiInternal || {});

  var AUTH_URL = /\/auth\/(login|signup)\/?(\?.*)?$/;

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

  internal.isAuthUrl = isAuthUrl;
  internal.normalizeError = normalizeError;
})();
