(function ($) {
  window.App = window.App || {};
  App.eventsList = App.eventsList || {};

  function isAdmin() {
    return App.auth.hasRole('admin');
  }

  // Local YYYY-MM-DD, to compare with the value of <input type="date">.
  function dayKey(value) {
    var d = new Date(value);
    if (isNaN(d.getTime())) return '';
    var m = d.getMonth() + 1;
    var day = d.getDate();
    return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (day < 10 ? '0' : '') + day;
  }

  function visible(ctx) {
    /* ROLE GUARD: unpublished events are for admins only. Normal users never see them
       in the list (the API returns every event, so the filter runs here). Admins see
       all events with a Draft badge. UX only; the backend does not hide them. */
    return $.grep(ctx.all, function (ev) {
      return isAdmin() || App.events.isPublished(ev);
    });
  }

  function fillLocations(ctx) {
    var seen = {};
    var current = ctx.$location.val();
    ctx.$location.find('option:not(:first)').remove();
    $.each(visible(ctx), function (i, ev) {
      if (ev.location && !seen[ev.location]) {
        seen[ev.location] = true;
        $('<option></option>').val(ev.location).text(ev.location).appendTo(ctx.$location);
      }
    });
    if (seen[current]) ctx.$location.val(current);
  }

  function filtered(ctx) {
    var q = $.trim(ctx.$q.val()).toLowerCase();
    var date = ctx.$date.val();
    var loc = ctx.$location.val();
    return $.grep(visible(ctx), function (ev) {
      if (q && ((ev.title || '') + ' ' + (ev.location || '')).toLowerCase().indexOf(q) === -1) return false;
      if (date && dayKey(ev.starts_at) !== date) return false;
      if (loc && ev.location !== loc) return false;
      return true;
    });
  }

  App.eventsList.filters = {
    isAdmin: isAdmin,
    visible: visible,
    fillLocations: fillLocations,
    filtered: filtered,
  };
})(jQuery);
