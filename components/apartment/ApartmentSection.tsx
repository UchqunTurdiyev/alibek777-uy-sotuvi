"use client";

import { useCallback, useEffect, useRef, useState, type ComponentType } from "react";
import { APARTMENTS } from "@/lib/apartments";
import type { ViewerProps, ViewMode } from "./Viewer3D";

// 3D ko'ruvchi (three.js) sahifa ochilganda emas, bo'lim ekranga yaqinlashganda yuklanadi —
// shu sababli birinchi kirishda sayt tezligiga ta'sir qilmaydi.
export default function ApartmentSection() {
  const ref = useRef<HTMLDivElement>(null);
  const [Viewer, setViewer] = useState<ComponentType<ViewerProps> | null>(null);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const [idx, setIdx] = useState(0);
  const [cutaway, setCutaway] = useState(true);
  const [labels, setLabels] = useState(true);
  const [mode, setMode] = useState<ViewMode>("3d");
  const apt = APARTMENTS[idx];

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        // WebGL yo'q bo'lsa — rasmsiz ro'yxat ko'rinadi
        const cv = document.createElement("canvas");
        if (!(cv.getContext("webgl2") || cv.getContext("webgl"))) return setFailed(true);
        import("./Viewer3D")
          .then((m) => setViewer(() => m.default))
          .catch(() => setFailed(true));
      },
      { rootMargin: "500px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const onReady = useCallback(() => setReady(true), []);

  function choose(i: number) {
    setIdx(i);
    try {
      sessionStorage.setItem("apt", `${APARTMENTS[i].title} — ${APARTMENTS[i].area.toFixed(2)} m²`);
    } catch {}
  }

  function wantPrice() {
    try {
      sessionStorage.setItem("apt", `${apt.title} — ${apt.area.toFixed(2)} m²`);
    } catch {}
    const form = document.getElementById("forma");
    form?.scrollIntoView({ behavior: "smooth", block: "center" });
    form?.classList.remove("flash");
    setTimeout(() => form?.classList.add("flash"), 400);
    setTimeout(() => form?.querySelector<HTMLInputElement>("input[name=name]")?.focus({ preventScroll: true }), 700);
  }

  const living = apt.spaces.filter((s) => s.kind !== "balcony").reduce((a, s) => a + s.area, 0);

  return (
    <section className="section apt3d" id="xonadonlar">
      <div className="container">
        <h2 className="title reveal">Xonadonni 3D ko&apos;rinishda tanlang</h2>
        <p className="apt-sub reveal">
          Haqiqiy qavat rejasi asosida: devorlar, eshik-derazalar va jihozlangan xonalar. Aylantiring, yaqinlashtiring.
        </p>

        <div className="apt-tabs reveal" role="tablist">
          {APARTMENTS.map((a, i) => (
            <button
              key={a.id}
              role="tab"
              aria-selected={i === idx}
              className={i === idx ? "on" : ""}
              onClick={() => choose(i)}
            >
              <b>{a.title.split(" · ")[0]}</b>
              <span>{a.area.toFixed(2)} m²</span>
            </button>
          ))}
        </div>

        <div className="apt-grid" ref={ref}>
          <div className="apt-stage">
            {Viewer && !failed ? (
              <Viewer apt={apt} cutaway={cutaway} labels={labels} mode={mode} onReady={onReady} />
            ) : null}
            {(!Viewer || !ready) && !failed && (
              <div className="apt-loading">
                <span className="spin" /> 3D model yuklanmoqda...
              </div>
            )}
            {failed && <div className="apt-loading">Qurilmangiz 3D ko&apos;rinishni qo&apos;llab-quvvatlamaydi</div>}
            <div className="apt-tools">
              <button className={mode === "3d" ? "on" : ""} onClick={() => setMode("3d")}>3D</button>
              <button className={mode === "top" ? "on" : ""} onClick={() => setMode("top")}>Yuqoridan</button>
              <button className={cutaway ? "on" : ""} onClick={() => setCutaway((v) => !v)} title="Devor balandligi">
                {cutaway ? "Past devor" : "To'liq devor"}
              </button>
              <button className={labels ? "on" : ""} onClick={() => setLabels((v) => !v)}>Nomlar</button>
            </div>
            <p className="apt-hint">🖐 Sichqoncha yoki barmoq bilan aylantiring · g&apos;ildirak / ikki barmoq — yaqinlashtirish</p>
          </div>

          <aside className="apt-info">
            <div className="apt-head">
              <h3>{apt.title.split(" · ")[0]} xonadon</h3>
              <div className="apt-area">{apt.area.toFixed(2)} <small>m²</small></div>
            </div>
            <p className="apt-note">{apt.note}</p>
            <ul className="apt-rooms">
              {apt.spaces.map((s) => (
                <li key={s.name}>
                  <span>{s.name}</span>
                  <b>{s.area.toFixed(2)} m²</b>
                </li>
              ))}
            </ul>
            <div className="apt-sum">
              <span>Xonalar maydoni</span>
              <b>{living.toFixed(2)} m²</b>
            </div>
            <button className="btn btn-gold btn-shine apt-cta" onClick={wantPrice}>
              Shu xonadon narxini bilish
            </button>
            <p className="apt-small">Blok-1 · 5-qavat rejasi asosida. Mebellar namuna sifatida ko&apos;rsatilgan.</p>
          </aside>
        </div>
      </div>
    </section>
  );
}
