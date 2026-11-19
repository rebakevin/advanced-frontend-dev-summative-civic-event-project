(function () {
  window.App = window.App || {};

  function promoId() {
    var raw = new URLSearchParams(window.location.search).get('id');
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(raw || '') ? raw : null;
  }

  function notFound() {
    window.location.replace(App.pageUrl('not-found'));
  }

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
    attachCaptions(video, $message, promo);
    return $player;
  }

  function deletePromo(promo, $btn) {
    App.promos.confirmDelete(promo, $btn, function () {
      App.flash.set('Promo deleted.', 'success');
      window.location.href = App.pageUrl('promos');
    });
  }

  function buildDetails(promo) {
    var $card = $('<article class="card"></article>');
    var $body = $('<div class="card-body gap-4 p-6"></div>').appendTo($card);

    var $head = $('<div class="flex flex-wrap items-center gap-3"></div>').appendTo($body);
    $('<h1></h1>').text(promo.title).appendTo($head);
    /* ROLE GUARD: only admins can load an unpublished promo in the UI. Normal users who
       open a draft by URL get the not-found page (see initPromoDetail). Admins see a
       Draft badge. UX only; the backend does not hide drafts. */
    function syncDraft() {
      $head.find('.badge-draft').remove();
      if (!App.promos.isPublished(promo)) {
        $('<span class="badge badge-draft"></span>').text('Draft').appendTo($head);
      }
    }
    syncDraft();

    $body.append(buildPlayer(promo));

    if (promo.description) {
      $('<p class="whitespace-pre-line"></p>').text(promo.description).appendTo($body);
    }
    if ($.trim(promo.caption_text || '')) {
      var $transcript = $('<section class="transcript" aria-labelledby="transcript-heading"></section>').appendTo($body);
      $('<h2 class="transcript-title" id="transcript-heading"></h2>').text('Transcript').appendTo($transcript);
      $('<p class="transcript-text"></p>').text(promo.caption_text).appendTo($transcript);
    }

    /* ROLE GUARD: Edit, Publish/Unpublish and Delete are for admins only, because only
       admins may change or remove promos. They carry data-role="admin", so the control
       guard removes them from the DOM for normal users. The backend still enforces this. */
    var $actions = $('<div class="flex flex-wrap items-center gap-3"></div>').appendTo($body);
    $('<a class="btn btn-ghost" data-role="admin"></a>')
      .attr('href', App.pageUrl('promo-form', { id: promo.id }))
      .text('Edit')
      .appendTo($actions);
    var $pub = $('<button class="btn btn-ghost" type="button" data-role="admin"></button>')
      .text(App.promos.isPublished(promo) ? 'Unpublish' : 'Publish')
      .appendTo($actions);
    $pub.on('click', function () {
      var want = !App.promos.isPublished(promo);
      App.ui.withLoading($pub, App.promos.setPublished(promo, want))
        .done(function () {
          promo.published = want;
          App.toast.success(want ? 'Promo published.' : 'Promo unpublished.');
          // Patch in place: a rebuild would restart the video and make a new Blob URL.
          syncDraft();
          $pub.text(want ? 'Unpublish' : 'Publish');
        })
        .fail(function (err) {
          App.toast.error(err.message);
        });
    });
    var $delete = $('<button class="btn btn-danger" type="button" data-role="admin">Delete</button>')
      .on('click', function () {
        deletePromo(promo, $delete);
      })
      .appendTo($actions);

    return $card;
  }

  function initPromoDetail() {
    var $root = $('#promo-detail');
    if (!$root.length) return;

    var id = promoId();
    if (!id) {
      notFound();
      return;
    }

    function show(promo) {
      $root.empty().removeAttr('aria-busy').append(buildDetails(promo));
      App.guard.applyControlGuard($root);
    }

    function load() {
      App.skeleton.show($root, { count: 1 });
      App.api.get('/promos/' + id, null, { inline: true })
        .done(function (promo) {
          // Users see published promos only; a draft opened by URL counts as not found.
          if (!promo || (!App.promos.isPublished(promo) && !App.auth.hasRole('admin'))) {
            notFound();
            return;
          }
          show(promo);
          document.title = promo.title + ' | ' + document.title;
        })
        .fail(function (err) {
          if (err.status === 404) {
            notFound();
            return;
          }
          App.skeleton.error($root, { message: err.message, onRetry: load });
        });
    }

    load();
  }

  $(function () {
    initPromoDetail();
  });
})();
