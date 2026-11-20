(function () {
  window.App = window.App || {};
  App.eventDetail = App.eventDetail || {};

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

  function buildFacts(event, $body) {
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
  }

  function buildActions(event, registered, $body) {
    var $actions = $('<div class="flex flex-wrap items-center gap-3"></div>').appendTo($body);
    /* ROLE GUARD: admins manage events, they do not attend them, so they get no Register button. */
    if (!App.auth.hasRole('admin')) $actions.append(App.eventDetail.actions.buildRegisterButton(event, registered));

    /* ROLE GUARD: Edit and Delete are for admins only, because only admins may change
       or remove events. They carry data-role="admin", so the control guard removes
       them from the DOM for normal users. The backend still enforces this. */
    $('<a class="btn btn-ghost" data-role="admin"></a>')
      .attr('href', App.pageUrl('event-form') + '?id=' + encodeURIComponent(event.id))
      .text('Edit')
      .appendTo($actions);
    var $delete = $('<button class="btn btn-danger" type="button" data-role="admin">Delete</button>')
      .on('click', function () {
        App.eventDetail.actions.deleteEvent(event, $delete);
      })
      .appendTo($actions);
  }

  function buildDetails(event, registered) {
    var $card = $('<article class="card"></article>');
    $card.append(buildImage(event));

    var $body = $('<div class="card-body gap-4 p-6"></div>').appendTo($card);
    $('<h1></h1>').text(event.title).appendTo($body);
    buildFacts(event, $body);
    $('<p class="whitespace-pre-line"></p>').text(event.description || '').appendTo($body);
    buildActions(event, registered, $body);

    /* ROLE GUARD: the attendee list is for admins only, because it exposes other
       users' names and emails. The block is removed for normal users, and the
       attendees endpoint is only called when the signed-in user is an admin. */
    $('<section data-role="admin" id="attendees" class="border-t border-border p-6" aria-labelledby="attendees-heading"></section>')
      .append('<h2 id="attendees-heading" class="mb-3">Attendees</h2>')
      .append('<div id="attendees-list" aria-live="polite"></div>')
      .appendTo($card);

    return $card;
  }

  App.eventDetail.details = { build: buildDetails };
})();
