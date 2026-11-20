(function ($) {
  window.App = window.App || {};
  var ns = (App.promosList = App.promosList || {});

  // Shared state of the promo list page. index.js fills $list and $count when the page starts.
  // all: the loaded promos. observer: the lazy thumbnail observer, created on first use.
  ns.state = {
    $list: null,
    $count: null,
    all: [],
    observer: null,
  };

  function isAdmin() {
    return App.auth.hasRole('admin');
  }

  function visible() {
    /* ROLE GUARD: unpublished promos are for admins only. Normal users never see them
       in the list (the API returns every promo, so the filter runs here). Admins see
       all promos with a Draft badge. UX only; the backend does not hide them. */
    return $.grep(ns.state.all, function (p) {
      return isAdmin() || App.promos.isPublished(p);
    });
  }

  // Updates the count, or shows the empty state when nothing is left.
  function updateCount() {
    var n = visible().length;
    if (!n) {
      ns.state.$count.text('');
      App.skeleton.empty(ns.state.$list, {
        title: 'No promos yet',
        text: 'Check back soon for new promo videos.',
      });
      return false;
    }
    ns.state.$count.text(n + (n === 1 ? ' promo' : ' promos'));
    return true;
  }

  ns.isAdmin = isAdmin;
  ns.visible = visible;
  ns.updateCount = updateCount;
})(jQuery);
