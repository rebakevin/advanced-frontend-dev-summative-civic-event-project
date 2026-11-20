(function () {
  window.App = window.App || {};
  App.mock = App.mock || {};
  App.mock.internal = App.mock.internal || {};
  App.mock.internal.seed = App.mock.internal.seed || {};

  // Builds the events table. `c` is the helper set from clock.js.
  App.mock.internal.seed.events = function (c) {
    var at = c.at;
    var slot = c.slot;
    var image = c.image;

    function event(id, title, description, location, days, hour, hours, imageFile, published, createdDaysAgo) {
      var t = slot(days, hour, hours);
      return {
        id: id,
        title: title,
        description: description,
        location: location,
        starts_at: t.starts_at,
        ends_at: t.ends_at,
        published: published,
        // The frontend reads the image from metadata.image_url.
        metadata: { image_url: image(imageFile) },
        created_at: at(-createdDaysAgo),
        updated_at: at(-createdDaysAgo),
      };
    }

    // Same events as scripts/seed-events.mjs, plus two drafts for the admin to publish.
    var events = [
      event(1, 'Riverside Farmers Market', 'Fresh fruit, vegetables and baked goods from over thirty local growers. Bring a reusable bag and meet the farmers behind your food. Live acoustic music from 11:00.', 'Kimironko Market, Kigali', 4, 8, 6, 'farmers-market.jpg', true, 12),
      event(2, 'Neighbourhood Clean-Up and Volunteer Day', 'Join your neighbours to clear litter from streets and green spaces. Gloves, bags and refreshments are provided. Volunteers receive a certificate of participation.', 'Nyarugenge Community Centre, Kigali', 9, 8, 4, 'volunteer-day.jpg', true, 14),
      event(3, 'Public Budget Town Hall', 'The city council presents next year\'s budget priorities and takes questions from residents. Submit your question in advance at the venue desk or ask it live.', 'Kigali City Hall, Nyarugenge', 14, 17, 2, 'town-hall.jpg', true, 16),
      event(4, 'Summer Night Music Festival', 'An open-air evening of live bands and local artists. Gates open at 17:00. Food stalls on site. Family friendly until 21:00.', 'Amahoro Stadium Grounds, Remera', 21, 17, 6, 'music-night.jpg', true, 18),
      event(5, 'Street Food and Culture Fair', 'Taste dishes from twenty neighbourhood kitchens, watch cooking demos and vote for the best street food of the year.', 'Kigali Convention Centre Plaza', 30, 11, 7, 'food-fair.jpg', true, 10),
      event(6, 'Youth Skills Workshop: CV and Interview Prep', 'A free hands-on session for 16 to 25 year olds: write a strong CV, practise interviews and meet local employers. Laptops are available. Limited to 60 seats.', 'Gasabo Youth Centre, Kacyiru', 40, 9, 5, 'skills-workshop.jpg', true, 8),
      event(7, 'Civic Innovation Conference', 'Two days of talks and panels on open data, public services and community technology. Speakers from city government, universities and civic start-ups.', 'Kigali Heights Conference Hall', -12, 9, 8, 'innovation-conference.jpg', true, 40),
      event(8, 'Community Kids Day', 'Games, storytelling and art for children aged 4 to 12, run by trained volunteers. Parents are welcome to stay and join in.', 'Kicukiro Playground, Kigali', -25, 10, 5, 'kids-day.jpg', true, 55),
      event(9, 'Winter Charity Concert', 'Draft: line-up and venue still being confirmed.', 'To be announced', 45, 18, 3, 'music-night.jpg', false, 4),
      event(10, 'Volunteer Orientation', 'Draft: onboarding session for new volunteers.', 'Civic Office, Meeting Room 1', 18, 9, 2, 'volunteer-day.jpg', false, 2),
    ];

    return events;
  };
})();
