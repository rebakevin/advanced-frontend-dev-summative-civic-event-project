(function () {
  window.App = window.App || {};
  App.mock = App.mock || {};
  App.mock.internal = App.mock.internal || {};
  App.mock.internal.seed = App.mock.internal.seed || {};

  // Demo credentials shown on the login page in demo mode.
  App.mock.demoAccounts = [
    { role: 'admin', email: 'admin@civicevents.test', password: 'Admin#1234' },
    { role: 'user', email: 'user@civicevents.test', password: 'User#1234' },
  ];

  // Seed data is rebuilt on every call so dates stay relative to "now".
  App.mock.seed = function () {
    var parts = App.mock.internal.seed;
    var c = parts.helpers(Date.now());

    return {
      users: parts.users(c),
      events: parts.events(c),
      event_registrations: parts.event_registrations(c),
      event_feedback: parts.event_feedback(c),
      announcements: parts.announcements(c),
      promos: parts.promos(c),
      notifications: parts.notifications(c),
    };
  };
})();
