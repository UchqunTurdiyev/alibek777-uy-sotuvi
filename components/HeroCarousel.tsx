"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type Slide = { src: string; alt: string };

const INTERVAL = 4500;

// Yengil karusel: avtomatik aylanadi, strelka, nuqtalar va barmoq bilan surish
export default function HeroCarousel({ slides }: { slides: Slide[] }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);
  const n = slides.length;
  const go = (k: number) => setI(((k % n) + n) % n);

  useEffect(() => {
    if (paused || n < 2) return;
    const t = setTimeout(() => setI((x) => (x + 1) % n), INTERVAL);
    return () => clearTimeout(t);
  }, [i, paused, n]);

  return (
    <div
      className="carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 40) go(i + (dx < 0 ? 1 : -1));
        touchX.current = null;
      }}
      aria-roledescription="carousel"
    >
      {slides.map((s, k) => (
        <div key={s.src} className={`slide${k === i ? " on" : ""}`} aria-hidden={k !== i}>
          <Image
            src={s.src}
            alt={s.alt}
            fill
            sizes="(max-width: 900px) 92vw, 440px"
            quality={70}
            priority={k === 0}
            loading={k === 0 ? undefined : "lazy"}
          />
        </div>
      ))}
      <span className="shine" />
      {n > 1 && (
        <>
          <button type="button" className="car-btn prev" onClick={() => go(i - 1)} aria-label="Oldingi rasm">‹</button>
          <button type="button" className="car-btn next" onClick={() => go(i + 1)} aria-label="Keyingi rasm">›</button>
          <div className="car-dots">
            {slides.map((s, k) => (
              <button
                key={s.src}
                type="button"
                className={k === i ? "on" : ""}
                onClick={() => go(k)}
                aria-label={`${k + 1}-rasm`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
