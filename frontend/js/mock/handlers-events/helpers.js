// Shared helpers for the /events, /event-registrations and /event-feedback mock handlers.
(function () {
  window.App = window.App || {};
  App.mock = App.mock || {};
  App.mock.internal = App.mock.internal || {};

  var fail = App.mock.error;
  var db = App.mock.db;

  function same(a, b) {
    return String(a) === String(b);
  }

  function userById(id) {
    return db.find('users', id) || {};
  }

  function copy(row) {
    return $.extend(true, {}, row);
  }

  function sortBy(rows, key, dir) {
    return rows.slice().sort(function (a, b) {
      var x = new Date(a[key]).getTime();
      var y = new Date(b[key]).getTime();
      return dir * (x - y);
    });
  }

  function requireEvent(id) {
    return db.require('events', id, 'Event');
  }

  // Postgres would answer a missing uuid with a database error (500).
  function requireField(value) {
    if (value === undefined || value === null || value === '') {
      throw fail(500, 'Internal Server Error');
    }
  }

  function present(value) {
    return value !== undefined && value !== null && value !== '';
  }

  App.mock.internal.eventsHelpers = {
    same: same,
    userById: userById,
    copy: copy,
    sortBy: sortBy,
    requireEvent: requireEvent,
    requireField: requireField,
    present: present,
  };
})();
