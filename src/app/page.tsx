import { Header } from '@/components/layout/Header';
import { ClientShell } from '@/components/ClientShell';
import { Hero } from '@/components/sections/Hero';
import { Conferido } from '@/components/sections/Conferido';
import { Escolha } from '@/components/sections/Escolha';
import { Mais } from '@/components/sections/Mais';
import { Vantagens } from '@/components/sections/Vantagens';
import { Loja, SiteFooter } from '@/components/sections/Loja';

/**
 * Server-rendered page: every word is indexable HTML. The 3D stage, scroll
 * director and interest list mount on the client inside <ClientShell />.
 */
export default function Home() {
  return (
    <>
      <a href="#main" className="skip-link">
        Pular para o conteúdo
      </a>
      <Header />
      <main id="main">
        <Hero />
        <Conferido />
        <Escolha />
        <Mais />
        <Vantagens />
        <Loja />
      </main>
      <SiteFooter />
      <ClientShell />
    </>
  );
}
