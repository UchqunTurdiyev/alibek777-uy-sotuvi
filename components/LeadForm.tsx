"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

function getCookie(name: string) {
  const m = document.cookie.match(new RegExp("(^|;)\\s*" + name + "=([^;]+)"));
  return m ? decodeURIComponent(m[2]) : "";
}

// +998 XX XXX XX XX ko'rinishida formatlash
function formatPhone(input: string) {
  let d = input.replace(/\D/g, "");
  if (d.startsWith("998")) d = d.slice(3);
  d = d.slice(0, 9);
  const p = [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean);
  return "+998 " + p.join(" ");
}

const uuid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).slice(2);

export default function LeadForm({ id = "forma" }: { id?: string }) {
  const router = useRouter();
  const [phone, setPhone] = useState("+998 ");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;
    const f = new FormData(e.currentTarget);
    const name = String(f.get("name") || "").trim();
    const address = String(f.get("address") || "").trim();
    const digits = phone.replace(/\D/g, "");

    if (name.length < 2) return setError("Ismingizni kiriting");
    if (digits.length !== 12) return setError("Telefon raqamni to'liq kiriting");
    if (address.length < 2) return setError("Manzilingizni kiriting");

    setError("");
    setLoading(true);
    const eventId = uuid();
    let utm = {};
    try {
      utm = JSON.parse(localStorage.getItem("utm") || "{}");
    } catch {}

    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone: digits,
          address,
          website: f.get("website"),
          eventId,
          fbp: getCookie("_fbp"),
          fbc: getCookie("_fbc"),
          vid: getCookie("_vid"),
          url: location.href,
          referrer: document.referrer,
          utm,
        }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "Xatolik");

      // Pixel Lead — CAPI bilan bir xil eventID (deduplikatsiya)
      window.fbq?.("track", "Lead", { content_name: "Uy-joy", content_category: "real_estate" }, { eventID: eventId });

      // Keyingi tashriflarda Pixel advanced matching uchun
      try {
        const [fn, ...rest] = name.toLowerCase().split(/\s+/);
        localStorage.setItem("ud", JSON.stringify({ ph: digits, fn, ln: rest.join("") }));
      } catch {}

      router.push("/rahmat");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xatolik. Qayta urinib ko'ring.");
      setLoading(false);
    }
  }

  return (
    <form id={id} className="form" onSubmit={onSubmit} noValidate>
      <div className="form-head">
        <h2>Bepul maslahat oling</h2>
        <p>Ma'lumotlaringizni qoldiring — tez orada qo'ng'iroq qilamiz</p>
      </div>
      <label>
        <span>Ismingiz</span>
        <input name="name" type="text" autoComplete="name" placeholder="Masalan: Alisher" required maxLength={80} />
      </label>
      <label>
        <span>Telefon raqamingiz</span>
        <input
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(formatPhone(e.target.value))}
          onFocus={(e) => e.target.value.length < 5 && setPhone("+998 ")}
          required
        />
      </label>
      <label>
        <span>Manzilingiz</span>
        <input name="address" type="text" autoComplete="street-address" placeholder="Shahar, tuman" required maxLength={200} />
      </label>
      <input name="website" type="text" tabIndex={-1} autoComplete="off" className="hp" aria-hidden="true" />
      {error && <p className="form-error">{error}</p>}
      <button type="submit" className="btn btn-gold" disabled={loading}>
        {loading ? "Yuborilmoqda..." : "Ariza qoldirish"}
      </button>
      <p className="form-note">🔒 Ma'lumotlaringiz uchinchi shaxslarga berilmaydi</p>
    </form>
  );
}
