(function () {
  window.App = window.App || {};
  var L = (App.layoutInternal = App.layoutInternal || {});

  var NARROW = '(max-width: 1023px)';

  L.initDropdown = function () {
    var $root = $('#profile-dropdown');
    if (!$root.length) return;
    var $trigger = $('#profile-trigger');
    var $menu = $('#profile-menu');

    function items() { return $menu.find('[role="menuitem"]'); }
    function open() {
      $menu.addClass('is-open');
      $trigger.attr('aria-expanded', 'true');
    }
    function close(returnFocus) {
      $menu.removeClass('is-open');
      $trigger.attr('aria-expanded', 'false');
      if (returnFocus) $trigger.trigger('focus');
    }

    $trigger.on('click', function () {
      if ($menu.hasClass('is-open')) close(false); else open();
    });
    $trigger.on('keydown', function (e) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        open();
        items().first().trigger('focus');
      }
    });
    $menu.on('keydown', function (e) {
      var $items = items();
      var i = $items.index(document.activeElement);
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        $items.eq((i + 1) % $items.length).trigger('focus');
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        $items.eq((i - 1 + $items.length) % $items.length).trigger('focus');
      }
    });
    $(document).on('click', function (e) {
      if (!$(e.target).closest($root).length) close(false);
    });
    $(document).on('keydown', function (e) {
      if (e.key === 'Escape' && $menu.hasClass('is-open')) close(true);
    });
  };

  L.initMobileNav = function () {
    var $toggle = $('#nav-toggle');
    var $menu = $('#header-menu');
    if (!$toggle.length || !$menu.length) return;

    function set(open) {
      $menu.toggleClass('is-open', open);
      $toggle.attr('aria-expanded', open ? 'true' : 'false');
    }
    $toggle.on('click', function () {
      set(!$menu.hasClass('is-open'));
    });
    $(document).on('keydown', function (e) {
      if (e.key === 'Escape' && $menu.hasClass('is-open') && window.matchMedia(NARROW).matches) {
        set(false);
        $toggle.trigger('focus');
      }
    });
  };

  L.initSidebarToggle = function () {
    var $toggle = $('#sidebar-toggle');
    var $nav = $('#sidebar-nav');
    if (!$toggle.length || !$nav.length) return;
    $toggle.on('click', function () {
      var open = $nav.toggleClass('is-open').hasClass('is-open');
      $toggle.attr('aria-expanded', String(open));
    });
  };
})();
