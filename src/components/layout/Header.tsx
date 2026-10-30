'use client';

import { useEffect, useRef, useState } from 'react';
import { NAV } from '@/config/site';
import { STORE, whatsappLink } from '@/config/store';
import { useExperience } from '@/store/useExperience';
import { WhatsAppIcon } from '../ui/WhatsAppIcon';
import { Logo } from './Logo';

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const count = useExperience((s) => s.list.length);
  const setListOpen = useExperience((s) => s.setListOpen);
  const motionPaused = useExperience((s) => s.motionPaused);
  const systemReduced = useExperience((s) => s.systemReducedMotion);
  const toggleMotion = useExperience((s) => s.toggleMotion);
  const menuButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        menuButton.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  const motionOff = motionPaused || systemReduced;
  const motionLabel = systemReduced
    ? 'Movimento reduzido ativado no seu sistema'
    : motionOff
      ? 'Retomar animações'
      : 'Pausar animações';

  return (
    <header className="site-header">
      <div className="progress" aria-hidden="true">
        <span className="progress__bar" data-progress-bar />
      </div>
      <div className="site-header__inner">
        <a href="#inicio" className="brand" aria-label={`${STORE.fullName}, voltar ao início`}>
          <Logo />
        </a>

        <nav aria-label="Principal" className="nav-desktop">
          <ul>
            {NAV.map((item) => (
              <li key={item.id}>
                <a href={`#${item.id}`} className="nav-link">
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="site-header__actions">
          <button
            type="button"
            className="icon-btn"
            aria-pressed={motionOff}
            onClick={toggleMotion}
            disabled={systemReduced}
            title={motionLabel}
            aria-label={motionLabel}
          >
            {motionOff ? (
              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                <path d="M8 5.5v13l10-6.5z" fill="currentColor" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                <path d="M8 5h3v14H8zM13 5h3v14h-3z" fill="currentColor" />
              </svg>
            )}
          </button>
          <button
            type="button"
            className="list-btn"
            onClick={() => setListOpen(true)}
            aria-label={`Abrir minha lista, ${count} ${count === 1 ? 'aparelho' : 'aparelhos'}`}
          >
            <span className="list-btn__label">Minha lista</span>
            <span className="list-btn__count tabular" data-filled={count > 0}>
              {count}
            </span>
          </button>
          <a
            className="btn btn--whatsapp btn--small header-wa"
            href={whatsappLink('Olá, Mega Store! Vim pelo site.')}
            target="_blank"
            rel="noopener noreferrer"
          >
            <WhatsAppIcon size={16} />
            <span className="header-wa__label">WhatsApp</span>
            <span className="sr-only"> (abre o WhatsApp)</span>
          </a>
          <button
            ref={menuButton}
            type="button"
            className="menu-btn"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen((o) => !o)}
          >
            <span className="sr-only">{menuOpen ? 'Fechar menu' : 'Abrir menu'}</span>
            <span className="menu-btn__lines" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div id="mobile-menu" className="mobile-menu" hidden={!menuOpen}>
        <nav aria-label="Menu">
          <ul>
            {NAV.map((item) => (
              <li key={item.id}>
                <a href={`#${item.id}`} onClick={() => setMenuOpen(false)}>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
