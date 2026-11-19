(function ($) {
  window.App = window.App || {};

  function initAnnouncements() {
    var $list = $('#announcements-list');
    if (!$list.length) return;

    var $count = $('#announcements-count');
    var all = [];

    function isAdmin() {
      return App.auth.hasRole('admin');
    }

    function visible() {
      /* ROLE GUARD: unpublished announcements are for admins only. Normal users never
         see them in the list (the API returns every announcement, so the filter runs
         here). Admins see all with a Draft badge. UX only; the backend does not hide them. */
      return $.grep(all, function (a) {
        return isAdmin() || App.announcements.isPublished(a);
      });
    }

    function buildCard(a) {
      var $card = $('<article class="card"></article>');
      var $body = $('<div class="card-body"></div>').appendTo($card);

      var $title = $('<h2 class="card-title"></h2>').text(a.title).appendTo($body);
      if (!App.announcements.isPublished(a)) {
        $('<span class="badge badge-draft ml-2"></span>').text('Draft').appendTo($title);
      }
      $('<p class="card-meta"></p>').text(App.events.formatDate(a.created_at)).appendTo($body);
      var $duration = $('<p class="card-meta"></p>').text('Loading duration...').appendTo($body);
      App.announcements.loadDuration(a.audio_url, function (seconds) {
        $duration.text('Duration ' + App.announcements.formatDuration(seconds));
      }, function () {
        $duration.text('Duration unavailable');
      });

      var $actions = $('<div class="card-actions"></div>').appendTo($card);
      $('<a class="btn btn-sm btn-primary"></a>')
        .attr({ href: App.pageUrl('announcement-detail', { id: a.id }), 'aria-label': 'Listen to ' + a.title })
        .text('Listen').appendTo($actions);

      /* ROLE GUARD: Edit, Publish/Unpublish and Delete are admin-only (create/edit/
         delete/publish announcements, spec section 2). They carry data-role="admin" and
         are removed from the DOM for normal users by applyControlGuard. The backend
         rejects these calls for non-admins too. */
      $('<a class="btn btn-sm btn-ghost" data-role="admin"></a>')
        .attr({ href: App.pageUrl('announcement-form', { id: a.id }), 'aria-label': 'Edit ' + a.title })
        .text('Edit').appendTo($actions);

      var $pub = $('<button class="btn btn-sm btn-ghost" type="button" data-role="admin"></button>').appendTo($actions);
      var on0 = App.announcements.isPublished(a);
      $pub.text(on0 ? 'Unpublish' : 'Publish')
        .attr('aria-label', (on0 ? 'Unpublish ' : 'Publish ') + a.title);
      $pub.on('click', function () {
        var want = !App.announcements.isPublished(a);
        App.ui.withLoading($pub, App.announcements.setPublished(a, want))
          .done(function () {
            a.published = want;
            $pub.text(want ? 'Unpublish' : 'Publish')
              .attr('aria-label', (want ? 'Unpublish ' : 'Publish ') + a.title);
            if (want) {
              $title.find('.badge-draft').remove();
            } else if (!$title.find('.badge-draft').length) {
              $('<span class="badge badge-draft ml-2"></span>').text('Draft').appendTo($title);
            }
            App.toast.success(want ? 'Announcement published.' : 'Announcement unpublished.');
            // A user-facing list never shows drafts; admins keep the card.
            if (!visible().length) render();
          })
          .fail(function (err) {
            App.toast.error(err.message);
          });
      });

      var $del = $('<button class="btn btn-sm btn-danger" type="button" data-role="admin"></button>')
        .attr('aria-label', 'Delete ' + a.title).text('Delete').appendTo($actions);
      $del.on('click', function () {
        App.announcements.confirmDelete(a, $del, function () {
          all = $.grep(all, function (x) { return x.id !== a.id; });
          App.toast.success('Announcement deleted.');
          $card.remove();
          if (visible().length) updateCount();
          else render();
        });
      });

      App.guard.applyControlGuard($card);
      return $card;
    }

    function updateCount() {
      var n = visible().length;
      $count.text(n + (n === 1 ? ' announcement' : ' announcements'));
    }

    function render() {
      var items = visible();
      if (!items.length) {
        $count.text('');
        App.skeleton.empty($list, {
          title: 'No announcements yet',
          text: 'Check back soon for new audio announcements.',
        });
        return;
      }
      updateCount();
      $list.removeAttr('aria-busy').empty();
      $.each(items, function (i, a) {
        $list.append(buildCard(a));
      });
    }

    function load() {
      $count.text('');
      App.skeleton.show($list, { count: 6 });
      // The API defaults to 20 rows and has no pagination data, so ask for plenty.
      App.api.get('/announcements', { limit: 100 }, { inline: true })
        .done(function (items) {
          all = $.isArray(items) ? items : [];
          render();
        })
        .fail(function (err) {
          App.skeleton.error($list, { message: err && err.message, onRetry: load });
        });
    }

    load();
  }

  $(function () {
    initAnnouncements();
  });
})(jQuery);
