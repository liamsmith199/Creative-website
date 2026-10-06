import {useEffect, useRef, type Ref} from 'react';
import {clamp} from '../lib/math';
import {onFrame} from '../lib/scroll';
import {LoopVideo} from './LoopVideo';

type Props = {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  /** Pixels of travel either side of centre as the frame crosses the viewport. */
  strength?: number;
  width: number;
  height: number;
  /** Optional silent loop shown instead of the still (the still becomes its poster). */
  video?: {src: string; poster: string};
};

/**
 * An image — or looping clip — that drifts against its frame as the frame
 * crosses the viewport. The media is scaled up just enough that the drift
 * never shows an edge.
 */
export function ParallaxImage({src, alt, className = '', imgClassName = '', strength = 36, width, height, video}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLImageElement | HTMLVideoElement>(null);

  useEffect(() => {
    let last = 2;
    return onFrame(() => {
      const wrap = wrapRef.current;
      const media = mediaRef.current;
      if (!wrap || !media) return;
      const r = wrap.getBoundingClientRect();
      const vh = window.innerHeight;
      if (r.bottom < -80 || r.top > vh + 80 || r.height === 0) return;
      // -1 as the frame enters from below, 0 centred, 1 as it leaves the top.
      const k = clamp((vh / 2 - (r.top + r.height / 2)) / (vh / 2 + r.height / 2), -1, 1);
      if (Math.abs(k - last) < 0.001) return;
      last = k;
      const scale = 1 + (strength * 2.2) / Math.max(1, r.height);
      media.style.transform = `translate3d(0, ${k * strength}px, 0) scale(${scale})`;
    });
  }, [strength]);

  const mediaClass = `size-full object-cover will-change-transform ${imgClassName}`;

  return (
    <div ref={wrapRef} className={`overflow-hidden ${className}`}>
      {video ? (
        <LoopVideo
          ref={mediaRef as Ref<HTMLVideoElement>}
          src={video.src}
          poster={video.poster}
          label={alt}
          className={mediaClass}
        />
      ) : (
        <img
          ref={mediaRef as Ref<HTMLImageElement>}
          src={src}
          alt={alt}
          width={width}
          height={height}
          loading="lazy"
          decoding="async"
          className={mediaClass}
        />
      )}
    </div>
  );
}
