// Lidlarni Upstash Redis'da saqlash (REST API, qo'shimcha paketsiz).
// Telegramda "Sotib oldi" bosilganda Metaga yuboriladigan fbp/fbc/IP/UA va boshqa ma'lumotlar shu yerdan olinadi.

export type LeadStatus = "new" | "qualified" | "disqualified" | "purchased";

export type HistoryItem = {
  status: LeadStatus;
  by: string;
  at: number;
  meta: boolean;
  value?: number;
  currency?: string;
};

export type Lead = {
  id: string;
  name: string;
  phone: string; // 998XXXXXXXXX
  address: string;
  createdAt: number;
  ip?: string;
  ua?: string;
  fbp?: string;
  fbc?: string;
  vid?: string; // external_id (brauzer cookie)
  eventId: string; // Lead hodisasi uchun (Pixel + CAPI deduplikatsiya)
  url?: string;
  referrer?: string;
  utm?: Record<string, string>;
  status: LeadStatus;
  value?: number;
  currency?: string;
  history: HistoryItem[];
  tg: { chatId: string; messageId: number }[];
};

const URL_ = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
const TTL = 60 * 60 * 24 * 365; // 1 yil

export const storeEnabled = Boolean(URL_ && TOKEN);

async function redis(cmd: (string | number)[]) {
  if (!storeEnabled) throw new Error("Upstash Redis sozlanmagan");
  const res = await fetch(URL_!, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(cmd),
    cache: "no-store",
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error);
  return json.result;
}

export async function saveLead(lead: Lead) {
  await redis(["SET", `lead:${lead.id}`, JSON.stringify(lead), "EX", TTL]);
}

export async function getLead(id: string): Promise<Lead | null> {
  const raw = await redis(["GET", `lead:${id}`]);
  return raw ? (JSON.parse(raw) as Lead) : null;
}
