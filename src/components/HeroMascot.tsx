import {forwardRef, useEffect, useImperativeHandle, useRef, useState, type KeyboardEvent, type PointerEvent} from 'react';
import {mascot} from '../content';
import {useReducedMotion} from '../hooks/useReducedMotion';
import {lerp, smoothstep} from '../lib/math';
import {onFrame} from '../lib/scroll';
import type {Mascot, Manifest, View} from '../lib/mascot3d';

export type HeroMascotHandle = {
  /**
   * Places the model for hero progress `t` (0 = centred on the wordmark,
   * 1 = moved aside for the copy) and dims it by `fade` as the sheet rises.
   * `floor` is the y, in CSS pixels, where the mascot's feet should stand.
   */
  place: (t: number, fade: number, vw: number, vh: number, floor: number) => void;
};

type Status = 'loading' | 'ready' | 'fallback';

/** The canvas runs on below the mascot's feet by this share of the framed height. */
const PAD = 0.22;

const VIEWS: {id: View; label: string}[] = [
  {id: 'front', label: 'Front'},
  {id: 'side', label: 'Side'},
  {id: 'back', label: 'Back'},
];

/**
 * The confirmed Mission 2 mascot, standing on the wordmark in place of the old
 * plate illustration. Falls back to the confirmed preview picture, clearly
 * labelled as a still, when WebGL is unavailable or the model fails to load.
 */
export const HeroMascot = forwardRef<HeroMascotHandle>(function HeroMascot(_, ref) {
  const boxRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engine = useRef<Mascot | null>(null);
  const reduced = useReducedMotion();
  const reducedRef = useRef(reduced);
  reducedRef.current = reduced;
  const [status, setStatus] = useState<Status>('loading');
  const [progress, setProgress] = useState(0);
  const [hinted, setHinted] = useState(false);
  const last = useRef('');

  useImperativeHandle(ref, () => ({
    place(t, fade, vw, vh, floor) {
      const box = boxRef.current;
      if (!box) return;
      const wide = vw >= 768;
      const e = smoothstep(t);
      // Start: as tall as the space between the header and the wordmark allows.
      const top = vh * (wide ? 0.11 : 0.13);
      const h0 = Math.max(160, floor - top);
      const w0 = Math.min(h0 * 0.8, vw * 0.92);
      // End: the right-hand column on wide screens, below the copy on phones.
      const h1 = wide ? Math.min(h0 * 0.9, vh * 0.78) : vh * 0.34;
      const cx = vw * lerp(0.5, wide ? 0.74 : 0.5, e);
      const cy = lerp(top + h0 / 2, vh * (wide ? 0.53 : 0.8), e);
      const s = lerp(1, h1 / h0, e);
      const hBox = h0 * (1 + PAD);
      const style = `${Math.round(w0)}|${Math.round(hBox)}|${cx.toFixed(1)}|${cy.toFixed(1)}|${s.toFixed(4)}|${fade.toFixed(3)}`;
      if (style === last.current) return;
      const resized = !last.current.startsWith(`${Math.round(w0)}|${Math.round(hBox)}|`);
      last.current = style;
      box.style.width = `${Math.round(w0)}px`;
      box.style.height = `${Math.round(hBox)}px`;
      // Shown small, the buttons would be too fine to tap, so only dragging remains.
      box.dataset.compact = String(s < 0.7);
      box.style.transform = `translate3d(${cx - w0 / 2}px, ${cy - h0 / 2}px, 0) scale(${s})`;
      box.style.opacity = String(1 - fade * 0.35);
      box.style.filter = fade > 0.001 ? `blur(${fade * 8}px) brightness(${1 - fade * 0.45})` : '';
      if (resized) engine.current?.resize();
    },
  }));

  useEffect(() => {
    let alive = true;
    let stop = () => {};
    (async () => {
      const lib = await import('../lib/mascot3d');
      if (!alive) return;
      if (!lib.hasWebGL()) {
        setStatus('fallback');
        return;
      }
      try {
        const manifest = (await (await fetch(mascot.manifest)).json()) as Manifest;
        const m = await lib.createMascot(canvasRef.current!, {
          modelUrl: mascot.model,
          manifest,
          reduced: () => reducedRef.current,
          shadowColor: '#03301c',
          pad: PAD,
          onProgress: (f) => alive && setProgress(f),
          onLost: () => alive && setStatus('fallback'),
        });
        if (!alive) return m.dispose();
        engine.current = m;
        let prev = 0;
        stop = onFrame((time) => {
          const dt = prev ? Math.min(0.1, (time - prev) / 1000) : 1 / 60;
          prev = time;
          // Skip work once the hero has scrolled out of view.
          const r = boxRef.current?.getBoundingClientRect();
          if (r && (r.bottom < 0 || r.top > window.innerHeight)) return;
          m.tick(dt, time);
        });
        setStatus('ready');
      } catch (err) {
        console.warn('3D mascot unavailable, showing the static preview instead.', err);
        if (alive) setStatus('fallback');
      }
    })();
    return () => {
      alive = false;
      stop();
      engine.current?.dispose();
      engine.current = null;
    };
  }, []);

  // Drag to turn. Touch only turns sideways, so a vertical swipe still scrolls the page.
  const drag = useRef<{x: number; y: number; id: number; touch: boolean} | null>(null);
  const down = (e: PointerEvent<HTMLDivElement>) => {
    if (status !== 'ready' || (e.target as HTMLElement).closest('button')) return;
    drag.current = {x: e.clientX, y: e.clientY, id: e.pointerId, touch: e.pointerType !== 'mouse'};
    if (!drag.current.touch) e.currentTarget.setPointerCapture(e.pointerId);
  };
  const move = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    d.x = e.clientX;
    d.y = e.clientY;
    engine.current?.rotate(-dx * 0.009, d.touch ? 0 : dy * 0.006);
    if (!hinted && Math.abs(dx) > 2) setHinted(true);
  };
  const up = (e: PointerEvent<HTMLDivElement>) => {
    if (drag.current?.id === e.pointerId) drag.current = null;
  };
  const keys = (e: KeyboardEvent<HTMLDivElement>) => {
    const m = engine.current;
    if (!m || e.target !== e.currentTarget) return;
    const step: Record<string, () => void> = {
      ArrowLeft: () => m.rotate(0.3, 0),
      ArrowRight: () => m.rotate(-0.3, 0),
      ArrowUp: () => m.rotate(0, 0.12),
      ArrowDown: () => m.rotate(0, -0.12),
      '+': () => m.zoom(1),
      '=': () => m.zoom(1),
      '-': () => m.zoom(-1),
      '0': () => m.view('reset'),
      Home: () => m.view('reset'),
    };
    const act = step[e.key];
    if (!act) return;
    e.preventDefault();
    act();
    setHinted(true);
  };

  return (
    <div
      ref={boxRef}
      className="group absolute top-0 left-0 select-none"
      style={{width: 320, height: 480, touchAction: 'pan-y', transformOrigin: `50% ${(50 / (1 + PAD)).toFixed(2)}%`}}
      data-testid="hero-mascot"
      data-status={status}
    >
      {status !== 'fallback' && (
        <>
          <canvas
            ref={canvasRef}
            aria-hidden="true"
            data-testid="hero-mascot-canvas"
            className={`pointer-events-none absolute inset-0 size-full transition-opacity duration-700 ease-out ${status === 'ready' ? 'opacity-100' : 'opacity-0'}`}
          />
          {/* Drag and focus cover only the framed part; the canvas runs on below the screen edge. */}
          <div
            role="img"
            aria-label={`${mascot.alt} ${mascot.instructions}`}
            tabIndex={status === 'ready' ? 0 : -1}
            onPointerDown={down}
            onPointerMove={move}
            onPointerUp={up}
            onPointerCancel={up}
            onKeyDown={keys}
            className={`absolute inset-x-0 top-0 rounded-[28px] ${status === 'ready' ? 'cursor-grab active:cursor-grabbing' : ''}`}
            style={{height: `${(100 / (1 + PAD)).toFixed(2)}%`}}
          />
        </>
      )}

      {status === 'loading' && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center" role="status">
          <span className="flex items-center gap-3 rounded-full bg-black/20 px-4 py-2 text-micro font-semibold text-white/85 uppercase backdrop-blur-sm">
            <span
              aria-hidden="true"
              className="size-4 rounded-full border-2 border-white/25 border-t-goggle motion-safe:animate-spin"
            />
            {mascot.loading}
            {progress > 0 && <span className="tabular-nums">{Math.round(progress * 100)}%</span>}
          </span>
        </div>
      )}

      {status === 'fallback' && (
        <figure className="absolute inset-0 flex flex-col items-center justify-center gap-3" data-testid="hero-mascot-fallback">
          <img
            src={mascot.preview}
            alt={mascot.alt}
            className="max-h-[88%] w-auto max-w-full rounded-[24px] object-contain shadow-[0_24px_60px_-24px_rgb(2_40_20/0.6)]"
          />
          <figcaption className="rounded-full bg-black/25 px-3.5 py-1.5 text-center text-micro font-semibold text-white/85 uppercase">
            {mascot.fallback}
          </figcaption>
        </figure>
      )}

      {status === 'ready' && (
        <>
          {/* A quiet cue above the head that fades once the visitor has turned the mascot. */}
          <p
            aria-hidden="true"
            className={`pointer-events-none absolute inset-x-0 top-0 flex justify-center transition-opacity duration-700 group-data-[compact=true]:opacity-0 ${hinted ? 'opacity-0' : 'opacity-100'}`}
          >
            <span className="flex items-center gap-2 rounded-full bg-cobalt-ink/45 px-3.5 py-1.5 text-micro font-semibold text-white/90 uppercase backdrop-blur-sm">
              <span aria-hidden="true">↔</span>
              {mascot.hint}
            </span>
          </p>

          {/* Controls sit beside the mascot, clear of the wordmark below. */}
          <div
            className="absolute right-0 -translate-y-1/2 transition-opacity duration-300 group-data-[compact=true]:pointer-events-none group-data-[compact=true]:opacity-0 md:-right-2"
            style={{top: `${(50 / (1 + PAD)).toFixed(2)}%`}}
          >
            <div
              className="flex flex-col items-stretch gap-0.5 rounded-[22px] border border-white/20 bg-cobalt-ink/55 p-1 text-nav text-white shadow-[0_12px_30px_-12px_rgb(0_0_0/0.5)] backdrop-blur-md"
              role="toolbar"
              aria-orientation="vertical"
              aria-label={mascot.controlsLabel}
            >
              {VIEWS.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => engine.current?.view(v.id)}
                  className="rounded-full px-2.5 py-2 text-[0.75rem] font-medium text-white/85 transition-colors hover:bg-white/15 hover:text-white"
                  data-testid={`mascot-view-${v.id}`}
                >
                  {v.label}
                </button>
              ))}
              <span aria-hidden="true" className="mx-auto my-1 h-px w-5 bg-white/20" />
              <IconButton label="Zoom in" testId="mascot-zoom-in" onClick={() => engine.current?.zoom(1)}>
                <path d="M12 5v14M5 12h14" />
              </IconButton>
              <IconButton label="Zoom out" testId="mascot-zoom-out" onClick={() => engine.current?.zoom(-1)}>
                <path d="M5 12h14" />
              </IconButton>
              <IconButton label="Reset view" testId="mascot-reset" onClick={() => engine.current?.view('reset')}>
                <path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4h4" />
              </IconButton>
            </div>
          </div>
        </>
      )}
    </div>
  );
});

function IconButton({label, testId, onClick, children}: {label: string; testId: string; onClick: () => void; children: React.ReactNode}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      data-testid={testId}
      className="mx-auto grid size-9 place-items-center rounded-full text-white/85 transition-colors hover:bg-white/15 hover:text-white"
    >
      <svg viewBox="0 0 24 24" className="size-[1.1rem]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {children}
      </svg>
    </button>
  );
}
