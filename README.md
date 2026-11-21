# ALI BEK 777 — Uy-joy sotuvi sayti

Next.js 16 (App Router) · Meta Pixel + Conversions API · Telegram bot · MongoDB · CRM paneli

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

## CRM paneli — `/crm`
- Parol bilan kirish (`CRM_PASSWORD`), har bir menejer o'z ismi bilan kiradi — izoh va o'zgarishlarda ismi yoziladi
- Kanban ustunlar: Lid · Ko'tarmadi · O'ylab ko'radi · Qiziqdi (sifatli) · Ko'rikka keladi · Keyinroq · Sotib oldi · Olmaydi
- Kartochkani sudrab boshqa ustunga o'tkazish yoki ro'yxatdan bosqich tanlash
- **Qiziqdi** → Metaga `QualifiedLead`, **Olmaydi** → `DisqualifiedLead`, **Sotib oldi** → summa so'raladi → `Purchase`
- Izohlar: qo'shish, tahrirlash, o'chirish, "Barchasini ko'rish"; oxirgi izoh Telegramdagi xabarda ham ko'rinadi
- Qidiruv (ism, telefon, manzil, izoh), manba filtri, ustunlarni yashirish
- Belgilash (har ustunda "All"), tanlanganlarni o'chirish yoki boshqa bosqichga ko'chirish
- Copy (raqamni nusxalash), qo'ng'iroq, Telegram username, IG ID / Email, budjet maydonlari
- "Ishlandi" doirasi, qo'lda lid qo'shish, statistika (jami, bugun, sotuvlar, konversiya, summa)
- Har 20 soniyada yangi lidlar avtomatik yuklanadi
- Telegram botdagi tugmalar va CRM bir xil bazada ishlaydi

## O'rnatish
1. `npm install`
2. `.env.example` ni `.env.local` ga nusxalab, qiymatlarni to'ldiring:
   - **Meta**: Events Manager → Dataset (Pixel) ID va *Conversions API → Generate access token*
   - **Telegram**: @BotFather dan token. Botni guruhga qo'shing, guruhda `/id` yozing → chat ID chiqadi (avval webhook ulangan bo'lishi kerak) yoki @userinfobot orqali oling
   - **MongoDB**: cloud.mongodb.com → bepul M0 klaster → Database Access'da foydalanuvchi → Network Access'da `0.0.0.0/0` → Connect → Drivers → `MONGODB_URI`
   - **CRM**: `CRM_PASSWORD` — panelga kirish paroli
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
