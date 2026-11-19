(function () {
  window.App = window.App || {};

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

    var $rating = $('#feedback-rating');
    var $comment = $('#feedback-comment');
    var $submit = $('#feedback-submit');
    // The signed-in user's existing feedback for this event, or null (create mode).
    var existing = null;

    var formRules = {
      rating: [V.required('Choose a rating'), validRating('Rating must be between 1 and 5')],
      comment: [],
    };

    App.validate.bindLive($form, formRules);

    function setMode(entry) {
      existing = entry;
      $rating.val(entry ? String(entry.rating) : '');
      $comment.val(entry ? entry.comment || '' : '');
      $submit.text(entry ? 'Update feedback' : 'Submit feedback');
      $('#feedback-heading').text(entry ? 'Your feedback' : 'Leave feedback');
    }

    function setBusy(busy) {
      $form.attr('aria-busy', busy ? 'true' : 'false');
      $rating.add($comment).add($submit).prop('disabled', busy);
    }

    // Finds this event's entry among the user's feedback. Resolves with the entry or null.
    function fetchMine() {
      return App.api.get('/event-feedback/my-feedback', null, { silent: true }).then(function (rows) {
        var found = null;
        $.each(rows || [], function (i, row) {
          if (row.event_id === id) found = row;
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

    $form.on('submit', function (e) {
      e.preventDefault();
      var result = App.validate.form($form, formRules);
      if (!result.valid) return;

      var body = { rating: Number(result.values.rating), comment: result.values.comment };
      var request;
      if (existing) {
        request = App.api.put('/event-feedback/' + existing.id, body, { inline: true });
      } else {
        body.event_id = id;
        request = App.api.post('/event-feedback', body, { inline: true });
      }

      App.ui.withLoading($submit, request)
        .done(function () {
          App.toast.success(existing ? 'Feedback updated.' : 'Thanks for your feedback.');
          // Reload so edit mode has the new row id.
          load();
          refreshAdminList(id);
        })
        .fail(function (err) {
          if (err.status === 409) {
            // Already reviewed (e.g. in another tab): switch to edit mode with the saved values.
            App.toast.info(err.message || 'You already left feedback for this event. You can edit it.');
            load();
            return;
          }
          if (err.status === 400 && $.isArray(err.data) && App.validate.showServerErrors($form, err.data)) return;
          App.toast.error(err.message);
        });
    });

    load();
  }

  function renderAverage($avg, rows) {
    if (!rows.length) {
      $avg.prop('hidden', true).text('');
      return;
    }
    var total = 0;
    $.each(rows, function (i, row) {
      total += Number(row.rating) || 0;
    });
    var avg = (total / rows.length).toFixed(1);
    $avg.text('Average rating: ' + avg + ' / 5 from ' + rows.length + (rows.length === 1 ? ' review' : ' reviews'))
      .prop('hidden', false);
  }

  function renderList($list, rows) {
    var $ul = $('<ul class="m-0 flex list-none flex-col gap-3 p-0"></ul>');
    $.each(rows, function (i, row) {
      var $li = $('<li class="card card-pad"></li>').appendTo($ul);
      var $head = $('<div class="flex flex-wrap items-baseline gap-x-3"></div>').appendTo($li);
      $('<span class="font-semibold"></span>').text(row.full_name).appendTo($head);
      $('<span class="text-muted"></span>').text(row.email).appendTo($head);
      // Text, not stars only, so the rating never relies on shape or colour.
      $('<p class="m-0 font-mono text-sm"></p>').text('Rating: ' + row.rating + ' / 5').appendTo($li);
      if (row.comment) $('<p class="m-0 mt-1 whitespace-pre-line"></p>').text(row.comment).appendTo($li);
      var when = App.events && App.events.formatDateTime(row.created_at);
      if (when) $('<p class="card-meta m-0 mt-1"></p>').text(when).appendTo($li);
    });
    $list.removeAttr('aria-busy').empty().append($ul);
  }

  function refreshAdminList(id) {
    /* ROLE GUARD: the full feedback list and the average rating are for admins only,
       because the backend only lets admins read every user's feedback. The block is
       removed for normal users, and the admin endpoint is never called for them. */
    if (!App.auth.hasRole('admin')) return;
    var $list = $('#feedback-list');
    if (!$list.length) return;
    var $avg = $('#feedback-average');

    App.skeleton.show($list, { type: 'row', count: 3 });
    $avg.prop('hidden', true);
    App.api.get('/event-feedback/event/' + id, null, { inline: true })
      .done(function (rows) {
        rows = rows || [];
        if (!rows.length) {
          App.skeleton.empty($list, { title: 'No feedback yet', text: 'Nobody has reviewed this event.' });
          return;
        }
        renderAverage($avg, rows);
        renderList($list, rows);
      })
      .fail(function (err) {
        App.skeleton.error($list, {
          message: err.message,
          onRetry: function () {
            refreshAdminList(id);
          },
        });
      });
  }

  $(function () {
    var id = eventId();
    // A missing or invalid id is handled (redirect) by event-detail.js.
    if (!id) return;
    initUserFeedback(id);
    refreshAdminList(id);
  });
})();
