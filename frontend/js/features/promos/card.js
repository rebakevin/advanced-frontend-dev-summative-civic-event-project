(function ($) {
  window.App = window.App || {};
  var ns = (App.promosList = App.promosList || {});

  var PLAY_ICON = '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" focusable="false"><path d="M8 5v14l11-7z"/></svg>';

  function buildCard(promo) {
    var state = ns.state;
    var $card = $('<article class="card"></article>');

    var $thumb = $('<div class="promo-thumb"></div>').appendTo($card);
    var video = document.createElement('video');
    video.setAttribute('preload', 'metadata');
    video.setAttribute('muted', '');
    video.muted = true;
    video.setAttribute('playsinline', '');
    video.setAttribute('tabindex', '-1');
    video.setAttribute('aria-hidden', 'true');
    // #t=0.1 makes the browser render a frame instead of a black box.
    video.setAttribute('data-src', String(promo.video_url || '') + '#t=0.1');
    $thumb.append(video);
    $('<span class="play-badge" aria-hidden="true"></span>').html(PLAY_ICON).appendTo($thumb);
    function syncDraft() {
      $thumb.find('.badge-draft').remove();
      if (!App.promos.isPublished(promo)) {
        $('<span class="badge badge-draft"></span>').text('Draft').appendTo($thumb);
      }
    }
    syncDraft();
    if (promo.video_url) ns.lazyThumb(video);

    var $body = $('<div class="card-body"></div>').appendTo($card);
    $('<h2 class="card-title"></h2>').text(promo.title).appendTo($body);
    if (promo.description) {
      $('<p class="line-clamp-3"></p>').text(promo.description).appendTo($body);
    }

    var $actions = $('<div class="card-actions"></div>').appendTo($card);
    $('<a class="btn btn-sm btn-primary"></a>')
      .attr({ href: App.pageUrl('promo-detail', { id: promo.id }), 'aria-label': 'Play ' + promo.title })
      .text('Play').appendTo($actions);

    /* ROLE GUARD: Edit, Publish/Unpublish and Delete are admin-only (create/edit/delete/
       publish/unpublish promos, spec section 2). They carry data-role="admin" and are
       removed from the DOM for normal users by applyControlGuard. The backend rejects
       these calls for non-admins too. */
    $('<a class="btn btn-sm btn-ghost" data-role="admin"></a>')
      .attr({ href: App.pageUrl('promo-form', { id: promo.id }), 'aria-label': 'Edit ' + promo.title })
      .text('Edit').appendTo($actions);

    var $pub = $('<button class="btn btn-sm btn-ghost" type="button" data-role="admin"></button>')
      .appendTo($actions);
    function syncPub() {
      var label = App.promos.isPublished(promo) ? 'Unpublish' : 'Publish';
      $pub.text(label).attr('aria-label', label + ' ' + promo.title);
    }
    syncPub();
    $pub.on('click', function () {
      var want = !App.promos.isPublished(promo);
      App.ui.withLoading($pub, App.promos.setPublished(promo, want))
        .done(function () {
          promo.published = want;
          syncDraft();
          syncPub();
          App.toast.success(want ? 'Promo published.' : 'Promo unpublished.');
        })
        .fail(function (err) {
          App.toast.error(err.message);
        });
    });

    var $del = $('<button class="btn btn-sm btn-danger" type="button" data-role="admin"></button>')
      .attr('aria-label', 'Delete ' + promo.title).text('Delete').appendTo($actions);
    $del.on('click', function () {
      App.promos.confirmDelete(promo, $del, function () {
        state.all = $.grep(state.all, function (p) { return p.id !== promo.id; });
        if (state.observer) state.observer.unobserve($card.find('video')[0]);
        $card.remove();
        App.toast.success('Promo deleted.');
        ns.updateCount();
      });
    });

    App.guard.applyControlGuard($card);
    return $card;
  }

  ns.buildCard = buildCard;
})(jQuery);
