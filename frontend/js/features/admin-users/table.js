(function ($) {
  window.App = window.App || {};
  var ns = (App.adminUsersPage = App.adminUsersPage || {});

  var LIMIT = 10;

  function buildTable(users) {
    var $wrap = $('<div class="table-wrap"></div>');
    var $table = $('<table class="table"></table>').appendTo($wrap);
    $('<caption class="sr-only">Users</caption>').appendTo($table);
    var $head = $('<tr></tr>').appendTo($('<thead></thead>').appendTo($table));
    $.each(['Name', 'Email', 'Role', 'Status', 'Joined', 'Actions'], function (i, h) {
      $('<th scope="col"></th>').text(h).appendTo($head);
    });
    var $tbody = $('<tbody></tbody>').appendTo($table);
    $.each(users, function (i, u) { $tbody.append(ns.buildRow(u)); });
    return $wrap;
  }

  function load() {
    var state = ns.state;
    state.$pagination.prop('hidden', true).empty();
    App.skeleton.show(state.$list, { count: 5, type: 'row' });
    App.api.get('/users', { page: state.page, limit: LIMIT }, { inline: true })
      .done(function (users) {
        users = $.isArray(users) ? users : [];
        if (!users.length) {
          if (state.page > 1) {
            state.page -= 1;
            load();
            return;
          }
          App.skeleton.empty(state.$list, { title: 'No users found', text: 'Accounts will appear here once people sign up.' });
          return;
        }
        var $wrap = buildTable(users);
        state.$list.removeAttr('aria-busy').empty().append($wrap);
        // The API returns no total, so a full page means there may be another one.
        App.ui.pagination(state.$pagination, {
          page: state.page,
          hasMore: users.length === LIMIT,
          onChange: function (p) { state.page = p; load(); },
        });
      })
      .fail(function (err) {
        App.skeleton.error(state.$list, { message: err && err.message, onRetry: load });
      });
  }

  ns.load = load;
})(jQuery);
