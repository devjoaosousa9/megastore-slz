/**
 * Mega Store SLZ - public business details, taken from the store's Google
 * Business Profile and Instagram (checked 30 Oct 2026). Edit here when anything
 * changes; every page reads from this file.
 */
export const STORE = {
  name: 'Mega Store',
  fullName: 'Mega Store SLZ',
  tagline: 'iPhones e muito mais',
  city: 'São Luís – MA',
  address: {
    line1: 'Centro Empresarial do Shopping da Ilha',
    line2: 'Torre Empresarial 2, sala 313',
    district: 'Ipase de Baixo',
    city: 'São Luís – MA',
    zip: '65061-901',
  },
  /** Listed on Google as the store phone; used for WhatsApp links. Confirm it is the WhatsApp line. */
  phone: '(98) 98123-8819',
  whatsapp: '5598981238819',
  instagram: 'mega_store_slz',
  hours: [
    { days: 'Segunda a sábado', time: '10h às 20h' },
    { days: 'Domingo', time: '13h às 17h' },
  ],
  google: {
    rating: '5,0',
    mapsUrl:
      'https://www.google.com/maps/search/?api=1&query=Mega+Store+Centro+Empresarial+Shopping+da+Ilha+Torre+2+S%C3%A3o+Lu%C3%ADs',
    reviewsUrl: 'https://share.google/1LOcaeRF0mxHDqfJW',
    /** Short excerpts from public Google reviews of the store. */
    reviews: [
      'Aparelho de qualidade, preço justo e atendimento e pós-venda muito bons!',
      'Preço ótimo, e melhores condições de parcelamento.',
    ],
  },
  /**
   * Store policies as published on the store's Instagram. Confirm with the store
   * before launch; anything set to null is hidden.
   */
  policies: {
    installments: 'Parcelamento em até 18x no cartão',
    credishop: 'Até 6x no Credishop',
    boleto: 'Compra facilitada no boleto',
    tradeIn: 'Seu iPhone usado entra como parte do pagamento',
    delivery: 'Entrega em toda a região de São Luís',
    warranty: 'Aparelhos com garantia da loja',
  },
} as const;

/** WhatsApp deep link with a pre-written message. */
export const whatsappLink = (message: string) =>
  `https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent(message)}`;

export const instagramUrl = `https://instagram.com/${STORE.instagram}`;
