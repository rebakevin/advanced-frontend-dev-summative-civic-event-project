(function ($) {
  window.App = window.App || {};

  function placeholder(type) {
    if (type === 'row') {
      var $row = $('<div class="skeleton-row" aria-hidden="true"></div>');
      $('<div class="skeleton skeleton-avatar"></div>').appendTo($row);
      $('<div class="skeleton skeleton-line"></div>').appendTo($row);
      return $row;
    }
    if (type === 'line') return $('<div class="skeleton skeleton-line" aria-hidden="true"></div>');
    return $('<div class="skeleton skeleton-card" aria-hidden="true"></div>');
  }

  function show($el, opts) {
    opts = opts || {};
    var count = opts.count > 0 ? opts.count : 3;
    $el.empty().attr('aria-busy', 'true');
    for (var i = 0; i < count; i++) $el.append(placeholder(opts.type));
  }

  function hide($el) {
    $el.find('.skeleton, .skeleton-row').remove();
    $el.removeAttr('aria-busy');
  }

  function buildState(title, text) {
    var $state = $('<div class="empty-state"></div>');
    $('<h2></h2>').text(title).appendTo($state);
    if (text) $('<p></p>').text(text).appendTo($state);
    return $state;
  }

  function empty($el, opts) {
    opts = opts || {};
    var $state = buildState(opts.title || 'Nothing here yet', opts.text);
    if (opts.actionLabel && opts.href) {
      $('<a class="btn btn-primary"></a>').attr('href', opts.href).text(opts.actionLabel).appendTo($state);
    }
    $el.removeAttr('aria-busy').empty().append($state);
  }

  function error($el, opts) {
    opts = opts || {};
    var $state = buildState('Something went wrong', opts.message || 'We could not load this. Please try again.');
    $state.attr('role', 'alert');
    if (typeof opts.onRetry === 'function') {
      $('<button class="btn btn-primary" type="button"></button>').text('Retry').on('click', function () {
        opts.onRetry();
      }).appendTo($state);
    }
    $el.removeAttr('aria-busy').empty().append($state);
  }

  App.skeleton = { show: show, hide: hide, empty: empty, error: error };
})(jQuery);
