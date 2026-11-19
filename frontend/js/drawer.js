(function ($) {
  window.App = window.App || {};

  var FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  function els() {
    return {
      $backdrop: $('#drawer-backdrop'),
      $drawer: $('#notif-drawer'),
      $close: $('#drawer-close'),
      $bell: $('#notif-bell')
    };
  }

  function isOpen() {
    return $('#notif-drawer').hasClass('is-open');
  }

  function onKey(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
    } else if (e.key === 'Tab') {
      var $drawer = $('#notif-drawer');
      var $items = $drawer.find(FOCUSABLE).filter(':visible');
      if (!$items.length) {
        e.preventDefault();
        return;
      }
      var first = $items[0];
      var last = $items[$items.length - 1];
      var active = document.activeElement;
      if (!$.contains($drawer[0], active)) {
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

  function open() {
    var e = els();
    if (!e.$drawer.length || !e.$backdrop.length || isOpen()) return;
    e.$backdrop.addClass('is-open');
    e.$drawer.addClass('is-open');
    e.$bell.attr({ 'aria-expanded': 'true', 'aria-controls': 'notif-drawer' });
    $(document.body).addClass('no-scroll');
    $(document).on('keydown', onKey);
    if (e.$close.length) e.$close[0].focus();
    $(document).trigger('drawer:open');
  }

  function close() {
    var e = els();
    if (!e.$drawer.length || !e.$backdrop.length || !isOpen()) return;
    e.$backdrop.removeClass('is-open');
    e.$drawer.removeClass('is-open');
    e.$bell.attr({ 'aria-expanded': 'false', 'aria-controls': 'notif-drawer' });
    $(document.body).removeClass('no-scroll');
    $(document).off('keydown', onKey);
    if (e.$bell.length) e.$bell[0].focus();
    $(document).trigger('drawer:close');
  }

  function toggle() {
    if (isOpen()) close(); else open();
  }

  $(document).on('click', '#drawer-backdrop', close);
  $(document).on('click', '#drawer-close', close);

  $(function () {
    $('#notif-bell').attr({ 'aria-expanded': isOpen() ? 'true' : 'false', 'aria-controls': 'notif-drawer' });
  });

  App.drawer = { open: open, close: close, toggle: toggle, isOpen: isOpen };
})(jQuery);
