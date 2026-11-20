(function () {
  window.App = window.App || {};
  var L = (App.layoutInternal = App.layoutInternal || {});

  // Marks the link whose data-match list contains the current page name.
  L.initCurrentPage = function () {
    var page = $('body').attr('data-page') || '';
    $('.header-link, .sidebar-link').each(function () {
      var names = ($(this).attr('data-match') || '').split(/\s+/);
      if (page && names.indexOf(page) !== -1) $(this).attr('aria-current', 'page');
      else $(this).removeAttr('aria-current');
    });
  };

  // Guests (and public pages like not-found) see only the logo.
  L.initGuestState = function () {
    var guest = $('body').attr('data-guard') === 'guest' || !App.auth.isLoggedIn();
    if (!guest) return false;
    $('#header-search, #primary-nav, #header-menu, #header-actions, #notif-bell, #profile-dropdown, #nav-toggle').prop('hidden', true);
    $('#notif-drawer, #drawer-backdrop').remove();
    return true;
  };

  // Regular users land on their dashboard, so the logo and a Dashboard tab lead back to it.
  // Admins have their own Dashboard link, so the user-only tab is removed for them.
  L.initUserHome = function () {
    if (App.auth.hasRole('admin')) {
      $('#primary-nav [data-role="user"]').remove();
      return;
    }
    $('.header-logo').attr('href', App.pageUrl('my-dashboard'));
  };

  L.initUserName = function () {
    var $name = $('#header-user-name');
    if (!$name.length) return;
    var user = App.auth.getUser();
    if (user && user.full_name) $name.text(user.full_name);
  };

  L.initBanner = function () {
    var $banner = $('#demo-banner');
    if (!$banner.length) return;
    if (App.config.USE_MOCK) $banner.prop('hidden', false);
  };
})();
