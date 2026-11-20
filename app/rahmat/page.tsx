import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import TelegramRedirect from "@/components/TelegramRedirect";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: `Rahmat! — ${site.brand}`,
  robots: { index: false, follow: false },
};

export default function Rahmat() {
  return (
    <main className="thanks">
      <div className="orbs" aria-hidden="true">
        <span className="orb orb-1" />
        <span className="orb orb-2" />
      </div>
      <div className="thanks-box anim-zoom">
        <Image src="/emblem.jpg" alt={site.brand} width={90} height={114} priority />
        <div className="thanks-check">
          <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
            <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1>Rahmat! Arizangiz qabul qilindi</h1>
        <p>Mutaxassisimiz tez orada siz bilan bog&apos;lanadi. Shoshilinch savollar bo&apos;lsa, qo&apos;ng&apos;iroq qiling:</p>
        <TelegramRedirect url={site.telegram} />
        <div className="thanks-phones">
          {site.phones.map((p) => (
            <a key={p.tel} href={`tel:${p.tel}`} className="btn btn-gold">📞 {p.label}</a>
          ))}
        </div>
        <Link href="/" className="back">← Bosh sahifaga qaytish</Link>
      </div>
    </main>
  );
}
