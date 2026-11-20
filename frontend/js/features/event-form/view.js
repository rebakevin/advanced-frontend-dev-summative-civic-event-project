(function () {
  window.App = window.App || {};
  App.eventForm = App.eventForm || {};

  function showExistingImage(ctx) {
    if (!ctx.existingImage) return;
    var img = document.createElement('img');
    img.setAttribute('src', ctx.existingImage);
    img.setAttribute('alt', 'Current event image');
    ctx.$preview.empty().append(img).prop('hidden', false);
  }

  function fill(ctx, event) {
    $('#title').val(event.title || '');
    $('#description').val(event.description || '');
    $('#location').val(event.location || '');
    $('#starts_at').val(App.eventForm.fields.toLocalInput(event.starts_at));
    $('#ends_at').val(App.eventForm.fields.toLocalInput(event.ends_at));
    ctx.existingImage = App.events.imageUrl(event);
    showExistingImage(ctx);
  }

  function setMode(ctx, heading, submitLabel) {
    $('#event-form-title').text(heading);
    ctx.$submit.text(submitLabel);
  }

  function showForm(ctx) {
    App.skeleton.hide(ctx.$state);
    ctx.$state.empty();
    ctx.$form.prop('hidden', false);
    $('#title').trigger('focus');
  }

  function load(ctx) {
    ctx.$form.prop('hidden', true);
    App.skeleton.show(ctx.$state, { type: 'line', count: 6 });
    App.api.get('/events/' + encodeURIComponent(ctx.eventId), null, { inline: true })
      .done(function (event) {
        if (!event) {
          window.location.replace(App.pageUrl('not-found'));
          return;
        }
        fill(ctx, event);
        showForm(ctx);
      })
      .fail(function (err) {
        if (err.status === 404) {
          window.location.replace(App.pageUrl('not-found'));
          return;
        }
        App.skeleton.error(ctx.$state, { message: err.message, onRetry: function () { load(ctx); } });
      });
  }

  App.eventForm.view = {
    showExistingImage: showExistingImage,
    setMode: setMode,
    showForm: showForm,
    load: load,
  };
})();
