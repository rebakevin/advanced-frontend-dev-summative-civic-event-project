(function ($) {
  window.App = window.App || {};

  var uid = 0;
  var FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  function confirm(opts) {
    opts = opts || {};
    var dfd = $.Deferred();
    var id = 'confirm-modal-' + (++uid);
    var previous = document.activeElement;

    var $backdrop = $('<div class="modal-backdrop" data-modal-backdrop></div>');
    var $modal = $('<div class="modal modal-confirm" role="dialog" aria-modal="true"></div>')
      .attr({ 'aria-labelledby': id + '-title', 'aria-describedby': id + '-body' })
      .appendTo($backdrop);

    var $header = $('<div class="modal-header"></div>').appendTo($modal);
    $('<h2 class="modal-title"></h2>').attr('id', id + '-title').text(opts.title || 'Are you sure?').appendTo($header);
    $('<button class="modal-close" type="button" aria-label="Close">×</button>').appendTo($header);
    $('<div class="modal-body"></div>').attr('id', id + '-body')
      .append($('<p></p>').text(opts.message || '')).appendTo($modal);

    var $footer = $('<div class="modal-footer"></div>').appendTo($modal);
    var $cancel = $('<button class="btn btn-ghost" type="button"></button>').text(opts.cancelLabel || 'Cancel').appendTo($footer);
    var $ok = $('<button type="button"></button>').addClass(opts.danger ? 'btn btn-danger' : 'btn btn-primary')
      .text(opts.confirmLabel || 'Confirm').appendTo($footer);

    function close(confirmed) {
      $(document).off('keydown', onKey);
      $backdrop.remove();
      if (!$('.modal-backdrop.is-open').length) $(document.body).removeClass('no-scroll');
      if (previous && typeof previous.focus === 'function' && document.contains(previous)) previous.focus();
      if (confirmed) dfd.resolve(); else dfd.reject();
    }

    function onKey(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        close(false);
      } else if (e.key === 'Tab') {
        var $items = $modal.find(FOCUSABLE).filter(':visible');
        if (!$items.length) return;
        var first = $items[0];
        var last = $items[$items.length - 1];
        var active = document.activeElement;
        if (!$.contains($modal[0], active)) {
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
    }

    $ok.on('click', function () { close(true); });
    $cancel.add($modal.find('.modal-close')).on('click', function () { close(false); });
    $backdrop.on('mousedown', function (e) {
      if (e.target === $backdrop[0]) close(false);
    });
    $(document).on('keydown', onKey);

    $backdrop.appendTo(document.body).addClass('is-open');
    $(document.body).addClass('no-scroll');
    (opts.danger ? $cancel : $ok)[0].focus();

    return dfd.promise();
  }

  App.modal = { confirm: confirm };
})(jQuery);
