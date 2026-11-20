(function ($) {
  window.App = window.App || {};
  var ns = (App.promoDetailPage = App.promoDetailPage || {});

  // Generates the WebVTT track in the browser (the API only has caption_text), once the
  // video duration is known so the cues can be spread across the whole video.
  function attachCaptions(video, $message, promo) {
    var blobUrl = null;
    var attached = false;

    function attach() {
      if (attached || !$.trim(promo.caption_text || '')) return;
      attached = true;
      var vtt = App.promos.buildVtt(promo.caption_text, video.duration);
      blobUrl = URL.createObjectURL(new Blob([vtt], { type: 'text/vtt' }));
      var track = document.createElement('track');
      track.setAttribute('kind', 'captions');
      track.setAttribute('srclang', 'en');
      track.setAttribute('label', 'English');
      track.setAttribute('default', '');
      track.setAttribute('src', blobUrl);
      video.appendChild(track);
      if (track.track) track.track.mode = 'showing';
    }

    $(video).on('loadedmetadata', attach);
    if (video.readyState >= 1) attach();
    $(video).on('error', function () {
      $message.prop('hidden', false).text('This video could not be played. Check your connection and try again later.');
    });
    $(window).one('pagehide', function () {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
      blobUrl = null;
    });
  }

  ns.attachCaptions = attachCaptions;
})(jQuery);
