import type { Metadata, Viewport } from 'next';
import { Archivo, Hanken_Grotesk } from 'next/font/google';
import { SITE } from '@/config/site';
import './globals.css';

// Wide, heavy grotesk: the same voice as the "MEGA STORE" storefront sign.
const display = Archivo({
  subsets: ['latin'],
  axes: ['wdth'],
  variable: '--font-display',
  display: 'swap',
});

const text = Hanken_Grotesk({
  subsets: ['latin'],
  variable: '--font-text',
  display: 'swap',
});

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url.endsWith('/') ? SITE.url : `${SITE.url}/`),
  title: SITE.name,
  description: SITE.description,
  applicationName: 'Mega Store SLZ',
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    title: SITE.name,
    description: SITE.description,
    url: SITE.url,
    siteName: 'Mega Store SLZ',
    images: [{ url: `${basePath}/og.png`, width: 1200, height: 630, alt: 'Mega Store, iPhones em São Luís' }],
  },
  twitter: { card: 'summary_large_image', title: SITE.name, description: SITE.description },
  icons: { icon: `${basePath}/favicon.svg` },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#000000',
  colorScheme: 'dark light',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${display.variable} ${text.variable}`} data-motion="full">
      <body>{children}</body>
    </html>
  );
}
