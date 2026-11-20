(function () {
  window.App = window.App || {};
  App.mock = App.mock || {};
  App.mock.internal = App.mock.internal || {};
  App.mock.internal.seed = App.mock.internal.seed || {};

  // Builds the promos table. `c` is the helper set from clock.js.
  App.mock.internal.seed.promos = function (c) {
    var at = c.at;
    var video = c.video;

    function promo(id, title, description, caption, published, daysAgo) {
      return {
        id: id,
        title: title,
        description: description,
        video_url: video(),
        caption_text: caption,
        published: published,
        created_by: 1,
        created_at: at(-daysAgo),
        updated_at: at(-daysAgo),
      };
    }

    var promos = [
      promo(1, 'Discover CivicEvents', 'A quick tour of what is happening in your community.', 'Welcome to CivicEvents. Find local events, register in seconds and stay informed about your city.', true, 14),
      promo(2, 'Clean-Up Day Highlights', 'Moments from our last neighbourhood clean-up.', 'Hundreds of volunteers came together to clean our parks. Join us at the next one.', true, 8),
      promo(3, 'Volunteer With Us', 'Learn how to get involved as a volunteer.', 'Volunteers are the heart of our community. Sign up and make a difference.', true, 3),
      promo(4, 'Winter Concert Teaser (Draft)', 'Teaser for the upcoming charity concert.', 'Coming soon: an evening of music for a good cause.', false, 1),
    ];

    return promos;
  };
})();
