import {forwardRef, useEffect, useImperativeHandle, useRef, type CSSProperties} from 'react';
import {useReducedMotion} from '../hooks/useReducedMotion';

type Props = {
  src: string;
  poster: string;
  className?: string;
  style?: CSSProperties;
  /** Extra gate on top of visibility — e.g. only the lit scene in a stack plays. */
  active?: boolean;
  label?: string;
};

/**
 * A silent looping clip that only decodes while it is on screen (and
 * `active`), and holds on its poster for people who prefer reduced motion.
 * Every loop starts and ends on the same frame, so the poster
 * is also a seamless resting state.
 */
export const LoopVideo = forwardRef<HTMLVideoElement, Props>(function LoopVideo(
  {src, poster, className = '', style, active = true, label},
  ref,
) {
  const videoRef = useRef<HTMLVideoElement>(null);
  useImperativeHandle(ref, () => videoRef.current!, []);
  const reduced = useReducedMotion();
  const visible = useRef(false);

  useEffect(() => {
    const video = videoRef.current!;
    const sync = () => {
      if (visible.current && active && !reduced) void video.play().catch(() => {});
      else video.pause();
    };
    const io = new IntersectionObserver(
      ([entry]) => {
        visible.current = entry.isIntersecting;
        sync();
      },
      {threshold: 0.05},
    );
    io.observe(video);
    sync();
    return () => io.disconnect();
  }, [active, reduced]);

  return (
    <video
      ref={videoRef}
      src={src}
      poster={poster}
      muted
      loop
      playsInline
      preload="metadata"
      aria-label={label}
      aria-hidden={label ? undefined : true}
      tabIndex={-1}
      className={className}
      style={style}
    />
  );
});
