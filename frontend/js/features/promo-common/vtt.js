(function () {
  window.App = window.App || {};
  var ns = (App.promoCommon = App.promoCommon || {});

  function pad(n, len) {
    var s = String(n);
    while (s.length < len) s = '0' + s;
    return s;
  }

  function timestamp(seconds) {
    var ms = Math.round(seconds * 1000);
    var h = Math.floor(ms / 3600000);
    var m = Math.floor((ms % 3600000) / 60000);
    var s = Math.floor((ms % 60000) / 1000);
    return pad(h, 2) + ':' + pad(m, 2) + ':' + pad(s, 2) + '.' + pad(ms % 1000, 3);
  }

  function escapeCue(text) {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // Splits caption text into sentences (and lines) that become one cue each.
  function splitCues(text) {
    var cues = [];
    $.each(String(text || '').split(/\r?\n/), function (i, line) {
      var parts = $.trim(line).match(/[^.!?]+[.!?]*/g) || [];
      $.each(parts, function (j, part) {
        part = $.trim(part);
        if (part) cues.push(part);
      });
    });
    return cues;
  }

  // WebVTT from caption_text. Cues are spread over the video duration in proportion to
  // their length. Without a usable duration each cue gets a fixed 4 seconds.
  function buildVtt(text, duration) {
    var cues = splitCues(text);
    var total = 0;
    $.each(cues, function (i, c) { total += c.length; });
    var known = isFinite(duration) && duration > 0;
    var out = ['WEBVTT', ''];
    var at = 0;
    $.each(cues, function (i, c) {
      var len = known ? (c.length / total) * duration : 4;
      out.push(String(i + 1));
      out.push(timestamp(at) + ' --> ' + timestamp(at + len));
      out.push(escapeCue(c));
      out.push('');
      at += len;
    });
    return out.join('\n');
  }

  ns.buildVtt = buildVtt;
})();
