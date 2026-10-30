'use client';

import { LAPTOP, WATCH } from '@/config/catalog';
import { whatsappLink } from '@/config/store';
import { laptopFinish, useExperience, watchFinish } from '@/store/useExperience';
import { StillRender } from '../Stage';
import { FinishPicker } from '../ui/Options';
import { WhatsAppIcon } from '../ui/WhatsAppIcon';

const fmt = (n: number) => n.toLocaleString('pt-BR', { maximumFractionDigits: 1 });

/** "E muito mais": the camera flies from the phone to the watch, then to the laptop. */
export function Mais() {
  const watchId = useExperience((s) => s.watchFinishId);
  const laptopId = useExperience((s) => s.laptopFinishId);
  const setWatchFinish = useExperience((s) => s.setWatchFinish);
  const setLaptopFinish = useExperience((s) => s.setLaptopFinish);
  const addToList = useExperience((s) => s.addToList);
  const w = watchFinish(watchId);
  const l = laptopFinish(laptopId);

  return (
    <section id="mais" className="more" aria-labelledby="more-title">
      <article className="more-step" aria-labelledby="watch-title">
        <div className="wrap">
          <div className="more-step__text">
            <h2 id="more-title" className="more__heading">
              iPhones e muito mais
            </h2>
            <h3 id="watch-title" className="more-step__title">
              {WATCH.name}
            </h3>
            <p className="more-step__body">
              Caixa de alumínio de {fmt(WATCH.mm.h)} mm, também na versão {WATCH.sizes[0]}. Pulseira esportiva e tela
              sempre ativa.
            </p>
            <FinishPicker label="Cor" finishes={WATCH.finishes} value={w.id} onChange={setWatchFinish} />
            <div className="more-step__actions">
              <a
                className="btn btn--whatsapp"
                href={whatsappLink(`Olá, Mega Store! Vi no site e tenho interesse no ${WATCH.name} (${w.name}). Vocês têm disponível?`)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <WhatsAppIcon />
                Perguntar pelo Watch
                <span className="sr-only"> no WhatsApp (abre o WhatsApp)</span>
              </a>
              <button
                type="button"
                className="btn btn--quiet"
                onClick={() => addToList({ key: `${WATCH.id}:${w.id}`, label: WATCH.name, detail: w.name })}
              >
                Adicionar à lista
              </button>
            </div>
          </div>
          <StillRender product="watch" className="more-step__still" />
        </div>
      </article>

      <article className="more-step" aria-labelledby="laptop-title">
        <div className="wrap">
          <div className="more-step__text">
            <h3 id="laptop-title" className="more-step__title">
              {LAPTOP.name}
            </h3>
            <p className="more-step__body">
              {fmt(LAPTOP.mm.h)} mm de espessura e tela de 13,6 polegadas. Leve para o dia a dia, com bateria para
              o dia inteiro.
            </p>
            <FinishPicker label="Cor" finishes={LAPTOP.finishes} value={l.id} onChange={setLaptopFinish} />
            <div className="more-step__actions">
              <a
                className="btn btn--whatsapp"
                href={whatsappLink(`Olá, Mega Store! Vi no site e tenho interesse no ${LAPTOP.name} (${l.name}). Vocês têm disponível?`)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <WhatsAppIcon />
                Perguntar pelo MacBook
                <span className="sr-only"> no WhatsApp (abre o WhatsApp)</span>
              </a>
              <button
                type="button"
                className="btn btn--quiet"
                onClick={() => addToList({ key: `${LAPTOP.id}:${l.id}`, label: LAPTOP.name, detail: l.name })}
              >
                Adicionar à lista
              </button>
            </div>
            <p className="more-step__aside">Também trabalhamos com iPad e Xiaomi. Pergunte pelo WhatsApp.</p>
          </div>
          <StillRender product="laptop" className="more-step__still" />
        </div>
      </article>
    </section>
  );
}
