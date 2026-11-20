(function () {
  window.App = window.App || {};
  App.mock = App.mock || {};
  App.mock.internal = App.mock.internal || {};
  App.mock.internal.seed = App.mock.internal.seed || {};

  // Builds the event_feedback table. `c` is the helper set from clock.js.
  App.mock.internal.seed.event_feedback = function (c) {
    var at = c.at;

    function feedback(id, userId, eventId, rating, comment, daysAgo) {
      return {
        id: id,
        user_id: userId,
        event_id: eventId,
        rating: rating,
        comment: comment,
        created_at: at(-daysAgo),
        updated_at: at(-daysAgo),
      };
    }

    // Feedback only for past events (7 and 8).
    var eventFeedback = [
      feedback(1, 2, 7, 5, 'Great talks and a lovely atmosphere. Will be back next year.', 8),
      feedback(2, 2, 8, 4, 'Wonderful day for the kids, though it ran a little long.', 23),
      feedback(3, 3, 7, 4, 'Good variety of speakers.', 8),
      feedback(4, 4, 8, 5, 'Well organised and the volunteers were great. Thank you.', 23),
      feedback(5, 5, 7, 3, 'Interesting panels but parking was difficult.', 7),
    ];

    return eventFeedback;
  };
})();
