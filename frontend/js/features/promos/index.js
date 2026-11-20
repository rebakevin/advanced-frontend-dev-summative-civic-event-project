(function ($) {
  window.App = window.App || {};
  var ns = (App.promosList = App.promosList || {});

  function initPromos() {
    var $list = $('#promos-list');
    if (!$list.length) return;

    ns.state.$list = $list;
    ns.state.$count = $('#promos-count');
    ns.state.all = [];
    ns.state.observer = null;

    ns.load();
  }

  $(function () {
    initPromos();
  });
})(jQuery);
