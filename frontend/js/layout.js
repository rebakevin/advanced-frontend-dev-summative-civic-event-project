(function () {
  window.App = window.App || {};

  var NARROW = '(max-width: 1023px)';

  // Marks the link whose data-match list contains the current page name.
  function initCurrentPage() {
    var page = $('body').attr('data-page') || '';
    $('.header-link, .sidebar-link').each(function () {
      var names = ($(this).attr('data-match') || '').split(/\s+/);
      if (page && names.indexOf(page) !== -1) $(this).attr('aria-current', 'page');
      else $(this).removeAttr('aria-current');
    });
  }

  // Guests (and public pages like not-found) see only the logo.
  function initGuestState() {
    var guest = $('body').attr('data-guard') === 'guest' || !App.auth.isLoggedIn();
    if (!guest) return false;
    $('#header-search, #primary-nav, #header-menu, #header-actions, #notif-bell, #profile-dropdown, #nav-toggle').prop('hidden', true);
    $('#notif-drawer, #drawer-backdrop').remove();
    return true;
  }

  // Regular users land on their dashboard, so the logo and a Dashboard tab lead back to it.
  // Admins have their own Dashboard link, so the user-only tab is removed for them.
  function initUserHome() {
    if (App.auth.hasRole('admin')) {
      $('#primary-nav [data-role="user"]').remove();
      return;
    }
    $('.header-logo').attr('href', App.pageUrl('my-dashboard'));
  }

  function initUserName() {
    var $name = $('#header-user-name');
    if (!$name.length) return;
    var user = App.auth.getUser();
    if (user && user.full_name) $name.text(user.full_name);
  }

  function initDropdown() {
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
  }

  function initMobileNav() {
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
  }

  function initSidebarToggle() {
    var $toggle = $('#sidebar-toggle');
    var $nav = $('#sidebar-nav');
    if (!$toggle.length || !$nav.length) return;
    $toggle.on('click', function () {
      var open = $nav.toggleClass('is-open').hasClass('is-open');
      $toggle.attr('aria-expanded', String(open));
    });
  }

  function initSearch() {
    var $form = $('#header-search');
    if (!$form.length) return;
    $form.on('submit', function (e) {
      // Empty searches go to the plain events list instead of ?q=.
      var q = $.trim($form.find('input[name="q"]').val());
      if (!q) {
        e.preventDefault();
        window.location.href = App.pageUrl('events');
      }
    });
    // Pre-fill from the current ?q= so the box reflects the active search.
    var current = new URLSearchParams(window.location.search).get('q');
    if (current) $form.find('input[name="q"]').val(current);
  }

  function initLogout() {
    $('#logout-btn').on('click', function () {
      App.auth.logout();
      window.location.href = App.pageUrl('login');
    });
  }

  function initBell() {
    $('#notif-bell').on('click', function () {
      // The drawer is a spec requirement, but it would only duplicate the full notifications page.
      if ($('body').data('page') === 'notifications') return;
      App.drawer.toggle();
    });
  }

  function initBanner() {
    var $banner = $('#demo-banner');
    if (!$banner.length) return;
    if (App.config.USE_MOCK) $banner.prop('hidden', false);
  }

  $(function () {
    if (App.guard && App.guard.redirected) return;
    initBanner();
    initCurrentPage();
    if (initGuestState()) return;
    initUserHome();
    initUserName();
    initDropdown();
    initMobileNav();
    initSidebarToggle();
    initSearch();
    initLogout();
    initBell();
  });
})();
