# Mega Store SLZ — iPhones em 3D

Site da **Mega Store SLZ**, loja de iPhones novos e seminovos no Centro Empresarial do Shopping da Ilha, em São Luís (MA). Os aparelhos são **modelos 3D renderizados em tempo real** no navegador: o wordmark da loja fica atrás do iPhone, um tour guiado pelo scroll mostra o que conferir num seminovo (com as medidas oficiais de cada modelo), e o configurador troca modelo, cor e armazenamento. Tudo termina numa conversa no WhatsApp da loja.

**Site no ar:** https://devjoaosousa9.github.io/megastore-slz/

> O site não vende nem reserva nada e não mostra preço nem estoque: a loja confirma disponibilidade, estado e valor de cada aparelho pelo WhatsApp.

## Conteúdo

| Seção | O que faz |
| --- | --- |
| Início | Wordmark MEGA STORE atrás do iPhone 15 Pro girando, chamada e botões para escolher ou falar no WhatsApp |
| Ponta a ponta | Tour de 4 passos (tela, câmeras, bateria, estrutura): a câmera percorre o aparelho escolhido, com pinos e linhas de cota em milímetros |
| Escolha o seu | Configurador: 7 iPhones (13 ao 15 Pro Max), cores e armazenamentos reais de cada um; girar com arraste, setas ou botões; "Perguntar por este" abre o WhatsApp com a configuração escrita |
| Watch e MacBook | Apple Watch Series 9 e MacBook Air 13" (M2) em 3D, com as cores de cada um |
| Vantagens | Parcelamento, troca, garantia, entrega e "como comprar" |
| A loja | Endereço, horários, WhatsApp, "Como chegar" e avaliações do Google |

**Minha lista:** o visitante junta vários aparelhos e envia tudo numa única mensagem de WhatsApp.

## Dados da loja

Tudo fica em `src/config/store.ts` (endereço, telefone, horários, Instagram, nota e trechos de avaliações do Google) e em `src/config/catalog.ts` (modelos, medidas oficiais, cores e armazenamentos). As condições de pagamento, troca, entrega e garantia estão marcadas no código como **a confirmar com a loja**.

## Os modelos 3D

Os aparelhos são **procedurais**, construídos em código (`src/three/devices/`), na escala real (1 unidade = 50 mm), a partir das medidas oficiais de cada modelo: corpo com bordas arredondadas, vidro traseiro brilhante, fosco ou matte conforme a geração, módulo de câmera dupla diagonal ou tripla, notch ou Dynamic Island, botão de Ação, conector Lightning ou USB-C. Watch e MacBook seguem a mesma ideia (pulseira, coroa, teclado instanciado, notch da tela). Nenhum logotipo da Apple é desenhado; o rodapé traz o aviso de marcas registradas.

## Arquitetura

| Camada | Escolha |
| --- | --- |
| App | Next.js 16 (App Router), React 19, TypeScript strict; todo o texto é HTML do servidor |
| 3D | three.js + React Three Fiber + drei (`Html`, `Line`, `Environment`/`Lightformer`, `ContactShadows`) |
| Scroll | GSAP ScrollTrigger buscando **uma timeline central** (`src/animation`) |
| Estado | Zustand (`src/store/useExperience.ts`): modelo, cor, armazenamento, lista, modo do palco, passo do tour |
| Estilo | Tailwind 4 + CSS (`src/app/globals.css`), fontes Archivo + Hanken Grotesk |

**Camadas da página:** fundo → wordmark do hero (z 0) → canvas WebGL transparente fixo (z 1) → conteúdo (z 2). Os três produtos ficam na mesma cena, distantes entre si, e a câmera viaja de um para o outro conforme o scroll.

**Quem controla o quê:** o ScrollTrigger só escreve a pose desejada (`sceneTarget`); o configurador só escreve `turntable` no store; o `CameraRig` é o único que move câmera e produtos, com amortecimento independente de FPS. Cada seção tem *marks* (posição 0–1) onde o enquadramento correspondente é atingido exatamente (`src/config/shots.ts`).

**Celular:** em telas em pé a câmera recentraliza no produto, se afasta e o eleva (`portraitLift`) para o espaço livre acima do texto; os cartões do tour ficam presos embaixo enquanto o passo correspondente está na tela, e no configurador o visualizador fica fixo no topo enquanto o painel desliza por baixo.

**Qualidade adaptativa:** tier inicial por sinais reais do aparelho (renderizador WebGL, WebGL2, núcleos, memória, `saveData`), refinado em execução pelo tempo de quadro medido. Render sob demanda (`frameloop="demand"`).

**Fallback:** sem WebGL, ou se o 3D falhar, a página mostra renders estáticos (`public/renders/*.webp`) e todo o resto continua funcionando.

## Estrutura

```
src/
├─ app/            layout (fontes, SEO/Open Graph), page, globals.css
├─ animation/      ScrollDirector, timeline central, sceneTarget
├─ components/
│  ├─ sections/    Hero, Conferido, Escolha, Mais, Vantagens, Loja (+ rodapé)
│  ├─ ui/          Options (modelo, cor, armazenamento), InterestList, WhatsAppIcon
│  ├─ layout/      Header, Logo
│  └─ Stage.tsx    canvas fixo, detecção de WebGL, fallback
├─ config/         catalog, store, shots, tour, site
├─ three/          Scene, CameraRig, Lighting, DeviceCallouts, devices/ (Phone, Watch, Laptop)
├─ store/ hooks/ lib/ types/
tests/unit         Vitest + Testing Library
tests/e2e          Playwright (desktop + mobile) contra o build estático
tests/tools        capturas de tela para revisão visual, imagem de compartilhamento (og.png)
```

## Rodar

```bash
npm install
npm run dev            # http://localhost:3000
npm run build:pages    # export estático em out/ (base /megastore-slz)
npm test               # unitários
npx playwright install chromium && npm run test:e2e
```

> Windows: não instale `node_modules` dentro de pasta do OneDrive (a sincronização trava o `npm install`).

URL params: `?webgl=0` força o fallback; `?quality=low|medium|high` força o tier.

## Deploy

GitHub Pages pelo branch `gh-pages` (conteúdo de `out/`). Na Vercel, o build padrão funciona sem mudanças.

## Testes

* Unitários (48): catálogo (medidas oficiais, hardware por geração), troca de modelo mantendo ou ajustando cor e armazenamento, lista de interesse, mensagens de WhatsApp, timeline central e marks, enquadramento no celular, texto do tour, qualidade adaptativa, componentes (teclado, configurador, lista, fallback, movimento reduzido).
* E2E (14, desktop + mobile): render 3D sem erros de console, tour, navegação, configurador → WhatsApp → lista, sem overflow horizontal, fallback sem WebGL, `prefers-reduced-motion`.

iPhone, Apple Watch, MacBook e iPad são marcas registradas da Apple Inc. Os modelos 3D deste site são representações ilustrativas.

Licença do código: MIT.
