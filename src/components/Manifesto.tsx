import {useEffect, useMemo, useRef} from 'react';
import {manifesto, marquee} from '../content';
import {clamp, easeOutCubic, lerp, pinProgress, range} from '../lib/math';
import {onFrame} from '../lib/scroll';
import {Plate} from './Logo';

/**
 * The black sheet. It pulls itself up by one viewport so it slides over the
 * still-pinned ice stage — rounded top edge and grab handle leading — then
 * pins itself while the manifesto tips up into place word by word. The plunge loop
 * plays behind it, only while it is on screen.
 */

const SECTION_VH = 300;

type Word = {text: string; em: boolean};

export function Manifesto() {
  const rootRef = useRef<HTMLElement>(null);
  const wordRefs = useRef<HTMLSpanElement[]>([]);
  const lastPos = useRef(-1);

  const words = useMemo<Word[]>(
    () => manifesto.flatMap((run) => run.text.split(' ').map((text) => ({text, em: !!run.em}))),
    [],
  );

  useEffect(
    () =>
      onFrame(() => {
        const root = rootRef.current;
        if (!root) return;
        const {p, rect, vh} = pinProgress(root);
        if (rect.top > vh || rect.bottom < 0) return;

        // The first line is already legible as the sheet arrives; the rest
        // resolves over the pinned scroll.
        const n = words.length;
        const pos = lerp(6, n + 2, range(p, 0.02, 0.82));
        if (Math.abs(pos - lastPos.current) < 0.01) return;
        lastPos.current = pos;

        // Each word tips up out of the baseline — rising, un-blurring and
        // rotating flat over a window about a word and a half wide. Bold
        // words then draw a cobalt ice line underneath themselves.
        wordRefs.current.forEach((el, i) => {
          const a = clamp((pos - i) / 1.5, 0, 1);
          const e = easeOutCubic(a);
          const rest = words[i].em ? 1 : 0.55;
          el.style.opacity = String(lerp(0.1, rest, e));
          el.style.transform = e < 0.999 ? `translate3d(0, ${(1 - e) * 0.55}em, 0) rotateX(${(1 - e) * -75}deg)` : '';
          el.style.filter = e < 0.99 ? `blur(${(1 - e) * 6}px)` : '';
          if (words[i].em) {
            const u = easeOutCubic(clamp((pos - i - 1) / 1.5, 0, 1));
            el.style.backgroundSize = `${u * 100}% 0.1em`;
          }
        });
      }),
    [words],
  );

  return (
    <section
      id="manifesto"
      ref={rootRef}
      aria-labelledby="manifesto-title"
      className="relative z-10 -mt-[100svh]"
      style={{height: `${SECTION_VH}svh`}}
    >
      <div className="sticky top-0 h-screen-s overflow-hidden rounded-t-[28px] bg-ink shadow-[0_-30px_60px_-20px_rgb(0_0_0/0.6)]">
        {/* Grab handle, as on a bottom sheet. */}
        <div aria-hidden="true" className="absolute top-3 left-1/2 z-20 h-1 w-12 -translate-x-1/2 rounded-full bg-white/70" />

        {/* The tray on black. Full bleed on wide screens (its left half is
            empty, made for type); a band across the top on phones. */}
        <div className="absolute inset-x-0 top-0 h-[38svh] md:inset-0 md:h-auto">
          <img
            className="size-full object-cover object-[78%_50%] md:object-[70%_50%]"
            src={`${import.meta.env.BASE_URL}media/story/manifesto.webp`}
            alt=""
            width={1920}
            height={1080}
            loading="lazy"
            decoding="async"
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-linear-to-t from-ink via-transparent to-transparent md:bg-linear-to-r md:from-ink md:via-ink/40 md:to-transparent" />
        </div>

        <div className="relative z-10 flex h-full flex-col px-4 pt-[36svh] pb-[4.5rem] sm:px-6 md:justify-center md:pt-24 md:pb-28 lg:px-8">
          <div className="max-w-[min(44rem,46vw)] max-md:max-w-none">
            <p id="manifesto-title" className="flex items-center gap-2 text-micro font-semibold text-goggle uppercase">
              <Plate className="size-3.5" />
              Why CampusPlate
            </p>
            <p className="mt-5 font-display text-manifesto font-medium text-white [perspective:700px]">
              {words.map((w, i) => (
                <span key={i}>
                  <span
                    ref={(el) => {
                      if (el) wordRefs.current[i] = el;
                    }}
                    className={`inline-block origin-[50%_100%] ${w.em ? 'font-bold' : ''}`}
                    style={{
                      opacity: 0.1,
                      transform: 'translate3d(0,0.55em,0) rotateX(-75deg)',
                      ...(w.em && {
                        backgroundImage: 'linear-gradient(var(--color-cobalt), var(--color-cobalt))',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: '0 96%',
                        backgroundSize: '0% 0.1em',
                      }),
                    }}
                  >
                    {w.text}
                  </span>{' '}
                </span>
              ))}
            </p>
          </div>
        </div>

        {/* What we make, on a loop, in the band a studio would usually give to client logos. */}
        <div className="absolute inset-x-0 bottom-0 z-10 overflow-hidden border-t border-white/10 py-4 md:py-5" aria-label="What CampusPlate does">
          <ul className="marquee-track flex w-max gap-10 pr-10 font-mark text-[0.8125rem] font-light tracking-[0.02em] text-white/55 uppercase md:text-[0.9375rem]">
            {[...marquee, ...marquee].map((item, i) => (
              <li key={i} className="flex items-center gap-10 whitespace-nowrap" aria-hidden={i >= marquee.length}>
                {item}
                <Plate className="size-3 text-goggle" />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
