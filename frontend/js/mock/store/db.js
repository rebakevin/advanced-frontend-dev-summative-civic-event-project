(function () {
  window.App = window.App || {};
  App.mock = App.mock || {};
  App.mock.internal = App.mock.internal || {};

  var load = function () { return App.mock.internal.load(); };

  App.mock.internal.db = {
    // Mutable state: {users, events, event_registrations, event_feedback, announcements, promos, notifications, seq}.
    // Rows use the same columns as the PostgreSQL tables. The transport saves after every non-GET request.
    get: load,
    save: function () {
      load();
      App.mock.internal.persist();
    },
    nextId: function (table) {
      var s = load();
      s.seq[table] = (s.seq[table] || 0) + 1;
      return String(s.seq[table]);
    },
    // Row by id (ids compared as strings), or undefined.
    find: function (table, id) {
      var rows = load()[table];
      for (var i = 0; i < rows.length; i++) {
        if (String(rows[i].id) === String(id)) return rows[i];
      }
      return undefined;
    },
    // Row by id, or throws 404 '<label> not found'.
    require: function (table, id, label) {
      var row = App.mock.db.find(table, id);
      if (!row) throw App.mock.error(404, label + ' not found');
      return row;
    },
    remove: function (table, row) {
      var rows = load()[table];
      rows.splice(rows.indexOf(row), 1);
    },
    reset: function () {
      App.mock.internal.reset();
    },
  };
})();
