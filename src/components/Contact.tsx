import {useId, useState, type FormEvent} from 'react';
import {brand, contact} from '../content';
import {useFitText} from '../hooks/useFitText';
import {useReveals} from '../hooks/useReveals';
import {ParallaxImage} from './ParallaxImage';

type Status = 'idle' | 'invalid' | 'sent';

/** Rotating club sticker built around the leash's paw-print tag. */
function Sticker({className = ''}: {className?: string}) {
  const id = useId();
  return (
    <div className={`size-28 md:size-36 ${className}`} aria-hidden="true">
      <svg viewBox="0 0 200 200" className="spin-slow absolute inset-0 size-full drop-shadow-[0_10px_24px_rgb(0_0_0/0.35)]">
        <defs>
          <path id={id} d="M100,100 m-80,0 a80,80 0 1,1 160,0 a80,80 0 1,1 -160,0" />
        </defs>
        <circle cx="100" cy="100" r="98" fill="#fff" />
        <text className="font-mark" fontSize="15.5" fontWeight="500" letterSpacing="2.6" fill="#000">
          <textPath href={`#${id}`}>{contact.sticker}</textPath>
        </text>
      </svg>
      <img
        src={`${import.meta.env.BASE_URL}media/paw.webp`}
        alt=""
        width={320}
        height={320}
        loading="lazy"
        className="absolute inset-[19%] size-[62%] rounded-full object-cover ring-2 ring-black"
      />
    </div>
  );
}

/**
 * Final beat: the leash, front and centre. On wide screens the scene fills
 * the section with the copy, call to action and form over its empty left
 * half; the club sticker is slapped beside the leash.
 */
export function Contact() {
  const markRef = useFitText<HTMLSpanElement>();
  const [status, setStatus] = useState<Status>('idle');
  const sectionRef = useReveals<HTMLElement>();

  // No backend yet: compose the message and hand it to the visitor's mail app.
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    if (!form.checkValidity()) {
      setStatus('invalid');
      form.reportValidity();
      return;
    }
    const data = new FormData(form);
    const from = String(data.get('email'));
    const body = String(data.get('message'));
    const subject = encodeURIComponent('My dog wants to be a Doogler');
    const text = encodeURIComponent(`${body}\n\n— ${from}`);
    window.location.href = `mailto:${brand.email}?subject=${subject}&body=${text}`;
    setStatus('sent');
  };

  return (
    <section ref={sectionRef} id="contact" aria-labelledby="contact-title" className="relative overflow-hidden rounded-t-[28px] bg-cobalt">
      {/* Phones: the scene is a band on top. Wide screens: it fills the section. */}
      <div className="relative md:absolute md:inset-0">
        <ParallaxImage
          src={contact.image}
          alt="The Google Doogler Baja Dog Leash in bright green, red, yellow and blue stripes with a padded handle and silver clip."
          width={2560}
          height={1434}
          strength={30}
          className="aspect-[16/11] md:aspect-auto md:size-full"
          imgClassName="object-[82%_50%] md:object-[75%_50%]"
        />
        <div className="absolute inset-0 bg-linear-to-t from-cobalt via-transparent to-transparent md:bg-linear-to-r md:from-cobalt md:via-cobalt/35 md:to-transparent" />
        <Sticker className="absolute top-[10%] right-[5%] rotate-[-8deg] md:top-[12%] md:right-[7%]" />
      </div>

      <div className="relative px-4 pt-6 pb-10 sm:px-6 md:min-h-[100svh] md:pt-28 lg:px-8">
        <div className="max-w-[32rem]" data-reveal>
          <p className="text-micro font-semibold text-white/85 uppercase">{contact.eyebrow}</p>
          <p className="mt-4 font-display text-[clamp(1.5rem,2.6vw,2.25rem)] leading-[1.12] font-medium tracking-[-0.025em]">
            {contact.lede}
          </p>

          <a
            href={brand.shopUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center gap-3 rounded-full bg-white px-7 py-4 text-nav font-semibold text-black transition-transform hover:-translate-y-0.5 active:translate-y-0"
          >
            Get the Doogler Leash <span aria-hidden="true">→</span>
          </a>

          <form noValidate onSubmit={onSubmit} className="mt-8 space-y-3" aria-describedby="contact-status">
            <label className="block">
              <span className="sr-only">Your email</span>
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@email.com"
                onInput={() => status !== 'idle' && setStatus('idle')}
                className="w-full rounded-2xl bg-white/14 px-5 py-4 text-body text-white ring-1 ring-white/30 outline-none backdrop-blur-md placeholder:text-white/60 focus:bg-white/20 focus:ring-2 focus:ring-white user-invalid:ring-goggle"
              />
            </label>
            <label className="block">
              <span className="sr-only">Tell us about your dog</span>
              <textarea
                name="message"
                required
                rows={3}
                placeholder="Tell us about your dog, or who you're gifting a leash to…"
                onInput={() => status !== 'idle' && setStatus('idle')}
                className="w-full resize-none rounded-2xl bg-white/14 px-5 py-4 text-body text-white ring-1 ring-white/30 outline-none backdrop-blur-md placeholder:text-white/60 focus:bg-white/20 focus:ring-2 focus:ring-white user-invalid:ring-goggle"
              />
            </label>
            <div className="flex flex-wrap items-center gap-4 pt-1">
              <button
                type="submit"
                className="rounded-full bg-goggle px-7 py-4 text-nav font-semibold text-black transition-transform hover:-translate-y-0.5 active:translate-y-0"
              >
                Join the club
              </button>
              <a href={`mailto:${brand.email}`} className="text-nav font-medium text-white/90 underline decoration-white/40 underline-offset-4 hover:decoration-white">
                or write to {brand.email}
              </a>
            </div>
            <p id="contact-status" role="status" className="min-h-[1.25rem] text-[0.8125rem] text-white/90">
              {status === 'invalid' && 'Add your email and a line about your dog.'}
              {status === 'sent' && `Your mail app should be open with the message ready. If not, write to ${brand.email}.`}
            </p>
          </form>
        </div>

        <h2 id="contact-title" className="-mx-1 mt-14 leading-none md:absolute md:inset-x-4 md:bottom-6 md:mx-0 lg:inset-x-6" aria-label="Good dog">
          <span
            ref={markRef}
            aria-hidden="true"
            className="inline-block font-mark leading-[0.8] font-light tracking-[-0.02em] whitespace-nowrap"
          >
            {contact.wordmark}
          </span>
        </h2>
      </div>
    </section>
  );
}
