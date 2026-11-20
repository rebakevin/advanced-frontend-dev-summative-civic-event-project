(function () {
  window.App = window.App || {};
  App.eventForm = App.eventForm || {};

  function onSubmit(ctx, e) {
    e.preventDefault();
    var result = App.validate.form(ctx.$form, ctx.formRules);

    // The image is optional, but a chosen file is checked again before it is sent.
    var file = ctx.$image[0].files && ctx.$image[0].files[0];
    if (file) {
      var res = App.upload.check(file, ctx.imageRule);
      if (!res.ok) {
        App.validate.showError(ctx.$image, res.message);
        if (result.valid) ctx.$image.trigger('focus');
        return;
      }
    }
    if (!result.valid) return;

    var v = result.values;
    var fd = new FormData();
    fd.append('title', $.trim(v.title));
    fd.append('description', $.trim(v.description));
    fd.append('location', $.trim(v.location));
    fd.append('starts_at', App.eventForm.fields.toIso(v.starts_at));
    fd.append('ends_at', App.eventForm.fields.toIso(v.ends_at));
    if (file) fd.append('image', file);

    $('#image-progress').empty();
    var req = App.upload.send(ctx.isEdit ? '/events/' + encodeURIComponent(ctx.eventId) : '/events', fd, {
      method: ctx.isEdit ? 'PUT' : 'POST',
      $progressContainer: $('#image-progress'),
      inline: true,
    });

    App.ui.withLoading(ctx.$submit, req)
      .done(function (event) {
        var id = (event && event.id) || ctx.eventId;
        App.flash.set(ctx.isEdit ? 'Event updated.' : 'Event created.', 'success');
        window.location.href = ctx.isEdit && id ? App.pageUrl('event-detail', { id: id }) : App.pageUrl('events');
      })
      .fail(function (err) {
        if (err.status === 400) {
          if (!(Array.isArray(err.data) && App.validate.showServerErrors(ctx.$form, err.data))) {
            App.toast.error(err.message);
          }
          return;
        }
        App.toast.error(err.message);
      });
  }

  function onDelete(ctx) {
    App.modal.confirm({
      title: 'Delete this event?',
      message: 'This removes the event for everyone. This cannot be undone.',
      confirmLabel: 'Delete event',
      danger: true,
    }).done(function () {
      App.ui.withLoading(ctx.$delete, App.api.del('/events/' + encodeURIComponent(ctx.eventId), { inline: true }))
        .done(function () {
          App.flash.set('Event deleted.', 'success');
          window.location.href = App.pageUrl('events');
        })
        .fail(function (err) {
          App.toast.error(err.message);
        });
    });
  }

  App.eventForm.submit = { onSubmit: onSubmit, onDelete: onDelete };
})();
