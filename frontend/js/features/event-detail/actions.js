(function () {
  window.App = window.App || {};
  App.eventDetail = App.eventDetail || {};

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
          if (App.auth.hasRole('admin')) App.eventDetail.attendees.load(event.id);
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

  App.eventDetail.actions = { buildRegisterButton: buildRegisterButton, deleteEvent: deleteEvent };
})();
