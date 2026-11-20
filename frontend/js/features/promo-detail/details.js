(function ($) {
  window.App = window.App || {};
  var ns = (App.promoDetailPage = App.promoDetailPage || {});

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

    $body.append(ns.buildPlayer(promo));

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

  ns.buildDetails = buildDetails;
})(jQuery);
