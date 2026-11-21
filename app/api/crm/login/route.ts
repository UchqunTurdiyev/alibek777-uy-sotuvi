import { NextRequest, NextResponse } from "next/server";
import { checkPassword, makeToken, COOKIE, cookieOptions, crmEnabled, fail } from "@/lib/crm-auth";
import { str } from "@/lib/crm";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!crmEnabled()) return fail("CRM_PASSWORD sozlanmagan", 500);
  const b = await req.json().catch(() => ({}));
  const name = str(b.name, 40);
  const password = str(b.password, 200);
  if (name.length < 2) return fail("Ismingizni kiriting");
  if (!checkPassword(password)) {
    await new Promise((r) => setTimeout(r, 600)); // parol tanlashni sekinlashtirish
    return fail("Parol noto'g'ri", 401);
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, makeToken(name), cookieOptions);
  return res;
}
