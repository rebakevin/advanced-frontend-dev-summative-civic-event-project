(function () {
  window.App = window.App || {};

  var DATE_FORMAT = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' };
  var TIME_FORMAT = { hour: '2-digit', minute: '2-digit' };

  function parse(value) {
    var date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  }

  function formatDate(value) {
    var date = parse(value);
    return date ? date.toLocaleDateString(undefined, DATE_FORMAT) : '';
  }

  function formatTime(value) {
    var date = parse(value);
    return date ? date.toLocaleTimeString(undefined, TIME_FORMAT) : '';
  }

  function formatDateTime(value) {
    var date = formatDate(value);
    return date ? date + ', ' + formatTime(value) : '';
  }

  // The API has no published filter for events. Missing flag counts as published.
  function isPublished(event) {
    return event.published !== false;
  }

  function imageUrl(event) {
    return (event && event.metadata && event.metadata.image_url) || '';
  }

  // Map link built from the location text only (no geocoding).
  function mapUrl(location) {
    return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(location || '');
  }

  // The backend keeps cancelled registrations as rows, so only 'registered' counts.
  function activeOnly(registrations) {
    return $.grep($.isArray(registrations) ? registrations : [], function (reg) {
      return reg.status === 'registered';
    });
  }

  // Resolves with the signed-in user's active registrations (array).
  function loadActiveRegistrations(opts) {
    return App.api.get('/event-registrations/my-registrations', null, opts).then(activeOnly);
  }

  function registeredIds(registrations) {
    var ids = {};
    $.each(activeOnly(registrations), function (i, reg) {
      ids[reg.event_id] = true;
    });
    return ids;
  }

  // Resolves with {eventId: true} for the signed-in user's active registrations.
  function loadRegisteredIds(opts) {
    return loadActiveRegistrations(opts).then(registeredIds);
  }

  // Toggles registration. Resolves with the new state (true = registered).
  // Cancelled rows still exist in the backend, so register after cancel answers 409.
  function setRegistered(eventId, register) {
    // Admins cannot register; the UI hides the buttons, this is the backstop.
    if (register && App.auth.hasRole('admin')) return $.Deferred().reject({ status: 403, message: 'Admins cannot register for events.' }).promise();
    var path = register ? '/event-registrations/register' : '/event-registrations/cancel';
    var dfd = $.Deferred();
    App.api.post(path, { event_id: eventId }, { inline: true })
      .done(function () {
        dfd.resolve(register);
      })
      .fail(function (err) {
        if (register && err.status === 409) {
          // "Already registered": the state is already what the user asked for.
          App.toast.info(err.message);
          dfd.resolve(true);
          return;
        }
        if (!register && err.status === 404) {
          App.toast.info(err.message);
          dfd.resolve(false);
          return;
        }
        App.toast.error(err.message);
        dfd.reject(err);
      });
    return dfd.promise();
  }

  App.events = {
    formatDate: formatDate,
    formatTime: formatTime,
    formatDateTime: formatDateTime,
    isPublished: isPublished,
    imageUrl: imageUrl,
    mapUrl: mapUrl,
    loadActiveRegistrations: loadActiveRegistrations,
    loadRegisteredIds: loadRegisteredIds,
    setRegistered: setRegistered,
  };
})();
