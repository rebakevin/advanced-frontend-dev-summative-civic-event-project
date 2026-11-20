(function ($) {
  window.App = window.App || {};

  function initEvents() {
    var $list = $('#events-list');
    if (!$list.length) return;

    // Shared state for the parts in App.eventsList.
    var ctx = {
      $list: $list,
      $pagination: $('#events-pagination'),
      $count: $('#events-count'),
      $form: $('#events-filters'),
      $q: $('#filter-q'),
      $date: $('#filter-date'),
      $location: $('#filter-location'),
      all: [],
      registered: {},
      page: 1,
    };
    var view = App.eventsList.render;

    ctx.$q.val(new URLSearchParams(window.location.search).get('q') || '');

    ctx.$form.on('submit', function (e) { e.preventDefault(); });
    ctx.$q.on('input', function () { ctx.page = 1; view.render(ctx); });
    ctx.$date.add(ctx.$location).on('change', function () { ctx.page = 1; view.render(ctx); });

    view.load(ctx);
  }

  $(function () {
    initEvents();
  });
})(jQuery);
