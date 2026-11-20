import Image from "next/image";
import LeadForm from "@/components/LeadForm";
import { site } from "@/lib/site";

export default function Home() {
  const main = site.phones[0];
  return (
    <>
      <header className="header">
        <div className="container header-row">
          <a href="#" className="brand" aria-label={site.brand}>
            <Image src="/emblem.jpg" alt="" width={34} height={43} priority />
            <span>
              <b>{site.brand}</b>
              <small>{site.company}</small>
            </span>
          </a>
          <div className="header-phones">
            {site.phones.map((p) => (
              <a key={p.tel} href={`tel:${p.tel}`}>📞 {p.label}</a>
            ))}
          </div>
          <a href={`tel:${main.tel}`} className="btn btn-outline header-call">Qo&apos;ng&apos;iroq</a>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="container hero-grid">
            <div className="hero-text">
              <span className="badge">{site.hero.badge}</span>
              <h1>{site.hero.title}</h1>
              <p className="lead">{site.hero.text}</p>
              <div className="hero-logo">
                <Image src="/logo.jpg" alt={`${site.brand} — ${site.company}`} width={780} height={700} priority sizes="(max-width: 900px) 70vw, 420px" />
              </div>
            </div>
            <LeadForm />
          </div>
        </section>

        <section className="section">
          <div className="container">
            <h2 className="title">Nega aynan biz?</h2>
            <div className="cards">
              {site.advantages.map((a) => (
                <div key={a.title} className="card">
                  <div className="card-icon">{a.icon}</div>
                  <h3>{a.title}</h3>
                  <p>{a.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section section-alt">
          <div className="container">
            <h2 className="title">Qanday ishlaymiz</h2>
            <ol className="steps">
              {site.steps.map((s, i) => (
                <li key={s.title}>
                  <span className="step-num">{i + 1}</span>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="section cta">
          <div className="container cta-box">
            <h2>Orzuingizdagi uyni bugun tanlang</h2>
            <p>Ariza qoldiring yoki hoziroq qo&apos;ng&apos;iroq qiling</p>
            <div className="cta-actions">
              <a href="#forma" className="btn btn-gold">Ariza qoldirish</a>
              {site.phones.map((p) => (
                <a key={p.tel} href={`tel:${p.tel}`} className="btn btn-outline">📞 {p.label}</a>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container footer-row">
          <span>© {new Date().getFullYear()} {site.brand} — {site.company}</span>
          <span className="footer-phones">
            {site.phones.map((p) => (
              <a key={p.tel} href={`tel:${p.tel}`}>{p.label}</a>
            ))}
          </span>
        </div>
      </footer>

      <a href={`tel:${main.tel}`} className="float-call" aria-label="Qo'ng'iroq qilish">📞</a>
    </>
  );
}
