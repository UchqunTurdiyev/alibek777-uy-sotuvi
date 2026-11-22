import Image from "next/image";
import LeadForm from "@/components/LeadForm";
import Reveal from "@/components/Reveal";
import RegisterToast from "@/components/RegisterToast";
import HeroCarousel from "@/components/HeroCarousel";
import { site } from "@/lib/site";

const delay = (i: number) => ({ "--d": `${i * 110}ms` }) as React.CSSProperties;

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
          <a href="#forma" className="btn btn-outline header-call">Ariza qoldirish</a>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="orbs" aria-hidden="true">
            <span className="orb orb-1" />
            <span className="orb orb-2" />
            <span className="orb orb-3" />
          </div>
          <div className="container hero-grid">
            <div className="hero-text">
              <span className="badge anim-up" style={delay(0)}>
                <i className="dot" /> {site.hero.badge}
              </span>
              <h1 className="anim-up" style={delay(1)}>
                {site.hero.title.split(" ").slice(0, -2).join(" ")}{" "}
                <span className="gold-text">{site.hero.title.split(" ").slice(-2).join(" ")}</span>
              </h1>
              <p className="lead anim-up" style={delay(2)}>{site.hero.text}</p>
              <div className="hero-logo anim-up float" style={delay(3)}>
                <HeroCarousel slides={site.gallery} />
              </div>
            </div>
            <div className="anim-zoom" style={delay(2)}>
              <LeadForm />
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <h2 className="title reveal">Nega aynan biz?</h2>
            <div className="cards">
              {site.advantages.map((a, i) => (
                <div key={a.title} className="card reveal" style={delay(i)}>
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
            <h2 className="title reveal">Qanday ishlaymiz</h2>
            <ol className="steps">
              {site.steps.map((s, i) => (
                <li key={s.title} className="reveal" style={delay(i)}>
                  <span className="step-num">{i + 1}</span>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="section cta">
          <div className="container cta-box reveal">
            <h2>Orzuingizdagi uyni bugun tanlang</h2>
            <p>Ariza qoldiring yoki hoziroq qo&apos;ng&apos;iroq qiling</p>
            <div className="cta-actions">
              <a href="#forma" className="btn btn-gold btn-shine">Ariza qoldirish</a>
              <a href={`tel:${main.tel}`} className="btn btn-outline">📞 {main.label}</a>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container footer-row">
          <span>© {new Date().getFullYear()} {site.brand} — {site.company}</span>
          <span className="footer-phones">
            <a href={`tel:${main.tel}`}>📞 {main.label}</a>
          </span>
        </div>
      </footer>

      <a href={`tel:${main.tel}`} className="float-call" aria-label="Qo'ng'iroq qilish">📞</a>
      <RegisterToast />
      <Reveal />
    </>
  );
}
