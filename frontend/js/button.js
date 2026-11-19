(function () {
  window.App = window.App || {};
  App.ui = App.ui || {};

  // Disables and marks the button busy; remembers the original disabled state and label.
  function setLoading($btn, isLoading, labelWhileLoading) {
    $btn.each(function () {
      var $b = $(this);
      if (isLoading) {
        if ($b.data('loading')) return;
        $b.data('loading', true);
        $b.data('wasDisabled', $b.prop('disabled'));
        $b.addClass('is-loading').attr('aria-busy', 'true').prop('disabled', true);
        if (labelWhileLoading) {
          $b.data('origLabel', $b.text());
          $b.text(labelWhileLoading);
        }
      } else {
        if (!$b.data('loading')) return;
        $b.data('loading', false);
        $b.removeClass('is-loading').removeAttr('aria-busy').prop('disabled', !!$b.data('wasDisabled'));
        if ($b.data('origLabel') !== undefined) {
          $b.text($b.data('origLabel'));
          $b.removeData('origLabel');
        }
      }
    });
    return $btn;
  }

  function isLoading($btn) {
    return !!$btn.first().data('loading');
  }

  // Loading while the promise is pending; returns the same promise.
  function withLoading($btn, promise, labelWhileLoading) {
    setLoading($btn, true, labelWhileLoading);
    if (promise && typeof promise.always === 'function') {
      promise.always(function () {
        setLoading($btn, false);
      });
    } else {
      setLoading($btn, false);
    }
    return promise;
  }

  var FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  // Keeps Tab / Shift+Tab inside an open overlay. Call it from the overlay's keydown handler.
  function trapTab(e, $container) {
    var $items = $container.find(FOCUSABLE).filter(':visible');
    if (!$items.length) {
      e.preventDefault();
      return;
    }
    var first = $items[0];
    var last = $items[$items.length - 1];
    var active = document.activeElement;
    if (!$.contains($container[0], active)) {
      e.preventDefault();
      first.focus();
    } else if (e.shiftKey && active === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  }

  App.ui.trapTab = trapTab;
  App.ui.setLoading = setLoading;
  App.ui.isLoading = isLoading;
  App.ui.withLoading = withLoading;
})();
