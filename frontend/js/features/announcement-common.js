(function () {
  window.App = window.App || {};

  // The API returns every announcement; a missing flag counts as published.
  function isPublished(item) {
    return item.published !== false;
  }

  // Seconds -> "m:ss". Empty when not a finite number. Announcements are short (max 5 MB).
  function formatDuration(seconds) {
    if (typeof seconds !== 'number' || !isFinite(seconds) || seconds < 0) return '';
    var total = Math.floor(seconds);
    var s = total % 60;
    return Math.floor(total / 60) + ':' + (s < 10 ? '0' : '') + s;
  }

  // audio_url -> seconds, so re-renders do not request metadata again.
  var durations = {};

  // The API has no duration field. Read it from the audio metadata.
  // Calls done(seconds) on success and fail() when the file cannot be read.
  function loadDuration(url, done, fail) {
    if (durations.hasOwnProperty(url)) {
      done(durations[url]);
      return;
    }
    var audio = document.createElement('audio');
    function release() {
      audio.removeAttribute('src');
      audio.load();
    }
    audio.preload = 'metadata';
    audio.addEventListener('loadedmetadata', function () {
      durations[url] = audio.duration;
      release();
      done(durations[url]);
    });
    audio.addEventListener('error', function () {
      release();
      if (fail) fail();
    });
    audio.src = url;
  }

  function id(item) {
    return encodeURIComponent(item.id);
  }

  // Publish/unpublish. Resolves with the updated announcement when the API returns it.
  function setPublished(item, publish) {
    return App.api.patch('/announcements/' + id(item) + (publish ? '/publish' : '/unpublish'), null, { inline: true });
  }

  // Confirm, then delete. Calls onDone() after success; errors show as a toast.
  function confirmDelete(item, $btn, onDone) {
    App.modal.confirm({
      title: 'Delete announcement?',
      message: 'Delete "' + item.title + '"? This cannot be undone.',
      confirmLabel: 'Delete',
      danger: true,
    }).done(function () {
      App.ui.withLoading($btn, App.api.del('/announcements/' + id(item), { inline: true }))
        .done(onDone)
        .fail(function (err) {
          App.toast.error(err.message);
        });
    });
  }

  App.announcements = {
    isPublished: isPublished,
    formatDuration: formatDuration,
    loadDuration: loadDuration,
    setPublished: setPublished,
    confirmDelete: confirmDelete,
  };
})();
