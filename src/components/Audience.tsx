import type {PointerEvent} from 'react';
import {audience} from '../content';
import {useReveals} from '../hooks/useReveals';
import {Plate} from './Logo';

/** Same soft tilt as the hero's ice blocks, for fine pointers only. */
function tilt(e: PointerEvent<HTMLLIElement>) {
  if (e.pointerType !== 'mouse') return;
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  const nx = (e.clientX - r.left) / r.width - 0.5;
  const ny = (e.clientY - r.top) / r.height - 0.5;
  el.style.transform = `perspective(900px) rotateX(${ny * -6}deg) rotateY(${nx * 8}deg) translate3d(0,-4px,0)`;
}
function untilt(e: PointerEvent<HTMLLIElement>) {
  e.currentTarget.style.transform = '';
}

/**
 * Target market, from the venture workspace: the five segmentation lenses as
 * cards, then one lime card with how CampusPlate plans to reach them.
 */
export function Audience() {
  const sectionRef = useReveals<HTMLElement>();

  return (
    <section
      ref={sectionRef}
      id="audience"
      aria-labelledby="audience-title"
      className="relative bg-ink px-4 pt-28 pb-28 sm:px-6 md:pt-40 md:pb-40 lg:px-8"
    >
      <div className="grid gap-8 md:grid-cols-12 md:items-end" data-reveal>
        <div className="md:col-span-7">
          <p className="text-micro font-semibold text-goggle uppercase">{audience.eyebrow}</p>
          <h2 id="audience-title" className="mt-4 max-w-[16ch] font-display text-display font-medium">
            {audience.heading}
          </h2>
        </div>
        <p className="max-w-[26rem] text-body text-white/60 md:col-span-4 md:col-start-9">{audience.lede}</p>
      </div>

      <ul className="mt-14 grid gap-3 sm:grid-cols-2 md:mt-20 lg:grid-cols-3">
        {audience.segments.map((seg, i) => (
          <li
            key={seg.label}
            data-reveal
            onPointerMove={tilt}
            onPointerLeave={untilt}
            className="group rounded-[24px] bg-white/[0.045] p-6 ring-1 ring-white/10 transition-[transform,background-color] duration-500 ease-out hover:bg-white/[0.07] md:p-8"
            style={{transitionDelay: `${i * 40}ms`}}
          >
            <div className="flex items-center justify-between gap-4">
              <span className="text-micro font-semibold text-goggle uppercase">{seg.label}</span>
              <span className="font-mark text-[0.8125rem] font-medium text-white/30">0{i + 1}</span>
            </div>
            <h3 className="mt-6 font-display text-[clamp(1.375rem,2vw,1.75rem)] leading-tight font-bold tracking-[-0.02em]">{seg.title}</h3>
            <p className="mt-3 text-body text-white/60">{seg.body}</p>
          </li>
        ))}

        <li data-reveal className="flex flex-col justify-between gap-8 rounded-[24px] bg-goggle p-6 text-black md:p-8">
          <div className="flex items-center justify-between">
            <span className="text-micro font-semibold uppercase">How we reach them</span>
            <Plate className="size-6" />
          </div>
          <ul className="space-y-2 font-display text-[clamp(1.125rem,1.6vw,1.375rem)] leading-snug font-bold tracking-[-0.015em]">
            <li>Campus ambassadors</li>
            <li>TikTok and Instagram</li>
            <li>Dining, athletics and wellness partners</li>
          </ul>
        </li>
      </ul>
    </section>
  );
}
