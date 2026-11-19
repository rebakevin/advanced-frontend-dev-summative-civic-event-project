(function () {
  window.App = window.App || {};

  function extOf(name) {
    var m = /\.([^.]+)$/.exec(String(name || ''));
    return m ? m[1].toLowerCase() : '';
  }

  function typeMessage(exts) {
    var names = $.map(exts, function (e) {
      return e === 'jpeg' ? null : e.toUpperCase();
    });
    var last = names.pop();
    return 'Choose a ' + (names.length ? names.join(', ') + ' or ' + last : last) + ' file.';
  }

  var rules = {
    image: {
      extensions: ['jpg', 'jpeg', 'png', 'gif'],
      maxMB: 2,
      typeMessage: 'Choose a JPG, PNG or GIF image.',
    },
    audio: {
      extensions: ['mp3', 'wav', 'm4a', 'ogg'],
      maxMB: 5,
      typeMessage: 'Choose an MP3, WAV, M4A or OGG audio file.',
    },
    video: {
      extensions: ['mp4', 'mov', 'avi', 'mkv'],
      maxMB: 8,
      typeMessage: 'Choose an MP4, MOV, AVI or MKV video file.',
    },
  };

  // -> {ok, message}
  function check(file, rule) {
    rule = rule || {};
    var exts = rule.extensions || [];
    if (!file) return { ok: false, message: 'Choose a file to upload.' };
    if (exts.length && $.inArray(extOf(file.name), exts) === -1) {
      return { ok: false, message: rule.typeMessage || typeMessage(exts) };
    }
    if (rule.maxMB && file.size > rule.maxMB * 1024 * 1024) {
      return { ok: false, message: 'File is too large. Maximum size is ' + rule.maxMB + ' MB.' };
    }
    return { ok: true, message: '' };
  }

  function bindInput($input, rule, opts) {
    opts = opts || {};
    var previewUrl = null;
    var $preview = opts.$preview;

    function clearPreview() {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        previewUrl = null;
      }
      if ($preview && $preview.length) {
        $preview.find('img').remove();
        $preview.prop('hidden', true);
      }
    }

    function showPreview(file) {
      clearPreview();
      if (!$preview || !$preview.length || !/^image\//.test(file.type || '')) return;
      previewUrl = URL.createObjectURL(file);
      var img = document.createElement('img');
      img.setAttribute('src', previewUrl);
      img.setAttribute('alt', 'Preview of the selected image');
      $preview.empty().append(img).prop('hidden', false);
    }

    $input.on('change', function () {
      var file = this.files && this.files[0];
      if (!file) {
        clearPreview();
        App.validate.clearError($input);
        return;
      }
      var res = check(file, rule);
      if (!res.ok) {
        $input.val('');
        clearPreview();
        App.validate.showError($input, res.message);
        if (typeof opts.onInvalid === 'function') opts.onInvalid(res.message);
        return;
      }
      App.validate.clearError($input);
      showPreview(file);
      if (typeof opts.onValid === 'function') opts.onValid(file);
    });

    return { clearPreview: clearPreview };
  }

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
      bar.style.width = p + '%';
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
        bar.style.width = '0%';
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

  App.upload = {
    rules: rules,
    check: check,
    bindInput: bindInput,
    progress: progress,
    send: send,
  };
})();
