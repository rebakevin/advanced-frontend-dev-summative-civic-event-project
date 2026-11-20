(function ($) {
  window.App = window.App || {};
  var ns = (App.feedbackPage = App.feedbackPage || {});

  function renderAverage($avg, rows) {
    if (!rows.length) {
      $avg.prop('hidden', true).text('');
      return;
    }
    var total = 0;
    $.each(rows, function (i, row) {
      total += Number(row.rating) || 0;
    });
    var avg = (total / rows.length).toFixed(1);
    $avg.text('Average rating: ' + avg + ' / 5 from ' + rows.length + (rows.length === 1 ? ' review' : ' reviews'))
      .prop('hidden', false);
  }

  function renderList($list, rows) {
    var $ul = $('<ul class="m-0 flex list-none flex-col gap-3 p-0"></ul>');
    $.each(rows, function (i, row) {
      var $li = $('<li class="card card-pad"></li>').appendTo($ul);
      var $head = $('<div class="flex flex-wrap items-baseline gap-x-3"></div>').appendTo($li);
      $('<span class="font-semibold"></span>').text(row.full_name).appendTo($head);
      $('<span class="text-muted"></span>').text(row.email).appendTo($head);
      // Text, not stars only, so the rating never relies on shape or colour.
      $('<p class="m-0 font-mono text-sm"></p>').text('Rating: ' + row.rating + ' / 5').appendTo($li);
      if (row.comment) $('<p class="m-0 mt-1 whitespace-pre-line"></p>').text(row.comment).appendTo($li);
      var when = App.events && App.events.formatDateTime(row.created_at);
      if (when) $('<p class="card-meta m-0 mt-1"></p>').text(when).appendTo($li);
    });
    $list.removeAttr('aria-busy').empty().append($ul);
  }

  function refreshAdminList(id) {
    /* ROLE GUARD: the full feedback list and the average rating are for admins only,
       because the backend only lets admins read every user's feedback. The block is
       removed for normal users, and the admin endpoint is never called for them. */
    if (!App.auth.hasRole('admin')) return;
    var $list = $('#feedback-list');
    if (!$list.length) return;
    var $avg = $('#feedback-average');

    App.skeleton.show($list, { type: 'row', count: 3 });
    $avg.prop('hidden', true);
    App.api.get('/event-feedback/event/' + id, null, { inline: true })
      .done(function (rows) {
        rows = rows || [];
        if (!rows.length) {
          App.skeleton.empty($list, { title: 'No feedback yet', text: 'Nobody has reviewed this event.' });
          return;
        }
        renderAverage($avg, rows);
        renderList($list, rows);
      })
      .fail(function (err) {
        App.skeleton.error($list, {
          message: err.message,
          onRetry: function () {
            refreshAdminList(id);
          },
        });
      });
  }

  ns.adminList = { refresh: refreshAdminList };
})(jQuery);
