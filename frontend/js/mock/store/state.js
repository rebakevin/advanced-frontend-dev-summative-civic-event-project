(function () {
  window.App = window.App || {};
  App.mock = App.mock || {};
  App.mock.internal = App.mock.internal || {};

  // Bump the version when the seed changes, so browsers drop their saved copy of the old seed.
  var STATE_KEY = 'civic.mock.v2';
  var TABLES = ['users', 'events', 'event_registrations', 'event_feedback', 'announcements', 'promos', 'notifications'];

  var state = null;

  // The backend uses string UUIDs and the pages compare ids strictly, so seed ids become strings.
  function stringifyIds(obj) {
    Object.keys(obj).forEach(function (key) {
      var value = obj[key];
      if (typeof value === 'number' && (key === 'id' || key === 'created_by' || /_id$/.test(key))) {
        obj[key] = String(value);
      } else if (value && typeof value === 'object') {
        stringifyIds(value);
      }
    });
    return obj;
  }

  function fresh() {
    var seed = stringifyIds(App.mock.seed ? App.mock.seed() : {});
    TABLES.forEach(function (table) {
      seed[table] = seed[table] || [];
    });
    seed.seq = {};
    TABLES.forEach(function (table) {
      seed.seq[table] = seed[table].reduce(function (max, row) {
        return Math.max(max, Number(row.id) || 0);
      }, 0);
    });
    return seed;
  }

  function persist() {
    try {
      window.localStorage.setItem(STATE_KEY, JSON.stringify(state));
    } catch (e) { /* storage full or blocked: state lives for this page only */ }
  }

  function load() {
    if (state) return state;
    try {
      var raw = window.localStorage.getItem(STATE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && parsed.seq && Array.isArray(parsed.users)) {
          state = App.mock.internal.sanitize(parsed);
          return state;
        }
      }
    } catch (e) { /* fall through to a fresh seed */ }
    state = fresh();
    persist();
    return state;
  }

  function reset() {
    state = null;
    try { window.localStorage.removeItem(STATE_KEY); } catch (e) { /* ignore */ }
    load();
  }

  App.mock.internal.load = load;
  App.mock.internal.persist = persist;
  App.mock.internal.reset = reset;
})();
