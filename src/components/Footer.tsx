import type {MouseEvent} from 'react';
import {brand, footer, nav} from '../content';
import {scrollToHash} from '../lib/scroll';
import {Paw} from './Logo';

const go = (e: MouseEvent<HTMLAnchorElement>) => {
  e.preventDefault();
  scrollToHash(e.currentTarget.getAttribute('href')!);
};

export function Footer() {
  return (
    <footer className="bg-cobalt-ink px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <span className="grid size-8 place-items-center rounded-full bg-white text-cobalt-ink">
            <Paw className="size-4" />
          </span>
          <span className="text-nav font-medium">
            © {new Date().getFullYear()} {brand.name}. <span className="text-white/60">{footer.note}</span>
          </span>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap items-center gap-x-5 gap-y-2">
          {nav.map((item) => (
            <a key={item.href} href={item.href} onClick={go} className="text-nav text-white/70 hover:text-white">
              {item.label}
            </a>
          ))}
          <a href="#top" onClick={go} className="rounded-full bg-white/10 px-4 py-2 text-nav font-medium hover:bg-white/20">
            Back to top ↑
          </a>
        </nav>
      </div>
    </footer>
  );
}
