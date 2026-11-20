(function () {
  window.App = window.App || {};

  function eventId() {
    var raw = new URLSearchParams(window.location.search).get('id');
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(raw || '') ? raw : null;
  }

  function notFound() {
    window.location.replace(App.pageUrl('not-found'));
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
          var $content = App.eventDetail.details.build(eventData, !!ids[eventData.id]);
          $root.empty().removeAttr('aria-busy').append($content);
          App.guard.applyControlGuard($root);
          document.title = eventData.title + ' | ' + document.title;
          App.eventDetail.attendees.load(id);
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
