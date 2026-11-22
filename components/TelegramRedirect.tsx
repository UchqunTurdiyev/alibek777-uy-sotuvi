"use client";

import { useEffect, useState } from "react";

const SECONDS = 10;

export default function TelegramRedirect({ url }: { url: string }) {
  const [left, setLeft] = useState(SECONDS);

  useEffect(() => {
    if (!url) return;
    const t = setInterval(() => setLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    const go = setTimeout(() => window.location.assign(url), SECONDS * 1000);
    return () => {
      clearInterval(t);
      clearTimeout(go);
    };
  }, [url]);

  if (!url) return null;

  const pct = ((SECONDS - left) / SECONDS) * 100;
  return (
    <div className="tg-redirect">
      <p>
        <b>{left}</b> soniyadan so&apos;ng Telegram kanalimizga o&apos;tasiz
      </p>
      <div className="tg-progress"><span style={{ width: `${pct}%` }} /></div>
      <a href={url} className="btn btn-tg">✈️ Telegram kanalga o&apos;tish</a>
    </div>
  );
}
