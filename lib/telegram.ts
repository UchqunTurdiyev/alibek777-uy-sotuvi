import type { Lead, LeadStatus } from "./store";

const BOT = process.env.TELEGRAM_BOT_TOKEN;

export const chatIds = (process.env.TELEGRAM_CHAT_IDS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

export async function tg(method: string, body: Record<string, unknown>) {
  if (!BOT) throw new Error("TELEGRAM_BOT_TOKEN yo'q");
  const res = await fetch(`https://api.telegram.org/bot${BOT}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const json = await res.json();
  if (!json.ok) console.error(`Telegram ${method} xato:`, json.description);
  return json;
}

export const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export const fmtPhone = (p: string) =>
  p.length === 12 ? `+${p.slice(0, 3)} ${p.slice(3, 5)} ${p.slice(5, 8)} ${p.slice(8, 10)} ${p.slice(10)}` : p;

export const fmtTime = (ts: number) =>
  new Intl.DateTimeFormat("ru-RU", {
    timeZone: "Asia/Samarkand",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(ts);

export const fmtMoney = (v: number) => new Intl.NumberFormat("ru-RU").format(v).replace(/ /g, " ");

const STATUS: Record<LeadStatus, string> = {
  new: "🆕 Yangi",
  qualified: "✅ Sifatli",
  disqualified: "❌ Sifatsiz",
  purchased: "💰 Sotib oldi",
};

export function leadText(l: Lead) {
  const utm = l.utm || {};
  const source = [utm.utm_source, utm.utm_medium, utm.utm_campaign].filter(Boolean).join(" / ");
  const lines = [
    `🏠 <b>Yangi lid #${l.id}</b>`,
    ``,
    `👤 <b>Ism:</b> ${esc(l.name)}`,
    `📞 <b>Tel:</b> ${fmtPhone(l.phone)}`,
    `📍 <b>Manzil:</b> ${esc(l.address)}`,
    `🕒 <b>Vaqt:</b> ${fmtTime(l.createdAt)}`,
    source ? `🎯 <b>Manba:</b> ${esc(source)}` : `🎯 <b>Manba:</b> to'g'ridan-to'g'ri`,
    utm.utm_content ? `🖼 <b>Kreativ:</b> ${esc(utm.utm_content)}` : "",
    `📊 <b>Meta:</b> fbp ${l.fbp ? "✅" : "—"} · fbc ${l.fbc ? "✅" : "—"} · IP ${l.ip ? "✅" : "—"}`,
    ``,
    `<b>Holat:</b> ${STATUS[l.status]}${
      l.status === "purchased" && l.value ? ` — ${fmtMoney(l.value)} ${l.currency}` : ""
    }`,
  ].filter((x) => x !== "");

  if (l.history.length) {
    lines.push("", "<i>Tarix:</i>");
    for (const h of l.history.slice(-5)) {
      const val = h.value ? ` ${fmtMoney(h.value)} ${h.currency}` : "";
      lines.push(`• ${STATUS[h.status]}${val} — ${esc(h.by)}, ${fmtTime(h.at)} · Meta ${h.meta ? "✅" : "⚠️"}`);
    }
  }
  return lines.join("\n");
}

export function leadKeyboard(id: string) {
  return {
    inline_keyboard: [
      [
        { text: "✅ Sifatli", callback_data: `st:q:${id}` },
        { text: "❌ Sifatsiz", callback_data: `st:d:${id}` },
      ],
      [{ text: "💰 Sotib oldi (summa kiritish)", callback_data: `st:p:${id}` }],
    ],
  };
}

export async function sendLeadToTelegram(lead: Lead) {
  const sent: { chatId: string; messageId: number }[] = [];
  await Promise.all(
    chatIds.map(async (chatId) => {
      const r = await tg("sendMessage", {
        chat_id: chatId,
        text: leadText(lead),
        parse_mode: "HTML",
        reply_markup: leadKeyboard(lead.id),
        link_preview_options: { is_disabled: true },
      });
      if (r.ok) sent.push({ chatId, messageId: r.result.message_id });
    })
  );
  return sent;
}

export async function refreshLeadMessages(lead: Lead) {
  await Promise.all(
    lead.tg.map((m) =>
      tg("editMessageText", {
        chat_id: m.chatId,
        message_id: m.messageId,
        text: leadText(lead),
        parse_mode: "HTML",
        reply_markup: leadKeyboard(lead.id),
        link_preview_options: { is_disabled: true },
      })
    )
  );
}
