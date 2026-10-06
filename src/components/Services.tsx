import {useEffect, useRef, useState, type MouseEvent} from 'react';
import {services} from '../content';
import {useReveals} from '../hooks/useReveals';
import {clamp} from '../lib/math';
import {onFrame, scrollToHash} from '../lib/scroll';
import {ParallaxImage} from './ParallaxImage';
import {ScrubCanvas} from './ScrubCanvas';

const toContact = (e: MouseEvent<HTMLAnchorElement>) => {
  e.preventDefault();
  scrollToHash('#contact');
};

/**
 * The menu. As the list scrolls, whichever row crosses the middle of the
 * screen lights up goggle-orange (keyboard focus can also pick one), and the
 * rest curve away from that line — sliding right and dimming the further
 * they are from it. On wide screens a sticky frame beside the list shows the
 * penguin doing the lit service, drifting against its own frame.
 *
 * A row with a scroll-played clip (the hammock) gets a dwell: its list item
 * is DWELL_VH tall and the row pins inside it, lit, while the clip plays
 * through with the scroll — then it lets go and the menu carries on.
 */

const DWELL_VH = 230;
export function Services() {
  const [active, setActive] = useState(0);
  const sectionRef = useReveals<HTMLElement>();
  // The visible body of each row (the pinned part, for a dwell row).
  const rowRefs = useRef<HTMLDivElement[]>([]);
  const rowInnerRefs = useRef<HTMLAnchorElement[]>([]);
  const dwellRef = useRef<HTMLLIElement>(null);
  const scrubProgress = useRef(0);
  const plateRef = useRef<HTMLDivElement>(null);
  const ghostRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let current = 0;
    let lastTop = Infinity;
    return onFrame(() => {
      const section = sectionRef.current;
      if (!section) return;
      const sr = section.getBoundingClientRect();
      const vh = window.innerHeight;
      if (sr.bottom < 0 || sr.top > vh) return;
      if (Math.abs(sr.top - lastTop) < 0.5) return;
      lastTop = sr.top;

      const mid = vh * 0.5;
      let best = current;
      let bestDist = Infinity;
      rowRefs.current.forEach((el, i) => {
        const r = el.getBoundingClientRect();
        const d = r.top + r.height / 2 - mid;
        if (Math.abs(d) < bestDist) {
          bestDist = Math.abs(d);
          best = i;
        }
        // Rows curve away from the reading line: a gentle arc, not a tilt.
        const n = clamp(Math.abs(d) / vh, 0, 1);
        const inner = rowInnerRefs.current[i];
        inner.style.transform = `translate3d(${n * n * 140}px, 0, 0)`;
        inner.style.opacity = String(1 - n * 0.55);
      });
      if (best !== current) {
        current = best;
        setActive(best);
      }

      // Dwell: how far the pinned row is through its stay.
      const dwell = dwellRef.current;
      const pinned = dwell?.firstElementChild as HTMLElement | null;
      if (dwell && pinned) {
        const lr = dwell.getBoundingClientRect();
        const stickyTop = parseFloat(getComputedStyle(pinned).top) || 0;
        scrubProgress.current = clamp((stickyTop - lr.top) / Math.max(1, lr.height - pinned.offsetHeight));
      }

      // Section progress, -1 entering → 1 leaving, drives the frame's layers.
      const k = clamp((mid - (sr.top + sr.height / 2)) / (sr.height / 2 + mid), -1, 1);
      if (plateRef.current) plateRef.current.style.transform = `translate3d(0, ${k * -42}px, 0)`;
      if (ghostRef.current) ghostRef.current.style.transform = `translate3d(0, ${k * 90}px, 0)`;
    });
  }, [sectionRef]);

  const item = services.items[active];

  return (
    <section
      ref={sectionRef}
      id="services"
      aria-labelledby="services-title"
      className="relative overflow-x-clip bg-ink px-4 pt-28 pb-24 sm:px-6 md:pt-40 md:pb-36 lg:px-8"
    >
      <div className="grid gap-8 md:grid-cols-12 md:items-end" data-reveal>
        <div className="md:col-span-7">
          <p className="text-micro font-semibold text-goggle uppercase">{services.eyebrow}</p>
          <h2 id="services-title" className="mt-4 font-display text-display font-medium">
            {services.heading}
          </h2>
        </div>
        <p className="max-w-[26rem] text-body text-white/60 md:col-span-4 md:col-start-9">{services.lede}</p>
      </div>

      <div className="mt-14 grid gap-10 md:mt-20 md:grid-cols-12 md:gap-8">
        <ol className="space-y-2 md:col-span-7">
          {services.items.map((s, i) => {
            const on = i === active;
            return (
              <li
                key={s.title}
                ref={s.scrub ? dwellRef : undefined}
                data-reveal
                style={s.scrub ? {height: `${DWELL_VH}vh`} : undefined}
              >
                <div
                  ref={(el) => {
                    if (el) rowRefs.current[i] = el;
                  }}
                  className={s.scrub ? 'sticky top-[10svh] md:top-[30vh]' : undefined}
                >
                  <a
                    ref={(el) => {
                      if (el) rowInnerRefs.current[i] = el;
                    }}
                    href="#contact"
                    onClick={toContact}
                    onFocus={() => setActive(i)}
                    aria-current={on ? 'true' : undefined}
                    className={`relative block overflow-hidden rounded-[22px] px-4 py-6 transition-colors duration-500 will-change-transform md:px-6 md:py-8 ${
                      on ? 'text-black' : 'text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    {/* Orange fill wipes in from the left on the lit row. */}
                    <span
                      aria-hidden="true"
                      className={`absolute inset-0 origin-left bg-goggle transition-transform duration-700 ease-[cubic-bezier(0.2,0.7,0.1,1)] ${
                        on ? 'scale-x-100' : 'scale-x-0'
                      }`}
                    />
                    {/* Hairline between unlit rows. */}
                    <span
                      aria-hidden="true"
                      className={`absolute inset-x-4 top-0 h-px bg-white/12 transition-opacity md:inset-x-6 ${on ? 'opacity-0' : ''}`}
                    />

                    <span className="relative grid grid-cols-[2.5rem_1fr_auto] items-center gap-x-4 md:grid-cols-[3.5rem_1fr_auto]">
                      <span className={`font-mark text-[0.8125rem] font-medium transition-colors duration-500 ${on ? 'text-black' : 'text-white/35'}`}>
                        0{i + 1}
                      </span>
                      <span
                        className={`font-display text-row font-medium transition-[color,transform] duration-500 ${
                          on ? 'translate-x-1.5 text-black' : 'text-white/45'
                        }`}
                      >
                        {s.title}
                      </span>
                      <span
                        aria-hidden="true"
                        className={`grid size-11 place-items-center rounded-full border transition-all duration-500 ${
                          on ? 'rotate-[-45deg] border-black bg-black text-goggle' : 'border-white/15 text-white/40'
                        }`}
                      >
                        →
                      </span>
                    </span>

                    <span className="relative mt-4 grid grid-cols-[2.5rem_1fr] gap-x-4 md:grid-cols-[3.5rem_1fr]">
                      <span />
                      <span>
                        <span className={`block max-w-[34rem] text-body transition-colors duration-500 ${on ? 'text-black/75' : 'text-white/55'}`}>
                          {s.body}
                        </span>
                        <span className="mt-3 flex flex-wrap gap-1.5">
                          {s.tags.map((tag) => (
                            <span
                              key={tag}
                              className={`rounded-full border px-2.5 py-1 text-[0.6875rem] font-medium transition-colors duration-500 ${
                                on ? 'border-black/30 text-black' : 'border-white/15 text-white/65'
                              }`}
                            >
                              {tag}
                            </span>
                          ))}
                        </span>
                        {/* Phones: the picture lives in the row. */}
                        {s.scrub ? (
                          <ScrubCanvas
                            scrub={s.scrub}
                            progress={scrubProgress}
                            label={s.caption}
                            className="relative mt-5 aspect-[4/3] rounded-[16px] md:hidden"
                          />
                        ) : (
                          <ParallaxImage
                            src={s.image}
                            alt={s.caption}
                            width={896}
                            height={1120}
                            strength={22}
                            className="mt-5 aspect-[4/3] rounded-[16px] md:hidden"
                          />
                        )}
                      </span>
                    </span>
                  </a>
                </div>
              </li>
            );
          })}
        </ol>

        {/* Wide screens: one sticky frame, crossfading between scenes. */}
        <div className="hidden md:col-span-5 md:block">
          {/* Width is capped from the height budget (74vh at 4:5) so the frame
              and the ticks under it always share one width. */}
          <figure className="sticky top-[14vh] ml-auto w-full max-w-[calc(74vh*0.8)]" data-reveal="clip">
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[28px] bg-ink-soft ring-2 ring-goggle/70">
              {/* Plate bleeds past the frame so its drift never shows an edge. */}
              <div ref={plateRef} className="absolute inset-x-0 -inset-y-[7%] will-change-transform">
                {services.items.map((s, i) => {
                  const cls = `absolute inset-0 size-full object-cover transition-[opacity,transform,filter] duration-700 ease-[cubic-bezier(0.2,0.7,0.1,1)] ${
                    i === active ? 'scale-100 opacity-100 blur-none' : 'scale-[1.08] opacity-0 blur-sm'
                  }`;
                  // The dwell scene plays with the scroll; the rest are stills.
                  return s.scrub ? (
                    <ScrubCanvas key={s.image} scrub={s.scrub} progress={scrubProgress} label={i === active ? s.caption : undefined} className={cls} />
                  ) : (
                    <img
                      key={s.image}
                      src={s.image}
                      alt={i === active ? s.caption : ''}
                      aria-hidden={i !== active}
                      width={896}
                      height={1120}
                      // All up front (~100KB each): a lazy frame could leave
                      // the caption naming a scene whose picture hadn't arrived.
                      loading="eager"
                      decoding="async"
                      className={cls}
                    />
                  );
                })}
              </div>
              {/* Big ghost numeral, drifting faster than the picture. */}
              <span
                ref={ghostRef}
                aria-hidden="true"
                className="pointer-events-none absolute top-4 right-5 font-mark text-[6rem] leading-none font-light text-transparent will-change-transform"
                style={{WebkitTextStroke: '1.5px var(--color-goggle)'}}
              >
                0{active + 1}
              </span>
              <figcaption className="absolute inset-x-4 bottom-4 flex items-center justify-between gap-3 rounded-2xl bg-black/50 px-4 py-3 backdrop-blur-md">
                <span className="text-[0.875rem] font-medium">{item.caption}</span>
                <span className="shrink-0 text-micro font-semibold text-goggle uppercase">{item.title}</span>
              </figcaption>
            </div>
            {/* Progress ticks — how far down the menu you are. */}
            <div className="mt-4 flex gap-1.5" aria-hidden="true">
              {services.items.map((s, i) => (
                <span key={s.title} className={`h-1 flex-1 rounded-full transition-colors duration-500 ${i <= active ? 'bg-goggle' : 'bg-white/15'}`} />
              ))}
            </div>
          </figure>
        </div>
      </div>
    </section>
  );
}
