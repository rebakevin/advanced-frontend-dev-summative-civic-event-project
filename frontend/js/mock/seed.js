(function () {
  window.App = window.App || {};
  App.mock = App.mock || {};

  var DAY = 24 * 60 * 60 * 1000;
  var HOUR = 60 * 60 * 1000;

  // Demo credentials shown on the login page in demo mode.
  App.mock.demoAccounts = [
    { role: 'admin', email: 'admin@civicevents.test', password: 'Admin#1234' },
    { role: 'user', email: 'user@civicevents.test', password: 'User#1234' },
  ];

  // Seed data is rebuilt on every call so dates stay relative to "now".
  App.mock.seed = function () {
    var now = Date.now();

    // Offset in days (can be fractional) from now, as an ISO string.
    function at(days) {
      return new Date(now + days * DAY).toISOString();
    }

    // Start and end of an event: `days` from now at `hour` o'clock, lasting `hours`.
    function slot(days, hour, hours) {
      var start = new Date(now + days * DAY);
      start.setHours(hour, 0, 0, 0);
      return { starts_at: start.toISOString(), ends_at: new Date(start.getTime() + hours * HOUR).toISOString() };
    }

    function image(file) { return App.mock.assetUrl('assets/demo/' + file); }
    function audio() { return App.mock.assetUrl('assets/demo/sample-audio.wav'); }
    function video() { return App.mock.assetUrl('assets/demo/sample-video.mp4'); }

    // Plain `password` is for the mock login; password_hash only mirrors the column.
    function user(id, name, email, password, role, active, ageDays) {
      return {
        id: id,
        full_name: name,
        email: email,
        password: password,
        password_hash: '$2b$10$mockhashnotusedinthedemo',
        role: role,
        is_active: active,
        created_at: at(-ageDays),
        updated_at: at(-ageDays),
      };
    }

    // Users are spread over the last six months for the dashboard growth chart.
    var users = [
      user(1, 'Admin User', 'admin@civicevents.test', 'Admin#1234', 'admin', true, 170),
      user(2, 'Demo User', 'user@civicevents.test', 'User#1234', 'user', true, 140),
      user(3, 'Amina Okafor', 'amina.okafor@civicevents.test', 'User#1234', 'user', true, 105),
      user(4, 'Liam Dupont', 'liam.dupont@civicevents.test', 'User#1234', 'user', true, 72),
      user(5, 'Sofia Mensah', 'sofia.mensah@civicevents.test', 'User#1234', 'user', true, 40),
      user(6, 'Daniel Karekezi', 'daniel.karekezi@civicevents.test', 'User#1234', 'user', false, 12),
    ];

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

    return {
      users: users,
      events: events,
      event_registrations: eventRegistrations,
      event_feedback: eventFeedback,
      announcements: announcements,
      promos: promos,
      notifications: notifications,
    };
  };
})();
