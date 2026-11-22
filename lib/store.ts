// Lidlarni MongoDB'da saqlash. CRM paneli, Telegram bot va Meta CAPI shu ma'lumotlardan foydalanadi.

import { MongoClient, type Collection } from "mongodb";
import type { LeadStatus } from "./stages";

export { STAGES, STATUS_KEYS, isStatus, stageLabel, type LeadStatus } from "./stages";

export type HistoryItem = {
  status: LeadStatus;
  by: string;
  at: number;
  meta: boolean | null; // null — bu bosqich Metaga yuborilmaydi
  value?: number;
  currency?: string;
};

export type Comment = { id: string; text: string; by: string; at: number };

export type Lead = {
  id: string;
  name: string;
  phone: string; // 998XXXXXXXXX
  address: string;
  createdAt: number;
  updatedAt?: number;
  source?: "website" | "manual";
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
  budget?: string;
  apartment?: string; // saytdagi 3D bo'limda tanlangan xonadon
  tgUser?: string;
  contact?: string; // IG ID / Email
  done?: boolean; // kartochkadagi doira — "ishlandi" belgisi
  history: HistoryItem[];
  comments: Comment[];
  tg: { chatId: string; messageId: number }[];
};

const URI = process.env.MONGODB_URI;
const DB = process.env.MONGODB_DB || "alibek777";

export const storeEnabled = Boolean(URI);

// Serverless muhitda ulanishni qayta ishlatish
const g = globalThis as unknown as { _mongo?: Promise<MongoClient>; _mongoIdx?: Promise<unknown> };

export async function leads(): Promise<Collection<Lead>> {
  if (!URI) throw new Error("MONGODB_URI sozlanmagan");
  if (!g._mongo) {
    g._mongo = new MongoClient(URI, { maxPoolSize: 5, serverSelectionTimeoutMS: 8000 }).connect();
    g._mongo.catch(() => (g._mongo = undefined));
  }
  const col = (await g._mongo).db(DB).collection<Lead>("leads");
  if (!g._mongoIdx) {
    g._mongoIdx = Promise.all([
      col.createIndex({ id: 1 }, { unique: true }),
      col.createIndex({ createdAt: -1 }),
      col.createIndex({ status: 1 }),
    ]).catch((e) => {
      g._mongoIdx = undefined;
      console.error("Mongo index xato:", e);
    });
  }
  return col;
}

export async function saveLead(lead: Lead) {
  const col = await leads();
  lead.updatedAt = Date.now();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { _id, ...doc } = lead as Lead & { _id?: unknown };
  await col.replaceOne({ id: lead.id }, doc, { upsert: true });
}

export async function getLead(id: string): Promise<Lead | null> {
  const col = await leads();
  const doc = await col.findOne({ id }, { projection: { _id: 0 } });
  if (!doc) return null;
  return { ...doc, history: doc.history || [], comments: doc.comments || [], tg: doc.tg || [] };
}
