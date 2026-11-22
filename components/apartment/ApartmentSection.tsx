"use client";

import { useState, type CSSProperties } from "react";

// Xonadonlar — tayyor 3D planirovka rasmlari (public/uylar ichida)
type Plan = {
  id: string;
  title: string;
  area: number;
  src: string;
  note: string;
  rooms?: { name: string; area: number }[];
};

const PLANS: Plan[] = [
  {
    id: "4x-112",
    title: "4 xonali",
    area: 112.5,
    src: "/uylar/01.jpg",
    note: "Katta oila uchun: keng mehmonxona, ikki yotoqxona, bolalar xonasi, alohida oshxona va ikki balkon",
  },
  {
    id: "2x-75",
    title: "2 xonali",
    area: 75.3,
    src: "/uylar/02.jpg",
    note: "Keng mehmonxona, yotoqxona, alohida oshxona va ikki balkon",
  },
  {
    id: "2x-73",
    title: "2 xonali",
    area: 73.5,
    src: "/uylar/05.jpg",
    note: "Ikki keng xona, yotoqxona, alohida sanuzellar va balkon",
    rooms: [
      { name: "Oshxona-mehmonxona", area: 20.0 },
      { name: "Yotoqxona", area: 19.6 },
      { name: "Mehmonxona", area: 17.9 },
      { name: "Yo'lak", area: 8.4 },
      { name: "Sanuzel", area: 3.28 },
      { name: "Balkon", area: 4.32 },
    ],
  },
  {
    id: "1x-50",
    title: "1 xonali",
    area: 50,
    src: "/uylar/03.jpg",
    note: "Oshxona-mehmonxona, alohida yotoqxona, keng yo'lak va balkon",
  },
  {
    id: "1x-37",
    title: "1 xonali",
    area: 37.7,
    src: "/uylar/04.jpg",
    note: "Ixcham va qulay: yotoqxona, oshxona-ovqatlanish xonasi, hammom va balkon",
  },
];

const label = (p: Plan) => p.title + " — " + p.area.toFixed(2) + " m²";

export default function ApartmentSection() {
  const [idx, setIdx] = useState(0);
  const apt = PLANS[idx];

  function choose(i: number) {
    setIdx(i);
    try {
      sessionStorage.setItem("apt", label(PLANS[i]));
    } catch {}
  }

  function step(d: number) {
    choose((idx + d + PLANS.length) % PLANS.length);
  }

  function wantPrice() {
    try {
      sessionStorage.setItem("apt", label(apt));
    } catch {}
    const form = document.getElementById("forma");
    form?.scrollIntoView({ behavior: "smooth", block: "center" });
    form?.classList.remove("flash");
    setTimeout(() => form?.classList.add("flash"), 400);
    setTimeout(() => form?.querySelector<HTMLInputElement>("input[name=name]")?.focus({ preventScroll: true }), 700);
  }

  const arrow: CSSProperties = {
    position: "absolute", top: "50%", transform: "translateY(-50%)", zIndex: 2,
    width: 44, height: 44, borderRadius: "50%", border: "none", cursor: "pointer",
    background: "rgba(22,22,26,.72)", color: "#fff", fontSize: 22, lineHeight: "44px",
  };

  return (
    <section className="section apt3d" id="xonadonlar">
      <div className="container">
        <h2 className="title reveal">Xonadonni 3D ko&apos;rinishda tanlang</h2>
        <p className="apt-sub reveal">
          Har bir xonadonning jihozlangan 3D planirovkasi. Variantni tanlang va narxini bilib oling.
        </p>

        <div className="apt-tabs reveal" role="tablist">
          {PLANS.map((a, i) => (
            <button
              key={a.id}
              role="tab"
              aria-selected={i === idx}
              className={i === idx ? "on" : ""}
              onClick={() => choose(i)}
            >
              <b>{a.title}</b>
              <span>{a.area.toFixed(2)} m²</span>
            </button>
          ))}
        </div>

        <div className="apt-grid">
          <div className="apt-stage" style={{ background: "#ececee" }}>
            <a href={apt.src} target="_blank" rel="noopener" title="Kattaroq ko'rish">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                key={apt.src}
                src={apt.src}
                alt={"ALI BEK 777 — " + label(apt) + ", 3D planirovka"}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", padding: 12 }}
              />
            </a>
            <button style={{ ...arrow, left: 12 }} onClick={() => step(-1)} aria-label="Oldingi xonadon">‹</button>
            <button style={{ ...arrow, right: 12 }} onClick={() => step(1)} aria-label="Keyingi xonadon">›</button>
            {/* Boshqa rasmlarni oldindan yuklab qo'yish — almashtirishda kechikish bo'lmasin */}
            <div style={{ display: "none" }}>
              {PLANS.map((p) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={p.id} src={p.src} alt="" loading="lazy" />
              ))}
            </div>
          </div>

          <aside className="apt-info">
            <div className="apt-head">
              <h3>{apt.title} xonadon</h3>
              <div className="apt-area">{apt.area.toFixed(2)} <small>m²</small></div>
            </div>
            <p className="apt-note">{apt.note}</p>
            {apt.rooms && (
              <ul className="apt-rooms">
                {apt.rooms.map((s) => (
                  <li key={s.name}>
                    <span>{s.name}</span>
                    <b>{s.area.toFixed(2)} m²</b>
                  </li>
                ))}
              </ul>
            )}
            <div className="apt-sum">
              <span>Umumiy maydon</span>
              <b>{apt.area.toFixed(2)} m²</b>
            </div>
            <button className="btn btn-gold btn-shine apt-cta" onClick={wantPrice}>
              Shu xonadon narxini bilish
            </button>
            <p className="apt-small">Rasmni bosib kattaroq ko&apos;ring. Mebellar namuna sifatida ko&apos;rsatilgan.</p>
          </aside>
        </div>
      </div>
    </section>
  );
}
