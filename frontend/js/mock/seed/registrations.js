(function () {
  window.App = window.App || {};
  App.mock = App.mock || {};
  App.mock.internal = App.mock.internal || {};
  App.mock.internal.seed = App.mock.internal.seed || {};

  // Builds the event_registrations table. `c` is the helper set from clock.js.
  App.mock.internal.seed.event_registrations = function (c) {
    var at = c.at;

    // status is 'registered' or 'cancelled' (cancelled rows are kept, like the backend).
    function reg(id, userId, eventId, status, daysAgo) {
      return {
        id: id,
        user_id: userId,
        event_id: eventId,
        status: status,
        created_at: at(-daysAgo),
        updated_at: at(-daysAgo),
      };
    }

    var eventRegistrations = [
      reg(1, 2, 2, 'registered', 5),
      reg(2, 2, 3, 'registered', 4),
      reg(3, 2, 7, 'registered', 20),
      reg(4, 2, 8, 'registered', 40),
      reg(5, 2, 6, 'cancelled', 2),
      reg(6, 3, 2, 'registered', 6),
      reg(7, 3, 4, 'registered', 3),
      reg(8, 3, 7, 'registered', 18),
      reg(9, 4, 2, 'registered', 4),
      reg(10, 4, 3, 'registered', 2),
      reg(11, 4, 8, 'registered', 35),
      reg(12, 5, 3, 'registered', 3),
      reg(13, 5, 4, 'registered', 1),
      reg(14, 5, 7, 'registered', 15),
      reg(15, 6, 6, 'registered', 1),
    ];

    return eventRegistrations;
  };
})();
