(function ($) {
  window.App = window.App || {};
  var ns = (App.promoDetailPage = App.promoDetailPage || {});

  function promoId() {
    var raw = new URLSearchParams(window.location.search).get('id');
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(raw || '') ? raw : null;
  }

  function notFound() {
    window.location.replace(App.pageUrl('not-found'));
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
      $root.empty().removeAttr('aria-busy').append(ns.buildDetails(promo));
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
})(jQuery);
