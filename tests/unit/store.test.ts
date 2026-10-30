import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getPhone, LAPTOP, PHONES, WATCH } from '@/config/catalog';
import { STORE, whatsappLink } from '@/config/store';
import {
  choiceLabel,
  DEFAULT_CHOICE,
  resolveChoice,
  TURNTABLE_LIMITS,
  useExperience,
} from '@/store/useExperience';
import { listMessage } from '@/components/ui/InterestList';
import { choiceMessage } from '@/components/sections/Escolha';

vi.mock('next/dynamic', () => ({ default: () => () => null }));

beforeEach(() => {
  useExperience.setState({
    choice: { ...DEFAULT_CHOICE },
    list: [],
    listOpen: false,
    notice: null,
    phoneChanges: 0,
    turntable: { yaw: 0, pitch: 0, zoom: 1 },
  });
});

describe('catalogue', () => {
  it('lists seven iPhones with unique ids and unique finishes per model', () => {
    expect(PHONES).toHaveLength(7);
    expect(new Set(PHONES.map((p) => p.id)).size).toBe(PHONES.length);
    for (const p of PHONES) {
      expect(new Set(p.finishes.map((f) => f.id)).size).toBe(p.finishes.length);
      expect(p.storage.length).toBeGreaterThan(0);
    }
  });

  it('uses the official dimensions', () => {
    expect(getPhone('iphone-15-pro').mm).toEqual({ h: 146.6, w: 70.6, d: 8.25 });
    expect(getPhone('iphone-15-pro-max').mm).toEqual({ h: 159.9, w: 76.7, d: 8.25 });
    expect(getPhone('iphone-13').mm).toEqual({ h: 146.7, w: 71.5, d: 7.65 });
    expect(WATCH.mm.h).toBe(45);
    expect(LAPTOP.mm.w).toBe(304.1);
  });

  it('matches each generation’s hardware', () => {
    const byId = (id: string) => getPhone(id);
    // USB-C and the Action button arrived with the 15 family (Action on Pro only).
    expect(PHONES.filter((p) => p.port === 'usb-c').map((p) => p.id)).toEqual([
      'iphone-15',
      'iphone-15-pro',
      'iphone-15-pro-max',
    ]);
    expect(PHONES.filter((p) => p.actionButton).map((p) => p.id)).toEqual(['iphone-15-pro', 'iphone-15-pro-max']);
    expect(byId('iphone-14').cutout).toBe('notch');
    expect(byId('iphone-14-pro').cutout).toBe('island');
    expect(byId('iphone-15').cutout).toBe('island');
    expect(PHONES.filter((p) => p.camera === 'triple').every((p) => p.name.includes('Pro'))).toBe(true);
  });

  it('falls back to the iPhone 15 Pro for unknown ids', () => {
    expect(getPhone('nope').id).toBe('iphone-15-pro');
  });
});

describe('store details', () => {
  it('links WhatsApp with the country code and an encoded message', () => {
    expect(STORE.whatsapp).toMatch(/^55\d{11}$/);
    const href = whatsappLink('Olá, Mega Store! 15 Pro (256 GB)');
    expect(href.startsWith(`https://wa.me/${STORE.whatsapp}?text=`)).toBe(true);
    expect(decodeURIComponent(href.split('text=')[1]!)).toBe('Olá, Mega Store! 15 Pro (256 GB)');
  });
});

describe('choosing a phone', () => {
  it('keeps colour and storage when the new model has them', () => {
    const { setPhone } = useExperience.getState();
    setPhone('iphone-15-pro-max');
    const s = useExperience.getState();
    expect(s.choice).toEqual({ phoneId: 'iphone-15-pro-max', finishId: 'natural-titanium', storage: '256 GB' });
    expect(s.notice).toBeNull();
    expect(s.phoneChanges).toBe(1);
  });

  it('falls back and explains when the colour or storage does not exist', () => {
    const { setStorage, setPhone } = useExperience.getState();
    setStorage('1 TB');
    setPhone('iphone-14');
    const s = useExperience.getState();
    expect(s.choice.phoneId).toBe('iphone-14');
    expect(s.choice.finishId).toBe(getPhone('iphone-14').finishes[0]!.id);
    expect(s.choice.storage).toBe('128 GB');
    expect(s.notice).toMatch(/^Ajustamos sua escolha: a cor Titânio natural não existe no iPhone 14 e o iPhone 14 não tem versão de 1 TB\.$/);
  });

  it('ignores re-selecting the current model', () => {
    useExperience.getState().setPhone(DEFAULT_CHOICE.phoneId);
    expect(useExperience.getState().phoneChanges).toBe(0);
  });

  it('resolves and labels a choice', () => {
    const choice = { phoneId: 'iphone-13', finishId: 'red', storage: '128 GB' };
    expect(resolveChoice(choice).finish.name).toBe('(PRODUCT)RED');
    expect(choiceLabel(choice)).toEqual({
      key: 'iphone-13:red:128 GB',
      label: 'iPhone 13',
      detail: '128 GB, (PRODUCT)RED',
    });
  });

  it('resets to the default choice', () => {
    const { setPhone, resetChoice } = useExperience.getState();
    setPhone('iphone-13');
    resetChoice();
    expect(useExperience.getState().choice).toEqual(DEFAULT_CHOICE);
  });
});

describe('interest list', () => {
  const item = { key: 'iphone-13:red:128 GB', label: 'iPhone 13', detail: '128 GB, (PRODUCT)RED' };

  it('adds once, opens the list and removes by key', () => {
    const { addToList, removeFromList } = useExperience.getState();
    addToList(item);
    addToList(item);
    expect(useExperience.getState().list).toHaveLength(1);
    expect(useExperience.getState().listOpen).toBe(true);
    removeFromList(item.key);
    expect(useExperience.getState().list).toHaveLength(0);
  });

  it('writes one WhatsApp message for the whole list', () => {
    expect(listMessage([item, { label: 'Apple Watch Series 9', detail: 'Meia-noite' }])).toBe(
      'Olá, Mega Store! Vi no site e tenho interesse em:\n' +
        '• iPhone 13 (128 GB, (PRODUCT)RED)\n' +
        '• Apple Watch Series 9 (Meia-noite)\n' +
        'Vocês têm disponível? Qual o valor?',
    );
  });

  it('asks about one configuration without promising price or stock', () => {
    const msg = choiceMessage('iPhone 15 Pro', '256 GB, Titânio natural');
    expect(msg).toBe(
      'Olá, Mega Store! Vi no site e tenho interesse no iPhone 15 Pro (256 GB, Titânio natural). Vocês têm disponível? Qual o valor?',
    );
    expect(msg).not.toMatch(/R\$/);
  });
});

describe('turntable', () => {
  it('clamps tilt and zoom', () => {
    const { rotateBy, zoomBy, resetView } = useExperience.getState();
    rotateBy(1, 5);
    zoomBy(10);
    let t = useExperience.getState().turntable;
    expect(t.yaw).toBe(1);
    expect(t.pitch).toBe(TURNTABLE_LIMITS.pitch);
    expect(t.zoom).toBe(TURNTABLE_LIMITS.zoomMax);
    zoomBy(0.01);
    expect(useExperience.getState().turntable.zoom).toBe(TURNTABLE_LIMITS.zoomMin);
    resetView();
    t = useExperience.getState().turntable;
    expect(t).toEqual({ yaw: 0, pitch: 0, zoom: 1 });
  });
});
