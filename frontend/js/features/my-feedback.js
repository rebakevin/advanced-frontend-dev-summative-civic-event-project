/* ROLE GUARD: signed-in users only (guard.js sends guests to login). This page shows your own feedback; the backend scopes the data to the token, so no other user's data is requested. */
(function ($) {
  window.App = window.App || {};

  function initMyFeedback() {
    var $list = $('#my-feedback-list');
    if (!$list.length) return;

    function buildCard(row) {
      var title = row.title || 'Event #' + row.event_id;
      var $card = $('<article class="card"></article>');

      var $body = $('<div class="card-body"></div>').appendTo($card);
      $('<h2 class="card-title"></h2>').text(title).appendTo($body);
      // Text, not stars only, so the rating never relies on shape or colour.
      $('<p class="card-meta"></p>').text('Rating: ' + row.rating + ' / 5').appendTo($body);
      if (row.comment) $('<p></p>').text(row.comment).appendTo($body);
      var when = App.events.formatDateTime(row.created_at);
      if (when) $('<p class="card-meta"></p>').text(when).appendTo($body);

      var $actions = $('<div class="card-actions"></div>').appendTo($card);
      $('<a class="btn btn-sm btn-ghost"></a>')
        .attr({ href: App.pageUrl('event-detail', { id: row.event_id }), 'aria-label': 'Edit feedback for ' + title })
        .text('View event').appendTo($actions);
      return $card;
    }

    function load() {
      App.skeleton.show($list, { count: 3 });
      App.api.get('/event-feedback/my-feedback', null, { inline: true })
        .done(function (rows) {
          rows = rows || [];
          if (!rows.length) {
            App.skeleton.empty($list, {
              title: 'No feedback yet',
              text: 'Open an event and leave your feedback.',
              actionLabel: 'Browse events',
              href: App.pageUrl('events'),
            });
            return;
          }
          $list.removeAttr('aria-busy').empty();
          $.each(rows, function (i, row) { $list.append(buildCard(row)); });
        })
        .fail(function (err) {
          App.skeleton.error($list, { message: err && err.message, onRetry: load });
        });
    }

    load();
  }

  $(function () {
    initMyFeedback();
  });
})(jQuery);
