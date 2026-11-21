import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { currentUser, unauthorized, fail } from "@/lib/crm-auth";
import { leads, saveLead, storeEnabled, isStatus, type Lead } from "@/lib/store";
import { toCrm, str, normPhone } from "@/lib/crm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Barcha lidlar (yangilari birinchi)
export async function GET() {
  if (!(await currentUser())) return unauthorized();
  if (!storeEnabled) return fail("MONGODB_URI sozlanmagan", 500);
  try {
    const col = await leads();
    const docs = await col.find({}, { projection: { _id: 0 } }).sort({ createdAt: -1 }).limit(5000).toArray();
    return NextResponse.json({ ok: true, leads: docs.map(toCrm) });
  } catch (e) {
    console.error(e);
    return fail("Bazaga ulanib bo'lmadi: " + (e instanceof Error ? e.message : ""), 500);
  }
}

// Qo'lda lid qo'shish
export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) return unauthorized();
  if (!storeEnabled) return fail("MONGODB_URI sozlanmagan", 500);
  const b = await req.json().catch(() => ({}));
  const name = str(b.name, 80);
  const phone = normPhone(b.phone);
  if (name.length < 2) return fail("Ismni kiriting");
  if (!phone) return fail("Telefon raqam noto'g'ri");
  const status = isStatus(b.status) ? b.status : "new";
  const now = Date.now();

  const lead: Lead = {
    id: randomBytes(4).toString("hex"),
    name,
    phone,
    address: str(b.address, 200),
    budget: str(b.budget, 80) || undefined,
    tgUser: str(b.tgUser, 60).replace(/^@/, "") || undefined,
    contact: str(b.contact, 120) || undefined,
    createdAt: now,
    source: "manual",
    eventId: randomBytes(8).toString("hex"),
    utm: {},
    status,
    history: [{ status, by: user.name, at: now, meta: null }],
    comments: [],
    tg: [],
  };
  const c = str(b.comment, 2000);
  if (c) lead.comments.push({ id: randomBytes(4).toString("hex"), text: c, by: user.name, at: now });

  await saveLead(lead);
  return NextResponse.json({ ok: true, lead: toCrm(lead) });
}
