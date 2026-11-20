(function () {
  window.App = window.App || {};
  App.mock = App.mock || {};
  App.mock.internal = App.mock.internal || {};
  App.mock.internal.seed = App.mock.internal.seed || {};

  // Builds the notifications table. `c` is the helper set from clock.js.
  App.mock.internal.seed.notifications = function (c) {
    var at = c.at;

    // recipient_id null means broadcast, like the backend.
    function notification(id, title, message, type, recipientId, metadata, read, daysAgo) {
      return {
        id: id,
        title: title,
        message: message,
        type: type,
        recipient_id: recipientId,
        metadata: metadata,
        read: read,
        created_by: 1,
        created_at: at(-daysAgo),
        updated_at: at(-daysAgo),
      };
    }

    var notifications = [
      notification(1, 'Welcome to CivicEvents', 'Browse upcoming events and register to take part.', 'system', null, {}, false, 30),
      notification(2, 'New event: Neighbourhood Clean-Up and Volunteer Day', 'Join us at Nyarugenge Community Centre, Kigali.', 'event', null, { event_id: 2, location: 'Nyarugenge Community Centre, Kigali' }, false, 5),
      notification(3, 'Registration confirmed', 'You are registered for Public Budget Town Hall.', 'event', 2, { event_id: 3 }, false, 4),
      notification(4, 'New promo: Volunteer With Us', 'Watch how you can get involved.', 'promo', null, { promo_id: 3 }, true, 3),
      notification(5, 'Thanks for your feedback', 'Your feedback on Civic Innovation Conference was received.', 'system', 2, { event_id: 7 }, true, 8),
      notification(6, 'Reminder: Youth Skills Workshop', 'The workshop is coming up soon.', 'event', 6, { event_id: 6 }, false, 1),
    ];

    return notifications;
  };
})();
