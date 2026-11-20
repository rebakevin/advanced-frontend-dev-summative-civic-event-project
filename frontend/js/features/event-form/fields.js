(function () {
  window.App = window.App || {};
  App.eventForm = App.eventForm || {};

  function pad(n) {
    return n < 10 ? '0' + n : String(n);
  }

  // ISO string from the API -> value for <input type="datetime-local"> (local time).
  function toLocalInput(iso) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) +
      'T' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  // datetime-local value -> ISO string for the API.
  function toIso(local) {
    var d = new Date(local);
    return isNaN(d.getTime()) ? '' : d.toISOString();
  }

  function validDate(message) {
    return function (v) {
      return !v || !isNaN(new Date(v).getTime()) ? '' : message || 'Enter a valid date and time';
    };
  }

  function endsAfterStart() {
    return function (v, values) {
      if (!v || !values.starts_at) return '';
      var start = new Date(values.starts_at).getTime();
      var end = new Date(v).getTime();
      if (isNaN(start) || isNaN(end)) return '';
      return end > start ? '' : 'End must be after the start';
    };
  }

  function buildRules() {
    var V = App.validate.rules;
    return {
      title: [V.required('Title is required')],
      description: [],
      location: [V.required('Location is required')],
      starts_at: [V.required('Start date and time is required'), validDate()],
      ends_at: [V.required('End date and time is required'), validDate(), endsAfterStart()],
    };
  }

  App.eventForm.fields = { toLocalInput: toLocalInput, toIso: toIso, buildRules: buildRules };
})();
