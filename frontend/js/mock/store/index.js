(function () {
  window.App = window.App || {};
  App.mock = App.mock || {};
  App.mock.internal = App.mock.internal || {};

  // Assembles the public App.mock API from the parts in this folder.
  var internal = App.mock.internal;

  App.mock.db = internal.db;
  App.mock.assetUrl = internal.assetUrl;
  App.mock.fileUrl = internal.fileUrl;
  App.mock.ok = internal.ok;
  App.mock.error = internal.error;
  App.mock.isError = internal.isError;
  App.mock.makeToken = internal.makeToken;
  App.mock.userFromToken = internal.userFromToken;
  App.mock.requireUser = internal.requireUser;
  App.mock.requireAdmin = internal.requireAdmin;
  App.mock.now = internal.now;
  App.mock.sortNewest = internal.sortNewest;
  App.mock.paginate = internal.paginate;
  App.mock.notify = internal.notify;
  App.mock.route = internal.route;
  App.mock.match = internal.match;
})();
