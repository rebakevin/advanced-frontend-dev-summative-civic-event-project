# Rubric vs Backend

Prioritized: the backend's real routes and data, over the assignment text.
The assignment explicitly said to work only in frontend folder. So, I didn't touch the backend code at all. I just used the backend's real routes and data to make the frontend work.

| #  | Rubric                                                            | Backend                                                                          |
|----|-------------------------------------------------------------------|----------------------------------------------------------------------------------|
| 1  | `POST /api/event-registrations` to register                       | `POST /event-registrations/register` and `POST /event-registrations/cancel`      |
| 2  | `GET /event-registrations/event/:event_id`                        | `GET /event-registrations/event/:event_id/attendees` (admin)                     |
| 3  | Everyone sees feedback list and average rating                    | `GET /event-feedback/event/:event_id` is admin-only                              |
| 4  | One feedback per event                                            | `UNIQUE(user_id, event_id)`; `PUT /event-feedback/:id` for the owner             |
| 5  | Events: published only, search, date/location filters, pagination | `GET /events` returns all events, no filters, no pagination, no published filter |
| 6  | Event form has a `published` toggle                               | `POST`/`PUT /events` ignore `published`                                          |
| 7  | Announcements and promos: published only                          | List returns all, no published filter                                            |
| 8  | Announcement `duration_seconds` and transcript                    | Neither field exists                                                             |
| 9  | Promo `caption_url` track, caption file, thumbnail                | Only `caption_text` (required); no `caption_url`, no thumbnail                   |
| 10 | Admin creates broadcast notifications                             | No create endpoint; created automatically with events, announcements, promos     |
| 11 | Mark notification as read, unread count                           | `read` column exists, no endpoint changes it                                     |
| 12 | Global search bar                                                 | No search endpoint                                                               |
| 13 | Login redirects to Dashboard                                      | `/dashboard/admin` and `/dashboard/me`                                           |
| 14 | Expired tokens sign the user out                                  | JWT valid 1 hour, no refresh                                                     |
| 15 | Signup is for users                                               | `POST /auth/signup` accepts a `role` field                                       |
| 16 | Admins manage users                                               | Only `PATCH /users/:id/enable` and `/disable`; no role endpoint                  |
| 17 | Upload limits not stated                                          | Images 2 MB, audio 5 MB, video 8 MB, fixed formats                               |
| 18 | Mentions "service requests"                                       | No such feature                                                                  |
