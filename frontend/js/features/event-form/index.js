/* ROLE GUARD: admin only. Creating, editing and deleting events is for admins.
   The page guard (page.json "admin") sends other users to the forbidden page, and the
   backend enforces the same rule on POST, PUT and DELETE /events. The client never
   sends role or is_active. */
(function () {
  window.App = window.App || {};

  function initEventForm() {
    var $form = $('#event-form');
    if (!$form.length) return;

    var eventId = new URLSearchParams(window.location.search).get('id');

    // Shared state for the parts in App.eventForm.
    var ctx = {
      $form: $form,
      eventId: eventId,
      isEdit: !!eventId,
      existingImage: '',
      $state: $('#event-form-state'),
      $submit: $('#event-submit'),
      $delete: $('#event-delete'),
      $preview: $('#image-preview'),
      $image: $('#image'),
      formRules: App.eventForm.fields.buildRules(),
      imageRule: App.upload.rules.image,
    };
    var view = App.eventForm.view;

    App.validate.bindLive($form, ctx.formRules);
    // Changing the start re-checks the end, which depends on it.
    $('#starts_at').on('change', function () {
      if ($('#ends_at').val()) App.validate.validateField($form, ctx.formRules, 'ends_at');
    });

    App.upload.bindInput(ctx.$image, ctx.imageRule, {
      $preview: ctx.$preview,
    });
    // After a cleared or rejected selection the saved image is shown again.
    ctx.$image.on('change', function () {
      if (!ctx.$image.val()) view.showExistingImage(ctx);
    });

    $form.on('submit', function (e) {
      App.eventForm.submit.onSubmit(ctx, e);
    });

    ctx.$delete.on('click', function () {
      App.eventForm.submit.onDelete(ctx);
    });

    if (ctx.isEdit) {
      view.setMode(ctx, 'Edit event', 'Save changes');
      ctx.$delete.prop('hidden', false);
      view.load(ctx);
    } else {
      view.setMode(ctx, 'Create event', 'Create event');
      view.showForm(ctx);
    }
  }

  $(function () {
    initEventForm();
  });
})();
