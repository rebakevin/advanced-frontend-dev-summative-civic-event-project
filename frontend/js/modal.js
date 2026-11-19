(function ($) {
  window.App = window.App || {};

  var uid = 0;

  // Generic dialog shell: backdrop, header with close button, body, optional footer.
  // Esc, the close button and a backdrop click call close(); Tab stays inside; focus
  // returns to the opener. opts: {title, $body, $footer, focus (element), onClose(result)}.
  // Returns {close(result)}.
  function open(opts) {
    opts = opts || {};
    var id = 'modal-' + (++uid);
    var previous = document.activeElement;

    var $backdrop = $('<div class="modal-backdrop" data-modal-backdrop></div>');
    var $modal = $('<div class="modal" role="dialog" aria-modal="true"></div>')
      .attr({ 'aria-labelledby': id + '-title', 'aria-describedby': id + '-body' })
      .appendTo($backdrop);

    var $header = $('<div class="modal-header"></div>').appendTo($modal);
    $('<h2 class="modal-title"></h2>').attr('id', id + '-title').text(opts.title || '').appendTo($header);
    $('<button class="modal-close" type="button" aria-label="Close">×</button>').appendTo($header);
    $('<div class="modal-body"></div>').attr('id', id + '-body').append(opts.$body).appendTo($modal);
    if (opts.$footer) $('<div class="modal-footer"></div>').append(opts.$footer).appendTo($modal);

    function close(result) {
      $(document).off('keydown', onKey);
      $backdrop.remove();
      if (!$('.modal-backdrop.is-open').length) $(document.body).removeClass('no-scroll');
      if (previous && typeof previous.focus === 'function' && document.contains(previous)) previous.focus();
      if (typeof opts.onClose === 'function') opts.onClose(result);
    }

    function onKey(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        close(false);
      } else if (e.key === 'Tab') {
        App.ui.trapTab(e, $modal);
      }
    }

    $modal.find('.modal-close').on('click', function () { close(false); });
    $backdrop.on('mousedown', function (e) {
      if (e.target === $backdrop[0]) close(false);
    });
    $(document).on('keydown', onKey);

    $backdrop.appendTo(document.body).addClass('is-open');
    $(document.body).addClass('no-scroll');
    (opts.focus || $modal.find('.modal-close')[0]).focus();

    return { close: close };
  }

  function confirm(opts) {
    opts = opts || {};
    var dfd = $.Deferred();

    var $cancel = $('<button class="btn btn-ghost" type="button"></button>').text(opts.cancelLabel || 'Cancel');
    var $ok = $('<button type="button"></button>').addClass(opts.danger ? 'btn btn-danger' : 'btn btn-primary')
      .text(opts.confirmLabel || 'Confirm');

    var dialog = open({
      title: opts.title || 'Are you sure?',
      $body: $('<p></p>').text(opts.message || ''),
      $footer: $cancel.add($ok),
      focus: (opts.danger ? $cancel : $ok)[0],
      onClose: function (confirmed) {
        if (confirmed) dfd.resolve(); else dfd.reject();
      },
    });
    $ok.on('click', function () { dialog.close(true); });
    $cancel.on('click', function () { dialog.close(false); });

    return dfd.promise();
  }

  App.modal = { open: open, confirm: confirm };
})(jQuery);
