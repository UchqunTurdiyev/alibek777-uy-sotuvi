import { createHmac, timingSafeEqual } from "crypto";
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
