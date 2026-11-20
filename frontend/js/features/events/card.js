(function ($) {
  window.App = window.App || {};
  App.eventsList = App.eventsList || {};

  function buildImage(ev, $card) {
    var imageUrl = App.events.imageUrl(ev);
    var $img = $('<div class="card-img"></div>').appendTo($card);
    if (imageUrl) {
      $('<img loading="lazy">').attr({ src: imageUrl, alt: 'Image for ' + ev.title }).appendTo($img);
    } else {
      $('<span class="sr-only"></span>').text('No image for ' + ev.title).appendTo($img);
    }
    if (!App.events.isPublished(ev)) {
      $('<span class="badge badge-draft"></span>').text('Draft').appendTo($img);
    }
  }

  function buildBody(ev, $card) {
    var $body = $('<div class="card-body"></div>').appendTo($card);
    $('<h2 class="card-title"></h2>').text(ev.title).appendTo($body);
    $('<p class="card-meta"></p>').text(App.events.formatDateTime(ev.starts_at)).appendTo($body);
    $('<p class="card-meta"></p>').text(ev.location || '').appendTo($body);
    if (ev.description) {
      $('<p class="line-clamp-3"></p>').text(ev.description).appendTo($body);
    }
  }

  function addRegisterButton(ctx, ev, $actions) {
    /* ROLE GUARD: admins manage events, they do not attend them, so they get no Register button. */
    var $reg = $('<button class="btn btn-sm btn-primary" type="button"></button>');
    if (!App.eventsList.filters.isAdmin()) $reg.appendTo($actions);
    function paintReg() {
      var on = !!ctx.registered[ev.id];
      $reg.text(on ? 'Cancel registration' : 'Register')
        .toggleClass('btn-primary', !on).toggleClass('btn-ghost', on)
        .attr('aria-label', (on ? 'Cancel registration for ' : 'Register for ') + ev.title);
    }
    paintReg();
    $reg.on('click', function () {
      var want = !ctx.registered[ev.id];
      App.ui.withLoading($reg, App.events.setRegistered(ev.id, want)).done(function (state) {
        ctx.registered[ev.id] = state;
        if (!state) delete ctx.registered[ev.id];
        paintReg();
        if (want && state) App.toast.success('You are registered for ' + ev.title + '.');
        else if (!want) App.toast.success('Registration cancelled.');
      });
    });
  }

  function addAdminButtons(ctx, ev, $actions) {
    /* ROLE GUARD: Edit and Delete are admin-only (create/edit/delete events, spec
       section 2). They carry data-role="admin" and are removed from the DOM for normal
       users by applyControlGuard. The backend rejects these calls for non-admins too. */
    $('<a class="btn btn-sm btn-ghost" data-role="admin"></a>')
      .attr({ href: App.pageUrl('event-form', { id: ev.id }), 'aria-label': 'Edit ' + ev.title })
      .text('Edit').appendTo($actions);
    var $del = $('<button class="btn btn-sm btn-danger" type="button" data-role="admin"></button>')
      .attr('aria-label', 'Delete ' + ev.title).text('Delete').appendTo($actions);
    $del.on('click', function () {
      App.modal.confirm({
        title: 'Delete event?',
        message: 'Delete "' + ev.title + '"? This cannot be undone.',
        confirmLabel: 'Delete',
        danger: true,
      }).done(function () {
        App.ui.withLoading($del, App.events.deleteEvent(ev.id))
          .done(function () {
            ctx.all = $.grep(ctx.all, function (e) { return e.id !== ev.id; });
            App.toast.success('Event deleted.');
            App.eventsList.filters.fillLocations(ctx);
            App.eventsList.render.render(ctx);
          })
          .fail(function (err) {
            App.toast.error(err.message);
          });
      });
    });
  }

  function buildCard(ctx, ev) {
    var $card = $('<article class="card"></article>');
    buildImage(ev, $card);
    buildBody(ev, $card);

    var $actions = $('<div class="card-actions"></div>').appendTo($card);
    $('<a class="btn btn-sm btn-ghost"></a>')
      .attr({ href: App.pageUrl('event-detail', { id: ev.id }), 'aria-label': 'View ' + ev.title })
      .text('View').appendTo($actions);
    addRegisterButton(ctx, ev, $actions);
    addAdminButtons(ctx, ev, $actions);

    App.guard.applyControlGuard($card);
    return $card;
  }

  App.eventsList.card = { build: buildCard };
})(jQuery);
