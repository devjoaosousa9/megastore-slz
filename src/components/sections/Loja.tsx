import { instagramUrl, STORE, whatsappLink } from '@/config/store';
import { NAV } from '@/config/site';
import { Logo } from '../layout/Logo';
import { WhatsAppIcon } from '../ui/WhatsAppIcon';

/** Visit the store (the phone returns on the right) and the footer. */
export function Loja() {
  const a = STORE.address;
  return (
    <>
      <section id="loja" className="visit" aria-labelledby="visit-title">
        <div className="wrap">
          <h2 id="visit-title" className="visit__title">
            Venha ver de perto.
          </h2>
          <address className="visit__address">
            {a.line1}
            <br />
            {a.line2}, {a.district}
            <br />
            {a.city}, {a.zip}
          </address>
          <dl className="visit__hours">
            {STORE.hours.map((h) => (
              <div key={h.days}>
                <dt>{h.days}</dt>
                <dd>{h.time}</dd>
              </div>
            ))}
          </dl>
          <div className="visit__actions">
            <a
              className="btn btn--whatsapp"
              href={whatsappLink('Olá, Mega Store! Vim pelo site.')}
              target="_blank"
              rel="noopener noreferrer"
            >
              <WhatsAppIcon />
              {STORE.phone}
              <span className="sr-only"> no WhatsApp (abre o WhatsApp)</span>
            </a>
            <a className="btn btn--light-quiet" href={STORE.google.mapsUrl} target="_blank" rel="noopener noreferrer">
              Como chegar
              <span className="sr-only"> (abre o Google Maps)</span>
            </a>
          </div>
          <figure className="visit__reviews">
            <figcaption>
              <a href={STORE.google.reviewsUrl} target="_blank" rel="noopener noreferrer">
                <span aria-hidden="true">★★★★★</span> {STORE.google.rating} no Google
                <span className="sr-only"> (abre as avaliações em nova aba)</span>
              </a>
            </figcaption>
            {STORE.google.reviews.map((r) => (
              <blockquote key={r}>
                <p>“{r}”</p>
              </blockquote>
            ))}
          </figure>
        </div>
      </section>
    </>
  );
}

export function SiteFooter() {
  return (
    <>
      <footer id="rodape" className="site-footer">
        <div className="wrap site-footer__grid">
          <div>
            <Logo />
            <p className="site-footer__note">{STORE.tagline}. iPhones novos e seminovos em São Luís.</p>
          </div>
          <nav aria-label="Rodapé">
            <ul>
              {NAV.map((n) => (
                <li key={n.id}>
                  <a href={`#${n.id}`}>{n.label}</a>
                </li>
              ))}
            </ul>
          </nav>
          <ul className="site-footer__contact">
            <li>
              <a href={instagramUrl} target="_blank" rel="noopener noreferrer">
                @{STORE.instagram}
                <span className="sr-only"> no Instagram (abre em nova aba)</span>
              </a>
            </li>
            <li>
              <a href={whatsappLink('Olá, Mega Store! Vim pelo site.')} target="_blank" rel="noopener noreferrer">
                WhatsApp {STORE.phone}
              </a>
            </li>
          </ul>
        </div>
        <div className="wrap site-footer__base">
          <p>
            iPhone, Apple Watch, MacBook e iPad são marcas registradas da Apple Inc. Os modelos 3D deste site são
            representações ilustrativas.
          </p>
          <p>© 2026 {STORE.fullName}</p>
        </div>
      </footer>
    </>
  );
}
