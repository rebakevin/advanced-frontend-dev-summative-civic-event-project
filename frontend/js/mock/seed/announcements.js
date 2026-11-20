(function () {
  window.App = window.App || {};
  App.mock = App.mock || {};
  App.mock.internal = App.mock.internal || {};
  App.mock.internal.seed = App.mock.internal.seed || {};

  // Builds the announcements table. `c` is the helper set from clock.js.
  App.mock.internal.seed.announcements = function (c) {
    var at = c.at;
    var audio = c.audio;

    function announcement(id, title, published, daysAgo) {
      return {
        id: id,
        title: title,
        audio_url: audio(),
        published: published,
        created_at: at(-daysAgo),
        updated_at: at(-daysAgo),
      };
    }

    var announcements = [
      announcement(1, 'Road Closures This Weekend', true, 2),
      announcement(2, 'New Recycling Schedule', true, 9),
      announcement(3, 'Library Opening Hours Update', true, 21),
      announcement(4, 'Upcoming Water Maintenance (Draft)', false, 1),
    ];

    return announcements;
  };
})();
