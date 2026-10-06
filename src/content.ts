/**
 * Every word on the page lives here. Brand name, contact address and copy are
 * working placeholders — swap them in one place.
 */

// Public assets resolve under the GitHub Pages project path (vite.config.ts `base`).
const base = import.meta.env.BASE_URL;

export const brand = {
  name: 'Cold Club',
  wordmark: 'COLD CLUB',
  tagline: ['Design, build &', 'automation studio.', 'We handle the heat.'],
  email: 'hello@coldclub.studio',
};

export const nav = [
  {label: 'Manifesto', href: '#manifesto'},
  {label: 'Menu', href: '#services'},
  {label: 'Process', href: '#process'},
  {label: 'Contact', href: '#contact'},
];

export const hero = {
  caption: 'Design · Build · Automate',
  scrollHint: 'Scroll to chill',
};

/** The three blocks that stack up beside the ice cube. */
export const perks = {
  eyebrow: 'Why the club',
  heading: ['Everything,', 'on ice.'],
  items: [
    {title: 'Launch-ready in weeks', note: 'Sites and products, designed and shipped.'},
    {title: 'Automations on autopilot', note: 'The busywork runs while you sleep.'},
    {title: 'One crew, zero hand-offs', note: 'Design, code and ops under one roof.'},
  ],
};

/**
 * Manifesto, as runs of plain and emphasised text. Emphasised runs finish
 * bright white; the rest settle at a softer grey, so the emphasised runs
 * read as one sentence.
 */
export const manifesto: {text: string; em?: boolean}[] = [
  {text: 'Most studios run hot. Missed deadlines, bloated retainers, forty-tab workflows.'},
  {text: 'We run cold.', em: true},
  {text: 'Cold Club is a small crew of'},
  {text: 'designers, engineers and automation nerds', em: true},
  {text: 'who take the overheated parts of your business —'},
  {text: 'the launch, the rebuild, the busywork', em: true},
  {text: '— and bring them down to'},
  {text: 'room temperature.', em: true},
  {text: 'You hand it over.'},
  {text: 'We handle the heat.', em: true},
  {text: 'You sit back with something iced and watch it'},
  {text: 'ship.', em: true},
];

export const marquee = [
  'Brand systems',
  'Websites',
  'Web apps',
  'Workflow automation',
  'AI agents',
  'Motion & 3D',
  'Mascots',
];

export const services = {
  eyebrow: 'The menu',
  heading: 'Pick your poison.',
  lede: 'Order one thing or the whole tray. Every project gets the same crew from brief to launch.',
  items: [
    {
      title: 'Brand & identity',
      image: `${base}media/story/sv1-brand.webp`,
      caption: 'Knitting your brand, stitch by stitch.',
      body: 'Names, marks, type and colour systems — and a mascot, if you are brave.',
      tags: ['Naming', 'Logo', 'Systems'],
    },
    {
      title: 'Websites',
      image: `${base}media/story/sv2-web.webp`,
      caption: 'Building the site. Still unbothered.',
      body: 'Marketing sites with a pulse. Designed, built and launched end to end.',
      tags: ['Design', 'React', 'CMS'],
    },
    {
      title: 'Web apps & product',
      image: `${base}media/story/sv3-app.webp`,
      caption: 'Conducting the dashboard.',
      body: 'Dashboards, portals and internal tools your team actually wants to open.',
      tags: ['UX', 'Front end', 'APIs'],
    },
    {
      title: 'Workflow automation',
      image: `${base}media/story/sv4-auto.webp`,
      // Played by scrolling: the row pins while the clip runs (see Services).
      scrub: {dir: `${base}frames/hammock`, count: 121},
      caption: 'The busywork runs. The penguin naps.',
      body: 'The repetitive stuff, wired together and running quietly in the background.',
      tags: ['Integrations', 'AI agents', 'Ops'],
    },
    {
      title: 'Motion & 3D',
      image: `${base}media/story/sv5-motion.webp`,
      caption: 'Rolling on the next scroll story.',
      body: 'Characters, product films and scroll stories. Like the one you just scrolled.',
      tags: ['Characters', 'Video', 'Scroll'],
    },
  ],
};

export const process = {
  eyebrow: 'How it works',
  heading: 'Three steps. Zero sweat.',
  steps: [
    {
      title: 'Drop it on us',
      image: `${base}media/story/pr1-drop.webp`,
      temp: '212°F',
      caption: 'Your problem arrives on fire.',
      body: 'One call, one brief. Tell us what is overheating and when it needs to cool down.',
    },
    {
      title: 'We handle the heat',
      image: `${base}media/story/pr2-heat.webp`,
      // Played by scrolling while this card holds in front (see Process).
      scrub: {dir: `${base}frames/heat`, count: 121},
      temp: '32°F',
      caption: 'We put it out.',
      body: 'Weekly drops you can click, not status decks. You see progress, not meetings.',
    },
    {
      title: 'You stay cold',
      image: `${base}media/story/pr3-cold.webp`,
      temp: '−4°F',
      caption: 'You float.',
      body: 'We launch, hand over the keys, and stay on call for whatever comes next.',
    },
  ],
};

export const contact = {
  eyebrow: 'The door is open',
  wordmark: 'STAY COLD',
  lede: 'Tell us what is overheating. Someone from the crew reads every message.',
  sticker: 'COLD CLUB ✺ STAY COLD ✺ MEMBERS ONLY ✺ ',
  image: `${base}media/story/ct-door-2560.webp`,
  video: {src: `${base}media/loops/door.mp4`, poster: `${base}media/loops/door.webp`},
};

export const footer = {
  note: 'Knitted in 3D. Served on ice.',
};
