/* Mock API: /announcements/* and /promos/* (mirrors backend routes, controllers, models, upload middleware). */
(function () {
  window.App = window.App || {};
  App.mock = App.mock || {};

  App.mock.internal.announcementRoutes.register();
  App.mock.internal.promoRoutes.register();
})();
