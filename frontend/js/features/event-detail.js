(function () {
  window.App = window.App || {};

  function eventId() {
    var raw = new URLSearchParams(window.location.search).get('id');
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(raw || '') ? raw : null;
  }

  function notFound() {
    window.location.replace(App.pageUrl('not-found'));
  }

  function buildImage(event) {
    var url = App.events.imageUrl(event);
    var $wrap = $('<div class="aspect-video w-full overflow-hidden bg-blue"></div>');
    if (url) {
      $('<img class="h-full w-full object-cover">').attr({ src: url, alt: 'Image for ' + event.title }).appendTo($wrap);
    } else {
      // Placeholder: decorative initial on a coloured block.
      $('<div class="flex h-full w-full items-center justify-center font-display text-6xl text-white" role="img"></div>')
        .attr('aria-label', 'No image for ' + event.title)
        .text(String(event.title || '?').charAt(0).toUpperCase())
        .appendTo($wrap);
    }
    return $wrap;
  }

  function buildFact(label, $value) {
    var $row = $('<div></div>');
    $('<dt class="font-mono text-xs uppercase tracking-wider text-muted"></dt>').text(label).appendTo($row);
    $('<dd class="m-0"></dd>').append($value).appendTo($row);
    return $row;
  }

  function buildRegisterButton(event, registered) {
    var $btn = $('<button class="btn" type="button" id="register-btn"></button>');

    function render() {
      var isRegistered = $btn.data('registered');
      $btn.text(isRegistered ? 'Cancel registration' : 'Register')
        .toggleClass('btn-ghost', isRegistered)
        .toggleClass('btn-primary', !isRegistered);
    }

    $btn.data('registered', registered);
    render();
    $btn.on('click', function () {
      var next = !$btn.data('registered');
      App.ui.withLoading($btn, App.events.setRegistered(event.id, next))
        .done(function (state) {
          $btn.data('registered', state);
          render();
          App.toast.success(state ? 'You are registered.' : 'Registration cancelled.');
          // The attendee list (admin) is now stale.
          if (App.auth.hasRole('admin')) loadAttendees(event.id);
        });
    });
    return $btn;
  }

  function deleteEvent(event, $btn) {
    App.modal.confirm({
      title: 'Delete event',
      message: 'Delete "' + event.title + '"? This cannot be undone.',
      confirmLabel: 'Delete',
      danger: true,
    }).done(function () {
      App.ui.withLoading($btn, App.api.del('/events/' + event.id, { inline: true }))
        .done(function () {
          App.flash.set('Event deleted.', 'success');
          window.location.href = App.pageUrl('events');
        })
        .fail(function (err) {
          App.toast.error(err.message);
        });
    });
  }

  function buildDetails(event, registered) {
    var $card = $('<article class="card"></article>');
    $card.append(buildImage(event));

    var $body = $('<div class="card-body gap-4 p-6"></div>').appendTo($card);
    $('<h1></h1>').text(event.title).appendTo($body);

    var $facts = $('<dl class="m-0 grid gap-3 sm:grid-cols-2"></dl>').appendTo($body);
    buildFact('Starts', $('<span></span>').text(App.events.formatDateTime(event.starts_at))).appendTo($facts);
    buildFact('Ends', $('<span></span>').text(App.events.formatDateTime(event.ends_at))).appendTo($facts);

    var $where = $('<span></span>').text(event.location || '');
    if (event.location) {
      $where.append(document.createTextNode(' '));
      $('<a target="_blank" rel="noopener"></a>')
        .attr('href', App.events.mapUrl(event.location))
        .text('View on map')
        .append('<span class="sr-only"> (opens in a new tab)</span>')
        .appendTo($where);
    }
    buildFact('Location', $where).appendTo($facts);

    $('<p class="whitespace-pre-line"></p>').text(event.description || '').appendTo($body);

    var $actions = $('<div class="flex flex-wrap items-center gap-3"></div>').appendTo($body);
    $actions.append(buildRegisterButton(event, registered));

    /* ROLE GUARD: Edit and Delete are for admins only, because only admins may change
       or remove events. They carry data-role="admin", so the control guard removes
       them from the DOM for normal users. The backend still enforces this. */
    $('<a class="btn btn-ghost" data-role="admin"></a>')
      .attr('href', App.pageUrl('event-form') + '?id=' + encodeURIComponent(event.id))
      .text('Edit')
      .appendTo($actions);
    var $delete = $('<button class="btn btn-danger" type="button" data-role="admin">Delete</button>')
      .on('click', function () {
        deleteEvent(event, $delete);
      })
      .appendTo($actions);

    /* ROLE GUARD: the attendee list is for admins only, because it exposes other
       users' names and emails. The block is removed for normal users, and the
       attendees endpoint is only called when the signed-in user is an admin. */
    $('<section data-role="admin" id="attendees" class="border-t border-border p-6" aria-labelledby="attendees-heading"></section>')
      .append('<h2 id="attendees-heading" class="mb-3">Attendees</h2>')
      .append('<div id="attendees-list" aria-live="polite"></div>')
      .appendTo($card);

    return $card;
  }

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

  function initEventDetail() {
    var $root = $('#event-detail');
    if (!$root.length) return;

    var id = eventId();
    if (!id) {
      notFound();
      return;
    }

    function load() {
      App.skeleton.show($root, { count: 1 });

      // The wrapper resolves with (data, body); keep only the data so $.when passes it through.
      var event = App.api.get('/events/' + id, null, { inline: true }).then(function (data) {
        return data;
      });
      // A failed registrations call must not hide the event: fall back to "not registered".
      var registered = App.events.loadRegisteredIds({ silent: true }).then(null, function () {
        return $.Deferred().resolve({}).promise();
      });

      $.when(event, registered)
        .done(function (eventData, ids) {
          var $content = buildDetails(eventData, !!ids[eventData.id]);
          $root.empty().removeAttr('aria-busy').append($content);
          App.guard.applyControlGuard($root);
          document.title = eventData.title + ' | ' + document.title;
          loadAttendees(id);
        })
        .fail(function (err) {
          if (err.status === 404) {
            notFound();
            return;
          }
          App.skeleton.error($root, { message: err.message, onRetry: load });
        });
    }

    load();
  }

  $(function () {
    initEventDetail();
  });
})();
