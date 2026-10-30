'use client';

import { useEffect, useRef } from 'react';
import { whatsappLink } from '@/config/store';
import { useExperience } from '@/store/useExperience';
import { WhatsAppIcon } from './WhatsAppIcon';

/** Builds the WhatsApp message for everything in the list. Pure, unit-tested. */
export function listMessage(items: { label: string; detail: string }[]) {
  const lines = items.map((i) => `• ${i.label} (${i.detail})`);
  return `Olá, Mega Store! Vi no site e tenho interesse em:\n${lines.join('\n')}\nVocês têm disponível? Qual o valor?`;
}

/**
 * "Minha lista": devices the visitor is interested in, sent to the store's
 * WhatsApp in one message. Nothing is sold or reserved on the site itself.
 */
export function InterestList() {
  const open = useExperience((s) => s.listOpen);
  const list = useExperience((s) => s.list);
  const setListOpen = useExperience((s) => s.setListOpen);
  const removeFromList = useExperience((s) => s.removeFromList);
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={dialog}
      className="drawer"
      aria-labelledby="list-title"
      onClose={() => setListOpen(false)}
      onClick={(e) => {
        if (e.target === dialog.current) setListOpen(false);
      }}
    >
      <div className="drawer__panel">
        <header className="drawer__head">
          <h2 id="list-title" className="drawer__title">
            Minha lista <span className="tabular">({list.length})</span>
          </h2>
          <button type="button" className="icon-btn" onClick={() => setListOpen(false)} aria-label="Fechar lista">
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.6" />
            </svg>
          </button>
        </header>

        {list.length === 0 ? (
          <p className="drawer__empty">
            Sua lista está vazia. Escolha um iPhone e toque em “Adicionar à lista” para perguntar por vários de uma vez.
          </p>
        ) : (
          <ul className="drawer__list">
            {list.map((item) => (
              <li key={item.key} className="list-item">
                <div>
                  <p className="list-item__name">{item.label}</p>
                  <p className="list-item__detail">{item.detail}</p>
                </div>
                <button type="button" className="link-btn" onClick={() => removeFromList(item.key)}>
                  Remover
                </button>
              </li>
            ))}
          </ul>
        )}

        <footer className="drawer__foot">
          {list.length > 0 && (
            <a className="btn btn--whatsapp btn--block" href={whatsappLink(listMessage(list))} target="_blank" rel="noopener noreferrer">
              <WhatsAppIcon />
              Enviar lista no WhatsApp
              <span className="sr-only"> (abre o WhatsApp)</span>
            </a>
          )}
          <p className="fine-print">A loja confirma disponibilidade, estado e preço de cada aparelho pelo WhatsApp.</p>
        </footer>
      </div>
    </dialog>
  );
}
