import { NextRequest, NextResponse } from "next/server";
import { currentUser, unauthorized, fail } from "@/lib/crm-auth";
import { getLead, saveLead, leads, isStatus } from "@/lib/store";
import { applyStatus } from "@/lib/status";
import { refreshLeadMessages } from "@/lib/telegram";
import { toCrm, str, normPhone, parseAmount } from "@/lib/crm";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

// Lidni tahrirlash va/yoki bosqichini o'zgartirish
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const user = await currentUser();
  if (!user) return unauthorized();
  const { id } = await params;
  const lead = await getLead(id);
  if (!lead) return fail("Lid topilmadi", 404);
  const b = await req.json().catch(() => ({}));

  // Oddiy maydonlar
  if ("name" in b) {
    const v = str(b.name, 80);
    if (v.length < 2) return fail("Ism juda qisqa");
    lead.name = v;
  }
  if ("phone" in b) {
    const p = normPhone(b.phone);
    if (!p) return fail("Telefon raqam noto'g'ri");
    lead.phone = p;
  }
  if ("address" in b) lead.address = str(b.address, 200);
  if ("budget" in b) lead.budget = str(b.budget, 80) || undefined;
  if ("tgUser" in b) lead.tgUser = str(b.tgUser, 60).replace(/^@/, "") || undefined;
  if ("contact" in b) lead.contact = str(b.contact, 120) || undefined;
  if ("done" in b) lead.done = Boolean(b.done);

  let meta: { ok: boolean; error?: string } | null = null;
  if ("status" in b) {
    if (!isStatus(b.status)) return fail("Noto'g'ri bosqich");
    let value: number | undefined;
    if (b.status === "purchased") {
      const v = parseAmount(b.value);
      if (!v) return fail("Sotuv summasini kiriting");
      value = v;
    }
    if (b.status !== lead.status || value !== undefined) {
      meta = await applyStatus(lead, b.status, user.name, value); // ichida saqlanadi
      return NextResponse.json({ ok: true, lead: toCrm(lead), meta });
    }
  }

  await saveLead(lead);
  if ("name" in b || "phone" in b || "address" in b) {
    refreshLeadMessages(lead).catch(() => {});
  }
  return NextResponse.json({ ok: true, lead: toCrm(lead), meta });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  if (!(await currentUser())) return unauthorized();
  const { id } = await params;
  const col = await leads();
  await col.deleteOne({ id });
  return NextResponse.json({ ok: true });
}
