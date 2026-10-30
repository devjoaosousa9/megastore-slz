import { create } from 'zustand';
import { LAPTOP, PHONES, WATCH, getPhone, type Finish, type PhoneSpec } from '@/config/catalog';

export type QualityTier = 'high' | 'medium' | 'low';
export type RenderStatus = 'pending' | 'ready' | 'unsupported' | 'error';
export type StageMode = 'cinematic' | 'configure';

export interface Turntable {
  yaw: number;
  pitch: number;
  zoom: number;
}

export interface PhoneChoice {
  phoneId: string;
  finishId: string;
  storage: string;
}

/** One line of the interest list that is sent to the store on WhatsApp. */
export interface ListItem {
  key: string;
  label: string;
  detail: string;
}

export const TURNTABLE_LIMITS = { pitch: 0.5, zoomMin: 0.75, zoomMax: 1.6 } as const;
const DEFAULT_TURNTABLE: Turntable = { yaw: 0, pitch: 0, zoom: 1 };

const DEFAULT_PHONE = getPhone('iphone-15-pro');
export const DEFAULT_CHOICE: PhoneChoice = {
  phoneId: DEFAULT_PHONE.id,
  finishId: DEFAULT_PHONE.finishes[0]!.id,
  storage: DEFAULT_PHONE.storage[1] ?? DEFAULT_PHONE.storage[0]!,
};

interface ExperienceState {
  choice: PhoneChoice;
  watchFinishId: string;
  laptopFinishId: string;
  list: ListItem[];
  listOpen: boolean;
  notice: string | null;

  systemReducedMotion: boolean;
  motionPaused: boolean;
  quality: QualityTier;
  renderStatus: RenderStatus;
  renderError: string | null;

  mode: StageMode;
  /** Index of the active step in the scroll tour (-1 when outside it). */
  tourStep: number;
  turntable: Turntable;
  /** Bumped on every phone change so the stage can play its reaction. */
  phoneChanges: number;

  setPhone: (phoneId: string) => void;
  setFinish: (finishId: string) => void;
  setStorage: (storage: string) => void;
  setWatchFinish: (finishId: string) => void;
  setLaptopFinish: (finishId: string) => void;
  resetChoice: () => void;

  addToList: (item: ListItem) => void;
  removeFromList: (key: string) => void;
  setListOpen: (open: boolean) => void;

  setSystemReducedMotion: (value: boolean) => void;
  toggleMotion: () => void;
  setQuality: (tier: QualityTier) => void;
  setRenderStatus: (status: RenderStatus, error?: string) => void;
  setMode: (mode: StageMode) => void;
  setTourStep: (step: number) => void;
  rotateBy: (dYaw: number, dPitch?: number) => void;
  zoomBy: (factor: number) => void;
  resetView: () => void;
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export const useExperience = create<ExperienceState>()((set, get) => ({
  choice: { ...DEFAULT_CHOICE },
  watchFinishId: WATCH.finishes[0]!.id,
  laptopFinishId: LAPTOP.finishes[0]!.id,
  list: [],
  listOpen: false,
  notice: null,

  systemReducedMotion: false,
  motionPaused: false,
  quality: 'high',
  renderStatus: 'pending',
  renderError: null,

  mode: 'cinematic',
  tourStep: -1,
  turntable: { ...DEFAULT_TURNTABLE },
  phoneChanges: 0,

  setPhone: (phoneId) => {
    const { choice, phoneChanges } = get();
    if (phoneId === choice.phoneId) return;
    const phone = getPhone(phoneId);
    const current = getPhone(choice.phoneId);
    const currentFinish = current.finishes.find((x) => x.id === choice.finishId);
    // Keep the colour and storage when the new model has them; otherwise fall back.
    const finish =
      phone.finishes.find((x) => x.id === choice.finishId) ??
      phone.finishes.find((x) => x.name === currentFinish?.name) ??
      phone.finishes[0]!;
    const storage = phone.storage.includes(choice.storage) ? choice.storage : phone.storage[0]!;
    const notes: string[] = [];
    if (finish.id !== choice.finishId) notes.push(`a cor ${currentFinish?.name ?? ''} não existe no ${phone.name}`);
    if (storage !== choice.storage) notes.push(`o ${phone.name} não tem versão de ${choice.storage}`);
    set({
      choice: { phoneId, finishId: finish.id, storage },
      phoneChanges: phoneChanges + 1,
      notice: notes.length ? `Ajustamos sua escolha: ${notes.join(' e ')}.` : null,
    });
  },
  setFinish: (finishId) => set((s) => ({ choice: { ...s.choice, finishId }, notice: null })),
  setStorage: (storage) => set((s) => ({ choice: { ...s.choice, storage }, notice: null })),
  setWatchFinish: (watchFinishId) => set({ watchFinishId }),
  setLaptopFinish: (laptopFinishId) => set({ laptopFinishId }),
  resetChoice: () =>
    set((s) => ({
      choice: { ...DEFAULT_CHOICE },
      notice: null,
      turntable: { ...DEFAULT_TURNTABLE },
      phoneChanges: s.choice.phoneId === DEFAULT_CHOICE.phoneId ? s.phoneChanges : s.phoneChanges + 1,
    })),

  addToList: (item) => {
    const { list } = get();
    set({
      list: list.some((i) => i.key === item.key) ? list : [...list, item],
      listOpen: true,
      notice: null,
    });
  },
  removeFromList: (key) => set((s) => ({ list: s.list.filter((i) => i.key !== key) })),
  setListOpen: (listOpen) => set({ listOpen }),

  setSystemReducedMotion: (systemReducedMotion) => set({ systemReducedMotion }),
  toggleMotion: () => set((s) => ({ motionPaused: !s.motionPaused })),
  setQuality: (quality) => set({ quality }),
  setRenderStatus: (renderStatus, error) => set({ renderStatus, renderError: error ?? null }),
  setMode: (mode) => set({ mode }),
  setTourStep: (tourStep) => set((s) => (s.tourStep === tourStep ? s : { tourStep })),
  rotateBy: (dYaw, dPitch = 0) =>
    set((s) => ({
      turntable: {
        ...s.turntable,
        yaw: s.turntable.yaw + dYaw,
        pitch: clamp(s.turntable.pitch + dPitch, -TURNTABLE_LIMITS.pitch, TURNTABLE_LIMITS.pitch),
      },
    })),
  zoomBy: (factor) =>
    set((s) => ({
      turntable: {
        ...s.turntable,
        zoom: clamp(s.turntable.zoom * factor, TURNTABLE_LIMITS.zoomMin, TURNTABLE_LIMITS.zoomMax),
      },
    })),
  resetView: () => set({ turntable: { ...DEFAULT_TURNTABLE } }),
}));

/** True when continuous / decorative motion must stop. */
export const selectMotionReduced = (s: ExperienceState) => s.systemReducedMotion || s.motionPaused;

/** The selected phone, its finish and storage, resolved from the catalogue. */
export function resolveChoice(choice: PhoneChoice): { phone: PhoneSpec; finish: Finish; storage: string } {
  const phone = getPhone(choice.phoneId);
  const finish = phone.finishes.find((x) => x.id === choice.finishId) ?? phone.finishes[0]!;
  return { phone, finish, storage: choice.storage };
}

export const choiceLabel = (choice: PhoneChoice) => {
  const { phone, finish, storage } = resolveChoice(choice);
  return { key: `${phone.id}:${finish.id}:${storage}`, label: phone.name, detail: `${storage}, ${finish.name}` };
};

export const watchFinish = (id: string) => WATCH.finishes.find((x) => x.id === id) ?? WATCH.finishes[0]!;
export const laptopFinish = (id: string) => LAPTOP.finishes.find((x) => x.id === id) ?? LAPTOP.finishes[0]!;
export const ALL_PHONES = PHONES;
