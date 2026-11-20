(function () {
  window.App = window.App || {};
  var U = (App.uploadInternal = App.uploadInternal || {});

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

  U.rules = rules;
  U.check = check;
})();
