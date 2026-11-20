import { NextRequest, NextResponse } from "next/server";
import { tg } from "@/lib/telegram";

export const runtime = "nodejs";

// Bir marta oching: https://SAYT/api/telegram/setup?secret=TELEGRAM_WEBHOOK_SECRET
export async function GET(req: NextRequest) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret || req.nextUrl.searchParams.get("secret") !== secret) {
    return NextResponse.json({ ok: false, error: "secret noto'g'ri" }, { status: 401 });
  }
  const base = (process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin).replace(/\/$/, "");
  const res = await tg("setWebhook", {
    url: `${base}/api/telegram/webhook`,
    secret_token: secret,
    allowed_updates: ["message", "callback_query"],
    drop_pending_updates: true,
  });
  const info = await tg("getWebhookInfo", {});
  return NextResponse.json({ setWebhook: res, info: info.result });
}
