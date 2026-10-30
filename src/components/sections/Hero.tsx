import { STORE, whatsappLink } from '@/config/store';
import { LoadState, StillRender } from '../Stage';
import { WhatsAppIcon } from '../ui/WhatsAppIcon';

/**
 * The wordmark sits on the page layer *behind* the transparent WebGL canvas, so
 * the iPhone turns in front of the store's name, like the storefront sign.
 */
export function Hero() {
  return (
    <section id="inicio" className="hero" aria-labelledby="hero-title">
      <p className="hero__mark" aria-hidden="true">
        <span>MEGA</span>
        <span>STORE</span>
      </p>
      <StillRender product="phone" className="hero__still" />
      <div className="wrap hero__content">
        <div className="hero__copy">
          <h1 id="hero-title" className="hero__title">
            iPhones novos e seminovos, conferidos de ponta a ponta.
          </h1>
          <p className="hero__lede">
            No Centro Empresarial do Shopping da Ilha, em São Luís. Veja cada modelo em 3D, escolha cor e
            armazenamento e fale direto com a loja.
          </p>
          <div className="hero__ctas">
            <a href="#escolha" className="btn btn--light">
              Escolher meu iPhone
            </a>
            <a
              href={whatsappLink('Olá, Mega Store! Vim pelo site e quero saber dos iPhones disponíveis.')}
              className="btn btn--whatsapp"
              target="_blank"
              rel="noopener noreferrer"
            >
              <WhatsAppIcon />
              Chamar no WhatsApp
              <span className="sr-only"> (abre o WhatsApp)</span>
            </a>
          </div>
        </div>
        <a className="hero__rating" href={STORE.google.reviewsUrl} target="_blank" rel="noopener noreferrer">
          <span className="hero__stars" aria-hidden="true">
            ★★★★★
          </span>
          <span>
            <strong className="tabular">{STORE.google.rating}</strong> no Google
          </span>
          <span className="sr-only"> (abre as avaliações em nova aba)</span>
        </a>
      </div>
      <LoadState />
    </section>
  );
}
