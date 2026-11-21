import { NextRequest, NextResponse, after } from "next/server";
import { randomBytes } from "crypto";
import { saveLead, storeEnabled, type Lead } from "@/lib/store";
import { sendLeadToTelegram } from "@/lib/telegram";
import { sendMetaEvent } from "@/lib/meta";

export const runtime = "nodejs";

const str = (v: unknown, max = 300) => (typeof v === "string" ? v.trim().slice(0, max) : "");

function clientIp(req: NextRequest) {
  const xff = req.headers.get("x-forwarded-for");
  return (xff?.split(",")[0] || req.headers.get("x-real-ip") || "").trim() || undefined;
}

export async function POST(req: NextRequest) {
  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Noto'g'ri so'rov" }, { status: 400 });
  }

  // Spam-bot tuzog'i (yashirin maydon)
  if (str(b.website)) return NextResponse.json({ ok: true });

  const name = str(b.name, 80);
  const address = str(b.address, 200);
  let phone = str(b.phone, 30).replace(/\D/g, "");
  if (phone.length === 9) phone = "998" + phone;

  if (name.length < 2) return NextResponse.json({ ok: false, error: "Ismingizni kiriting" }, { status: 400 });
  if (!/^998\d{9}$/.test(phone))
    return NextResponse.json({ ok: false, error: "Telefon raqam noto'g'ri" }, { status: 400 });
  if (address.length < 2) return NextResponse.json({ ok: false, error: "Manzilni kiriting" }, { status: 400 });

  // fbp / fbc: avval cookie'dan, bo'lmasa brauzer yuborgan qiymatdan
  const fbp = req.cookies.get("_fbp")?.value || str(b.fbp, 200) || undefined;
  let fbc = req.cookies.get("_fbc")?.value || str(b.fbc, 400) || undefined;
  const pageUrl = str(b.url, 1000);
  if (!fbc && pageUrl) {
    try {
      const fbclid = new URL(pageUrl).searchParams.get("fbclid");
      if (fbclid) fbc = `fb.1.${Date.now()}.${fbclid}`;
    } catch {}
  }

  const utmIn = (b.utm && typeof b.utm === "object" ? b.utm : {}) as Record<string, unknown>;
  const utm: Record<string, string> = {};
  for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"]) {
    const v = str(utmIn[k], 150);
    if (v) utm[k] = v;
  }

  const lead: Lead = {
    id: randomBytes(4).toString("hex"),
    name,
    phone,
    address,
    createdAt: Date.now(),
    ip: clientIp(req),
    ua: req.headers.get("user-agent") || undefined,
    fbp,
    fbc,
    vid: req.cookies.get("_vid")?.value || str(b.vid, 64) || undefined,
    eventId: str(b.eventId, 64) || randomBytes(8).toString("hex"),
    url: pageUrl || undefined,
    referrer: str(b.referrer, 500) || undefined,
    utm,
    source: "website",
    status: "new",
    history: [],
    comments: [],
    tg: [],
  };

  try {
    lead.tg = await sendLeadToTelegram(lead);
  } catch (e) {
    console.error("Telegram xato:", e);
  }

  if (storeEnabled) {
    try {
      await saveLead(lead);
    } catch (e) {
      console.error("MongoDB xato:", e);
    }
  }

  // Meta CAPI — javobni kechiktirmaslik uchun fonda yuboriladi
  after(() => sendMetaEvent("Lead", lead, { eventId: lead.eventId }));

  return NextResponse.json({ ok: true });
}
