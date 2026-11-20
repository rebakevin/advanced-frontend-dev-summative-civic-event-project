(function ($) {
  window.App = window.App || {};
  var ns = (App.feedbackPage = App.feedbackPage || {});

  // Shared state of the user feedback form. index.js fills it in when the page starts.
  // existing: the signed-in user's feedback for this event, or null (create mode).
  var state = (ns.state = {
    id: null,
    $form: null,
    $rating: null,
    $comment: null,
    $submit: null,
    existing: null,
    formRules: null,
  });

  function setMode(entry) {
    state.existing = entry;
    state.$rating.val(entry ? String(entry.rating) : '');
    state.$comment.val(entry ? entry.comment || '' : '');
    state.$submit.text(entry ? 'Update feedback' : 'Submit feedback');
    $('#feedback-heading').text(entry ? 'Your feedback' : 'Leave feedback');
  }

  function setBusy(busy) {
    state.$form.attr('aria-busy', busy ? 'true' : 'false');
    state.$rating.add(state.$comment).add(state.$submit).prop('disabled', busy);
  }

  // Finds this event's entry among the user's feedback. Resolves with the entry or null.
  function fetchMine() {
    return App.api.get('/event-feedback/my-feedback', null, { silent: true }).then(function (rows) {
      var found = null;
      $.each(rows || [], function (i, row) {
        if (row.event_id === state.id) found = row;
      });
      return found;
    });
  }

  function load() {
    setBusy(true);
    fetchMine()
      .done(function (entry) {
        setMode(entry);
        setBusy(false);
      })
      .fail(function (err) {
        // Stay disabled: submitting without knowing the mode could hit the 409 rule.
        App.toast.show({
          type: 'error',
          message: err.message || 'We could not load your feedback.',
          actionLabel: 'Retry',
          onAction: load,
        });
      });
  }

  ns.formState = {
    setMode: setMode,
    setBusy: setBusy,
    fetchMine: fetchMine,
    load: load,
  };
})(jQuery);
