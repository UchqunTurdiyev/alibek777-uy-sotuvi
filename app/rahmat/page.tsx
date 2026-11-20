import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: `Rahmat! — ${site.brand}`,
  robots: { index: false, follow: false },
};

export default function Rahmat() {
  return (
    <main className="thanks">
      <div className="thanks-box">
        <Image src="/emblem.jpg" alt={site.brand} width={90} height={114} priority />
        <div className="thanks-check">✓</div>
        <h1>Rahmat! Arizangiz qabul qilindi</h1>
        <p>Mutaxassisimiz tez orada siz bilan bog&apos;lanadi. Shoshilinch savollar bo&apos;lsa, qo&apos;ng&apos;iroq qiling:</p>
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
