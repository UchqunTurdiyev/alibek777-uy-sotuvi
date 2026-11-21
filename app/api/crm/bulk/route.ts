import { NextRequest, NextResponse } from "next/server";
import { currentUser, unauthorized, fail } from "@/lib/crm-auth";
import { leads, getLead, isStatus } from "@/lib/store";
import { applyStatus } from "@/lib/status";
import { str } from "@/lib/crm";

export const runtime = "nodejs";

// Ommaviy amallar: { action: "delete" | "status", ids: string[], status? }
export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) return unauthorized();
  const b = await req.json().catch(() => ({}));
  const ids: string[] = Array.isArray(b.ids) ? b.ids.map((x: unknown) => str(x, 20)).filter(Boolean).slice(0, 1000) : [];
  if (!ids.length) return fail("Hech narsa tanlanmagan");

  if (b.action === "delete") {
    const col = await leads();
    const r = await col.deleteMany({ id: { $in: ids } });
    return NextResponse.json({ ok: true, count: r.deletedCount });
  }

  if (b.action === "status") {
    if (!isStatus(b.status) || b.status === "purchased") return fail("Bu bosqichga ommaviy o'tkazib bo'lmaydi");
    let count = 0;
    for (const id of ids) {
      const lead = await getLead(id);
      if (!lead || lead.status === b.status) continue;
      await applyStatus(lead, b.status, user.name);
      count++;
    }
    return NextResponse.json({ ok: true, count });
  }

  return fail("Noma'lum amal");
}
