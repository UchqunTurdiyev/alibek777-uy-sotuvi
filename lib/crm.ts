import type { Lead } from "./store";

// Panelga yuboriladigan lid ko'rinishi (texnik maydonlarsiz)
export type CrmLead = Pick<
  Lead,
  | "id" | "name" | "phone" | "address" | "createdAt" | "updatedAt" | "source" | "utm" | "status" | "value"
  | "currency" | "budget" | "tgUser" | "contact" | "done" | "history" | "comments" | "url"
>;

export function toCrm(l: Lead): CrmLead {
  return {
    id: l.id,
    name: l.name,
    phone: l.phone,
    address: l.address,
    createdAt: l.createdAt,
    updatedAt: l.updatedAt,
    source: l.source,
    utm: l.utm,
    status: l.status,
    value: l.value,
    currency: l.currency,
    budget: l.budget,
    tgUser: l.tgUser,
    contact: l.contact,
    done: l.done,
    history: l.history || [],
    comments: l.comments || [],
    url: l.url,
  };
}

export const str = (v: unknown, max = 300) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export function normPhone(v: unknown) {
  let p = str(v, 30).replace(/\D/g, "");
  if (p.length === 9) p = "998" + p;
  return /^998\d{9}$/.test(p) ? p : null;
}

export function parseAmount(v: unknown) {
  if (typeof v === "number") return Number.isFinite(v) && v > 0 ? Math.round(v * 100) / 100 : null;
  let t = str(v, 40).toLowerCase().replace(/\s|_/g, "").replace(/\$|usd|so'm|som|сум|uzs/g, "");
  let mult = 1;
  if (/k$/.test(t)) { mult = 1000; t = t.slice(0, -1); }
  if (/(mln|m)$/.test(t)) { mult = 1_000_000; t = t.replace(/(mln|m)$/, ""); }
  if (/^\d{1,3}([.,]\d{3})+$/.test(t)) t = t.replace(/[.,]/g, "");
  else t = t.replace(",", ".");
  const n = parseFloat(t) * mult;
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null;
}
