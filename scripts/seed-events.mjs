// Seeds sample events (with photos) through the running backend API as the seeded admin.
// Safe to run repeatedly: events whose title already exists are skipped.
// Usage: node scripts/seed-events.mjs   (backend must be running; API_URL overrides the default)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const API = process.env.API_URL || 'http://localhost:4000/api';
const IMAGES = path.join(path.dirname(fileURLToPath(import.meta.url)), 'seed-images');

const DAY = 24 * 60 * 60 * 1000;
// Offsets are in days from now, so the sample data always has both upcoming and past events.
const EVENTS = [
  {
    title: 'Riverside Farmers Market',
    description: 'Fresh fruit, vegetables and baked goods from over thirty local growers. Bring a reusable bag and meet the farmers behind your food. Live acoustic music from 11:00.',
    location: 'Kimironko Market, Kigali',
    days: 4, hours: 8, duration: 6, image: 'farmers-market.jpg',
  },
  {
    title: 'Neighbourhood Clean-Up and Volunteer Day',
    description: 'Join your neighbours to clear litter from streets and green spaces. Gloves, bags and refreshments are provided. Volunteers receive a certificate of participation.',
    location: 'Nyarugenge Community Centre, Kigali',
    days: 9, hours: 8, duration: 4, image: 'volunteer-day.jpg',
  },
  {
    title: 'Public Budget Town Hall',
    description: 'The city council presents next year\'s budget priorities and takes questions from residents. Submit your question in advance at the venue desk or ask it live.',
    location: 'Kigali City Hall, Nyarugenge',
    days: 14, hours: 17, duration: 2, image: 'town-hall.jpg',
  },
  {
    title: 'Summer Night Music Festival',
    description: 'An open-air evening of live bands and local artists. Gates open at 17:00. Food stalls on site. Family friendly until 21:00.',
    location: 'Amahoro Stadium Grounds, Remera',
    days: 21, hours: 17, duration: 6, image: 'music-night.jpg',
  },
  {
    title: 'Street Food and Culture Fair',
    description: 'Taste dishes from twenty neighbourhood kitchens, watch cooking demos and vote for the best street food of the year.',
    location: 'Kigali Convention Centre Plaza',
    days: 30, hours: 11, duration: 7, image: 'food-fair.jpg',
  },
  {
    title: 'Youth Skills Workshop: CV and Interview Prep',
    description: 'A free hands-on session for 16 to 25 year olds: write a strong CV, practise interviews and meet local employers. Laptops are available. Limited to 60 seats.',
    location: 'Gasabo Youth Centre, Kacyiru',
    days: 40, hours: 9, duration: 5, image: 'skills-workshop.jpg',
  },
  {
    title: 'Civic Innovation Conference',
    description: 'Two days of talks and panels on open data, public services and community technology. Speakers from city government, universities and civic start-ups.',
    location: 'Kigali Heights Conference Hall',
    days: -12, hours: 9, duration: 8, image: 'innovation-conference.jpg',
  },
  {
    title: 'Community Kids Day',
    description: 'Games, storytelling and art for children aged 4 to 12, run by trained volunteers. Parents are welcome to stay and join in.',
    location: 'Kicukiro Playground, Kigali',
    days: -25, hours: 10, duration: 5, image: 'kids-day.jpg',
  },
];

function at(days, hours) {
  const d = new Date(Date.now() + days * DAY);
  d.setHours(hours, 0, 0, 0);
  return d;
}

async function json(res) {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(res.status + ' ' + (body.message || res.statusText));
  return body;
}

const login = await json(await fetch(API + '/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'admin@civicevents.test', password: 'Admin#1234' }),
}));
const auth = { Authorization: 'Bearer ' + login.data.token };

const existing = (await json(await fetch(API + '/events', { headers: auth }))).data.map((e) => e.title);

let added = 0;
for (const ev of EVENTS) {
  if (existing.includes(ev.title)) continue;
  const start = at(ev.days, ev.hours);
  const form = new FormData();
  form.append('title', ev.title);
  form.append('description', ev.description);
  form.append('location', ev.location);
  form.append('starts_at', start.toISOString());
  form.append('ends_at', new Date(start.getTime() + ev.duration * 60 * 60 * 1000).toISOString());
  const file = fs.readFileSync(path.join(IMAGES, ev.image));
  form.append('image', new Blob([file], { type: 'image/jpeg' }), ev.image);
  await json(await fetch(API + '/events', { method: 'POST', headers: auth, body: form }));
  added++;
}
console.log('Seeded events: ' + added + ' added, ' + (EVENTS.length - added) + ' already existed');
