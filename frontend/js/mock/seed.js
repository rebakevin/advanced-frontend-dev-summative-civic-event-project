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

    // Start and end of an event, `days` from now, lasting `hours`.
    function slot(days, hours) {
      return { starts_at: at(days), ends_at: new Date(now + days * DAY + hours * HOUR).toISOString() };
    }

    function image() { return App.mock.assetUrl('assets/demo/sample-event.svg'); }
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

    function event(id, title, description, location, days, hours, published, createdDaysAgo) {
      var t = slot(days, hours);
      return {
        id: id,
        title: title,
        description: description,
        location: location,
        starts_at: t.starts_at,
        ends_at: t.ends_at,
        published: published,
        // The frontend reads the image from metadata.image_url.
        metadata: { image_url: image() },
        created_at: at(-createdDaysAgo),
        updated_at: at(-createdDaysAgo),
      };
    }

    var events = [
      event(1, 'Neighbourhood Clean-Up Day', 'Join your neighbours to tidy parks and streets. Gloves and bags are provided.', 'Central Park, Kigali', 6, 3, true, 20),
      event(2, 'Town Hall: City Budget 2027', 'Hear the proposed budget and ask your questions directly to city officials.', 'City Hall, Main Auditorium', 12, 2, true, 18),
      event(3, 'Community Health Fair', 'Free screenings, vaccination information and wellness talks for all ages.', 'Riverside Community Centre', 25, 6, true, 15),
      event(4, 'Youth Coding Workshop', 'A hands-on introduction to web development for teenagers.', 'Public Library, Room 2', 3, 4, true, 10),
      event(5, 'Local Farmers Market', 'Fresh produce and crafts from local growers and makers.', 'Market Square', -9, 5, true, 40),
      event(6, 'Public Safety Forum', 'A discussion with police and fire services about neighbourhood safety.', 'Eastside Town Hall', -24, 2, true, 55),
      event(7, 'Winter Charity Concert', 'Draft: line-up and venue still being confirmed.', 'To be announced', 45, 3, false, 4),
      event(8, 'Volunteer Orientation', 'Draft: onboarding session for new volunteers.', 'Civic Office, Meeting Room 1', 18, 2, false, 2),
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
      reg(1, 2, 1, 'registered', 5),
      reg(2, 2, 2, 'registered', 4),
      reg(3, 2, 5, 'registered', 20),
      reg(4, 2, 6, 'registered', 40),
      reg(5, 2, 4, 'cancelled', 2),
      reg(6, 3, 1, 'registered', 6),
      reg(7, 3, 3, 'registered', 3),
      reg(8, 3, 5, 'registered', 18),
      reg(9, 4, 1, 'registered', 4),
      reg(10, 4, 2, 'registered', 2),
      reg(11, 4, 6, 'registered', 35),
      reg(12, 5, 2, 'registered', 3),
      reg(13, 5, 3, 'registered', 1),
      reg(14, 5, 5, 'cancelled', 15),
      reg(15, 6, 4, 'registered', 1),
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

    // Feedback only for past events (5 and 6).
    var eventFeedback = [
      feedback(1, 2, 5, 5, 'Great produce and a lovely atmosphere. Will be back next month.', 8),
      feedback(2, 2, 6, 4, 'Useful forum, though it ran a little long.', 23),
      feedback(3, 3, 5, 4, 'Good variety of stalls.', 8),
      feedback(4, 4, 6, 5, 'Clear answers from the officials. Thank you for organising it.', 23),
      feedback(5, 5, 5, 3, 'Nice market but parking was difficult.', 7),
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
      notification(2, 'New event: Neighbourhood Clean-Up Day', 'Join us at Central Park, Kigali.', 'event', null, { event_id: 1, location: 'Central Park, Kigali' }, false, 5),
      notification(3, 'Registration confirmed', 'You are registered for Town Hall: City Budget 2027.', 'event', 2, { event_id: 2 }, false, 4),
      notification(4, 'New promo: Volunteer With Us', 'Watch how you can get involved.', 'promo', null, { promo_id: 3 }, true, 3),
      notification(5, 'Thanks for your feedback', 'Your feedback on Local Farmers Market was received.', 'system', 2, { event_id: 5 }, true, 8),
      notification(6, 'Reminder: Youth Coding Workshop', 'The workshop starts in three days.', 'event', 6, { event_id: 4 }, false, 1),
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
