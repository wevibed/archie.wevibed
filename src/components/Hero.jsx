import React, { useEffect, useRef } from "react";

// Full-bleed hero. Uses site.hero.image when set, otherwise the template's gradient. Text sits in front.
export default function Hero({ site, children }) {
  const bg = useRef(null);
  const { hero } = site;

  useEffect(() => {
    const el = bg.current;
    const mq = (q) => window.matchMedia && window.matchMedia(q).matches;
    // Parallax only on wide screens with a mouse. On phones it adds a per-frame transform on a huge layer.
    if (!el || mq("(prefers-reduced-motion: reduce)") || !mq("(min-width: 768px) and (pointer: fine)")) return undefined;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.transform = `translate3d(0, ${Math.min(window.scrollY, 800) * 0.18}px, 0)`;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <header className="hero" id="top">
      <div className="hero-bg" ref={bg}>
        {hero.image ? <img src={hero.image} alt={hero.imageAlt || ""} fetchpriority="high" decoding="async" /> : null}
      </div>
      <div className="hero-scrim" />
      <div className="hero-inner">
        {hero.eyebrow ? <p className="glass-dark inline-block rounded-full px-4 py-1.5 text-sm mb-5">{hero.eyebrow}</p> : null}
        <h1 className="text-4xl md:text-6xl font-bold leading-tight max-w-3xl">{hero.headline}</h1>
        {hero.subheadline ? <p className="mt-4 text-lg md:text-xl max-w-2xl opacity-90">{hero.subheadline}</p> : null}
        <div className="mt-8 flex flex-wrap gap-3">{children}</div>
      </div>
    </header>
  );
}
