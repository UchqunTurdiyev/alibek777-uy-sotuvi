import { createHash, createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// CRM paneliga kirish: parol (CRM_PASSWORD) + menejer ismi. Sessiya imzolangan cookie'da saqlanadi.

export const COOKIE = "crm_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 kun

const secret = () => process.env.CRM_SECRET || process.env.CRM_PASSWORD || "";
export const crmEnabled = () => Boolean(process.env.CRM_PASSWORD);

const sign = (data: string) => createHmac("sha256", secret()).update(data).digest("base64url");

function safeEq(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function checkPassword(pw: string) {
  const real = process.env.CRM_PASSWORD || "";
  return Boolean(real) && safeEq(pw, real);
}

export function makeToken(name: string) {
  const payload = Buffer.from(JSON.stringify({ n: name, e: Date.now() + MAX_AGE * 1000 })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function readToken(token?: string): { name: string } | null {
  if (!token || !secret()) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig || !safeEq(sig, sign(payload))) return null;
  try {
    const { n, e } = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (typeof n !== "string" || typeof e !== "number" || e < Date.now()) return null;
    return { name: n };
  } catch {
    return null;
  }
}

export async function currentUser() {
  const jar = await cookies();
  return readToken(jar.get(COOKIE)?.value);
}

export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: MAX_AGE,
};

export const unauthorized = () => NextResponse.json({ ok: false, error: "Kirish talab qilinadi" }, { status: 401 });
export const fail = (error: string, status = 400) => NextResponse.json({ ok: false, error }, { status });

// O'chirish kodi. Repozitoriy ochiq bo'lgani uchun kodning o'zi emas, SHA-256 xeshi saqlanadi.
// Kodni almashtirish: Vercel'da CRM_DELETE_CODE qo'ying (u bo'lsa, shu xesh o'rniga ishlatiladi).
const DELETE_CODE_HASH = "c443727913d42cd1a8600c5f3e784a9260f5c43c1a99c4f704b27440b04deb8f";

export async function checkDeleteCode(code: unknown) {
  const c = typeof code === "string" ? code.trim() : "";
  const env = process.env.CRM_DELETE_CODE;
  const ok = c.length > 0 && (env ? safeEq(c, env) : safeEq(createHash("sha256").update(c).digest("hex"), DELETE_CODE_HASH));
  if (!ok) await new Promise((r) => setTimeout(r, 800)); // kod tanlashni sekinlashtirish
  return ok;
}

export const badCode = () => NextResponse.json({ ok: false, error: "O'chirish kodi noto'g'ri" }, { status: 403 });
