import {useEffect, useRef, type RefObject} from 'react';
import {useReducedMotion} from '../hooks/useReducedMotion';
import {loadSequence} from '../lib/frames';
import {onFrame} from '../lib/scroll';

export type Scrub = {
  /** Folder under public/ holding f001.webp, f002.webp, … */
  dir: string;
  count: number;
};

type Props = {
  scrub: Scrub;
  /** 0–1, written by the parent each frame from its own scroll maths. */
  progress: RefObject<number>;
  className?: string;
  /** Cover-crop anchor, 0–1 on each axis. */
  focusX?: number;
  focusY?: number;
  label?: string;
};

/** Frames per second of the source clips — the playhead never moves slower. */
const FPS = 24;

export const scrubUrl = (dir: string, i: number) => `${dir}/f${String(i + 1).padStart(3, '0')}.webp`;

/**
 * A clip played by scrolling rather than by time. Same approach as the hero
 * walk: a pre-decoded frame sequence painted to a canvas, with a playhead
 * that chases the scroll position but never plays slower than the footage,
 * so it always reads as video. Frames only start streaming once the canvas
 * is within a screen or so of the viewport; the first frame doubles as the
 * poster until then.
 */
export function ScrubCanvas({scrub, progress, className = '', focusX = 0.5, focusY = 0.5, label}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frames = useRef<(HTMLImageElement | undefined)[]>(new Array(scrub.count));
  const dirty = useRef(true);
  const reduced = useReducedMotion();
  const reducedRef = useRef(reduced);
  reducedRef.current = reduced;

  // Lazy-start the stream.
  useEffect(() => {
    const wrap = wrapRef.current!;
    let cancel: (() => void) | undefined;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || cancel) return;
        cancel = loadSequence(scrub.count, (i) => scrubUrl(scrub.dir, i), (i, img) => {
          frames.current[i] = img;
          dirty.current = true;
        });
        io.disconnect();
      },
      {rootMargin: '120% 0px'},
    );
    io.observe(wrap);
    return () => {
      io.disconnect();
      cancel?.();
    };
  }, [scrub.count, scrub.dir]);

  // Backing store follows CSS size.
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
    const ctx = canvas.getContext('2d')!;
    const n = scrub.count;
    let playhead = 0;
    let lastTime = 0;
    let lastImg: HTMLImageElement | undefined;

    const nearest = (i: number) => {
      for (let d = 0; d < n; d++) {
        const a = frames.current[i - d];
        if (a) return a;
        const b = frames.current[i + d];
        if (b) return b;
      }
      return undefined;
    };

    return onFrame((time) => {
      const dt = lastTime ? Math.min(0.1, (time - lastTime) / 1000) : 1 / 60;
      lastTime = time;
      const wrap = wrapRef.current;
      if (!wrap) return;
      const r = wrap.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight || r.width === 0) return;

      const target = Math.min(1, Math.max(0, progress.current ?? 0)) * (n - 1);
      const diff = target - playhead;
      if (reducedRef.current) playhead = target;
      else if (Math.abs(diff) > 0.001) {
        const step = Math.max(FPS * 1.25, Math.abs(diff) * 3.2) * dt;
        playhead = Math.abs(diff) <= step ? target : playhead + Math.sign(diff) * step;
      }

      const img = nearest(Math.round(playhead));
      if (!img || (!dirty.current && img === lastImg)) return;
      lastImg = img;
      dirty.current = false;

      // object-fit: cover, anchored at the focus point.
      const cw = canvas.width;
      const ch = canvas.height;
      const s = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
      const w = img.naturalWidth * s;
      const h = img.naturalHeight * s;
      ctx.clearRect(0, 0, cw, ch);
      ctx.drawImage(img, (cw - w) * focusX, (ch - h) * focusY, w, h);
    });
  }, [scrub.count, progress, focusX, focusY]);

  return (
    <div ref={wrapRef} className={`overflow-hidden ${className}`} role={label ? 'img' : undefined} aria-label={label}>
      <img
        src={scrubUrl(scrub.dir, 0)}
        alt=""
        aria-hidden="true"
        loading="lazy"
        decoding="async"
        className="absolute inset-0 size-full object-cover"
        style={{objectPosition: `${focusX * 100}% ${focusY * 100}%`}}
      />
      <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 size-full" />
    </div>
  );
}
