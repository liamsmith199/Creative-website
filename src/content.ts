/**
 * Every word on the page lives here. CampusPlate: an AI nutrition tracker
 * for college students, built from the MKTG 1101 Marketing Venture Workspace.
 */

// Public assets resolve under the GitHub Pages project path (vite.config.ts `base`).
const base = import.meta.env.BASE_URL;

/** A still, or a scroll-played frame sequence (none on this page yet). */
type Scene = {image: string; scrub?: {dir: string; count: number}};

export const brand = {
  name: 'CampusPlate',
  wordmark: 'CAMPUSPLATE',
  tagline: ['Snap your meal.', 'Get your macros.', 'Built for students.'],
  // Waitlist sign-ups go straight to the founder.
  email: 'liam.smith@student.fairfield.edu',
};

export const nav = [
  {label: 'Why', href: '#manifesto'},
  {label: 'Features', href: '#services'},
  {label: 'How it works', href: '#process'},
  {label: "Who it's for", href: '#audience'},
];

export const hero = {
  caption: 'AI nutrition tracking',
  scrollHint: 'Scroll to explore',
};

/** The three blocks that stack up beside the plate. */
export const perks = {
  eyebrow: 'Why students use it',
  heading: ['Snap a photo.', 'Know your macros.'],
  items: [
    {title: 'Macros in seconds', note: 'Calories, protein, carbs and fat from one photo.'},
    {title: 'Dining hall menu match', note: 'Matched to campus menus for more accurate numbers.'},
    {title: 'Student price', note: '$29.99 a year, with a free plan to start.'},
  ],
};

/**
 * Manifesto, as runs of plain and emphasised text. Emphasised runs finish
 * bright white; the rest settle at a softer grey, so the emphasised runs
 * read as one sentence.
 */
export const manifesto: {text: string; em?: boolean}[] = [
  {text: 'College students want to eat better, build muscle and feel good. But typing every meal into an app takes too long, so most people'},
  {text: 'quit tracking within weeks.', em: true},
  {text: 'CampusPlate fixes that. Take a photo of your plate and our AI'},
  {text: 'breaks it down in seconds:', em: true},
  {text: 'calories, protein, carbs and fat, matched to your campus dining hall menu. Our mission is'},
  {text: 'to make healthy eating simple for college students,', em: true},
  {text: 'so better habits take'},
  {text: 'one photo, not ten minutes.', em: true},
];

export const marquee = ['Snap a photo', 'Macros in seconds', 'Dining hall menus', '$29.99 a year', 'Macro-only mode', 'Starting at Fairfield'];

export const services: {
  eyebrow: string;
  heading: string;
  lede: string;
  items: (Scene & {title: string; caption: string; body: string; tags: string[]})[];
} = {
  eyebrow: 'Features',
  heading: 'Tracking without the typing.',
  lede: 'Everything a busy student needs to hit their goals, and nothing that slows them down between class, practice and the gym.',
  items: [
    {
      title: 'Snap and go',
      image: `${base}media/story/sv1-snap.webp`,
      caption: 'Point your camera at your meal.',
      body: 'No searching food databases or weighing portions. Point your camera at your plate, tap once, and CampusPlate does the rest.',
      tags: ['Photo logging', 'One tap', 'No typing'],
    },
    {
      title: 'Full macro breakdown',
      image: `${base}media/story/sv2-macros.webp`,
      caption: 'Calories, protein, carbs and fat.',
      body: 'Every meal comes back with calories plus a clear protein, carbs and fat split, so you can see exactly what is on your plate.',
      tags: ['Calories', 'Protein', 'Carbs + fat'],
    },
    {
      title: 'Dining hall menu match',
      image: `${base}media/story/sv3-menu.webp`,
      caption: 'Matched to the campus menu.',
      body: 'CampusPlate checks your photo against the dining hall menu for the day, which makes the numbers more accurate for campus food.',
      tags: ['Campus menus', 'More accurate', 'Fairfield first'],
    },
    {
      title: 'Macro-only mode',
      image: `${base}media/story/sv4-macro-mode.webp`,
      caption: 'Focus on goals, not just calories.',
      body: 'Hide calories and focus on protein and balanced meals. Built for healthy, non-restrictive habits and goals like building muscle.',
      tags: ['Protein goals', 'Healthy habits', 'Streaks'],
    },
    {
      title: 'Student pricing',
      image: `${base}media/story/sv5-price.webp`,
      caption: '$29.99 a year. Free plan to start.',
      body: 'Premium trackers charge around $79.99 a year. CampusPlate is $29.99 a year for students, and you can start on the free plan.',
      tags: ['$29.99 / year', 'Free plan', 'Student budget'],
    },
  ],
};

export const process: {
  eyebrow: string;
  heading: string;
  goal: number;
  unit: string;
  statuses: [number, string][];
  steps: (Scene & {title: string; temp: string; caption: string; body: string})[];
} = {
  eyebrow: 'How it works',
  heading: 'Three steps. Zero typing.',
  // The big readout counts up to this meal's calories.
  goal: 626,
  unit: 'kcal logged',
  statuses: [
    [60, 'Snap'],
    [250, 'Scanning'],
    [580, 'Matching menu'],
    [Infinity, 'Logged'],
  ],
  steps: [
    {
      title: 'Snap',
      image: `${base}media/story/pr1-snap.webp`,
      temp: '1 photo',
      caption: 'Point, tap, done.',
      body: 'Open CampusPlate in the dining hall and take one photo of your plate.',
    },
    {
      title: 'Analyze',
      image: `${base}media/story/pr2-scan.webp`,
      temp: '~3 seconds',
      caption: 'AI spots every food.',
      body: 'Our AI identifies each food, estimates the portion and checks it against the campus menu.',
    },
    {
      title: 'Track',
      image: `${base}media/story/pr3-track.webp`,
      temp: '626 kcal',
      caption: 'Your day, at a glance.',
      body: 'Your calories and macros add up through the day, so you always know where you stand on your goals.',
    },
  ],
};

/** Target market, straight from the venture workspace segmentation. */
export const audience = {
  eyebrow: "Who it's for",
  heading: 'Built for students who care about what they eat.',
  lede: 'We start at Fairfield University, then grow campus by campus through student ambassadors, TikTok and Instagram.',
  segments: [
    {
      label: 'Geographic',
      title: 'Campus first',
      body: 'College campuses and nearby student housing, starting with Fairfield University.',
    },
    {
      label: 'Demographic',
      title: 'Students, 18 to 24',
      body: 'College students who eat most of their meals in dining halls or on campus.',
    },
    {
      label: 'Psychographic',
      title: 'Health-minded',
      body: 'Students who care about health and fitness and want to build muscle or eat more balanced meals, but have no time to log food by hand.',
    },
    {
      label: 'Behavioral',
      title: 'Gym-goers and past trackers',
      body: 'Students who work out, track protein or calories, or tried other apps and quit because logging took too long.',
    },
    {
      label: 'Benefits',
      title: 'Fast, accurate, affordable',
      body: 'Photo-based tracking, macro breakdowns, campus menu matching and a student price.',
    },
  ],
};

export const contact = {
  eyebrow: 'Join the waitlist',
  wordmark: 'EAT SMART',
  lede: 'Be one of the first Fairfield students to try CampusPlate. Join the waitlist for early beta access.',
  cta: 'Join the waitlist',
  sticker: 'CAMPUSPLATE ✺ SNAP ✺ TRACK ✺ EAT SMART ✺ ',
  image: `${base}media/story/ct-hero.webp`,
  imageAlt: 'The CampusPlate app showing a salmon and quinoa plate broken down into calories, protein, carbs and fat.',
  formPrompt: 'Tell us your goal: building muscle, eating more balanced, or just curious…',
  subject: 'CampusPlate waitlist',
};

export const footer = {
  note: 'A student venture concept for MKTG 1101 at Fairfield University.',
};
