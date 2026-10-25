import {useEffect, useRef, type PointerEvent} from 'react';
import {brand, hero, perks} from '../content';
import {useFitText} from '../hooks/useFitText';
import {useReducedMotion} from '../hooks/useReducedMotion';
import {clamp, easeInQuad, easeOutCubic, lerp, pinProgress, range, smoothstep} from '../lib/math';
import {onFrame} from '../lib/scroll';

/**
 * Pinned hero. One scroll range drives the whole beat:
 *
 *   0.00 – 0.13  wordmark letters drop out of frame, left to right
 *   0.04 – 0.56  the plate and phone swing, shrink and slide aside (canvas)
 *   0.52 – 0.72  "Snap a photo. Know your macros." rises, then three frosted blocks swing in,
 *                thaw and catch a glint, then drift apart as you keep going
 *   last 100vh   the black manifesto sheet rises over the stage while the
 *                stage blurs, dims and sinks back
 *
 * The manifesto section pulls itself up by 100svh (see Manifesto.tsx), so it
 * starts overlapping exactly when this stage has one viewport of pin left.
 */

const STAGE_VH = 540;

const T = {
  letters: [0.008, 0.13] as const,
  frames: [0.04, 0.55] as const,
  eyebrow: [0.515, 0.55] as const,
  heading: 0.52,
  headingStep: 0.022,
  headingLen: 0.05,
  cards: 0.56,
  cardStep: 0.04,
  cardLen: 0.1,
};

/** Per-letter tumble as it falls — fixed so the drop looks the same every visit. */
const TUMBLE = [-14, 9, -6, 12, 0, -10, 7, -12, 11];

const COBALT = '#0B7A4B'; // CampusPlate green

/** Hero cut-out of the plate and phone, painted to the canvas every frame it moves. */
const LEASH_SRC = `${import.meta.env.BASE_URL}media/hero-plate.webp`;

/**
 * Paints the plate and phone, in CSS pixels, into whatever transform `ctx` already
 * has. At t = 0 it hangs centred and large; by t = 1 it has swung, shrunk and
 * slid aside (right on wide screens, down on phones) to make room for copy.
 */
function drawScene(ctx: CanvasRenderingContext2D, vw: number, vh: number, img: HTMLImageElement, t: number) {
  ctx.fillStyle = COBALT;
  ctx.fillRect(0, 0, vw, vh);
  const wide = vw >= 768;
  const e = smoothstep(t);
  const ratio = img.naturalHeight / img.naturalWidth;
  // Cap by height too, so the picture never runs into the wordmark or header.
  const base = Math.min(wide ? Math.min(vw * 0.6, vh * 1.5) : vw * 0.9, (vh * (wide ? 0.58 : 0.34)) / ratio);
  const w = base * lerp(1, wide ? 0.82 : 0.86, e);
  const h = w * ratio;
  const cx = vw * lerp(0.5, wide ? 0.72 : 0.5, e);
  const cy = vh * lerp(wide ? 0.42 : 0.44, wide ? 0.5 : 0.76, e);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(((lerp(-9, 5, e) + Math.sin(t * Math.PI * 3) * 2) * Math.PI) / 180);
  ctx.shadowColor = 'rgba(0, 40, 20, 0.3)';
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 18;
  ctx.drawImage(img, -w / 2, -h / 2, w, h);
  ctx.restore();
}

/** Pointer tilt for the ice blocks — fine pointers only, eased by CSS. */
function tilt(e: PointerEvent<HTMLDivElement>) {
  if (e.pointerType !== 'mouse') return;
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  const nx = (e.clientX - r.left) / r.width - 0.5;
  const ny = (e.clientY - r.top) / r.height - 0.5;
  el.style.transform = `perspective(900px) rotateX(${ny * -10}deg) rotateY(${nx * 14}deg) translate3d(0,-4px,0) scale(1.035)`;
}
function untilt(e: PointerEvent<HTMLDivElement>) {
  e.currentTarget.style.transform = '';
}

export function IceStage() {
  const rootRef = useRef<HTMLElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fadeRefs = useRef<HTMLElement[]>([]);
  const letterRefs = useRef<HTMLSpanElement[]>([]);
  const perksRef = useRef<HTMLDivElement>(null);
  const eyebrowRef = useRef<HTMLParagraphElement>(null);
  const lineRefs = useRef<HTMLSpanElement[]>([]);
  const cardRefs = useRef<HTMLLIElement[]>([]);
  const frostRefs = useRef<HTMLSpanElement[]>([]);
  const shineRefs = useRef<HTMLSpanElement[]>([]);
  const textRefs = useRef<HTMLSpanElement[]>([]);
  const markRef = useFitText<HTMLSpanElement>();
  const reduced = useReducedMotion();
  const reducedRef = useRef(reduced);
  reducedRef.current = reduced;

  const picture = useRef<HTMLImageElement | undefined>(undefined);
  const dirty = useRef(true);

  // One picture, loaded once.
  useEffect(() => {
    const img = new Image();
    img.decoding = 'async';
    img.src = LEASH_SRC;
    img.onload = () => {
      picture.current = img;
      dirty.current = true;
    };
  }, []);

  // Keep the canvas backing store in step with its CSS size.
  useEffect(() => {
    const canvas = canvasRef.current!;
    const sync = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      dirty.current = true;
    };
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d', {alpha: false})!;
    // Blur during the sheet transition comes from painting into a small
    // canvas and scaling it back up — a few thousand pixels of work instead
    // of a full-screen CSS filter, which dropped frames.
    const lo = document.createElement('canvas');
    const loCtx = lo.getContext('2d', {alpha: false})!;

    let playhead = 0;
    let lastTime = 0;
    let lastP = -1;
    let lastFrame = -1;
    let lastBlur = -1;

    const paint = (img: HTMLImageElement, t: number, blur: number) => {
      const vw = canvas.clientWidth;
      const vh = canvas.clientHeight;
      if (blur < 0.001) {
        const dpr = canvas.width / Math.max(1, vw);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        drawScene(ctx, vw, vh, img, t);
        return;
      }
      const k = 1 + blur * 11;
      const lw = Math.max(8, Math.round(vw / k));
      const lh = Math.max(8, Math.round(vh / k));
      if (lo.width !== lw || lo.height !== lh) {
        lo.width = lw;
        lo.height = lh;
      }
      loCtx.setTransform(lw / vw, 0, 0, lh / vh, 0, 0);
      drawScene(loCtx, vw, vh, img, t);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(lo, 0, 0, lw, lh, 0, 0, canvas.width, canvas.height);
      ctx.fillStyle = `rgba(0, 0, 0, ${blur * 0.55})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    return onFrame((time) => {
      const dt = lastTime ? Math.min(0.1, (time - lastTime) / 1000) : 1 / 60;
      lastTime = time;

      const root = rootRef.current;
      if (!root) return;
      const {p, rect, vh} = pinProgress(root);
      if (rect.bottom < 0) return;

      // The playhead eases towards the scroll position, so the plate glides
      // rather than jumping when the wheel is flicked.
      const target = range(p, ...T.frames);
      const diff = target - playhead;
      if (reducedRef.current) {
        playhead = target;
      } else if (Math.abs(diff) > 0.0005) {
        playhead += diff * Math.min(1, dt * 7);
      } else {
        playhead = target;
      }

      const sheetStart = 1 - vh / Math.max(1, rect.height - vh);
      const x = range(p, sheetStart, 1);

      const img = picture.current;
      if (img && (dirty.current || playhead !== lastFrame || Math.abs(x - lastBlur) > 0.0005)) {
        paint(img, playhead, x);
        lastFrame = playhead;
        lastBlur = x;
        dirty.current = false;
      }

      if (Math.abs(p - lastP) < 0.00005) return;
      lastP = p;

      // Caption + scroll hint leave with the first flick of the wheel.
      const intro = 1 - range(p, 0, 0.035);
      fadeRefs.current.forEach((el) => (el.style.opacity = String(intro)));

      // Wordmark letters fall, each a beat after the one before.
      const n = letterRefs.current.length;
      letterRefs.current.forEach((el, i) => {
        const span = T.letters[1] - T.letters[0];
        const start = T.letters[0] + (i / n) * span * 0.55;
        const k = range(p, start, start + span * 0.45);
        const e = easeInQuad(k);
        el.style.transform = k > 0 ? `translate3d(0, ${e * 140}%, 0) rotate(${TUMBLE[i % TUMBLE.length] * e}deg)` : '';
        el.style.opacity = String(1 - k);
        el.style.filter = k > 0.01 ? `blur(${k * 6}px)` : '';
      });

      // Eyebrow fades up; each heading line rises out of its own mask.
      const eb = easeOutCubic(range(p, ...T.eyebrow));
      if (eyebrowRef.current) {
        eyebrowRef.current.style.opacity = String(eb);
        eyebrowRef.current.style.transform = `translate3d(0, ${(1 - eb) * 12}px, 0)`;
      }
      lineRefs.current.forEach((el, i) => {
        const start = T.heading + i * T.headingStep;
        const e = easeOutCubic(range(p, start, start + T.headingLen));
        el.style.transform = `translate3d(0, ${(1 - e) * 110}%, 0) rotate(${(1 - e) * 4}deg)`;
      });

      // Ice blocks: swing in from the left in 3D, thaw, catch a glint as they
      // land, then drift apart at different rates until the sheet arrives.
      const settled = T.cards + (cardRefs.current.length - 1) * T.cardStep + T.cardLen;
      cardRefs.current.forEach((el, i) => {
        const start = T.cards + i * T.cardStep;
        const a = range(p, start, start + T.cardLen);
        const e = easeOutCubic(a);
        const drift = range(p, settled, sheetStart) * (18 + i * 22);
        el.style.opacity = String(clamp(a * 2.4));
        el.style.transform =
          a >= 1
            ? `translate3d(0, ${-drift}px, 0)`
            : `perspective(1100px) translate3d(${(1 - e) * -140}px, ${(1 - e) * 36 - drift}px, 0) rotateY(${(1 - e) * -38}deg) rotateX(${(1 - e) * 14}deg) scale(${0.84 + e * 0.16})`;
        el.style.pointerEvents = a > 0.95 ? 'auto' : 'none';

        const thaw = range(a, 0.3, 0.95);
        frostRefs.current[i].style.opacity = String(1 - thaw);
        textRefs.current[i].style.filter = thaw < 0.99 ? `blur(${(1 - thaw) * 8}px)` : '';
        const s = range(a, 0.5, 1);
        shineRefs.current[i].style.transform = `translate3d(${-140 + s * 340}%, 0, 0) skewX(-18deg)`;
      });

      // As the sheet rises the copy lifts away with it (the canvas handles
      // its own blur; filtering DOM layers here is what cost frames).
      if (perksRef.current) {
        perksRef.current.style.opacity = String(1 - x * 0.9);
        perksRef.current.style.transform = x > 0 ? `translate3d(0, ${-x * 60}px, 0)` : '';
      }
      const scene = sceneRef.current!;
      scene.style.transform = x > 0.001 ? `scale(${1 - x * 0.06})` : '';
    });
  }, []);

  const letters = [...brand.wordmark];

  return (
    <section id="top" ref={rootRef} aria-label="Intro" className="relative" style={{height: `${STAGE_VH}svh`}}>
      <div className="sticky top-0 h-screen-s overflow-hidden bg-cobalt">
        <div ref={sceneRef} className="absolute inset-0 origin-[50%_70%]">
          <canvas ref={canvasRef} className="absolute inset-0 size-full" aria-hidden="true" />

          {/* Perks — top on phones, left column on wider screens. */}
          <div
            ref={perksRef}
            className="absolute inset-x-4 top-[11svh] sm:inset-x-6 md:top-1/2 md:right-auto md:left-[5vw] md:w-[min(38rem,46vw)] md:-translate-y-[54%]"
          >
            <p ref={eyebrowRef} className="text-micro font-semibold text-white/80 uppercase opacity-0">
              {perks.eyebrow}
            </p>
            <h2 className="mt-3 font-display text-display font-medium text-white">
              {perks.heading.map((line, i) => (
                <span key={line} className="block overflow-hidden pb-[0.08em]">
                  <span
                    ref={(el) => {
                      if (el) lineRefs.current[i] = el;
                    }}
                    className="block origin-[0_100%]"
                    style={{transform: 'translate3d(0,110%,0)'}}
                  >
                    {line}
                  </span>
                </span>
              ))}
            </h2>

            <ul className="mt-5 space-y-2.5 md:mt-9 md:space-y-4">
              {perks.items.map((item, i) => (
                <li
                  key={item.title}
                  ref={(el) => {
                    if (el) cardRefs.current[i] = el;
                  }}
                  className="origin-[0_50%] opacity-0"
                  style={{marginLeft: `calc(${i} * clamp(0.75rem, 2.8vw, 3rem))`, pointerEvents: 'none'}}
                >
                  <div
                    onPointerMove={tilt}
                    onPointerLeave={untilt}
                    className="w-full max-w-[32rem] transition-transform duration-500 ease-out will-change-transform"
                  >
                    <div className="ice relative flex items-center gap-4 overflow-hidden rounded-[20px] p-3.5 text-black md:gap-5 md:p-5">
                      {/* Numeral set in its own little ice cube. */}
                      <span className="grid size-12 shrink-0 place-items-center rounded-[13px] bg-linear-to-br from-[#eefbe0] to-[#c8f169] font-mark text-[0.9375rem] font-medium text-cobalt shadow-[inset_0_1px_0_#fff,inset_0_-6px_10px_-6px_rgb(11_122_75/0.45)] md:size-16 md:rounded-[16px] md:text-[1.125rem]">
                        0{i + 1}
                      </span>
                      <span
                        ref={(el) => {
                          if (el) textRefs.current[i] = el;
                        }}
                        className="min-w-0"
                        style={{filter: 'blur(8px)'}}
                      >
                        <span className="block font-display text-[clamp(1.0625rem,1.6vw,1.5rem)] leading-tight font-bold tracking-[-0.02em]">
                          {item.title}
                        </span>
                        <span className="mt-1 block text-[clamp(0.8125rem,0.95vw,1rem)] leading-snug text-black/60">{item.note}</span>
                      </span>

                      {/* Frost that thaws off as the block lands. */}
                      <span
                        ref={(el) => {
                          if (el) frostRefs.current[i] = el;
                        }}
                        aria-hidden="true"
                        className="frost pointer-events-none absolute inset-0 rounded-[inherit]"
                      />
                      {/* Glint that crosses the block once, on landing. */}
                      <span
                        ref={(el) => {
                          if (el) shineRefs.current[i] = el;
                        }}
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-linear-to-r from-transparent via-white/90 to-transparent mix-blend-soft-light"
                        style={{transform: 'translate3d(-140%,0,0) skewX(-18deg)'}}
                      />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-0">
            {/* Caption row sits on the wordmark's cap line. */}
            <div
              ref={(el) => {
                if (el) fadeRefs.current[0] = el;
              }}
              className="flex items-end justify-between px-4 pb-3 text-micro font-semibold text-white/85 uppercase sm:px-6 lg:px-8"
            >
              <span>{hero.caption}</span>
              <span className="flex items-center gap-2">
                {hero.scrollHint}
                <span aria-hidden="true" className="inline-block animate-bounce motion-reduce:animate-none">
                  ↓
                </span>
              </span>
            </div>

            <h1 className="px-3 leading-none sm:px-5 lg:px-6" aria-label={brand.name}>
              <span
                ref={markRef}
                aria-hidden="true"
                className="inline-block pb-[0.05em] font-mark leading-[0.8] font-light tracking-[-0.02em] whitespace-nowrap text-white"
              >
                {letters.map((ch, i) => (
                  <span
                    key={i}
                    ref={(el) => {
                      if (el) letterRefs.current[i] = el;
                    }}
                    className="inline-block will-change-transform"
                  >
                    {ch === ' ' ? ' ' : ch}
                  </span>
                ))}
              </span>
            </h1>
          </div>
        </div>
      </div>
    </section>
  );
}
