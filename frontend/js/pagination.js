(function ($) {
  window.App = window.App || {};
  App.ui = App.ui || {};

  // Renders Prev / numbered pages / Next into $el. opts: {page, pages, onChange(page)}.
  // For lists with no known total, pass {page, hasMore} instead: Prev / "Page N" / Next.
  // Hides $el when there is nothing to page through.
  function pagination($el, opts) {
    var page = opts.page;
    var known = typeof opts.pages === 'number';
    var pages = known ? opts.pages : page + (opts.hasMore ? 1 : 0);
    $el.empty();
    if (pages <= 1 && page <= 1) {
      $el.prop('hidden', true);
      return;
    }
    $el.prop('hidden', false);

    function btn(label, target, extra) {
      var $b = $('<button class="page-btn" type="button"></button>').text(label).appendTo($el);
      if (extra.ariaLabel) $b.attr('aria-label', extra.ariaLabel);
      if (extra.current) $b.attr('aria-current', 'page');
      if (extra.disabled) $b.prop('disabled', true);
      $b.on('click', function () {
        opts.onChange(target);
        var h1 = document.querySelector('h1');
        if (h1) h1.scrollIntoView();
      });
    }

    btn('Prev', page - 1, { disabled: page <= 1, ariaLabel: 'Previous page' });
    if (known) {
      for (var i = 1; i <= pages; i++) btn(String(i), i, { current: i === page, ariaLabel: 'Page ' + i });
    } else {
      btn('Page ' + page, page, { current: true, disabled: true });
    }
    btn('Next', page + 1, { disabled: page >= pages, ariaLabel: 'Next page' });
  }

  App.ui.pagination = pagination;
})(jQuery);
