(function ($) {
  window.App = window.App || {};
  var ns = (App.feedbackPage = App.feedbackPage || {});

  // Wires the submit handler of the feedback form (create or update, depending on state.existing).
  function bindSubmit() {
    var state = ns.state;
    var $form = state.$form;
    var $submit = state.$submit;

    $form.on('submit', function (e) {
      e.preventDefault();
      var result = App.validate.form($form, state.formRules);
      if (!result.valid) return;

      var body = { rating: Number(result.values.rating), comment: result.values.comment };
      var request;
      if (state.existing) {
        request = App.api.put('/event-feedback/' + state.existing.id, body, { inline: true });
      } else {
        body.event_id = state.id;
        request = App.api.post('/event-feedback', body, { inline: true });
      }

      App.ui.withLoading($submit, request)
        .done(function () {
          App.toast.success(state.existing ? 'Feedback updated.' : 'Thanks for your feedback.');
          // Reload so edit mode has the new row id.
          ns.formState.load();
          ns.adminList.refresh(state.id);
        })
        .fail(function (err) {
          if (err.status === 409) {
            // Already reviewed (e.g. in another tab): switch to edit mode with the saved values.
            App.toast.info(err.message || 'You already left feedback for this event. You can edit it.');
            ns.formState.load();
            return;
          }
          if (err.status === 400 && $.isArray(err.data) && App.validate.showServerErrors($form, err.data)) return;
          App.toast.error(err.message);
        });
    });
  }

  ns.formSubmit = { bind: bindSubmit };
})(jQuery);
