import { STORE } from '@/config/store';

const STEPS = [
  { title: 'Escolha aqui', body: 'Veja o modelo em 3D, a cor e o armazenamento que você quer.' },
  { title: 'Fale com a loja', body: 'Pelo WhatsApp, a loja confirma disponibilidade e preço. Peça fotos e a saúde da bateria.' },
  { title: 'Retire ou receba', body: 'Na loja, no Shopping da Ilha, ou com entrega em São Luís.' },
];

/** Payment, trade-in and the three-step way to buy. Opaque: the camera flies home behind it. */
export function Vantagens() {
  const p = STORE.policies;
  const perks = [
    { title: p.installments, detail: [p.credishop, p.boleto].filter(Boolean).join('. ') },
    { title: 'Seu usado vale desconto', detail: p.tradeIn },
    { title: 'Garantia da loja', detail: p.warranty },
    { title: 'Entrega em São Luís', detail: p.delivery },
  ].filter((x) => x.title && x.detail);

  return (
    <section id="vantagens" className="perks" aria-labelledby="perks-title">
      <div className="wrap">
        <h2 id="perks-title" className="h2">
          Comprar aqui é simples
        </h2>
        <dl className="perks__list">
          {perks.map((perk) => (
            <div key={perk.title} className="perks__item">
              <dt>{perk.title}</dt>
              <dd>{perk.detail}.</dd>
            </div>
          ))}
        </dl>
        <h3 className="perks__subhead">Como comprar</h3>
        <ol className="steps">
          {STEPS.map((s, i) => (
            <li key={s.title} className="steps__item">
              <span className="steps__n tabular" aria-hidden="true">
                {i + 1}
              </span>
              <p className="steps__title">{s.title}</p>
              <p className="steps__body">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
