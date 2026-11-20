(function () {
  window.App = window.App || {};
  var U = (App.uploadInternal = App.uploadInternal || {});

  // Progress bar: <div class="progress"><div class="progress-bar" role="progressbar">...</div><span class="progress-text">
  function progress($container) {
    var wrap = document.createElement('div');
    wrap.className = 'progress';
    var track = document.createElement('div');
    track.className = 'progress-track';
    var bar = document.createElement('div');
    bar.className = 'progress-bar';
    bar.setAttribute('role', 'progressbar');
    bar.setAttribute('aria-label', 'Upload progress');
    bar.setAttribute('aria-valuemin', '0');
    bar.setAttribute('aria-valuemax', '100');
    bar.setAttribute('aria-valuenow', '0');
    track.appendChild(bar);
    var text = document.createElement('span');
    text.className = 'progress-text';
    text.setAttribute('aria-hidden', 'true');
    text.textContent = '0%';
    wrap.appendChild(track);
    wrap.appendChild(text);
    wrap.hidden = true;
    $container.append(wrap);

    function set(percent) {
      var p = Math.max(0, Math.min(100, Math.round(Number(percent) || 0)));
      wrap.hidden = false;
      bar.setAttribute('aria-valuenow', String(p));
      $(bar).css('width', p + '%');
      text.textContent = p + '%';
    }

    return {
      el: wrap,
      set: set,
      done: function () {
        set(100);
      },
      reset: function () {
        bar.setAttribute('aria-valuenow', '0');
        $(bar).css('width', '0%');
        text.textContent = '0%';
        wrap.hidden = true;
      },
    };
  }

  // opts: {method, $progressContainer, inline, silent}
  function send(path, formData, opts) {
    opts = opts || {};
    var bar = opts.$progressContainer ? progress(opts.$progressContainer) : null;
    var callOpts = $.extend({}, opts);
    delete callOpts.$progressContainer;
    if (bar) {
      bar.set(0);
      callOpts.onProgress = bar.set;
    }
    var promise = App.api.upload(path, formData, callOpts);
    if (bar) {
      promise.done(bar.done).fail(bar.reset);
    }
    return promise;
  }

  U.progress = progress;
  U.send = send;
})();
