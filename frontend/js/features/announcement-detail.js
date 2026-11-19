(function () {
  window.App = window.App || {};

  function announcementId() {
    var raw = new URLSearchParams(window.location.search).get('id');
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(raw || '') ? raw : null;
  }

  function notFound() {
    window.location.replace(App.pageUrl('not-found'));
  }

  function buildPlayer(a) {
    var $player = $('<div class="audio-player"></div>');
    $('<label class="audio-label" for="announcement-audio"></label>').text(a.title).appendTo($player);

    var $audio = $('<audio id="announcement-audio" class="audio-el" controls preload="metadata"></audio>')
      .attr('src', a.audio_url)
      .text('Your browser does not support audio playback. You can download the file instead.')
      .appendTo($player);

    var $time = $('<p class="audio-time"></p>').appendTo($player);
    var $current = $('<span class="audio-current">0:00</span>').appendTo($time);
    $time.append(document.createTextNode(' / '));
    var $duration = $('<span class="audio-duration">0:00</span>').appendTo($time);

    var $fallback = $('<p class="audio-fallback" role="alert" hidden></p>')
      .text('This audio could not be played. The file may be missing or in an unsupported format.')
      .appendTo($player);

    var el = $audio[0];
    function paintDuration() {
      var text = App.announcements.formatDuration(el.duration);
      if (text) $duration.text(text);
    }
    $audio.on('loadedmetadata', paintDuration);
    $audio.on('durationchange', paintDuration);
    $audio.on('timeupdate', function () {
      $current.text(App.announcements.formatDuration(el.currentTime) || '0:00');
    });
    $audio.on('error', function () {
      $fallback.prop('hidden', false);
      $duration.text('unavailable');
    });
    return $player;
  }

  function buildDetails(a) {
    var $card = $('<article class="card"></article>');
    var $body = $('<div class="card-body gap-4 p-6"></div>').appendTo($card);

    var $h1 = $('<h1></h1>').text(a.title).appendTo($body);
    if (!App.announcements.isPublished(a)) {
      $('<span class="badge badge-draft ml-2"></span>').text('Draft').appendTo($h1);
    }
    $('<p class="card-meta"></p>').text('Posted ' + App.events.formatDate(a.created_at)).appendTo($body);

    $body.append(buildPlayer(a));

    var $actions = $('<div class="flex flex-wrap items-center gap-3"></div>').appendTo($body);

    /* ROLE GUARD: Edit, Publish/Unpublish and Delete are for admins only, because only
       admins may change, publish or remove announcements. They carry data-role="admin",
       so the control guard removes them from the DOM for normal users. The backend
       still enforces this. */
    $('<a class="btn btn-ghost" data-role="admin"></a>')
      .attr('href', App.pageUrl('announcement-form', { id: a.id }))
      .text('Edit').appendTo($actions);

    var $pub = $('<button class="btn btn-ghost" type="button" data-role="admin"></button>')
      .text(App.announcements.isPublished(a) ? 'Unpublish' : 'Publish').appendTo($actions);
    $pub.on('click', function () {
      var want = !App.announcements.isPublished(a);
      App.ui.withLoading($pub, App.announcements.setPublished(a, want))
        .done(function () {
          a.published = want;
          $pub.text(want ? 'Unpublish' : 'Publish');
          if (want) {
            $h1.find('.badge-draft').remove();
          } else if (!$h1.find('.badge-draft').length) {
            $('<span class="badge badge-draft ml-2"></span>').text('Draft').appendTo($h1);
          }
          App.toast.success(want ? 'Announcement published.' : 'Announcement unpublished.');
        })
        .fail(function (err) {
          App.toast.error(err.message);
        });
    });

    var $del = $('<button class="btn btn-danger" type="button" data-role="admin">Delete</button>').appendTo($actions);
    $del.on('click', function () {
      App.announcements.confirmDelete(a, $del, function () {
        App.flash.set('Announcement deleted.', 'success');
        window.location.href = App.pageUrl('announcements');
      });
    });

    return $card;
  }

  function initAnnouncementDetail() {
    var $root = $('#announcement-detail');
    if (!$root.length) return;

    var id = announcementId();
    if (!id) {
      notFound();
      return;
    }

    function load() {
      App.skeleton.show($root, { count: 1 });
      App.api.get('/announcements/' + id, null, { inline: true })
        .done(function (a) {
          if (!a) {
            notFound();
            return;
          }
          /* ROLE GUARD: a draft is for admins only. A normal user who opens a draft by
             URL is sent to the not-found page. UX only; the backend does not hide it. */
          if (!App.announcements.isPublished(a) && !App.auth.hasRole('admin')) {
            notFound();
            return;
          }
          $root.empty().removeAttr('aria-busy').append(buildDetails(a));
          App.guard.applyControlGuard($root);
          document.title = a.title + ' | ' + document.title;
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
    initAnnouncementDetail();
  });
})();
