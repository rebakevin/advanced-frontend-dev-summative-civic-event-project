(function ($) {
  window.App = window.App || {};
  var ns = (App.feedbackPage = App.feedbackPage || {});

  var V = App.validate.rules;

  function eventId() {
    var raw = new URLSearchParams(window.location.search).get('id');
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(raw || '') ? raw : null;
  }

  function validRating(message) {
    return function (v) {
      return /^[1-5]$/.test(String(v)) ? '' : message;
    };
  }

  function initUserFeedback(id) {
    var $form = $('#feedback-form');
    if (!$form.length) return;

    var state = ns.state;
    state.id = id;
    state.$form = $form;
    state.$rating = $('#feedback-rating');
    state.$comment = $('#feedback-comment');
    state.$submit = $('#feedback-submit');
    state.existing = null;
    state.formRules = {
      rating: [V.required('Choose a rating'), validRating('Rating must be between 1 and 5')],
      comment: [],
    };

    App.validate.bindLive($form, state.formRules);
    ns.formSubmit.bind();
    ns.formState.load();
  }

  $(function () {
    var id = eventId();
    // A missing or invalid id is handled (redirect) by event-detail.js.
    if (!id) return;
    initUserFeedback(id);
    ns.adminList.refresh(id);
  });
})(jQuery);
