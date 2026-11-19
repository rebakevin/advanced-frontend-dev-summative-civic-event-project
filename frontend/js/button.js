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

  App.ui.setLoading = setLoading;
  App.ui.isLoading = isLoading;
  App.ui.withLoading = withLoading;
})();
