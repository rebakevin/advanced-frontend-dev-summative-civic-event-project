(function () {
  window.App = window.App || {};
  var L = App.layoutInternal;

  $(function () {
    if (App.guard && App.guard.redirected) return;
    L.initBanner();
    L.initCurrentPage();
    if (L.initGuestState()) return;
    L.initUserHome();
    L.initUserName();
    L.initDropdown();
    L.initMobileNav();
    L.initSidebarToggle();
    L.initSearch();
    L.initLogout();
    L.initBell();
  });
})();
