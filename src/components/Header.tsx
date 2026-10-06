import {useEffect, useState, type MouseEvent} from 'react';
import {brand, nav} from '../content';
import {scrollToHash} from '../lib/scroll';
import {Snowflake} from './Logo';

function go(e: MouseEvent<HTMLAnchorElement>, then?: () => void) {
  const hash = e.currentTarget.getAttribute('href');
  if (!hash?.startsWith('#')) return;
  e.preventDefault();
  then?.();
  scrollToHash(hash);
}

export function Header() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 text-white">
      <div className="flex items-start justify-between gap-6 px-4 pt-4 sm:px-6 sm:pt-5 lg:px-8">
        <a href="#top" onClick={(e) => go(e)} className="group flex items-start gap-3" aria-label={`${brand.name} — back to top`}>
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white text-cobalt transition-transform duration-500 group-hover:rotate-60">
            <Snowflake className="size-5" />
          </span>
          <span className="hidden font-display text-[0.6875rem] leading-[1.25] font-medium text-white/85 sm:block">
            {brand.tagline.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </span>
        </a>

        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={(e) => go(e)}
              className="rounded-full px-3.5 py-2.5 text-nav font-medium text-white/85 transition-colors hover:bg-white/12 hover:text-white"
            >
              {item.label}
            </a>
          ))}
          <a
            href="#contact"
            onClick={(e) => go(e)}
            className="ml-3 rounded-full bg-goggle px-5 py-2.5 text-nav font-semibold text-black transition-transform hover:-translate-y-0.5 active:translate-y-0"
          >
            Join the club
          </a>
        </nav>

        <button
          type="button"
          className="grid size-10 place-items-center rounded-full bg-white/14 backdrop-blur-md md:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="relative block h-3 w-4">
            <span
              className={`absolute left-0 h-0.5 w-4 bg-white transition-transform duration-300 ${open ? 'top-[5px] rotate-45' : 'top-0'}`}
            />
            <span
              className={`absolute left-0 h-0.5 w-4 bg-white transition-transform duration-300 ${open ? 'top-[5px] -rotate-45' : 'top-2.5'}`}
            />
          </span>
        </button>
      </div>

      <div
        id="mobile-menu"
        className={`fixed inset-0 -z-10 flex flex-col justify-end bg-black/92 px-5 pb-10 backdrop-blur-xl transition-opacity duration-300 md:hidden ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        inert={!open}
      >
        <ul className="space-y-1">
          {nav.map((item, i) => (
            <li key={item.href}>
              <a
                href={item.href}
                onClick={(e) => go(e, () => setOpen(false))}
                className="flex items-baseline gap-4 py-2 font-display text-[2.5rem] leading-none font-medium tracking-[-0.03em]"
              >
                <span className="font-mark text-micro text-goggle">0{i + 1}</span>
                {item.label}
              </a>
            </li>
          ))}
        </ul>
        <a
          href="#contact"
          onClick={(e) => go(e, () => setOpen(false))}
          className="mt-8 rounded-full bg-goggle py-4 text-center text-nav font-semibold text-black"
        >
          Join the club
        </a>
      </div>
    </header>
  );
}
