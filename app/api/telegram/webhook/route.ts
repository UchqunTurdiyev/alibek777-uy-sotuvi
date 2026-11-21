import { NextRequest, NextResponse } from "next/server";
import { getLead, type Lead, type LeadStatus } from "@/lib/store";
import { applyStatus } from "@/lib/status";
import { tg, chatIds, refreshLeadMessages, esc, fmtMoney } from "@/lib/telegram";
import { CURRENCY } from "@/lib/meta";

export const runtime = "nodejs";

const SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;

type TgUser = { first_name?: string; last_name?: string; username?: string };
const who = (u?: TgUser) =>
  u ? [u.first_name, u.last_name].filter(Boolean).join(" ") + (u.username ? ` (@${u.username})` : "") : "Noma'lum";

const allowed = (chatId: number | string) => chatIds.includes(String(chatId));

function parseAmount(text: string) {
  let t = text.toLowerCase().replace(/\s|_/g, "").replace(/\$|usd|so'm|som|сум|uzs/g, "");
  let mult = 1;
  if (/k$/.test(t)) { mult = 1000; t = t.slice(0, -1); }
  if (/(mln|m)$/.test(t)) { mult = 1_000_000; t = t.replace(/(mln|m)$/, ""); }
  // 85,000 / 85.000 => minglik ajratgich; 85,5 => o'nlik
  if (/^\d{1,3}([.,]\d{3})+$/.test(t)) t = t.replace(/[.,]/g, "");
  else t = t.replace(",", ".");
  const n = parseFloat(t) * mult;
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null;
}

const setStatus = (lead: Lead, status: LeadStatus, by: string, value?: number) =>
  applyStatus(lead, status, by, value).then((r) => r || { ok: true, error: undefined });

const PROMPT_TAG = "#LID:";

function askAmount(chatId: number, replyTo: number, lead: Lead, note = "") {
  return tg("sendMessage", {
    chat_id: chatId,
    text:
      `${note}💰 <b>#${lead.id}</b> — ${esc(lead.name)}\n` +
      `Sotuv summasini <b>${CURRENCY}</b> da javob (reply) qilib yozing.\n` +
      `Masalan: <code>65000</code> yoki <code>65k</code>\n\n${PROMPT_TAG}${lead.id}`,
    parse_mode: "HTML",
    reply_parameters: { message_id: replyTo, allow_sending_without_reply: true },
    reply_markup: { force_reply: true, selective: true, input_field_placeholder: `Summa (${CURRENCY})` },
  });
}

export async function POST(req: NextRequest) {
  if (!SECRET || req.headers.get("x-telegram-bot-api-secret-token") !== SECRET) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const update = await req.json();

  try {
    // 1) Inline tugmalar
    const cq = update.callback_query;
    if (cq) {
      const chatId = cq.message?.chat?.id;
      if (!chatId || !allowed(chatId)) {
        await tg("answerCallbackQuery", { callback_query_id: cq.id, text: "Ruxsat yo'q", show_alert: true });
        return NextResponse.json({ ok: true });
      }
      const [, action, id] = String(cq.data || "").split(":");
      const lead = await getLead(id);
      if (!lead) {
        await tg("answerCallbackQuery", { callback_query_id: cq.id, text: "Lid bazada topilmadi", show_alert: true });
        return NextResponse.json({ ok: true });
      }

      if (action === "p") {
        await tg("answerCallbackQuery", { callback_query_id: cq.id, text: "Summani kiriting" });
        await askAmount(chatId, cq.message.message_id, lead);
        return NextResponse.json({ ok: true });
      }

      const status: LeadStatus = action === "q" ? "viewing" : "disqualified";
      if (lead.status === status) {
        await tg("answerCallbackQuery", { callback_query_id: cq.id, text: "Bu holat allaqachon belgilangan" });
        return NextResponse.json({ ok: true });
      }
      const res = await setStatus(lead, status, who(cq.from));
      await tg("answerCallbackQuery", {
        callback_query_id: cq.id,
        text: res.ok ? "✅ Metaga yuborildi" : `⚠️ Saqlandi, Meta xato: ${res.error}`.slice(0, 190),
        show_alert: !res.ok,
      });
      return NextResponse.json({ ok: true });
    }

    // 2) Xabarlar
    const msg = update.message;
    if (msg?.text) {
      const chatId = msg.chat.id;
      const text: string = msg.text.trim();

      if (/^\/(start|id)\b/.test(text)) {
        await tg("sendMessage", {
          chat_id: chatId,
          text: `Chat ID: <code>${chatId}</code>\nShu raqamni TELEGRAM_CHAT_IDS ga qo'shing.`,
          parse_mode: "HTML",
        });
        return NextResponse.json({ ok: true });
      }

      const prompt: string | undefined = msg.reply_to_message?.text;
      const m = prompt?.match(/#LID:([a-f0-9]+)/);
      if (m && msg.reply_to_message?.from?.is_bot && allowed(chatId)) {
        const lead = await getLead(m[1]);
        if (!lead) {
          await tg("sendMessage", { chat_id: chatId, text: "Lid bazada topilmadi." });
          return NextResponse.json({ ok: true });
        }
        const amount = parseAmount(text);
        if (!amount) {
          await askAmount(chatId, msg.message_id, lead, "⚠️ Summa tushunarsiz. Qaytadan kiriting.\n\n");
          return NextResponse.json({ ok: true });
        }
        const res = await setStatus(lead, "purchased", who(msg.from), amount);
        await tg("sendMessage", {
          chat_id: chatId,
          reply_parameters: { message_id: msg.message_id, allow_sending_without_reply: true },
          parse_mode: "HTML",
          text: res.ok
            ? `✅ <b>Purchase</b> Metaga yuborildi: #${lead.id} — ${fmtMoney(amount)} ${CURRENCY}`
            : `⚠️ Sotuv saqlandi, lekin Metaga yuborilmadi: ${esc(res.error || "")}`,
        });
      }
    }
  } catch (e) {
    console.error("Webhook xato:", e);
  }
  return NextResponse.json({ ok: true });
}
