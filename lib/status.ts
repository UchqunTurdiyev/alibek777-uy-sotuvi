import { saveLead, type Lead, type LeadStatus } from "./store";
import { sendMetaEvent, CURRENCY, type MetaEvent } from "./meta";
import { refreshLeadMessages } from "./telegram";

// Qaysi bosqich Metaga qaysi hodisa sifatida yuboriladi
const META_EVENT: Partial<Record<LeadStatus, { name: MetaEvent; prefix: string }>> = {
  viewing: { name: "QualifiedLead", prefix: "ql" }, // "Ko'rikka keladi" = sifatli lid
  disqualified: { name: "DisqualifiedLead", prefix: "dl" },
  purchased: { name: "Purchase", prefix: "pur" },
};

/**
 * Lid bosqichini o'zgartiradi: Metaga hodisa yuboradi (kerak bo'lsa), tarixga yozadi,
 * bazaga saqlaydi va Telegramdagi xabarlarni yangilaydi.
 */
export async function applyStatus(lead: Lead, status: LeadStatus, by: string, value?: number) {
  const ev = META_EVENT[status];
  let res: { ok: boolean; error?: string } | null = null;

  if (ev) {
    // Purchase event_id summaga bog'langan: summa tuzatilsa ham Meta qabul qiladi, takror yuborish esa dublikat bo'lmaydi
    const eventId = `${ev.prefix}_${lead.id}${value ? `_${value}` : ""}`;
    res = await sendMetaEvent(ev.name, lead, { eventId, value, currency: CURRENCY });
  }

  lead.status = status;
  if (status === "purchased" && value) {
    lead.value = value;
    lead.currency = CURRENCY;
  }
  lead.history = lead.history || [];
  lead.history.push({
    status,
    by,
    at: Date.now(),
    meta: res ? res.ok : null,
    value: status === "purchased" ? value : undefined,
    currency: status === "purchased" && value ? CURRENCY : undefined,
  });
  await saveLead(lead);
  try {
    await refreshLeadMessages(lead);
  } catch (e) {
    console.error("Telegram yangilash xato:", e);
  }
  return res;
}
