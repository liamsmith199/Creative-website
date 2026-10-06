/**
 * The hero → ice-cube walk runs off a decoded WebP frame sequence rather than
 * a <video>. Scrubbing a <video> means writing `currentTime` on every scroll
 * tick, and browsers answer that with async seeks that drop or coalesce under
 * fast scrolling. Pre-decoded bitmaps make picking a frame an array index and
 * painting it one drawImage.
 *
 * Source: one 8-second clip at 24fps, every frame. An
 * earlier 12fps cut cross-dissolved between frames and ghosted whenever the
 * penguin moved quickly; full rate with hard cuts reads as real video.
 */

export const FRAME_COUNT = 193;

export type FrameSet = 'd' | 'm';

export const frameUrl = (set: FrameSet, i: number) =>
  `${import.meta.env.BASE_URL}frames/${set}/c${String(i + 1).padStart(3, '0')}.webp`;

/**
 * Coarse-to-fine order: the resting pose first, then every 32nd frame, then
 * every 16th… so a fast scroller always has a nearby frame to show while the
 * gaps fill in.
 */
function loadOrder(count: number): number[] {
  const seen = new Set<number>([0]);
  const order = [0];
  for (let stride = 32; stride >= 1; stride /= 2) {
    for (let i = 0; i < count; i += stride) {
      if (!seen.has(i)) {
        seen.add(i);
        order.push(i);
      }
    }
  }
  if (!seen.has(count - 1)) order.push(count - 1);
  return order;
}

function loadOne(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.src = src;
    const done = () => resolve(img);
    img.decode().then(done, () => (img.complete ? done() : (img.onload = done)));
    img.onerror = () => reject(new Error(`Failed to load ${src}`));
  });
}

/**
 * Streams any numbered sequence in coarse-to-fine, six requests at a time.
 * Returns a cancel function.
 */
export function loadSequence(
  count: number,
  urlFor: (index: number) => string,
  onFrame: (index: number, img: HTMLImageElement) => void,
) {
  const queue = loadOrder(count);
  let cancelled = false;

  const worker = async () => {
    while (!cancelled && queue.length) {
      const i = queue.shift()!;
      try {
        const img = await loadOne(urlFor(i));
        if (!cancelled) onFrame(i, img);
      } catch {
        // A missing frame just means its neighbour gets painted instead.
      }
    }
  };

  // Frame 0 alone first, so the resting pose paints before anything competes.
  loadOne(urlFor(queue.shift()!))
    .then((img) => !cancelled && onFrame(0, img))
    .catch(() => {})
    .finally(() => {
      for (let k = 0; k < 6; k++) void worker();
    });

  return () => {
    cancelled = true;
  };
}

/** The hero walk. */
export const loadFrames = (set: FrameSet, onFrame: (index: number, img: HTMLImageElement) => void) =>
  loadSequence(FRAME_COUNT, (i) => frameUrl(set, i), onFrame);
