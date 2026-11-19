/* ROLE GUARD: admin only. This page is guarded by guard.js (role "admin"; users are sent to "forbidden").
   The enable/disable controls are admin-only because only admins may change account access; the backend enforces it.
   The client never sends role or is_active, and an admin cannot disable their own account here. */
(function ($) {
  window.App = window.App || {};

  var LIMIT = 10;

  function initAdminUsers() {
    var $list = $('#users-list');
    if (!$list.length) return;
    var $pagination = $('#users-pagination');
    var page = 1;
    var me = App.auth.getUser();
    var myId = me ? me.id : null;

    function statusBadge(active) {
      return $('<span class="badge"></span>')
        .addClass(active ? 'badge-green' : 'badge-red').text(active ? 'Active' : 'Disabled');
    }

    function roleBadge(role) {
      return $('<span class="badge"></span>').addClass(role === 'admin' ? 'badge-blue' : 'badge-draft').text(role || '');
    }

    function applyStatus($row, user) {
      $row.find('.user-status').empty().append(statusBadge(user.is_active));
      $row.find('.user-toggle').text(user.is_active ? 'Disable' : 'Enable')
        .toggleClass('btn-danger', !!user.is_active).toggleClass('btn-primary', !user.is_active)
        .attr('aria-label', (user.is_active ? 'Disable ' : 'Enable ') + user.full_name);
    }

    function openProfile(user) {
      var $body = $('<div></div>');
      var $done = $('<button class="btn btn-ghost" type="button">Close</button>');
      var dialog = App.modal.open({ title: user.full_name || 'User profile', $body: $body, $footer: $done });
      $done.on('click', function () { dialog.close(); });

      function fill(u) {
        $body.empty().removeAttr('aria-busy');
        var $dl = $('<dl class="grid gap-3"></dl>').appendTo($body);
        function row(label, value) {
          var $r = $('<div></div>').appendTo($dl);
          $('<dt class="text-sm text-muted"></dt>').text(label).appendTo($r);
          var $dd = $('<dd class="m-0"></dd>').appendTo($r);
          if (value && value.jquery) $dd.append(value); else $dd.text(value || '');
        }
        row('Name', u.full_name);
        row('Email', u.email);
        row('Role', roleBadge(u.role));
        row('Status', statusBadge(u.is_active));
        row('Created', App.events.formatDateTime(u.created_at));
        row('Last updated', App.events.formatDateTime(u.updated_at));
      }
      function load() {
        App.skeleton.show($body, { count: 3, type: 'line' });
        App.api.get('/users/' + encodeURIComponent(user.id), null, { inline: true })
          .done(fill)
          .fail(function (err) {
            App.skeleton.error($body, { message: err && err.message, onRetry: load });
          });
      }
      load();
    }

    function toggleUser(user, $tr, $toggle) {
      var disabling = !!user.is_active;
      App.modal.confirm({
        title: disabling ? 'Disable user?' : 'Enable user?',
        message: disabling
          ? user.full_name + ' will no longer be able to sign in.'
          : user.full_name + ' will be able to sign in again.',
        confirmLabel: disabling ? 'Disable' : 'Enable',
        danger: disabling,
      }).done(function () {
        var req = App.api.patch('/users/' + encodeURIComponent(user.id) + (disabling ? '/disable' : '/enable'), null, { inline: true });
        App.ui.withLoading($toggle, req).done(function () {
          user.is_active = !disabling;
          applyStatus($tr, user);
          App.toast.success(user.full_name + (disabling ? ' disabled.' : ' enabled.'));
        });
      });
    }

    function buildRow(user) {
      var $tr = $('<tr></tr>');
      $('<td></td>').text(user.full_name).appendTo($tr);
      $('<td></td>').text(user.email).appendTo($tr);
      $('<td></td>').append(roleBadge(user.role)).appendTo($tr);
      $('<td class="user-status"></td>').appendTo($tr);
      $('<td></td>').text(App.events.formatDate(user.created_at)).appendTo($tr);
      var $actions = $('<td class="table-actions"></td>').appendTo($tr);

      var $view = $('<button class="btn btn-sm btn-ghost" type="button"></button>')
        .attr('aria-label', 'View profile of ' + user.full_name).text('View profile').appendTo($actions);
      $view.on('click', function () { openProfile(user); });

      /* ROLE GUARD: admin only. Enable/disable changes account access; the backend enforces the role.
         The signed-in admin cannot disable their own account. */
      var $toggle = $('<button class="btn btn-sm user-toggle" type="button"></button>').appendTo($actions);
      applyStatus($tr, user);
      if (String(user.id) === String(myId)) {
        $toggle.prop('disabled', true);
        $('<span class="text-sm text-muted"></span>').attr('id', 'user-self-' + user.id)
          .text('This is your account.').appendTo($actions);
        $toggle.attr('aria-describedby', 'user-self-' + user.id);
      } else {
        $toggle.on('click', function () { toggleUser(user, $tr, $toggle); });
      }
      return $tr;
    }

    function load() {
      $pagination.prop('hidden', true).empty();
      App.skeleton.show($list, { count: 5, type: 'row' });
      App.api.get('/users', { page: page, limit: LIMIT }, { inline: true })
        .done(function (users) {
          users = $.isArray(users) ? users : [];
          if (!users.length) {
            if (page > 1) {
              page -= 1;
              load();
              return;
            }
            App.skeleton.empty($list, { title: 'No users found', text: 'Accounts will appear here once people sign up.' });
            return;
          }
          var $wrap = $('<div class="table-wrap"></div>');
          var $table = $('<table class="table"></table>').appendTo($wrap);
          $('<caption class="sr-only">Users</caption>').appendTo($table);
          var $head = $('<tr></tr>').appendTo($('<thead></thead>').appendTo($table));
          $.each(['Name', 'Email', 'Role', 'Status', 'Joined', 'Actions'], function (i, h) {
            $('<th scope="col"></th>').text(h).appendTo($head);
          });
          var $tbody = $('<tbody></tbody>').appendTo($table);
          $.each(users, function (i, u) { $tbody.append(buildRow(u)); });
          $list.removeAttr('aria-busy').empty().append($wrap);
          // The API returns no total, so a full page means there may be another one.
          App.ui.pagination($pagination, {
            page: page,
            hasMore: users.length === LIMIT,
            onChange: function (p) { page = p; load(); },
          });
        })
        .fail(function (err) {
          App.skeleton.error($list, { message: err && err.message, onRetry: load });
        });
    }

    load();
  }

  $(function () {
    initAdminUsers();
  });
})(jQuery);
