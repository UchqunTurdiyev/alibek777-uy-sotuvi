"use client";

import { useEffect, useState, type FormEvent } from "react";

export default function CrmLogin({ brand }: { brand: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/crm/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: f.get("name"), password: f.get("password") }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "Xatolik");
      try {
        localStorage.setItem("crm_name", String(f.get("name") || ""));
      } catch {}
      location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xatolik");
      setLoading(false);
    }
  }

  const [saved, setSaved] = useState("");
  useEffect(() => {
    try {
      setSaved(localStorage.getItem("crm_name") || "");
    } catch {}
  }, []);

  return (
    <main className="crm-login">
      <form className="crm-login-box" onSubmit={onSubmit}>
        <div className="crm-login-logo">🏠</div>
        <h1>{brand} CRM</h1>
        <p>Menejerlar uchun panel</p>
        <label>
          <span>Ismingiz</span>
          <input name="name" key={saved} defaultValue={saved} placeholder="Masalan: Alibek" required minLength={2} maxLength={40} autoComplete="nickname" />
        </label>
        <label>
          <span>Parol</span>
          <input name="password" type="password" required autoComplete="current-password" />
        </label>
        {error && <div className="crm-error">{error}</div>}
        <button className="crm-btn crm-btn-gold" disabled={loading}>
          {loading ? "Kirilmoqda..." : "Kirish"}
        </button>
      </form>
    </main>
  );
}
