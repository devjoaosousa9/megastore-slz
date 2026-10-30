'use client';

import { useRef, type KeyboardEvent, type PointerEvent } from 'react';
import { whatsappLink } from '@/config/store';
import { choiceLabel, resolveChoice, useExperience } from '@/store/useExperience';
import { StillRender } from '../Stage';
import { FinishPicker, ModelPicker, Notice, StoragePicker } from '../ui/Options';
import { WhatsAppIcon } from '../ui/WhatsAppIcon';

const STEP = Math.PI / 8;

/** WhatsApp message for one configuration. Pure, unit-tested. */
export function choiceMessage(label: string, detail: string) {
  return `Olá, Mega Store! Vi no site e tenho interesse no ${label} (${detail}). Vocês têm disponível? Qual o valor?`;
}

/**
 * Configurator. The viewer is a transparent window onto the fixed 3D stage: a
 * horizontal drag turns the phone (touch-action: pan-y keeps page scrolling
 * native on phones), arrow keys turn and tilt it, +/- zoom within limits. The
 * outcome is a WhatsApp message to the store - availability and price are
 * confirmed there, never promised on the site.
 */
export function Escolha() {
  const rotateBy = useExperience((s) => s.rotateBy);
  const zoomBy = useExperience((s) => s.zoomBy);
  const resetView = useExperience((s) => s.resetView);
  const resetChoice = useExperience((s) => s.resetChoice);
  const addToList = useExperience((s) => s.addToList);
  const choice = useExperience((s) => s.choice);
  const { phone, finish, storage } = resolveChoice(choice);
  const item = choiceLabel(choice);
  const drag = useRef<{ x: number; y: number; id: number } | null>(null);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return;
    drag.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    rotateBy((e.clientX - d.x) * 0.012, e.pointerType === 'mouse' ? (e.clientY - d.y) * 0.005 : 0);
    d.x = e.clientX;
    d.y = e.clientY;
  };
  const endDrag = () => {
    drag.current = null;
  };
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const actions: Record<string, () => void> = {
      ArrowLeft: () => rotateBy(-STEP),
      ArrowRight: () => rotateBy(STEP),
      ArrowUp: () => rotateBy(0, -STEP / 2),
      ArrowDown: () => rotateBy(0, STEP / 2),
      '+': () => zoomBy(1.12),
      '=': () => zoomBy(1.12),
      '-': () => zoomBy(1 / 1.12),
      '0': resetView,
    };
    const action = actions[e.key];
    if (action) {
      e.preventDefault();
      action();
    }
  };

  return (
    <section id="escolha" className="cfg" aria-labelledby="cfg-title">
      <div className="wrap cfg__grid">
        <div
          className="cfg__viewer"
          role="group"
          tabIndex={0}
          aria-label="Visualizador do iPhone. Arraste ou use as setas para girar, mais e menos para aproximar, zero para voltar."
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onKeyDown={onKeyDown}
        >
          <StillRender product="phone" className="cfg__still" />
          <p className="cfg__hint" aria-hidden="true">
            Arraste para girar
          </p>
          <div className="cfg__tools" role="toolbar" aria-label="Controles de visualização">
            <button type="button" className="icon-btn" onClick={() => rotateBy(-STEP)} aria-label="Girar para a esquerda">
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path d="M9 7H4V2M4.5 7A8 8 0 1 1 4 13" stroke="currentColor" strokeWidth="1.6" fill="none" />
              </svg>
            </button>
            <button type="button" className="icon-btn" onClick={() => rotateBy(STEP)} aria-label="Girar para a direita">
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path d="M15 7h5V2M19.5 7A8 8 0 1 0 20 13" stroke="currentColor" strokeWidth="1.6" fill="none" />
              </svg>
            </button>
            <button type="button" className="icon-btn" onClick={() => zoomBy(1 / 1.12)} aria-label="Afastar">
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path d="M6 12h12" stroke="currentColor" strokeWidth="1.6" />
              </svg>
            </button>
            <button type="button" className="icon-btn" onClick={() => zoomBy(1.12)} aria-label="Aproximar">
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path d="M6 12h12M12 6v12" stroke="currentColor" strokeWidth="1.6" />
              </svg>
            </button>
            <button type="button" className="btn btn--quiet btn--small" onClick={resetView}>
              Voltar à posição
            </button>
          </div>
        </div>

        <div className="cfg__panel">
          <h2 id="cfg-title" className="h2">
            Escolha o seu
          </h2>
          <ModelPicker />
          <FinishPicker />
          <StoragePicker />
          <Notice />
          <div className="cfg__summary">
            <p className="cfg__summary-name">{phone.name}</p>
            <p className="cfg__summary-detail">
              {storage}, {finish.name}
            </p>
            <p className="cfg__summary-note">
              Preço e disponibilidade mudam todo dia e são confirmados pela loja no WhatsApp. Peça fotos e a
              saúde da bateria.
            </p>
          </div>
          <div className="cfg__actions">
            <a
              className="btn btn--whatsapp"
              href={whatsappLink(choiceMessage(item.label, item.detail))}
              target="_blank"
              rel="noopener noreferrer"
            >
              <WhatsAppIcon />
              Perguntar por este
              <span className="sr-only"> no WhatsApp (abre o WhatsApp)</span>
            </a>
            <button type="button" className="btn btn--quiet" onClick={() => addToList(item)}>
              Adicionar à lista
            </button>
          </div>
          <button type="button" className="link-btn" onClick={resetChoice}>
            Recomeçar
          </button>
        </div>
      </div>
    </section>
  );
}
