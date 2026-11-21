import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { currentUser, unauthorized, fail } from "@/lib/crm-auth";
import { getLead, saveLead } from "@/lib/store";
import { refreshLeadMessages } from "@/lib/telegram";
import { toCrm, str } from "@/lib/crm";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

// Izoh qo'shish
export async function POST(req: NextRequest, { params }: Ctx) {
  const user = await currentUser();
  if (!user) return unauthorized();
  const { id } = await params;
  const lead = await getLead(id);
  if (!lead) return fail("Lid topilmadi", 404);
  const b = await req.json().catch(() => ({}));
  const text = str(b.text, 2000);
  if (!text) return fail("Izoh bo'sh");
  lead.comments.push({ id: randomBytes(4).toString("hex"), text, by: user.name, at: Date.now() });
  await saveLead(lead);
  refreshLeadMessages(lead).catch(() => {});
  return NextResponse.json({ ok: true, lead: toCrm(lead) });
}

// Izohni tahrirlash: { cid, text }
export async function PATCH(req: NextRequest, { params }: Ctx) {
  if (!(await currentUser())) return unauthorized();
  const { id } = await params;
  const lead = await getLead(id);
  if (!lead) return fail("Lid topilmadi", 404);
  const b = await req.json().catch(() => ({}));
  const c = lead.comments.find((x) => x.id === str(b.cid, 20));
  const text = str(b.text, 2000);
  if (!c) return fail("Izoh topilmadi", 404);
  if (!text) return fail("Izoh bo'sh");
  c.text = text;
  await saveLead(lead);
  return NextResponse.json({ ok: true, lead: toCrm(lead) });
}

// Izohni o'chirish: ?cid=...
export async function DELETE(req: NextRequest, { params }: Ctx) {
  if (!(await currentUser())) return unauthorized();
  const { id } = await params;
  const lead = await getLead(id);
  if (!lead) return fail("Lid topilmadi", 404);
  const cid = req.nextUrl.searchParams.get("cid");
  lead.comments = lead.comments.filter((x) => x.id !== cid);
  await saveLead(lead);
  return NextResponse.json({ ok: true, lead: toCrm(lead) });
}
