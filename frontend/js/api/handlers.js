(function () {
  window.App = window.App || {};
  var internal = (App.apiInternal = App.apiInternal || {});

  var redirecting = false;

  // The `inline` and `silent` flags are only honoured through the wrapper, so
  // they are plain data here.
  function prefilter(options, original, jqXHR) {
    if (internal.isAuthUrl(options.url)) return;
    var token = App.auth && App.auth.getToken();
    if (token) jqXHR.setRequestHeader('Authorization', 'Bearer ' + token);
  }

  function onAjaxError(event, jqXHR, settings) {
    // One failed request gets one reaction.
    if (jqXHR.errorHandled) return;
    jqXHR.errorHandled = true;

    if (settings.silent || jqXHR.statusText === 'abort') return;
    // Only react to our own API; other ajax users are not ours to toast.
    if (String(settings.url).indexOf(App.config.API_BASE_URL) !== 0) return;

    var err = internal.normalizeError(jqXHR);
    var status = err.status;

    if (status === 401) {
      if (internal.isAuthUrl(settings.url) || redirecting) return;
      redirecting = true;
      App.auth.logout();
      App.flash.set('Your session expired. Please sign in again.', 'error');
      window.location.href = App.pageUrl('login');
      return;
    }

    if (status === 403) {
      internal.show({
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
      if (!settings.inline) internal.show({ type: 'error', message: err.message });
      return;
    }

    if (status === 0 || status >= 500) {
      internal.show({
        type: 'error',
        message: err.message,
        actionLabel: 'Retry',
        onAction: internal.buildRetry(settings),
      });
      return;
    }

    internal.show({ type: 'error', message: err.message });
  }

  internal.prefilter = prefilter;
  internal.onAjaxError = onAjaxError;
})();
