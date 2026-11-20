(function ($) {
  window.App = window.App || {};
  var ns = (App.promoDetailPage = App.promoDetailPage || {});

  function buildPlayer(promo) {
    var $player = $('<div class="video-player"></div>');
    var $frame = $('<div class="video-frame"></div>').appendTo($player);
    var video = document.createElement('video');
    video.setAttribute('controls', '');
    video.setAttribute('preload', 'metadata');
    video.setAttribute('playsinline', '');
    video.setAttribute('aria-label', 'Video: ' + (promo.title || 'Promo'));
    video.setAttribute('src', promo.video_url || '');
    video.appendChild(document.createTextNode('Your browser cannot play this video. The transcript is shown below.'));
    $frame.append(video);

    var $message = $('<p class="alert alert-error" role="alert" hidden></p>').appendTo($player);
    ns.attachCaptions(video, $message, promo);
    return $player;
  }

  ns.buildPlayer = buildPlayer;
})(jQuery);
