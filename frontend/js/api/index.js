(function () {
  window.App = window.App || {};
  var internal = App.apiInternal;
  var request = internal.request;

  $.ajaxPrefilter(internal.prefilter);

  $(document).ajaxError(internal.onAjaxError);

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
    normalizeError: internal.normalizeError,
  };
})();
