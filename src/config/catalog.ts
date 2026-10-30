/**
 * Product catalogue with the manufacturer's published specifications. These
 * drive both the configurator and the 3D models (real size, camera layout,
 * frame material and finish of every model).
 *
 * Mega Store SLZ sells pre-owned devices: which models, storages and colours are
 * in stock changes daily, so the site never states availability or prices - it
 * hands the exact configuration to the store's WhatsApp.
 */

export type FrameMaterial = 'aluminium' | 'steel' | 'titanium';
export type CameraLayout = 'dual-diagonal' | 'triple';
export type FrontCutout = 'notch' | 'island';
export type BackGlass = 'glossy' | 'frosted-tint' | 'matte';

export interface Finish {
  id: string;
  name: string;
  /** Back glass colour. */
  back: string;
  /** Frame / band colour. */
  frame: string;
  /** Swatch shown in the UI. */
  swatch: string;
}

export interface PhoneSpec {
  id: string;
  name: string;
  year: number;
  /** Height x width x depth in millimetres (Apple tech specs). */
  mm: { h: number; w: number; d: number };
  camera: CameraLayout;
  cutout: FrontCutout;
  frame: FrameMaterial;
  glass: BackGlass;
  port: 'lightning' | 'usb-c';
  actionButton: boolean;
  storage: string[];
  finishes: Finish[];
}

const f = (id: string, name: string, back: string, frame = back, swatch = back): Finish => ({ id, name, back, frame, swatch });

export const PHONES: PhoneSpec[] = [
  {
    id: 'iphone-13',
    name: 'iPhone 13',
    year: 2021,
    mm: { h: 146.7, w: 71.5, d: 7.65 },
    camera: 'dual-diagonal',
    cutout: 'notch',
    frame: 'aluminium',
    glass: 'glossy',
    port: 'lightning',
    actionButton: false,
    storage: ['128 GB', '256 GB', '512 GB'],
    finishes: [
      f('midnight', 'Meia-noite', '#232a31'),
      f('starlight', 'Estelar', '#f2ece4', '#e9e1d6'),
      f('blue', 'Azul', '#215e7c'),
      f('pink', 'Rosa', '#f6d9d1', '#e9c7bf'),
      f('red', '(PRODUCT)RED', '#bf0013'),
      f('green', 'Verde', '#394c38'),
    ],
  },
  {
    id: 'iphone-13-pro',
    name: 'iPhone 13 Pro',
    year: 2021,
    mm: { h: 146.7, w: 71.5, d: 7.65 },
    camera: 'triple',
    cutout: 'notch',
    frame: 'steel',
    glass: 'matte',
    port: 'lightning',
    actionButton: false,
    storage: ['128 GB', '256 GB', '512 GB', '1 TB'],
    finishes: [
      f('graphite', 'Grafite', '#54524f', '#4a4846'),
      f('gold', 'Dourado', '#f3e2c7', '#e2c99f'),
      f('silver', 'Prateado', '#eceeea', '#d8dadc'),
      f('sierra-blue', 'Azul-sierra', '#9bb5ce', '#8aa4bf'),
      f('alpine-green', 'Verde-alpino', '#576856', '#4e5d4c'),
    ],
  },
  {
    id: 'iphone-14',
    name: 'iPhone 14',
    year: 2022,
    mm: { h: 146.7, w: 71.5, d: 7.8 },
    camera: 'dual-diagonal',
    cutout: 'notch',
    frame: 'aluminium',
    glass: 'glossy',
    port: 'lightning',
    actionButton: false,
    storage: ['128 GB', '256 GB', '512 GB'],
    finishes: [
      f('midnight', 'Meia-noite', '#222930'),
      f('starlight', 'Estelar', '#f3eee8', '#e6ded4'),
      f('purple', 'Roxo', '#ddd2e4', '#cbbfd6'),
      f('blue', 'Azul', '#a0b4c7'),
      f('yellow', 'Amarelo', '#f6df72', '#ead068'),
      f('red', '(PRODUCT)RED', '#d0021b'),
    ],
  },
  {
    id: 'iphone-14-pro',
    name: 'iPhone 14 Pro',
    year: 2022,
    mm: { h: 147.5, w: 71.5, d: 7.85 },
    camera: 'triple',
    cutout: 'island',
    frame: 'steel',
    glass: 'matte',
    port: 'lightning',
    actionButton: false,
    storage: ['128 GB', '256 GB', '512 GB', '1 TB'],
    finishes: [
      f('space-black', 'Preto-espacial', '#403e3d', '#363534'),
      f('silver', 'Prateado', '#eceeee', '#d6d8da'),
      f('gold', 'Dourado', '#f1e3c6', '#dfc89c'),
      f('deep-purple', 'Roxo-profundo', '#594f63', '#4f4659'),
    ],
  },
  {
    id: 'iphone-15',
    name: 'iPhone 15',
    year: 2023,
    mm: { h: 147.6, w: 71.6, d: 7.8 },
    camera: 'dual-diagonal',
    cutout: 'island',
    frame: 'aluminium',
    glass: 'frosted-tint',
    port: 'usb-c',
    actionButton: false,
    storage: ['128 GB', '256 GB', '512 GB'],
    finishes: [
      f('black', 'Preto', '#35393b', '#2f3234'),
      f('blue', 'Azul', '#d4e4f1', '#c3d5e4'),
      f('green', 'Verde', '#e1e8d8', '#cfd8c4'),
      f('yellow', 'Amarelo', '#f8f0c6', '#ece2b0'),
      f('pink', 'Rosa', '#f2dcdd', '#e6c8ca'),
    ],
  },
  {
    id: 'iphone-15-pro',
    name: 'iPhone 15 Pro',
    year: 2023,
    mm: { h: 146.6, w: 70.6, d: 8.25 },
    camera: 'triple',
    cutout: 'island',
    frame: 'titanium',
    glass: 'matte',
    port: 'usb-c',
    actionButton: true,
    storage: ['128 GB', '256 GB', '512 GB', '1 TB'],
    finishes: [
      f('natural-titanium', 'Titânio natural', '#bab4a9', '#a9a296'),
      f('blue-titanium', 'Titânio azul', '#3f4757', '#3a4150'),
      f('white-titanium', 'Titânio branco', '#ecebe6', '#d9d8d2'),
      f('black-titanium', 'Titânio preto', '#3c3c3d', '#333334'),
    ],
  },
  {
    id: 'iphone-15-pro-max',
    name: 'iPhone 15 Pro Max',
    year: 2023,
    mm: { h: 159.9, w: 76.7, d: 8.25 },
    camera: 'triple',
    cutout: 'island',
    frame: 'titanium',
    glass: 'matte',
    port: 'usb-c',
    actionButton: true,
    storage: ['256 GB', '512 GB', '1 TB'],
    finishes: [
      f('natural-titanium', 'Titânio natural', '#bab4a9', '#a9a296'),
      f('blue-titanium', 'Titânio azul', '#3f4757', '#3a4150'),
      f('white-titanium', 'Titânio branco', '#ecebe6', '#d9d8d2'),
      f('black-titanium', 'Titânio preto', '#3c3c3d', '#333334'),
    ],
  },
];

export interface WatchSpec {
  id: string;
  name: string;
  /** Case height x width x depth in millimetres. */
  mm: { h: number; w: number; d: number };
  sizes: string[];
  finishes: Finish[];
}

export const WATCH: WatchSpec = {
  id: 'apple-watch-s9',
  name: 'Apple Watch Series 9',
  mm: { h: 45, w: 38, d: 10.7 },
  sizes: ['41 mm', '45 mm'],
  finishes: [
    f('midnight', 'Meia-noite', '#2e3640'),
    f('starlight', 'Estelar', '#e3dccf'),
    f('silver', 'Prateado', '#e3e4e5'),
    f('pink', 'Rosa', '#f5d4d6'),
    f('red', '(PRODUCT)RED', '#ba0c2e'),
  ],
};

export interface LaptopSpec {
  id: string;
  name: string;
  /** Closed: width x depth x height in millimetres. */
  mm: { w: number; d: number; h: number };
  finishes: Finish[];
}

export const LAPTOP: LaptopSpec = {
  id: 'macbook-air-13-m2',
  name: 'MacBook Air 13" (M2)',
  mm: { w: 304.1, d: 215, h: 11.3 },
  finishes: [
    f('midnight', 'Meia-noite', '#2e3642'),
    f('starlight', 'Estelar', '#f0e4d3'),
    f('space-gray', 'Cinza-espacial', '#7d7e80'),
    f('silver', 'Prateado', '#e3e4e5'),
  ],
};

/** Scene scale shared by every device: 1 scene unit = 50 mm. */
export const MM_PER_UNIT = 50;
export const mm = (value: number) => value / MM_PER_UNIT;

export const getPhone = (id: string) => PHONES.find((p) => p.id === id) ?? PHONES[PHONES.length - 2]!;
