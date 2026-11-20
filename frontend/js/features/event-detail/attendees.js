(function () {
  window.App = window.App || {};
  App.eventDetail = App.eventDetail || {};

  function renderAttendees($list, rows) {
    var attendees = $.grep(rows || [], function (row) {
      return row.status === 'registered';
    });
    if (!attendees.length) {
      App.skeleton.empty($list, { title: 'No attendees yet', text: 'Nobody has registered for this event.' });
      return;
    }
    var $ul = $('<ul class="m-0 flex list-none flex-col gap-2 p-0"></ul>');
    $.each(attendees, function (i, row) {
      var $li = $('<li class="flex flex-wrap items-baseline gap-x-3"></li>').appendTo($ul);
      $('<span class="font-semibold"></span>').text(row.full_name).appendTo($li);
      $('<span class="text-muted"></span>').text(row.email).appendTo($li);
    });
    $list.removeAttr('aria-busy').empty().append($('<p class="mb-2 text-muted"></p>').text(attendees.length + ' registered')).append($ul);
  }

  function loadAttendees(id) {
    // Never reached for normal users: the list block is removed for them too.
    if (!App.auth.hasRole('admin')) return;
    var $list = $('#attendees-list');
    if (!$list.length) return;
    App.skeleton.show($list, { type: 'row', count: 3 });
    App.api.get('/event-registrations/event/' + id + '/attendees', null, { inline: true })
      .done(function (rows) {
        renderAttendees($list, rows);
      })
      .fail(function (err) {
        App.skeleton.error($list, {
          message: err.message,
          onRetry: function () {
            loadAttendees(id);
          },
        });
      });
  }

  App.eventDetail.attendees = { load: loadAttendees };
})();
