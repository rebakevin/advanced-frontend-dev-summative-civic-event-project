(function ($) {
  window.App = window.App || {};

  function initRegistrations() {
    var $list = $('#registrations-list');
    if (!$list.length) return;

    function buildCard(reg) {
      // The backend joins the event fields flat onto each registration row.
      var title = reg.title || 'Event #' + reg.event_id;
      var $card = $('<article class="card"></article>');

      var $body = $('<div class="card-body"></div>').appendTo($card);
      $('<h2 class="card-title"></h2>').text(title).appendTo($body);
      $('<p class="card-meta"></p>').text(App.events.formatDateTime(reg.starts_at)).appendTo($body);
      $('<p class="card-meta"></p>').text(reg.location || '').appendTo($body);

      var $actions = $('<div class="card-actions"></div>').appendTo($card);
      $('<a class="btn btn-sm btn-ghost"></a>')
        .attr({ href: App.pageUrl('event-detail', { id: reg.event_id }), 'aria-label': 'View ' + title })
        .text('View').appendTo($actions);
      var $cancel = $('<button class="btn btn-sm btn-danger" type="button"></button>')
        .attr('aria-label', 'Cancel registration for ' + title).text('Cancel registration').appendTo($actions);

      $cancel.on('click', function () {
        App.modal.confirm({
          title: 'Cancel registration?',
          message: 'Cancel your registration for "' + title + '"?',
          confirmLabel: 'Cancel registration',
          cancelLabel: 'Keep it',
          danger: true,
        }).done(function () {
          App.ui.withLoading($cancel, App.events.setRegistered(reg.event_id, false)).done(function () {
            App.toast.success('Registration cancelled.');
            $card.remove();
            if (!$list.children().length) showEmpty();
          });
        });
      });
      return $card;
    }

    function showEmpty() {
      App.skeleton.empty($list, {
        title: 'No registrations yet',
        text: 'Register for an event and it will show up here.',
        actionLabel: 'Browse events',
        href: App.pageUrl('events'),
      });
    }

    function load() {
      App.skeleton.show($list, { count: 3 });
      App.api.get('/event-registrations/my-registrations', null, { inline: true })
        .done(function (regs) {
          var active = $.grep($.isArray(regs) ? regs : [], function (r) { return r.status === 'registered'; });
          if (!active.length) {
            showEmpty();
            return;
          }
          $list.removeAttr('aria-busy').empty();
          $.each(active, function (i, reg) { $list.append(buildCard(reg)); });
        })
        .fail(function (err) {
          App.skeleton.error($list, { message: err && err.message, onRetry: load });
        });
    }

    load();
  }

  $(function () {
    initRegistrations();
  });
})(jQuery);
