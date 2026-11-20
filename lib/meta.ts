import { createHash } from "crypto";
import type { Lead } from "./store";

// Meta Conversions API (CAPI). Barcha shaxsiy ma'lumotlar SHA-256 bilan xeshlanadi.

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const TOKEN = process.env.META_ACCESS_TOKEN;
const VERSION = process.env.META_API_VERSION || "v24.0";
const TEST_CODE = process.env.META_TEST_EVENT_CODE;
export const CURRENCY = (process.env.META_CURRENCY || "USD").toUpperCase();

const sha = (v: string) => createHash("sha256").update(v.trim().toLowerCase()).digest("hex");
const cleanName = (v: string) => v.toLowerCase().replace(/[^\p{L}]/gu, "");

function userData(lead: Lead) {
  const parts = lead.name.trim().split(/\s+/);
  const fn = cleanName(parts[0] || "");
  const ln = cleanName(parts.slice(1).join(""));
  const ud: Record<string, unknown> = {
    ph: [sha(lead.phone)],
    country: [sha("uz")],
    external_id: [sha(lead.vid || lead.id)],
  };
  if (fn) ud.fn = [sha(fn)];
  if (ln) ud.ln = [sha(ln)];
  if (process.env.META_CITY) ud.ct = [sha(cleanName(process.env.META_CITY))];
  if (lead.ip) ud.client_ip_address = lead.ip;
  if (lead.ua) ud.client_user_agent = lead.ua;
  if (lead.fbp) ud.fbp = lead.fbp;
  if (lead.fbc) ud.fbc = lead.fbc;
  return ud;
}

export type MetaEvent = "Lead" | "QualifiedLead" | "DisqualifiedLead" | "Purchase";

export async function sendMetaEvent(
  name: MetaEvent,
  lead: Lead,
  opts: { eventId: string; value?: number; currency?: string } = { eventId: "" }
): Promise<{ ok: boolean; error?: string }> {
  if (!PIXEL_ID || !TOKEN) return { ok: false, error: "Pixel ID yoki token yo'q" };

  const custom: Record<string, unknown> = {
    content_name: "Uy-joy",
    content_category: "real_estate",
    content_type: "product",
    content_ids: [lead.id],
    lead_source: lead.utm?.utm_source || "website",
  };
  if (name === "Purchase") {
    custom.value = opts.value;
    custom.currency = opts.currency || CURRENCY;
    custom.order_id = lead.id;
    custom.num_items = 1;
  }
  if (lead.utm?.utm_campaign) custom.utm_campaign = lead.utm.utm_campaign;

  const body: Record<string, unknown> = {
    data: [
      {
        event_name: name,
        event_time: Math.floor(Date.now() / 1000),
        event_id: opts.eventId,
        action_source: "website",
        event_source_url: lead.url || process.env.NEXT_PUBLIC_SITE_URL,
        user_data: userData(lead),
        custom_data: custom,
      },
    ],
  };
  if (TEST_CODE) body.test_event_code = TEST_CODE;

  try {
    const res = await fetch(
      `https://graph.facebook.com/${VERSION}/${PIXEL_ID}/events?access_token=${TOKEN}`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), cache: "no-store" }
    );
    const json = await res.json();
    if (!res.ok || json.error) {
      console.error("Meta CAPI xato:", json.error);
      return { ok: false, error: json.error?.message || `HTTP ${res.status}` };
    }
    return { ok: true };
  } catch (e) {
    console.error("Meta CAPI xato:", e);
    return { ok: false, error: String(e) };
  }
}
