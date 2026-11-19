/* ROLE GUARD: admin only. This page is an admin tool: the page guard (data-guard="admin") sends
   everyone else to "forbidden", and the Delete control carries data-role="admin" so it is
   removed for non-admins. The backend enforces the real rule on DELETE /notifications/:id. */
(function ($) {
  window.App = window.App || {};

  function initAdminNotifications() {
    var $root = $('#admin-notifications');
    if (!$root.length) return;

    function showEmpty() {
      App.skeleton.empty($root, {
        title: 'No notifications',
        text: 'Notifications created by the system will show up here.',
      });
    }

    function buildRow(n) {
      var title = n.title || 'Notification #' + n.id;
      var $tr = $('<tr></tr>').data('id', n.id);
      $('<td></td>').text(title).appendTo($tr);
      $('<td></td>').append($('<span></span>').addClass(App.notifications.chipClass(n.type))
        .text(App.notifications.typeLabel(n.type))).appendTo($tr);
      $('<td></td>').text(App.notifications.preview(n.message)).appendTo($tr);
      $('<td></td>').text(n.recipient_id == null ? 'Broadcast' : 'Targeted').appendTo($tr);
      $('<td></td>').text(App.events.formatDateTime(n.created_at)).appendTo($tr);

      var $actions = $('<td class="table-actions"></td>').appendTo($tr);
      /* ROLE GUARD: Delete is for admins only (data-role="admin"). */
      var $del = $('<button class="btn btn-sm btn-danger" type="button" data-role="admin"></button>')
        .attr('aria-label', 'Delete notification ' + title).text('Delete').appendTo($actions);

      $del.on('click', function () {
        App.modal.confirm({
          title: 'Delete notification?',
          message: 'Delete "' + title + '"? This removes it for everyone and cannot be undone.',
          confirmLabel: 'Delete',
          cancelLabel: 'Keep it',
          danger: true,
        }).done(function () { remove(n, $tr); });
      });
      return $tr;
    }

    // Optimistic: the row goes first; on failure it is put back where it was.
    function remove(n, $tr) {
      var $tbody = $tr.parent();
      var $prev = $tr.prev();
      $tr.detach();
      if (!$tbody.children().length) showEmpty();

      App.api.del('/notifications/' + n.id, { inline: true })
        .done(function () {
          App.toast.success('Notification deleted.');
          App.notifications.forget(n.id);
        })
        .fail(function (err) {
          if (!$root.find('tbody').length) renderTable([n]);
          else if ($prev.length && $prev.parent().length) $prev.after($tr);
          else $root.find('tbody').prepend($tr);
          App.toast.error((err && err.message) || 'Could not delete the notification.');
        });
    }

    function renderTable(list) {
      var $wrap = $('<div class="table-wrap"></div>');
      var $table = $('<table class="table table-zebra"></table>').appendTo($wrap);
      $('<caption class="sr-only"></caption>').text('All notifications').appendTo($table);
      var $head = $('<tr></tr>').appendTo($('<thead></thead>').appendTo($table));
      $.each(['Title', 'Type', 'Message', 'Audience', 'Created', 'Actions'], function (i, label) {
        $('<th scope="col"></th>').text(label).appendTo($head);
      });
      var $body = $('<tbody></tbody>').appendTo($table);
      $.each(list, function (i, n) { $body.append(buildRow(n)); });
      $root.removeAttr('aria-busy').empty().append($wrap);
    }

    function load() {
      App.skeleton.show($root, { count: 5, type: 'row' });
      App.notifications.load({ force: true, inline: true })
        .done(function (list) {
          if (!list.length) {
            showEmpty();
            return;
          }
          renderTable(list);
        })
        .fail(function (err) {
          App.skeleton.error($root, { message: err && err.message, onRetry: load });
        });
    }

    load();
  }

  $(function () {
    initAdminNotifications();
  });
})(jQuery);
