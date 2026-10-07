/**
 * Every word on the page lives here. Relaunch copy for the Google Doogler
 * Baja Dog Leash, written for first-time city dog parents.
 */

// Public assets resolve under the GitHub Pages project path (vite.config.ts `base`).
const base = import.meta.env.BASE_URL;

/** A still, or a scroll-played frame sequence (none on this page yet). */
type Scene = {image: string; scrub?: {dir: string; count: number}};

export const brand = {
  name: 'Doogler',
  wordmark: 'DOOGLER',
  tagline: ['The Baja Dog Leash.', 'Made for city walks.', 'Every dog is a Doogler.'],
  email: 'hello@doogler.dog',
  shopUrl: 'https://shop.merch.google/',
};

export const nav = [
  {label: 'The story', href: '#manifesto'},
  {label: 'Details', href: '#services'},
  {label: 'The walk', href: '#process'},
  {label: 'Get yours', href: '#contact'},
];

export const hero = {
  caption: 'Google Doogler Baja Dog Leash',
  scrollHint: 'Scroll for walkies',
};

/** The three blocks that stack up beside the leash. */
export const perks = {
  eyebrow: 'Why dog parents love it',
  heading: ['Every walk,', 'a little prouder.'],
  items: [
    {title: 'Baja stripes that pop', note: 'Bright enough to spot across the dog park.'},
    {title: 'Padded comfort handle', note: 'Soft in your hand, even on the long loop.'},
    {title: 'Sturdy swivel clip', note: 'Stays put through every squirrel sighting.'},
  ],
};

/**
 * Manifesto, as runs of plain and emphasised text. Emphasised runs finish
 * bright white; the rest settle at a softer grey, so the emphasised runs
 * read as one sentence.
 */
export const manifesto: {text: string; em?: boolean}[] = [
  {text: 'At Google, the dogs come to work too. Inside the company they have a name:'},
  {text: 'Dooglers.', em: true},
  {text: 'They nap under desks, crash meetings and lead the lunchtime walk.'},
  {text: 'Now the leash made for them', em: true},
  {text: 'is ready for your best friend. Bright Baja stripes, a padded grip and a clip you can trust,'},
  {text: 'built for city sidewalks', em: true},
  {text: 'and the dog who owns them. Because every dog who is loved like family'},
  {text: 'is already a Doogler.', em: true},
];

export const marquee = ['Baja stripes', 'Padded handle', 'Swivel clip', 'Paw-print tag', 'Gift ready', '#MyDoogler'];

export const services: {
  eyebrow: string;
  heading: string;
  lede: string;
  items: (Scene & {title: string; caption: string; body: string; tags: string[]})[];
} = {
  eyebrow: 'The details',
  heading: 'Made for the walk.',
  lede: 'Every part of the Doogler Leash is designed for dog parents who walk a lot and post even more.',
  items: [
    {
      title: 'Baja stripes',
      image: `${base}media/story/sv1-stripes.webp`,
      caption: 'Bright enough for every photo.',
      body: 'Green, red, yellow and blue woven stripes in Google colors. It stands out on a busy sidewalk and looks great on your feed.',
      tags: ['Bold color', 'Woven pattern', 'Photo ready'],
    },
    {
      title: 'Padded handle',
      image: `${base}media/story/sv2-handle.webp`,
      caption: 'Soft grip, long walks.',
      body: 'A cushioned black handle that stays comfortable on the morning loop, the lunch break walk and the late-night stroll.',
      tags: ['Comfort', 'No rope burn', 'All-day walks'],
    },
    {
      title: 'Swivel clip',
      image: `${base}media/story/sv3-clip.webp`,
      caption: 'Clips on in one click.',
      body: 'A sturdy metal snap hook that swivels with your dog, so the leash never twists when they spot a squirrel.',
      tags: ['Metal hardware', 'Swivel', 'Secure'],
    },
    {
      title: 'Paw-print tag',
      image: `${base}media/story/sv4-tag.webp`,
      caption: 'The Doogler badge of honor.',
      body: 'A colorful paw-print label that quietly says your dog is part of the club. Fellow dog parents will ask about it.',
      tags: ['Signature detail', 'Google colors'],
    },
    {
      title: 'New Doogler gift',
      image: `${base}media/story/sv5-gift.webp`,
      caption: 'The perfect "you got a puppy!" gift.',
      body: 'Know someone who just adopted? The Doogler Leash is the gift they will use every single day.',
      tags: ['Gift ready', 'New puppy', 'Starter kit'],
    },
  ],
};

export const process: {
  eyebrow: string;
  heading: string;
  steps: (Scene & {title: string; temp: string; caption: string; body: string})[];
} = {
  eyebrow: 'How it works',
  heading: 'Three steps. One happy dog.',
  steps: [
    {
      title: 'Clip on',
      image: `${base}media/story/pr1-clip.webp`,
      temp: '0 steps',
      caption: 'Leash on. Tail going.',
      body: 'One click on the collar and your dog already knows what time it is.',
    },
    {
      title: 'Head out',
      image: `${base}media/story/pr2-walk.webp`,
      temp: '2,500 steps',
      caption: 'Around the block in style.',
      body: 'The padded handle keeps you comfortable while the stripes turn heads on every corner.',
    },
    {
      title: 'Show off',
      image: `${base}media/story/pr3-show.webp`,
      temp: '5,000 steps',
      caption: 'Post it with #MyDoogler.',
      body: 'Snap your pup, tag #MyDoogler and join a community of proud city dog parents.',
    },
  ],
};

export const contact = {
  eyebrow: 'Join the club',
  wordmark: 'GOOD DOG',
  lede: 'Make your dog a Doogler. Get the Baja Dog Leash, or send one to a friend who just got a puppy.',
  sticker: 'DOOGLER ✺ GOOD DOG CLUB ✺ #MYDOOGLER ✺ ',
  image: `${base}media/story/ct-hero.webp`,
};

export const footer = {
  note: 'Every dog is a Doogler. Google Merchandise Store relaunch concept.',
};
