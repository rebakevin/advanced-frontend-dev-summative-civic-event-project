(function ($) {
  window.App = window.App || {};

  var PAGE_SIZE = 9;

  function initEvents() {
    var $list = $('#events-list');
    if (!$list.length) return;

    var $pagination = $('#events-pagination');
    var $count = $('#events-count');
    var $form = $('#events-filters');
    var $q = $('#filter-q');
    var $date = $('#filter-date');
    var $location = $('#filter-location');

    var all = [];
    var registered = {};
    var page = 1;

    $q.val(new URLSearchParams(window.location.search).get('q') || '');

    function isAdmin() {
      return App.auth.hasRole('admin');
    }

    // Local YYYY-MM-DD, to compare with the value of <input type="date">.
    function dayKey(value) {
      var d = new Date(value);
      if (isNaN(d.getTime())) return '';
      var m = d.getMonth() + 1;
      var day = d.getDate();
      return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (day < 10 ? '0' : '') + day;
    }

    function visible() {
      /* ROLE GUARD: unpublished events are for admins only. Normal users never see them
         in the list (the API returns every event, so the filter runs here). Admins see
         all events with a Draft badge. UX only; the backend does not hide them. */
      return $.grep(all, function (ev) {
        return isAdmin() || App.events.isPublished(ev);
      });
    }

    function fillLocations() {
      var seen = {};
      var current = $location.val();
      $location.find('option:not(:first)').remove();
      $.each(visible(), function (i, ev) {
        if (ev.location && !seen[ev.location]) {
          seen[ev.location] = true;
          $('<option></option>').val(ev.location).text(ev.location).appendTo($location);
        }
      });
      if (seen[current]) $location.val(current);
    }

    function filtered() {
      var q = $.trim($q.val()).toLowerCase();
      var date = $date.val();
      var loc = $location.val();
      return $.grep(visible(), function (ev) {
        if (q && ((ev.title || '') + ' ' + (ev.location || '')).toLowerCase().indexOf(q) === -1) return false;
        if (date && dayKey(ev.starts_at) !== date) return false;
        if (loc && ev.location !== loc) return false;
        return true;
      });
    }

    function buildCard(ev) {
      var imageUrl = App.events.imageUrl(ev);
      var $card = $('<article class="card"></article>');

      var $img = $('<div class="card-img"></div>').appendTo($card);
      if (imageUrl) {
        $('<img loading="lazy">').attr({ src: imageUrl, alt: 'Image for ' + ev.title }).appendTo($img);
      } else {
        $('<span class="sr-only"></span>').text('No image for ' + ev.title).appendTo($img);
      }
      if (!App.events.isPublished(ev)) {
        $('<span class="badge badge-draft"></span>').text('Draft').appendTo($img);
      }

      var $body = $('<div class="card-body"></div>').appendTo($card);
      $('<h2 class="card-title"></h2>').text(ev.title).appendTo($body);
      $('<p class="card-meta"></p>').text(App.events.formatDateTime(ev.starts_at)).appendTo($body);
      $('<p class="card-meta"></p>').text(ev.location || '').appendTo($body);
      if (ev.description) {
        $('<p class="line-clamp-3"></p>').text(ev.description).appendTo($body);
      }

      var $actions = $('<div class="card-actions"></div>').appendTo($card);
      $('<a class="btn btn-sm btn-ghost"></a>')
        .attr({ href: App.pageUrl('event-detail', { id: ev.id }), 'aria-label': 'View ' + ev.title })
        .text('View').appendTo($actions);

      var $reg = $('<button class="btn btn-sm btn-primary" type="button"></button>').appendTo($actions);
      function paintReg() {
        var on = !!registered[ev.id];
        $reg.text(on ? 'Cancel registration' : 'Register')
          .toggleClass('btn-primary', !on).toggleClass('btn-ghost', on)
          .attr('aria-label', (on ? 'Cancel registration for ' : 'Register for ') + ev.title);
      }
      paintReg();
      $reg.on('click', function () {
        var want = !registered[ev.id];
        App.ui.withLoading($reg, App.events.setRegistered(ev.id, want)).done(function (state) {
          registered[ev.id] = state;
          if (!state) delete registered[ev.id];
          paintReg();
          if (want && state) App.toast.success('You are registered for ' + ev.title + '.');
          else if (!want) App.toast.success('Registration cancelled.');
        });
      });

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
          App.ui.withLoading($del, App.api.del('/events/' + ev.id, { inline: true }))
            .done(function () {
              all = $.grep(all, function (e) { return e.id !== ev.id; });
              App.toast.success('Event deleted.');
              fillLocations();
              render();
            })
            .fail(function (err) {
              App.toast.error(err.message);
            });
        });
      });

      App.guard.applyControlGuard($card);
      return $card;
    }

    function render() {
      var items = filtered();
      var pages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
      if (page > pages) page = pages;

      if (!items.length) {
        $count.text('');
        $pagination.prop('hidden', true).empty();
        var hasFilter = $.trim($q.val()) || $date.val() || $location.val();
        App.skeleton.empty($list, {
          title: hasFilter ? 'No events match your filters' : 'No events yet',
          text: hasFilter ? 'Try a different search, date or location.' : 'Check back soon for upcoming events.',
        });
        return;
      }

      $count.text(items.length + (items.length === 1 ? ' event' : ' events'));
      $list.removeAttr('aria-busy').empty();
      $.each(items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), function (i, ev) {
        $list.append(buildCard(ev));
      });
      App.ui.pagination($pagination, { page: page, pages: pages, onChange: function (p) { page = p; render(); } });
    }

    function load() {
      $pagination.prop('hidden', true).empty();
      $count.text('');
      App.skeleton.show($list, { count: 6 });
      // Registration state is not critical: the list still works if it fails.
      var regs = App.events.loadRegisteredIds({ inline: true }).then(null, function () {
        return $.Deferred().resolve({}).promise();
      });
      $.when(App.api.get('/events', null, { inline: true }), regs)
        .done(function (events, ids) {
          all = $.isArray(events) ? events : [];
          registered = ids || {};
          fillLocations();
          page = 1;
          render();
        })
        .fail(function (err) {
          App.skeleton.error($list, { message: err && err.message, onRetry: load });
        });
    }

    $form.on('submit', function (e) { e.preventDefault(); });
    $q.on('input', function () { page = 1; render(); });
    $date.add($location).on('change', function () { page = 1; render(); });

    load();
  }

  $(function () {
    initEvents();
  });
})(jQuery);
