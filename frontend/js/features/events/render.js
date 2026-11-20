(function ($) {
  window.App = window.App || {};
  App.eventsList = App.eventsList || {};

  var PAGE_SIZE = 9;

  function render(ctx) {
    var items = App.eventsList.filters.filtered(ctx);
    var pages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
    if (ctx.page > pages) ctx.page = pages;

    if (!items.length) {
      ctx.$count.text('');
      ctx.$pagination.prop('hidden', true).empty();
      var hasFilter = $.trim(ctx.$q.val()) || ctx.$date.val() || ctx.$location.val();
      App.skeleton.empty(ctx.$list, {
        title: hasFilter ? 'No events match your filters' : 'No events yet',
        text: hasFilter ? 'Try a different search, date or location.' : 'Check back soon for upcoming events.',
      });
      return;
    }

    ctx.$count.text(items.length + (items.length === 1 ? ' event' : ' events'));
    ctx.$list.removeAttr('aria-busy').empty();
    $.each(items.slice((ctx.page - 1) * PAGE_SIZE, ctx.page * PAGE_SIZE), function (i, ev) {
      ctx.$list.append(App.eventsList.card.build(ctx, ev));
    });
    App.ui.pagination(ctx.$pagination, {
      page: ctx.page,
      pages: pages,
      onChange: function (p) { ctx.page = p; render(ctx); },
    });
  }

  function load(ctx) {
    ctx.$pagination.prop('hidden', true).empty();
    ctx.$count.text('');
    App.skeleton.show(ctx.$list, { count: 6 });
    // Registration state is not critical: the list still works if it fails.
    var regs = App.events.loadRegisteredIds({ inline: true }).then(null, function () {
      return $.Deferred().resolve({}).promise();
    });
    // The wrapper resolves with (data, body); keep only the data so $.when passes it through.
    var list = App.api.get('/events', null, { inline: true }).then(function (data) {
      return data;
    });
    $.when(list, regs)
      .done(function (events, ids) {
        ctx.all = $.isArray(events) ? events : [];
        ctx.registered = ids || {};
        App.eventsList.filters.fillLocations(ctx);
        ctx.page = 1;
        render(ctx);
      })
      .fail(function (err) {
        App.skeleton.error(ctx.$list, { message: err && err.message, onRetry: function () { load(ctx); } });
      });
  }

  App.eventsList.render = { render: render, load: load };
})(jQuery);
