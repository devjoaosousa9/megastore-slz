'use client';

import { TOUR } from '@/config/tour';
import { resolveChoice, useExperience } from '@/store/useExperience';

/**
 * Scroll tour around the selected iPhone: screen, cameras, battery, frame. The
 * section is four equal steps so every camera shot lands on its step's centre,
 * and the copy and measurements follow whichever model is selected.
 */
export function Conferido() {
  const choice = useExperience((s) => s.choice);
  const { phone } = resolveChoice(choice);
  return (
    <section id="conferido" className="tour" aria-labelledby="tour-title">
      {TOUR.map((step, i) => (
        <article key={step.id} className="tour-step" data-tour-step={i} aria-labelledby={`tour-${step.id}`}>
          <div className="wrap">
            <div className="tour-step__text">
              {i === 0 && (
                <h2 id="tour-title" className="tour__heading">
                  Conferido de ponta a ponta
                </h2>
              )}
              <p className="tour-step__count">
                <span className="tabular">{i + 1}</span> de {TOUR.length}
              </p>
              <h3 id={`tour-${step.id}`} className="tour-step__title">
                {step.title}
              </h3>
              <p className="tour-step__body">{step.body(phone)}</p>
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}
