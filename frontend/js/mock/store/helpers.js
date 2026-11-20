(function () {
  window.App = window.App || {};
  App.mock = App.mock || {};
  App.mock.internal = App.mock.internal || {};

  App.mock.internal.now = function () {
    return new Date().toISOString();
  };

  // Newest first by created_at (ISO strings sort lexically).
  App.mock.internal.sortNewest = function (rows) {
    return rows.sort(function (a, b) {
      return String(b.created_at).localeCompare(String(a.created_at));
    });
  };

  // Parses ?page & ?limit (defaults 1 and 20, bad values fall back) and slices `rows`.
  // Returns {items, page, limit, total, pages}.
  App.mock.internal.paginate = function (rows, query) {
    var page = parseInt(query.page, 10);
    var limit = parseInt(query.limit, 10);
    page = page > 0 ? page : 1;
    limit = limit > 0 ? limit : 20;
    return {
      items: rows.slice((page - 1) * limit, page * limit),
      page: page,
      limit: limit,
      total: rows.length,
      pages: Math.ceil(rows.length / limit),
    };
  };

  // Mirrors Notifications.create (a model function in the backend, not an HTTP route).
  // Call from handlers that create events, announcements or promos.
  App.mock.internal.notify = function (data) {
    var row = {
      id: App.mock.db.nextId('notifications'),
      title: data.title,
      message: data.message,
      type: data.type,
      recipient_id: data.recipient_id === undefined ? null : data.recipient_id,
      metadata: data.metadata || {},
      created_by: data.created_by === undefined ? null : data.created_by,
      read: false,
      created_at: App.mock.now(),
      updated_at: App.mock.now(),
    };
    App.mock.internal.load().notifications.push(row);
    return row;
  };
})();
