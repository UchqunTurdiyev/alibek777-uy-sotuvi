# ALI BEK 777 — Uy-joy sotuvi sayti

Next.js 16 (App Router) · Meta Pixel + Conversions API · Telegram bot · Upstash Redis

## Imkoniyatlar
- Forma: ism, telefon (+998 maska), manzil → `/rahmat` sahifasiga o'tadi
- Lid Telegram botga tushadi (bir nechta chat/guruhga)
- Botdagi tugmalar:
  - **✅ Sifatli** → Metaga `QualifiedLead`
  - **❌ Sifatsiz** → Metaga `DisqualifiedLead`
  - **💰 Sotib oldi** → bot summani so'raydi → javob qilib yozasiz (`65000`, `65k`, `450 mln`) → Metaga `Purchase` + `value` + `currency`
- Metaga yuboriladigan ma'lumotlar: telefon, ism, familiya, mamlakat, external_id (SHA-256), IP, User-Agent, `fbp`, `fbc` (cookie yoki fbclid'dan), event_source_url, UTM
- Pixel `Lead` va CAPI `Lead` bir xil `event_id` bilan → deduplikatsiya
- Lid kartochkasida status tarixi va Metaga yuborilgan/yuborilmaganligi ko'rinadi

## O'rnatish
1. `npm install`
2. `.env.example` ni `.env.local` ga nusxalab, qiymatlarni to'ldiring:
   - **Meta**: Events Manager → Dataset (Pixel) ID va *Conversions API → Generate access token*
   - **Telegram**: @BotFather dan token. Botni guruhga qo'shing, guruhda `/id` yozing → chat ID chiqadi (avval webhook ulangan bo'lishi kerak) yoki @userinfobot orqali oling
   - **Upstash Redis**: upstash.com (yoki Vercel → Storage → Upstash) → REST URL va Token
3. `npm run dev` — lokal ishga tushirish

## Deploy (Vercel)
1. GitHub'ga yuklab, Vercel'da import qiling, Environment Variables'ni kiriting
2. Deploydan keyin bir marta oching:
   `https://SIZNING-DOMEN/api/telegram/setup?secret=TELEGRAM_WEBHOOK_SECRET`
   → bot webhook ulanadi
3. Sinov: `META_TEST_EVENT_CODE` ni qo'yib, Events Manager → Test events'da tekshiring, keyin o'chiring

## Matnlarni o'zgartirish
Barcha matnlar, afzalliklar va telefonlar — `lib/site.ts`

## Metada sotuvga target
Events Manager'da `Purchase` kela boshlagach: Kampaniya → **Sotuvlar (Sales)** → Konversiya joyi: Veb-sayt → Hodisa: **Purchase** → Byudjet strategiyasi: **Highest value** yoki **ROAS goal**. Auditoriyalar: Custom audience → Website → Purchase (yoki QualifiedLead) → Lookalike.
