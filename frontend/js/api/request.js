(function () {
  window.App = window.App || {};
  var internal = (App.apiInternal = App.apiInternal || {});

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
        dfd.reject(internal.normalizeError(xhr));
      });

    var promise = dfd.promise();
    promise.abort = function () {
      jqXHR.abort();
    };
    return promise;
  }

  internal.request = request;
})();
