import {useEffect, useRef} from 'react';
import {process} from '../content';
import {useReducedMotion} from '../hooks/useReducedMotion';
import {clamp, lerp, pinProgress, range, smoothstep} from '../lib/math';
import {onFrame} from '../lib/scroll';
import {ScrubCanvas} from './ScrubCanvas';

/**
 * "How it works", told as a walk. The section pins while a giant readout
 * counts the steps from 0 to 5,000 and a step meter fills beside it. The
 * light shifts with it through the leash's stripes, red to yellow to green,
 * and the confetti rising off the floor slows, softens and starts drifting
 * down. Meanwhile the three steps slide through on a 3D carousel, the one in
 * front ringed in the current colour.
 *
 * The carousel doesn't move evenly: each card holds in front for a while,
 * and step 2 holds longest (the count climbs fastest right then, too).
 */

const SECTION_VH = 580;
const START = 0;
const GOAL = 5000;

/** Scroll → temperature and carousel windows, as shares of the pin. */
const W = {
  temp: [0.04, 0.9] as const,
  cards: [0.08, 0.92] as const,
};

/**
 * Carousel position (0 → 2) across the cards window. Flat stretches are
 * holds; the ramps between them are the slides.
 */
function carousel(u: number) {
  if (u < 0.1) return 0;
  if (u < 0.24) return smoothstep((u - 0.1) / 0.14);
  if (u < 0.7) return 1;
  if (u < 0.84) return 1 + smoothstep((u - 0.7) / 0.14);
  return 2;
}

/** A step-2 clip, if one is added, plays from as the card arrives to as it leaves. */
const HEAT_SCRUB = [0.17, 0.77] as const;

type RGB = [number, number, number];
// The leash's Baja stripes: red, yellow, green.
const EMBER: RGB = [234, 67, 53];
const FROST: RGB = [251, 188, 4];
const ICE: RGB = [52, 168, 83];
const BG_HOT: RGB = [24, 6, 4];
const BG_MID: RGB = [8, 7, 4];
const BG_COLD: RGB = [2, 18, 9];

const mix = (a: RGB, b: RGB, t: number): RGB => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
/** Three-stop ramp: a at 0, b at 0.5, c at 1. */
const ramp = (a: RGB, b: RGB, c: RGB, t: number) => (t < 0.5 ? mix(a, b, t * 2) : mix(b, c, (t - 0.5) * 2));
const rgb = ([r, g, b]: RGB, alpha = 1) => `rgba(${r | 0}, ${g | 0}, ${b | 0}, ${alpha})`;

function statusFor(steps: number) {
  if (steps < 500) return 'Leash on';
  if (steps < 2000) return 'Out the door';
  if (steps < 4500) return 'Around the block';
  return 'Good dog';
}

type Particle = {x: number; y: number; speed: number; size: number; phase: number};

function makeParticles(count: number): Particle[] {
  // Deterministic scatter so the field is the same on every visit.
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  return Array.from({length: count}, () => ({
    x: rand(),
    y: rand(),
    speed: 0.5 + rand() * 0.8,
    size: 0.7 + rand() * 1.3,
    phase: rand() * Math.PI * 2,
  }));
}

export function Process() {
  const rootRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tempRef = useRef<HTMLSpanElement>(null);
  const statusRef = useRef<HTMLSpanElement>(null);
  const mercuryRef = useRef<HTMLSpanElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const cardRefs = useRef<HTMLElement[]>([]);
  const imgRefs = useRef<HTMLElement[]>([]);
  const scrubProgress = useRef(0);
  const reduced = useReducedMotion();
  const reducedRef = useRef(reduced);
  reducedRef.current = reduced;

  // Canvas backing store follows its CSS size.
  useEffect(() => {
    const canvas = canvasRef.current!;
    const sync = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
    };
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const particles = makeParticles(window.matchMedia('(max-width: 767px)').matches ? 60 : 120);
    let lastTime = 0;
    let lastP = -1;
    let lastTemp = NaN;
    let lastStep = -1;

    return onFrame((time) => {
      const root = rootRef.current;
      const stage = stageRef.current;
      if (!root || !stage) return;
      const {p, rect, vh} = pinProgress(root);
      if (rect.bottom < 0 || rect.top > vh) {
        lastTime = 0;
        return;
      }
      const dt = lastTime ? Math.min(0.05, (time - lastTime) / 1000) : 0;
      lastTime = time;

      const t = smoothstep(range(p, ...W.temp));
      const heat = ramp(EMBER, FROST, ICE, t);

      // --- Confetti rises, then drifts down. Runs every frame while on screen. ---
      const cw = canvas.clientWidth;
      const ch = canvas.clientHeight;
      const dpr = canvas.width / Math.max(1, cw);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cw, ch);
      ctx.globalCompositeOperation = 'lighter';
      const vy = lerp(-0.07, 0.055, t); // share of the height per second
      const color = rgb(ramp(EMBER, [255, 214, 170], [235, 244, 255], t), 1);
      ctx.fillStyle = color;
      const moving = !reducedRef.current;
      for (const pt of particles) {
        if (moving) {
          pt.y += vy * pt.speed * dt;
          pt.x += Math.sin(time * 0.0006 + pt.phase) * 0.012 * dt;
          if (pt.y < -0.02) pt.y += 1.04;
          if (pt.y > 1.02) pt.y -= 1.04;
          if (pt.x < 0) pt.x += 1;
          if (pt.x > 1) pt.x -= 1;
        }
        // Early on it flickers small and bright; later it is larger and softer.
        const flicker = t < 0.5 ? 0.55 + 0.45 * Math.sin(time * 0.012 + pt.phase * 3) : 0.75;
        ctx.globalAlpha = lerp(0.9, 0.55, t) * flicker;
        const r = pt.size * lerp(1.2, 2.2, t);
        ctx.beginPath();
        ctx.arc(pt.x * cw, pt.y * ch, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';

      if (Math.abs(p - lastP) < 0.00005) return;
      lastP = p;

      // --- Room colour. ---
      stage.style.setProperty('--heat', rgb(heat));
      stage.style.setProperty('--heat-soft', rgb(heat, 0.32));
      stage.style.backgroundColor = rgb(ramp(BG_HOT, BG_MID, BG_COLD, t));

      // --- Readout + thermometer. ---
      const temp = Math.round(lerp(START, GOAL, t) / 10) * 10;
      if (temp !== lastTemp) {
        lastTemp = temp;
        tempRef.current!.textContent = temp.toLocaleString('en-US');
        statusRef.current!.textContent = statusFor(temp);
      }
      mercuryRef.current!.style.transform = `scaleY(${lerp(0.06, 1, t)})`;

      // --- Carousel. ---
      const n = cardRefs.current.length;
      const u = range(p, ...W.cards);
      const f = carousel(u) * ((n - 1) / 2);
      scrubProgress.current = range(u, ...HEAT_SCRUB);
      const step = Math.round(f);
      if (step !== lastStep) {
        lastStep = step;
        counterRef.current!.textContent = `0${step + 1}`;
      }
      barRef.current!.style.transform = `scaleX(${u})`;

      const vw = window.innerWidth;
      const gap = vw < 768 ? vw * 0.05 : vw * 0.03;
      cardRefs.current.forEach((card, i) => {
        const d = i - f; // <0 already passed, 0 in front, >0 still coming
        const w = card.offsetWidth;
        const x = d * (w + gap) + (d < 0 ? d * w * 0.35 : 0);
        const a = Math.abs(d);
        const scale = 1 - Math.min(a, 1.5) * 0.1;
        const rot = clamp(d, -1.5, 1.5) * -16;
        const lift = d < 0 ? d * -40 : 0;
        card.style.transform = `translate3d(${x}px, calc(-50% - ${lift}px), 0) perspective(1200px) rotateY(${rot}deg) scale(${scale})`;
        card.style.opacity = String(clamp(d < 0 ? 1 + d * 1.6 : 1 - d * 0.38));
        card.style.zIndex = String(10 - Math.round(a * 2));
        // Only the card in front wears the ring.
        const ring = clamp(1 - a * 2);
        card.style.setProperty('--ring', String(ring));
        // Scaled from the top edge so heads never crop; drift is sideways only.
        imgRefs.current[i].style.transform = `translate3d(${d * -24}px, 0, 0) scale(1.1)`;
      });
    });
  }, []);

  return (
    <section
      ref={rootRef}
      id="process"
      aria-labelledby="process-title"
      className="relative"
      style={{height: `${SECTION_VH}svh`}}
    >
      <div ref={stageRef} className="sticky top-0 h-screen-s overflow-hidden" style={{backgroundColor: rgb(BG_HOT)}}>
        {/* Glow off the floor, in the current temperature's colour. */}
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{background: 'radial-gradient(70% 60% at 22% 100%, var(--heat-soft, rgba(255,122,26,0.32)), transparent 70%)'}}
        />
        <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 size-full" />

        {/* Heading. */}
        <div className="absolute inset-x-4 top-20 sm:inset-x-6 md:top-24 lg:inset-x-8">
          <p className="text-micro font-semibold uppercase" style={{color: 'var(--heat, #ff7a1a)'}}>
            {process.eyebrow}
          </p>
          <h2 id="process-title" className="mt-3 max-w-[14ch] font-display text-[clamp(1.75rem,3.4vw,3.25rem)] leading-[1] font-medium tracking-[-0.03em]">
            {process.heading}
          </h2>
        </div>

        {/* Readout + thermometer. */}
        <div className="absolute inset-x-4 top-[30svh] flex items-end gap-5 sm:inset-x-6 md:top-auto md:right-auto md:bottom-[12svh] md:left-8">
          <div
            aria-hidden="true"
            className="relative hidden h-[34svh] w-4 shrink-0 rounded-full bg-white/10 ring-1 ring-white/15 md:block"
          >
            <span
              ref={mercuryRef}
              className="absolute inset-x-[3px] top-[3px] bottom-[3px] origin-bottom rounded-full"
              style={{background: 'var(--heat, #ff7a1a)'}}
            />
            <span className="absolute -bottom-3 left-1/2 size-7 -translate-x-1/2 rounded-full ring-1 ring-white/20" style={{background: 'var(--heat, #ff7a1a)'}} />
            <span className="absolute top-0 left-7 text-[0.625rem] font-medium whitespace-nowrap text-white/50">5,000</span>
            <span className="absolute top-[48%] left-7 text-[0.625rem] font-medium whitespace-nowrap text-white/50">2,500</span>
          </div>
          <div aria-live="off">
            <span
              ref={tempRef}
              className="block font-mark text-[clamp(4.25rem,9vw,9rem)] leading-[0.82] font-light tracking-[-0.04em] tabular-nums"
              style={{color: 'var(--heat, #ff7a1a)'}}
            >
              0
            </span>
            <span className="mt-3 flex items-center gap-2 text-micro font-semibold text-white/80 uppercase">
              <span className="size-2 rounded-full" style={{background: 'var(--heat, #ff7a1a)'}} />
              <span ref={statusRef}>Leash on</span>
              <span className="text-white/40">· Steps walked</span>
            </span>
          </div>
        </div>

        {/* Carousel. Cards are anchored at one spot and moved by transform. */}
        <ol className="absolute inset-0" aria-label="Steps">
          {process.steps.map((step, i) => (
            <li
              key={step.title}
              ref={(el) => {
                if (el) cardRefs.current[i] = el;
              }}
              className="absolute top-[68svh] left-[4vw] w-[78vw] origin-[50%_50%] will-change-transform md:top-1/2 md:left-[42vw] md:w-[min(26rem,30vw)]"
              style={{transform: 'translate3d(0,-50%,0)'}}
            >
              <article
                className="rounded-[26px] bg-white/[0.045] p-2.5 ring-1 ring-white/10 transition-shadow"
                style={{
                  boxShadow:
                    '0 0 0 calc(var(--ring, 0) * 1.5px) var(--heat, #ff7a1a), 0 40px 90px -40px color-mix(in srgb, var(--heat, #ff7a1a) calc(var(--ring, 0) * 90%), transparent)',
                }}
              >
                <div className="relative aspect-[4/3.4] overflow-hidden rounded-[20px] bg-ink-soft md:aspect-[4/4.4]">
                  <div
                    ref={(el) => {
                      if (el) imgRefs.current[i] = el;
                    }}
                    className="absolute inset-0 origin-top will-change-transform"
                    style={{transform: 'scale(1.1)'}}
                  >
                    {step.scrub ? (
                      <ScrubCanvas scrub={step.scrub} progress={scrubProgress} focusY={0} label={step.caption} className="absolute inset-0" />
                    ) : (
                      <img
                        src={step.image}
                        alt={step.caption}
                        width={896}
                        height={1120}
                        loading="lazy"
                        decoding="async"
                        className="size-full object-cover object-top"
                      />
                    )}
                  </div>
                  <span
                    className={`absolute top-3 left-3 rounded-full px-3 py-1.5 font-mark text-[0.75rem] font-medium backdrop-blur-md ${
                      i === 0 ? 'bg-goggle text-black' : i === 1 ? 'bg-white/85 text-black' : 'bg-cobalt text-white'
                    }`}
                  >
                    {step.temp}
                  </span>
                  <span className="absolute inset-x-3 bottom-3 font-display text-[1.0625rem] leading-tight font-bold tracking-[-0.02em] [text-shadow:0_2px_16px_rgb(0_0_0/0.7)]">
                    {step.caption}
                  </span>
                </div>
                <div className="flex gap-4 px-2.5 pt-4 pb-3">
                  <span
                    aria-hidden="true"
                    className="font-mark text-[2.25rem] leading-[0.9] font-light text-transparent"
                    style={{WebkitTextStroke: '1px rgb(255 255 255 / 0.45)'}}
                  >
                    0{i + 1}
                  </span>
                  <div>
                    <h3 className="font-display text-[1.25rem] leading-tight font-bold tracking-[-0.02em] md:text-[1.375rem]">{step.title}</h3>
                    <p className="mt-1.5 text-[0.875rem] leading-relaxed text-white/60 md:text-[0.9375rem]">{step.body}</p>
                  </div>
                </div>
              </article>
            </li>
          ))}
        </ol>

        {/* Step counter. */}
        <div className="absolute right-4 bottom-6 left-4 flex items-center gap-4 sm:right-6 sm:left-6 md:left-[42vw] lg:right-8" aria-hidden="true">
          <span className="font-mark text-[0.8125rem] font-medium tabular-nums">
            <span ref={counterRef}>01</span>
            <span className="text-white/40"> / 0{process.steps.length}</span>
          </span>
          <span className="relative h-px flex-1 bg-white/15">
            <span ref={barRef} className="absolute inset-0 origin-left" style={{background: 'var(--heat, #ff7a1a)', transform: 'scaleX(0)'}} />
          </span>
        </div>
      </div>
    </section>
  );
}
