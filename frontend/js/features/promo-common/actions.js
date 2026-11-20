(function () {
  window.App = window.App || {};
  var ns = (App.promoCommon = App.promoCommon || {});

  // Each call invalidates the cache on success. Resolves with the API data.
  function setPublished(promo, publish) {
    var path = '/promos/' + encodeURIComponent(promo.id) + (publish ? '/publish' : '/unpublish');
    return App.api.patch(path, null, { inline: true }).then(function (data) {
      ns.invalidate();
      return data;
    });
  }

  function remove(promo) {
    return App.api.del('/promos/' + encodeURIComponent(promo.id), { inline: true }).then(function (data) {
      ns.invalidate();
      return data;
    });
  }

  // Confirm, then delete. Calls onDone() after success; errors show as a toast.
  function confirmDelete(promo, $btn, onDone) {
    App.modal.confirm({
      title: 'Delete promo?',
      message: 'Delete "' + promo.title + '"? This cannot be undone.',
      confirmLabel: 'Delete',
      danger: true,
    }).done(function () {
      App.ui.withLoading($btn, remove(promo))
        .done(onDone)
        .fail(function (err) {
          App.toast.error(err.message);
        });
    });
  }

  ns.setPublished = setPublished;
  ns.remove = remove;
  ns.confirmDelete = confirmDelete;
})();
