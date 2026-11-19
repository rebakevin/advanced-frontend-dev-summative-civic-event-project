(function ($) {
  window.App = window.App || {};

  var MAX_VISIBLE = 4;
  var $container = null;

  function getContainer() {
    if (!$container || !$container.length || !$.contains(document.body, $container[0])) {
      $container = $('<div class="toast-container" aria-live="polite"></div>').appendTo(document.body);
    }
    return $container;
  }

  function dismiss($toast) {
    if ($toast.data('dismissed')) return;
    $toast.data('dismissed', true);
    clearTimeout($toast.data('timer'));
    $toast.remove();
  }

  function show(opts) {
    opts = opts || {};
    if (!opts.message) return null;
    var type = opts.type === 'success' || opts.type === 'error' ? opts.type : 'info';
    var hasAction = !!(opts.actionLabel && typeof opts.onAction === 'function');
    var duration = typeof opts.duration === 'number' ? opts.duration : (type === 'error' && hasAction ? 10000 : 5000);

    var $c = getContainer();
    var $toast = $('<div class="toast toast-enter" role="status"></div>').addClass('toast-' + type);
    $('<p class="toast-message"></p>').text(opts.message).appendTo($toast);

    if (hasAction) {
      $('<button class="toast-action" type="button"></button>').text(opts.actionLabel).on('click', function () {
        dismiss($toast);
        opts.onAction();
      }).appendTo($toast);
    }

    $('<button class="toast-close" type="button" aria-label="Dismiss notification"></button>')
      .text('×')
      .on('click', function () { dismiss($toast); })
      .appendTo($toast);

    function start() {
      clearTimeout($toast.data('timer'));
      if (duration > 0) $toast.data('timer', setTimeout(function () { dismiss($toast); }, duration));
    }
    function pause() { clearTimeout($toast.data('timer')); }
    $toast.on('mouseenter focusin', pause).on('mouseleave focusout', start);

    $c.append($toast);
    var $all = $c.children('.toast');
    while ($all.length > MAX_VISIBLE) {
      dismiss($all.first());
      $all = $c.children('.toast');
    }
    start();
    return $toast;
  }

  App.toast = {
    show: show,
    success: function (message) { return show({ type: 'success', message: message }); },
    error: function (message) { return show({ type: 'error', message: message }); },
    info: function (message) { return show({ type: 'info', message: message }); }
  };

  $(function () {
    var flash = App.flash && App.flash.take();
    if (flash) show({ type: flash.type, message: flash.message });
  });
})(jQuery);
