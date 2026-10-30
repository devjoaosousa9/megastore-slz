'use client';

import { useId, type CSSProperties, type KeyboardEvent } from 'react';
import { PHONES, type Finish } from '@/config/catalog';
import { resolveChoice, useExperience } from '@/store/useExperience';

/** Arrow-key navigation for radio groups (WAI-ARIA radiogroup pattern). */
function onRadioKeys(e: KeyboardEvent<HTMLDivElement>) {
  const keys = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'];
  if (!keys.includes(e.key)) return;
  const radios = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="radio"]'));
  const i = radios.indexOf(document.activeElement as HTMLButtonElement);
  if (i < 0 || radios.length === 0) return;
  e.preventDefault();
  let next = i;
  if (e.key === 'Home') next = 0;
  else if (e.key === 'End') next = radios.length - 1;
  else next = (i + (e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1) + radios.length) % radios.length;
  radios[next]!.focus();
  radios[next]!.click();
}

function RadioGroup({ label, children, className }: { label: string; children: React.ReactNode; className: string }) {
  const id = useId();
  return (
    <div className="option">
      <p id={id} className="option__label">
        {label}
      </p>
      <div role="radiogroup" aria-labelledby={id} className={className} onKeyDown={onRadioKeys}>
        {children}
      </div>
    </div>
  );
}

export function ModelPicker() {
  const phoneId = useExperience((s) => s.choice.phoneId);
  const setPhone = useExperience((s) => s.setPhone);
  return (
    <RadioGroup label="Modelo" className="models">
      {PHONES.map((p) => (
        <button
          key={p.id}
          type="button"
          role="radio"
          aria-checked={p.id === phoneId}
          tabIndex={p.id === phoneId ? 0 : -1}
          className="model"
          onClick={() => setPhone(p.id)}
        >
          <span className="model__name">{p.name.replace('iPhone ', '')}</span>
          <span className="model__year tabular">{p.year}</span>
        </button>
      ))}
    </RadioGroup>
  );
}

/** Colour swatches. Used for the phone and, with `finishes`/`value`/`onChange`, for the watch and laptop. */
export function FinishPicker(props: {
  label?: string;
  finishes?: Finish[];
  value?: string;
  onChange?: (id: string) => void;
}) {
  const choice = useExperience((s) => s.choice);
  const setFinish = useExperience((s) => s.setFinish);
  const { phone, finish } = resolveChoice(choice);
  const finishes = props.finishes ?? phone.finishes;
  const value = props.value ?? finish.id;
  const onChange = props.onChange ?? setFinish;
  const current = finishes.find((f) => f.id === value) ?? finishes[0]!;

  return (
    <div className="option">
      <RadioGroup label={`${props.label ?? 'Cor'}: ${current.name}`} className="swatches">
        {finishes.map((f) => (
          <button
            key={f.id}
            type="button"
            role="radio"
            aria-checked={f.id === value}
            aria-label={f.name}
            title={f.name}
            tabIndex={f.id === value ? 0 : -1}
            className="swatch"
            style={{ '--swatch': f.swatch } as CSSProperties}
            onClick={() => onChange(f.id)}
          />
        ))}
      </RadioGroup>
    </div>
  );
}

export function StoragePicker() {
  const choice = useExperience((s) => s.choice);
  const setStorage = useExperience((s) => s.setStorage);
  const { phone, storage } = resolveChoice(choice);
  return (
    <RadioGroup label="Armazenamento" className="chips">
      {phone.storage.map((s) => (
        <button
          key={s}
          type="button"
          role="radio"
          aria-checked={s === storage}
          tabIndex={s === storage ? 0 : -1}
          className="chip tabular"
          onClick={() => setStorage(s)}
        >
          {s}
        </button>
      ))}
    </RadioGroup>
  );
}

export function Notice() {
  const notice = useExperience((s) => s.notice);
  return (
    <p className="notice" role="status" aria-live="polite" data-visible={!!notice}>
      {notice ?? ''}
    </p>
  );
}
