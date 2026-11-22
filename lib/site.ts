// Saytdagi barcha matnlar va kontaktlar shu yerda — o'zgartirish uchun faqat shu faylni tahrirlang.

export const site = {
  brand: "ALI BEK 777",
  // Rahmat sahifasidan 10 soniyada o'tiladigan Telegram kanal (Vercel'da NEXT_PUBLIC_TELEGRAM_URL bilan almashtirish mumkin)
  telegram: /^https:\/\/t\.me\/\w{3,}/.test(process.env.NEXT_PUBLIC_TELEGRAM_URL || "")
    ? process.env.NEXT_PUBLIC_TELEGRAM_URL!
    : "https://t.me/Alibek777_TJM",
  company: "Abdullayev Company",
  phones: [
    { label: "+998 91 031 47 77", tel: "+998910314777" },
    { label: "+998 91 031 37 77", tel: "+998910313777" },
  ],
  // Bosh sahifadagi karusel rasmlari (public/uylar ichida, siqilgan WebP)
  gallery: [
    { src: "/uylar/uy-1.webp", alt: "ALI BEK 777 turar-joy majmuasi — ko'cha tomondan ko'rinish" },
    { src: "/uylar/uy-2.webp", alt: "ALI BEK 777 turar-joy majmuasi — hovli va bolalar maydonchasi" },
  ],
  hero: {
    badge: "Uy-joy sotuvi",
    title: "Oilangiz uchun ishonchli uyni biz bilan tanlang",
    text: "Zamonaviy uylar va xonadonlar. To'liq ma'lumot uchun ro'yxatdan o'ting — mutaxassisimiz siz bilan bog'lanib, byudjetingizga mos variantlarni taklif qiladi.",
  },
  advantages: [
    { icon: "🏠", title: "Turli variantlar", text: "Har xil maydon va narxdagi uylar hamda xonadonlar." },
    { icon: "📄", title: "Hujjatlar to'liq", text: "Har bir obyekt hujjatlari tekshirilgan holda taklif qilinadi." },
    { icon: "🤝", title: "Shaxsiy menejer", text: "Tanlovdan kalit topshirilguncha bitta mas'ul mutaxassis." },
    { icon: "🚗", title: "Bepul ko'rik", text: "Sizga qulay vaqtda obyektni joyida ko'rsatamiz." },
  ],
  steps: [
    { title: "Ariza qoldiring", text: "Ism, telefon va manzilingizni yozing — 1 daqiqa." },
    { title: "Maslahat oling", text: "Menejer qo'ng'iroq qilib, talablaringizni aniqlaydi." },
    { title: "Uyni ko'ring", text: "Mos variantlarni birga ko'rib chiqamiz." },
    { title: "Kalitni oling", text: "Rasmiylashtirishda to'liq yordam beramiz." },
  ],
};
