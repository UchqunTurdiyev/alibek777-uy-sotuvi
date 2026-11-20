"use client";

import { useEffect, useState } from "react";

const INTERVAL = 20_000; // har 20 soniyada
const VISIBLE = 7_000; // 7 soniya ko'rinib turadi

export default function RegisterToast() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let hideTimer: ReturnType<typeof setTimeout>;
    const tick = setInterval(() => {
      // Foydalanuvchi formani to'ldirayotgan bo'lsa, xalaqit bermaymiz
      const active = document.activeElement;
      if (active && active.closest("form")) return;
      setShow(true);
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => setShow(false), VISIBLE);
    }, INTERVAL);
    return () => {
      clearInterval(tick);
      clearTimeout(hideTimer);
    };
  }, []);

  function goForm() {
    setShow(false);
    const form = document.getElementById("forma");
    form?.scrollIntoView({ behavior: "smooth", block: "center" });
    form?.classList.remove("flash");
    setTimeout(() => form?.classList.add("flash"), 400);
    setTimeout(() => form?.classList.remove("flash"), 1800);
    setTimeout(() => form?.querySelector<HTMLInputElement>("input[name=name]")?.focus({ preventScroll: true }), 600);
  }

  return (
    <div className={`toast${show ? " show" : ""}`} role="status" aria-live="polite" aria-hidden={!show}>
      <div className="toast-icon">🏡</div>
      <div className="toast-body">
        <b>To&apos;liq ma&apos;lumot olish uchun ro&apos;yxatdan o&apos;ting</b>
        <span>Narxlar va mavjud uylar ro&apos;yxatini yuboramiz</span>
      </div>
      <button type="button" className="toast-btn" onClick={goForm} tabIndex={show ? 0 : -1}>
        Ro&apos;yxatdan o&apos;tish
      </button>
      <button type="button" className="toast-close" onClick={() => setShow(false)} aria-label="Yopish" tabIndex={show ? 0 : -1}>
        ×
      </button>
      <span className="toast-bar" />
    </div>
  );
}
