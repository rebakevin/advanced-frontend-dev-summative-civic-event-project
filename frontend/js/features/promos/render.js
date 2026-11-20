(function ($) {
  window.App = window.App || {};
  var ns = (App.promosList = App.promosList || {});

  function render() {
    var state = ns.state;
    var items = ns.visible();
    if (state.observer) state.observer.disconnect();
    if (!ns.updateCount()) return;

    state.$list.removeAttr('aria-busy').empty();
    $.each(items, function (i, promo) {
      state.$list.append(ns.buildCard(promo));
    });
  }

  function load() {
    var state = ns.state;
    state.$count.text('');
    App.skeleton.show(state.$list, { count: 6 });
    App.promos.loadList()
      .done(function (promos) {
        // loadList returns copies, so local edits never touch the cache.
        state.all = promos;
        render();
      })
      .fail(function (err) {
        App.skeleton.error(state.$list, { message: err && err.message, onRetry: load });
      });
  }

  ns.render = render;
  ns.load = load;
})(jQuery);
