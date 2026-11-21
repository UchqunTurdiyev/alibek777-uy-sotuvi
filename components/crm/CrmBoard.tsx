"use client";

import { Fragment, useCallback, useEffect, useMemo, useRef, useState, type DragEvent, type FormEvent } from "react";
import { STAGES, type LeadStatus } from "@/lib/stages";
import type { Comment } from "@/lib/store";
import type { CrmLead } from "@/lib/crm";

/* ───────────── yordamchi funksiyalar ───────────── */

const fmtPhone = (p: string) =>
  p.length === 12 ? `+${p.slice(0, 3)} ${p.slice(3, 5)} ${p.slice(5, 8)} ${p.slice(8, 10)} ${p.slice(10)}` : p;

const fmtTime = (ts?: number) =>
  ts
    ? new Intl.DateTimeFormat("ru-RU", {
        timeZone: "Asia/Samarkand",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(ts)
    : "";

const fmtMoney = (v: number) => new Intl.NumberFormat("ru-RU").format(v);

const stage = (k: LeadStatus) => STAGES.find((s) => s.key === k) || STAGES[0];

function sourceTag(l: CrmLead) {
  if (l.source === "manual") return "qo'lda";
  return l.utm?.utm_campaign || l.utm?.utm_source || "sayt";
}

async function api<T = { ok: boolean; error?: string }>(url: string, method = "GET", body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  if (res.status === 401) {
    location.reload();
    throw new Error("Sessiya tugadi");
  }
  const json = await res.json().catch(() => ({ ok: false, error: `HTTP ${res.status}` }));
  if (!json.ok) throw new Error(json.error || "Xatolik");
  return json as T;
}

type Confirm = { text: string; danger?: boolean; onYes: () => void } | null;
type Toast = { id: number; text: string; kind: "ok" | "err" };

/* ───────────── asosiy panel ───────────── */

export default function CrmBoard({ user, brand, dbReady }: { user: string; brand: string; dbReady: boolean }) {
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [q, setQ] = useState("");
  const [srcFilter, setSrcFilter] = useState<"all" | "website" | "manual">("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [openId, setOpenId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [purchaseFor, setPurchaseFor] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [dragOver, setDragOver] = useState<LeadStatus | null>(null);
  const [hidden, setHidden] = useState<Set<LeadStatus>>(new Set());
  const busy = useRef(false);

  const toast = useCallback((text: string, kind: "ok" | "err" = "ok") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, text, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const r = await api<{ ok: true; leads: CrmLead[] }>("/api/crm/leads");
      setLeads(r.leads);
      setLoadError("");
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Xatolik");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!dbReady) {
      setLoading(false);
      return;
    }
    load();
    try {
      const h = JSON.parse(localStorage.getItem("crm_hidden") || "[]");
      if (Array.isArray(h)) setHidden(new Set(h));
    } catch {}
    // Har 20 soniyada yangi lidlarni tekshirish
    const t = setInterval(() => {
      if (!busy.current && document.visibilityState === "visible") load(true);
    }, 20_000);
    return () => clearInterval(t);
  }, [load, dbReady]);

  const replaceLead = useCallback((l: CrmLead) => setLeads((all) => all.map((x) => (x.id === l.id ? l : x))), []);

  /* ── filtrlash ── */
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    const digits = s.replace(/\D/g, "");
    return leads.filter((l) => {
      if (srcFilter !== "all" && (l.source || "website") !== srcFilter) return false;
      if (!s) return true;
      if (l.name.toLowerCase().includes(s)) return true;
      if (digits.length >= 3 && l.phone.includes(digits)) return true;
      if (l.address?.toLowerCase().includes(s)) return true;
      if (l.tgUser?.toLowerCase().includes(s.replace(/^@/, ""))) return true;
      if (l.contact?.toLowerCase().includes(s)) return true;
      return l.comments.some((c) => c.text.toLowerCase().includes(s));
    });
  }, [leads, q, srcFilter]);

  const byStage = useMemo(() => {
    const m = new Map<LeadStatus, CrmLead[]>();
    STAGES.forEach((s) => m.set(s.key, []));
    filtered.forEach((l) => (m.get(l.status) || m.get("new")!).push(l));
    return m;
  }, [filtered]);

  const stats = useMemo(() => {
    const today = new Date().toLocaleDateString("ru-RU", { timeZone: "Asia/Samarkand" });
    const isToday = (ts: number) => new Date(ts).toLocaleDateString("ru-RU", { timeZone: "Asia/Samarkand" }) === today;
    const sold = leads.filter((l) => l.status === "purchased");
    return {
      total: leads.length,
      today: leads.filter((l) => isToday(l.createdAt)).length,
      sold: sold.length,
      sum: sold.reduce((a, l) => a + (l.value || 0), 0),
      currency: sold.find((l) => l.currency)?.currency || "",
      conv: leads.length ? Math.round((sold.length / leads.length) * 1000) / 10 : 0,
    };
  }, [leads]);

  /* ── amallar ── */

  async function changeStatus(id: string, status: LeadStatus, value?: string) {
    const lead = leads.find((l) => l.id === id);
    if (!lead) return;
    if (status === "purchased" && !value) {
      setPurchaseFor(id);
      return;
    }
    if (lead.status === status && !value) return;
    const prev = lead.status;
    replaceLead({ ...lead, status });
    busy.current = true;
    try {
      const r = await api<{ ok: true; lead: CrmLead; meta: { ok: boolean; error?: string } | null }>(
        `/api/crm/leads/${id}`,
        "PATCH",
        { status, value }
      );
      replaceLead(r.lead);
      const label = stage(status).label;
      if (r.meta && !r.meta.ok) toast(`"${label}" saqlandi, lekin Meta xato: ${r.meta.error}`, "err");
      else toast(r.meta ? `"${label}" — Metaga yuborildi ✅` : `"${label}" bosqichiga o'tkazildi`);
    } catch (e) {
      replaceLead({ ...lead, status: prev });
      toast(e instanceof Error ? e.message : "Xatolik", "err");
    } finally {
      busy.current = false;
    }
  }

  async function patchLead(id: string, body: Record<string, unknown>, okText?: string) {
    busy.current = true;
    try {
      const r = await api<{ ok: true; lead: CrmLead }>(`/api/crm/leads/${id}`, "PATCH", body);
      replaceLead(r.lead);
      if (okText) toast(okText);
      return true;
    } catch (e) {
      toast(e instanceof Error ? e.message : "Xatolik", "err");
      return false;
    } finally {
      busy.current = false;
    }
  }

  function deleteLead(id: string) {
    const l = leads.find((x) => x.id === id);
    setConfirm({
      text: `"${l?.name}" lidini butunlay o'chirasizmi? Bu amalni qaytarib bo'lmaydi.`,
      danger: true,
      onYes: async () => {
        try {
          await api(`/api/crm/leads/${id}`, "DELETE");
          setLeads((all) => all.filter((x) => x.id !== id));
          setSelected((s) => {
            const n = new Set(s);
            n.delete(id);
            return n;
          });
          if (openId === id) setOpenId(null);
          toast("Lid o'chirildi");
        } catch (e) {
          toast(e instanceof Error ? e.message : "Xatolik", "err");
        }
      },
    });
  }

  function bulkDelete() {
    const ids = [...selected];
    if (!ids.length) return;
    setConfirm({
      text: `Tanlangan ${ids.length} ta lidni butunlay o'chirasizmi? Bu amalni qaytarib bo'lmaydi.`,
      danger: true,
      onYes: async () => {
        try {
          const r = await api<{ ok: true; count: number }>("/api/crm/bulk", "POST", { action: "delete", ids });
          setLeads((all) => all.filter((x) => !selected.has(x.id)));
          setSelected(new Set());
          toast(`${r.count} ta lid o'chirildi`);
        } catch (e) {
          toast(e instanceof Error ? e.message : "Xatolik", "err");
        }
      },
    });
  }

  async function bulkMove(status: LeadStatus) {
    const ids = [...selected];
    if (!ids.length) return;
    busy.current = true;
    try {
      const r = await api<{ ok: true; count: number }>("/api/crm/bulk", "POST", { action: "status", ids, status });
      toast(`${r.count} ta lid "${stage(status).label}" bosqichiga o'tkazildi`);
      setSelected(new Set());
      await load(true);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Xatolik", "err");
    } finally {
      busy.current = false;
    }
  }

  async function logout() {
    await fetch("/api/crm/logout", { method: "POST" });
    location.reload();
  }

  function toggleSel(id: string) {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  function toggleColumn(key: LeadStatus, on: boolean) {
    const ids = (byStage.get(key) || []).map((l) => l.id);
    setSelected((s) => {
      const n = new Set(s);
      ids.forEach((id) => (on ? n.add(id) : n.delete(id)));
      return n;
    });
  }

  function toggleHidden(key: LeadStatus) {
    setHidden((h) => {
      const n = new Set(h);
      if (n.has(key)) n.delete(key);
      else n.add(key);
      try {
        localStorage.setItem("crm_hidden", JSON.stringify([...n]));
      } catch {}
      return n;
    });
  }

  /* ── drag & drop ── */
  function onDrop(e: DragEvent, key: LeadStatus) {
    e.preventDefault();
    setDragOver(null);
    const id = e.dataTransfer.getData("text/plain");
    if (id) changeStatus(id, key);
  }

  const openLead = leads.find((l) => l.id === openId) || null;
  const purchaseLead = leads.find((l) => l.id === purchaseFor) || null;

  if (!dbReady) {
    return (
      <main className="crm-setup">
        <h1>MongoDB ulanmagan</h1>
        <p>
          Vercel → Settings → Environment Variables bo&apos;limiga <code>MONGODB_URI</code> qo&apos;shing va qayta deploy
          qiling.
        </p>
        <button className="crm-btn" onClick={logout}>Chiqish</button>
      </main>
    );
  }

  return (
    <main className="crm">
      {/* Sarlavha */}
      <header className="crm-head">
        <div className="crm-title">
          <h1>{brand} CRM — Lid statuslari</h1>
          <span className="crm-user">👤 {user}</span>
        </div>
        <div className="crm-head-actions">
          <button className="crm-btn crm-btn-gold" onClick={() => setAdding(true)}>+ Lid qo&apos;shish</button>
          <button className="crm-btn" onClick={() => load()} title="Yangilash">⟳ Yangilash</button>
          <button className="crm-btn" onClick={logout}>⎋ Chiqish</button>
        </div>
      </header>

      {/* Statistika */}
      <section className="crm-stats">
        <div><b>{stats.total}</b><span>Jami lidlar</span></div>
        <div><b>{stats.today}</b><span>Bugun</span></div>
        <div><b>{stats.sold}</b><span>Sotuvlar</span></div>
        <div><b>{stats.conv}%</b><span>Konversiya</span></div>
        <div><b>{fmtMoney(stats.sum)} {stats.currency}</b><span>Sotuv summasi</span></div>
      </section>

      {/* Qidiruv va filtr */}
      <div className="crm-search">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Ism, telefon raqam, manzil yoki izoh bo'yicha qidirish..."
        />
        {q && <button className="crm-search-x" onClick={() => setQ("")} aria-label="Tozalash">×</button>}
      </div>

      <div className="crm-toolbar">
        <button className="crm-btn crm-btn-sm crm-btn-danger" disabled={!selected.size} onClick={bulkDelete}>
          Tanlanganlarni o&apos;chirish ({selected.size})
        </button>
        <button className="crm-btn crm-btn-sm" disabled={!selected.size} onClick={() => setSelected(new Set())}>
          Tanlovni tozalash
        </button>
        <select
          className="crm-select"
          disabled={!selected.size}
          value=""
          onChange={(e) => e.target.value && bulkMove(e.target.value as LeadStatus)}
        >
          <option value="">Tanlanganlarni ko&apos;chirish →</option>
          {STAGES.filter((s) => s.key !== "purchased").map((s) => (
            <option key={s.key} value={s.key}>{s.label}</option>
          ))}
        </select>
        <select className="crm-select" value={srcFilter} onChange={(e) => setSrcFilter(e.target.value as typeof srcFilter)}>
          <option value="all">Barcha manbalar</option>
          <option value="website">Saytdan</option>
          <option value="manual">Qo&apos;lda qo&apos;shilgan</option>
        </select>
        <div className="crm-hide">
          {STAGES.map((s) => (
            <button
              key={s.key}
              className={`crm-chip${hidden.has(s.key) ? " off" : ""}`}
              style={{ ["--c" as string]: s.color }}
              onClick={() => toggleHidden(s.key)}
              title={hidden.has(s.key) ? "Ustunni ko'rsatish" : "Ustunni yashirish"}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {loadError && (
        <div className="crm-error crm-error-bar">
          ⚠️ {loadError} <button className="crm-btn crm-btn-sm" onClick={() => load()}>Qayta urinish</button>
        </div>
      )}

      {/* Kanban */}
      <div className="crm-board">
        {STAGES.filter((s) => !hidden.has(s.key)).map((s) => {
          const list = byStage.get(s.key) || [];
          const allOn = list.length > 0 && list.every((l) => selected.has(l.id));
          const sum = s.key === "purchased" ? list.reduce((a, l) => a + (l.value || 0), 0) : 0;
          return (
            <section
              key={s.key}
              className={`crm-col${dragOver === s.key ? " over" : ""}`}
              style={{ ["--c" as string]: s.color }}
              onDragOver={(e) => {
                e.preventDefault();
                if (dragOver !== s.key) setDragOver(s.key);
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver(null);
              }}
              onDrop={(e) => onDrop(e, s.key)}
            >
              <div className="crm-col-head">
                <h2>
                  {s.label} <span>({list.length})</span>
                  {sum > 0 && <small>{fmtMoney(sum)} {list.find((l) => l.currency)?.currency}</small>}
                </h2>
                <label className="crm-all">
                  <input type="checkbox" checked={allOn} disabled={!list.length} onChange={(e) => toggleColumn(s.key, e.target.checked)} />
                  All
                </label>
              </div>
              <div className="crm-col-body">
                {loading && !leads.length ? (
                  <div className="crm-skel" />
                ) : list.length === 0 ? (
                  <div className="crm-empty">Bo&apos;sh</div>
                ) : (
                  list.map((l) => (
                    <LeadCard
                      key={l.id}
                      lead={l}
                      selected={selected.has(l.id)}
                      onSelect={() => toggleSel(l.id)}
                      onOpen={() => setOpenId(l.id)}
                      onDelete={() => deleteLead(l.id)}
                      onStatus={(st) => changeStatus(l.id, st)}
                      onDone={() => patchLead(l.id, { done: !l.done })}
                      onComment={async (text) => {
                        try {
                          const r = await api<{ ok: true; lead: CrmLead }>(`/api/crm/leads/${l.id}/comments`, "POST", { text });
                          replaceLead(r.lead);
                          toast("Izoh qo'shildi");
                          return true;
                        } catch (e) {
                          toast(e instanceof Error ? e.message : "Xatolik", "err");
                          return false;
                        }
                      }}
                      toast={toast}
                    />
                  ))
                )}
              </div>
            </section>
          );
        })}
      </div>

      {openLead && (
        <LeadModal
          lead={openLead}
          onClose={() => setOpenId(null)}
          onSave={(body) => patchLead(openLead.id, body, "Saqlandi")}
          onStatus={(st) => changeStatus(openLead.id, st)}
          onDelete={() => deleteLead(openLead.id)}
          onReplace={replaceLead}
          setConfirm={setConfirm}
          toast={toast}
        />
      )}

      {adding && (
        <AddModal
          onClose={() => setAdding(false)}
          onCreated={(l) => {
            setLeads((all) => [l, ...all]);
            setAdding(false);
            toast("Lid qo'shildi");
          }}
          toast={toast}
        />
      )}

      {purchaseLead && (
        <PurchaseModal
          lead={purchaseLead}
          onClose={() => setPurchaseFor(null)}
          onSubmit={async (v) => {
            setPurchaseFor(null);
            await changeStatus(purchaseLead.id, "purchased", v);
          }}
        />
      )}

      {confirm && (
        <div className="crm-overlay" onClick={() => setConfirm(null)}>
          <div className="crm-modal crm-modal-sm" onClick={(e) => e.stopPropagation()}>
            <p className="crm-confirm-text">{confirm.text}</p>
            <div className="crm-modal-foot">
              <button className="crm-btn" onClick={() => setConfirm(null)}>Bekor qilish</button>
              <button
                className={`crm-btn ${confirm.danger ? "crm-btn-danger" : "crm-btn-gold"}`}
                onClick={() => {
                  const fn = confirm.onYes;
                  setConfirm(null);
                  fn();
                }}
              >
                Ha, tasdiqlayman
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="crm-toasts">
        {toasts.map((t) => (
          <div key={t.id} className={`crm-toast ${t.kind}`}>{t.text}</div>
        ))}
      </div>
    </main>
  );
}

/* ───────────── kartochka ───────────── */

function LeadCard({
  lead: l,
  selected,
  onSelect,
  onOpen,
  onDelete,
  onStatus,
  onDone,
  onComment,
  toast,
}: {
  lead: CrmLead;
  selected: boolean;
  onSelect: () => void;
  onOpen: () => void;
  onDelete: () => void;
  onStatus: (s: LeadStatus) => void;
  onDone: () => void;
  onComment: (text: string) => Promise<boolean>;
  toast: (t: string, k?: "ok" | "err") => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const [writing, setWriting] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const comments = l.comments || [];
  const visible = showAll ? comments : comments.slice(-1);

  async function copy() {
    try {
      await navigator.clipboard.writeText("+" + l.phone);
      toast("Raqam nusxalandi");
    } catch {
      toast("Nusxalab bo'lmadi", "err");
    }
  }

  async function send(e: FormEvent) {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    if (await onComment(text.trim())) {
      setText("");
      setWriting(false);
    }
    setSending(false);
  }

  return (
    <article
      className={`crm-card${selected ? " sel" : ""}${l.done ? " done" : ""}`}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", l.id);
        e.dataTransfer.effectAllowed = "move";
      }}
    >
      <div className="crm-card-top">
        <input type="checkbox" checked={selected} onChange={onSelect} aria-label="Tanlash" />
        <button
          className={`crm-done${l.done ? " on" : ""}`}
          onClick={onDone}
          title={l.done ? "Ishlandi (belgini olib tashlash)" : "Ishlandi deb belgilash"}
          aria-label="Ishlandi"
        >
          {l.done ? "✓" : ""}
        </button>
      </div>

      <button className="crm-name" onClick={onOpen} title="Batafsil">{l.name}</button>
      <a className="crm-phone" href={`tel:+${l.phone}`}>{fmtPhone(l.phone)}</a>
      <div className="crm-row-btns">
        <button className="crm-btn crm-btn-sm" onClick={copy}>Copy</button>
        {l.tgUser && (
          <a className="crm-btn crm-btn-sm" href={`https://t.me/${l.tgUser}`} target="_blank" rel="noreferrer">Telegram</a>
        )}
      </div>

      <dl className="crm-fields">
        {l.address && (<><dt>Manzil:</dt><dd>{l.address}</dd></>)}
        {l.budget && (<><dt>Budjet:</dt><dd className="green">{l.budget}</dd></>)}
        {l.status === "purchased" && l.value ? (<><dt>Sotuv:</dt><dd className="green">{fmtMoney(l.value)} {l.currency}</dd></>) : null}
        <dt>tg:</dt><dd>{l.tgUser ? "@" + l.tgUser : "—"}</dd>
        <dt>IG ID / Email:</dt><dd className={l.contact ? "" : "warn"}>{l.contact || "yo'q"}</dd>
      </dl>

      <button className="crm-btn crm-btn-sm crm-wide" onClick={onOpen}>IG ID / Email tahrirlash</button>

      <div className="crm-comments">
        <div className="crm-comments-h">
          <b>Izohlar{comments.length ? ` (${comments.length})` : ""}:</b>
          {!writing && <button className="crm-link" onClick={() => setWriting(true)}>+ Izoh</button>}
        </div>
        {comments.length === 0 && !writing && <p className="crm-muted">Izohlar yo&apos;q.</p>}
        {visible.map((c) => (
          <p key={c.id} className={`crm-comment${showAll ? "" : " clamp"}`}>
            <span>{c.by}:</span> {c.text}
          </p>
        ))}
        {comments.length > 1 && (
          <button className="crm-link" onClick={() => setShowAll((v) => !v)}>
            {showAll ? "▲ Yig'ish" : `▼ Barchasini ko'rish (${comments.length})`}
          </button>
        )}
        {writing && (
          <form onSubmit={send} className="crm-comment-form">
            <textarea
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Izoh yozing..."
              rows={3}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send(e);
                if (e.key === "Escape") setWriting(false);
              }}
            />
            <div className="crm-row-btns">
              <button type="button" className="crm-btn crm-btn-sm" onClick={() => setWriting(false)}>Bekor</button>
              <button className="crm-btn crm-btn-sm crm-btn-gold" disabled={sending || !text.trim()}>
                {sending ? "..." : "Saqlash"}
              </button>
            </div>
          </form>
        )}
      </div>

      <select className="crm-select crm-wide" value={l.status} onChange={(e) => onStatus(e.target.value as LeadStatus)}>
        {STAGES.map((s) => (
          <option key={s.key} value={s.key}>{s.label}</option>
        ))}
      </select>

      <div className="crm-card-foot">
        <time>{fmtTime(l.createdAt)}</time>
        <button className="crm-del" onClick={onDelete} title="O'chirish" aria-label="O'chirish">🗑</button>
      </div>
      <span className="crm-tag">{sourceTag(l)}</span>
    </article>
  );
}

/* ───────────── batafsil oyna ───────────── */

function LeadModal({
  lead: l,
  onClose,
  onSave,
  onStatus,
  onDelete,
  onReplace,
  setConfirm,
  toast,
}: {
  lead: CrmLead;
  onClose: () => void;
  onSave: (b: Record<string, unknown>) => Promise<boolean>;
  onStatus: (s: LeadStatus) => void;
  onDelete: () => void;
  onReplace: (l: CrmLead) => void;
  setConfirm: (c: Confirm) => void;
  toast: (t: string, k?: "ok" | "err") => void;
}) {
  const [form, setForm] = useState({
    name: l.name,
    phone: "+" + l.phone,
    address: l.address || "",
    budget: l.budget || "",
    tgUser: l.tgUser || "",
    contact: l.contact || "",
  });
  const [saving, setSaving] = useState(false);
  const [text, setText] = useState("");
  const [editing, setEditing] = useState<{ id: string; text: string } | null>(null);
  const [tab, setTab] = useState<"comments" | "history" | "info">("comments");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function save(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    await onSave(form);
    setSaving(false);
  }

  async function addComment(e: FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      const r = await api<{ ok: true; lead: CrmLead }>(`/api/crm/leads/${l.id}/comments`, "POST", { text });
      onReplace(r.lead);
      setText("");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Xatolik", "err");
    }
  }

  async function saveComment() {
    if (!editing) return;
    try {
      const r = await api<{ ok: true; lead: CrmLead }>(`/api/crm/leads/${l.id}/comments`, "PATCH", {
        cid: editing.id,
        text: editing.text,
      });
      onReplace(r.lead);
      setEditing(null);
      toast("Izoh yangilandi");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Xatolik", "err");
    }
  }

  function delComment(c: Comment) {
    setConfirm({
      text: "Bu izohni o'chirasizmi?",
      danger: true,
      onYes: async () => {
        try {
          const r = await api<{ ok: true; lead: CrmLead }>(`/api/crm/leads/${l.id}/comments?cid=${c.id}`, "DELETE");
          onReplace(r.lead);
          toast("Izoh o'chirildi");
        } catch (err) {
          toast(err instanceof Error ? err.message : "Xatolik", "err");
        }
      },
    });
  }

  const utm = l.utm || {};

  return (
    <div className="crm-overlay" onClick={onClose}>
      <div className="crm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="crm-modal-head">
          <div>
            <h3>{l.name}</h3>
            <span className="crm-badge" style={{ ["--c" as string]: stage(l.status).color }}>{stage(l.status).label}</span>
            <span className="crm-muted"> · #{l.id} · {fmtTime(l.createdAt)}</span>
          </div>
          <button className="crm-x" onClick={onClose} aria-label="Yopish">×</button>
        </div>

        <div className="crm-modal-grid">
          <form onSubmit={save} className="crm-form">
            <label><span>Ism</span><input value={form.name} onChange={set("name")} /></label>
            <label><span>Telefon</span><input value={form.phone} onChange={set("phone")} inputMode="tel" /></label>
            <label><span>Manzil</span><input value={form.address} onChange={set("address")} /></label>
            <label><span>Budjet</span><input value={form.budget} onChange={set("budget")} placeholder="Masalan: 60 000 $" /></label>
            <label><span>Telegram username</span><input value={form.tgUser} onChange={set("tgUser")} placeholder="@username" /></label>
            <label><span>IG ID / Email</span><input value={form.contact} onChange={set("contact")} /></label>
            <label>
              <span>Bosqich</span>
              <select className="crm-select" value={l.status} onChange={(e) => onStatus(e.target.value as LeadStatus)}>
                {STAGES.map((s) => (
                  <option key={s.key} value={s.key}>{s.label}</option>
                ))}
              </select>
            </label>
            <div className="crm-row-btns">
              <button className="crm-btn crm-btn-gold" disabled={saving}>{saving ? "Saqlanmoqda..." : "Saqlash"}</button>
              <a className="crm-btn" href={`tel:+${l.phone}`}>📞 Qo&apos;ng&apos;iroq</a>
              <button type="button" className="crm-btn crm-btn-danger" onClick={onDelete}>O&apos;chirish</button>
            </div>
          </form>

          <div className="crm-side">
            <div className="crm-tabs">
              <button className={tab === "comments" ? "on" : ""} onClick={() => setTab("comments")}>Izohlar ({l.comments.length})</button>
              <button className={tab === "history" ? "on" : ""} onClick={() => setTab("history")}>Tarix ({l.history.length})</button>
              <button className={tab === "info" ? "on" : ""} onClick={() => setTab("info")}>Manba</button>
            </div>

            {tab === "comments" && (
              <>
                <form onSubmit={addComment} className="crm-comment-form">
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Yangi izoh... (Ctrl+Enter — saqlash)"
                    rows={3}
                    onKeyDown={(e) => e.key === "Enter" && (e.metaKey || e.ctrlKey) && addComment(e)}
                  />
                  <button className="crm-btn crm-btn-sm crm-btn-gold" disabled={!text.trim()}>Izoh qo&apos;shish</button>
                </form>
                <ul className="crm-timeline">
                  {[...l.comments].reverse().map((c) => (
                    <li key={c.id}>
                      <div className="crm-tl-meta">
                        <b>{c.by}</b> · {fmtTime(c.at)}
                        <span className="crm-tl-act">
                          <button className="crm-link" onClick={() => setEditing({ id: c.id, text: c.text })}>tahrirlash</button>
                          <button className="crm-link red" onClick={() => delComment(c)}>o&apos;chirish</button>
                        </span>
                      </div>
                      {editing?.id === c.id ? (
                        <div className="crm-comment-form">
                          <textarea value={editing.text} rows={3} onChange={(e) => setEditing({ id: c.id, text: e.target.value })} />
                          <div className="crm-row-btns">
                            <button className="crm-btn crm-btn-sm" onClick={() => setEditing(null)}>Bekor</button>
                            <button className="crm-btn crm-btn-sm crm-btn-gold" onClick={saveComment}>Saqlash</button>
                          </div>
                        </div>
                      ) : (
                        <p>{c.text}</p>
                      )}
                    </li>
                  ))}
                  {!l.comments.length && <li className="crm-muted">Hali izoh yo&apos;q</li>}
                </ul>
              </>
            )}

            {tab === "history" && (
              <ul className="crm-timeline">
                {[...l.history].reverse().map((h, i) => (
                  <li key={i}>
                    <div className="crm-tl-meta"><b>{h.by}</b> · {fmtTime(h.at)}</div>
                    <p>
                      → {stage(h.status).label}
                      {h.value ? ` — ${fmtMoney(h.value)} ${h.currency || ""}` : ""}
                      {h.meta === true && <span className="green"> · Meta ✅</span>}
                      {h.meta === false && <span className="red"> · Meta ⚠️</span>}
                    </p>
                  </li>
                ))}
                {!l.history.length && <li className="crm-muted">O&apos;zgarishlar yo&apos;q</li>}
              </ul>
            )}

            {tab === "info" && (
              <dl className="crm-fields crm-info">
                <dt>Manba:</dt><dd>{l.source === "manual" ? "Qo'lda qo'shilgan" : "Sayt formasi"}</dd>
                {Object.entries(utm).map(([k, v]) => (<Fragment key={k}><dt>{k}:</dt><dd>{v}</dd></Fragment>))}
                {l.url && (<><dt>Sahifa:</dt><dd className="crm-break">{l.url}</dd></>)}
                <dt>Yangilangan:</dt><dd>{fmtTime(l.updatedAt)}</dd>
              </dl>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────────── yangi lid ───────────── */

function AddModal({
  onClose,
  onCreated,
  toast,
}: {
  onClose: () => void;
  onCreated: (l: CrmLead) => void;
  toast: (t: string, k?: "ok" | "err") => void;
}) {
  const [saving, setSaving] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget));
    setSaving(true);
    try {
      const r = await api<{ ok: true; lead: CrmLead }>("/api/crm/leads", "POST", f);
      onCreated(r.lead);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Xatolik", "err");
      setSaving(false);
    }
  }

  return (
    <div className="crm-overlay" onClick={onClose}>
      <div className="crm-modal crm-modal-md" onClick={(e) => e.stopPropagation()}>
        <div className="crm-modal-head">
          <h3>Yangi lid qo&apos;shish</h3>
          <button className="crm-x" onClick={onClose} aria-label="Yopish">×</button>
        </div>
        <form className="crm-form" onSubmit={submit}>
          <label><span>Ism *</span><input name="name" required autoFocus /></label>
          <label><span>Telefon *</span><input name="phone" required inputMode="tel" placeholder="+998 90 123 45 67" /></label>
          <label><span>Manzil</span><input name="address" /></label>
          <label><span>Budjet</span><input name="budget" /></label>
          <label><span>Telegram username</span><input name="tgUser" placeholder="@username" /></label>
          <label><span>IG ID / Email</span><input name="contact" /></label>
          <label>
            <span>Bosqich</span>
            <select name="status" className="crm-select" defaultValue="new">
              {STAGES.filter((s) => s.key !== "purchased").map((s) => (
                <option key={s.key} value={s.key}>{s.label}</option>
              ))}
            </select>
          </label>
          <label><span>Izoh</span><textarea name="comment" rows={3} /></label>
          <div className="crm-modal-foot">
            <button type="button" className="crm-btn" onClick={onClose}>Bekor qilish</button>
            <button className="crm-btn crm-btn-gold" disabled={saving}>{saving ? "Saqlanmoqda..." : "Qo'shish"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ───────────── sotuv summasi ───────────── */

function PurchaseModal({ lead, onClose, onSubmit }: { lead: CrmLead; onClose: () => void; onSubmit: (v: string) => void }) {
  const [v, setV] = useState(lead.value ? String(lead.value) : "");
  return (
    <div className="crm-overlay" onClick={onClose}>
      <div className="crm-modal crm-modal-sm" onClick={(e) => e.stopPropagation()}>
        <h3>💰 Sotuv — {lead.name}</h3>
        <p className="crm-muted">Summani kiriting (masalan: 65000, 65k, 450 mln). Metaga Purchase hodisasi yuboriladi.</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (v.trim()) onSubmit(v.trim());
          }}
        >
          <input className="crm-input" autoFocus value={v} onChange={(e) => setV(e.target.value)} placeholder="Summa" />
          <div className="crm-modal-foot">
            <button type="button" className="crm-btn" onClick={onClose}>Bekor qilish</button>
            <button className="crm-btn crm-btn-gold" disabled={!v.trim()}>Saqlash</button>
          </div>
        </form>
      </div>
    </div>
  );
}
