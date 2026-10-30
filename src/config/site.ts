export const SITE = {
  name: 'Mega Store SLZ | iPhones novos e seminovos em São Luís',
  description:
    'iPhones novos e seminovos, Apple Watch e MacBook no Centro Empresarial do Shopping da Ilha, em São Luís – MA. Veja cada modelo em 3D, escolha cor e armazenamento e fale com a loja no WhatsApp.',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://devjoaosousa9.github.io/megastore-slz',
};

export const NAV = [
  { id: 'conferido', label: 'Ponta a ponta' },
  { id: 'escolha', label: 'Escolha o seu' },
  { id: 'mais', label: 'Watch e MacBook' },
  { id: 'loja', label: 'A loja' },
] as const;
