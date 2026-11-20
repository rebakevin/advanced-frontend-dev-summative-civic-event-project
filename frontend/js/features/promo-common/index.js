(function () {
  window.App = window.App || {};
  var ns = App.promoCommon;

  // Public API, used by the other promo files.
  App.promos = {
    isPublished: ns.isPublished,
    loadList: ns.loadList,
    invalidate: ns.invalidate,
    setPublished: ns.setPublished,
    remove: ns.remove,
    confirmDelete: ns.confirmDelete,
    buildVtt: ns.buildVtt,
  };
})();
