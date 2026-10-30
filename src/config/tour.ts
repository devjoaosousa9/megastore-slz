import type { PhoneSpec } from './catalog';

export type Dimension = 'height' | 'width' | 'depth';
export type AnchorId = 'screen' | 'camera' | 'sideButton' | 'port' | 'frame';

export interface TourStep {
  id: 'tela' | 'cameras' | 'bateria' | 'estrutura';
  title: string;
  body: (phone: PhoneSpec) => string;
  pin: { anchor: AnchorId; label: (phone: PhoneSpec) => string };
  dimension?: Dimension;
}

const fmt = (n: number) => n.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
const frameName: Record<PhoneSpec['frame'], string> = {
  aluminium: 'alumínio',
  steel: 'aço inoxidável',
  titanium: 'titânio',
};

/**
 * "Conferido de ponta a ponta": four things worth checking on any pre-owned
 * iPhone, each paired with the selected model's official measurements. The copy
 * asks the customer to check; it never claims a result for a specific device.
 */
export const TOUR: TourStep[] = [
  {
    id: 'tela',
    title: 'A tela',
    body: (p) =>
      `O ${p.name} tem ${fmt(p.mm.h)} mm de altura. Antes de fechar, peça fotos e um vídeo da tela ligada pelo WhatsApp: marcas e manchas aparecem na hora.`,
    pin: { anchor: 'screen', label: (p) => (p.cutout === 'island' ? 'Dynamic Island' : 'Tela com notch') },
    dimension: 'height',
  },
  {
    id: 'cameras',
    title: 'As câmeras',
    body: (p) =>
      `${p.camera === 'triple' ? 'Três câmeras traseiras' : 'Duas câmeras traseiras em diagonal'}, em ${fmt(p.mm.w)} mm de largura. Na loja, no Shopping da Ilha, você testa foto e vídeo antes de levar.`,
    pin: { anchor: 'camera', label: (p) => (p.camera === 'triple' ? 'Câmera tripla' : 'Câmera dupla') },
    dimension: 'width',
  },
  {
    id: 'bateria',
    title: 'A bateria',
    body: (p) =>
      `Em seminovos, a saúde da bateria é o número que mais importa. Pergunte o percentual do aparelho que você escolheu; o ${p.name} carrega pelo conector ${p.port === 'usb-c' ? 'USB-C' : 'Lightning'}.`,
    pin: { anchor: 'port', label: (p) => (p.port === 'usb-c' ? 'Conector USB-C' : 'Conector Lightning') },
  },
  {
    id: 'estrutura',
    title: 'Estrutura e botões',
    body: (p) =>
      `Estrutura de ${frameName[p.frame]} com ${fmt(p.mm.d)} mm de espessura. Confira laterais, cantos e o clique dos botões${p.actionButton ? ', incluindo o botão de Ação' : ''}.`,
    pin: { anchor: 'sideButton', label: (p) => (p.actionButton ? 'Botão de Ação' : 'Botões laterais') },
    dimension: 'depth',
  },
];
