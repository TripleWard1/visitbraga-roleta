# Roda da Sorte Visit Braga — Feiras Internacionais

Webapp de roleta de prémios para o stand Visit Braga em feiras internacionais
de turismo (Fitur, WTM, B-Travel, …). Trilingue (PT/ES/EN), com stock em tempo
real por feira, modo montra, curiosidades de Braga durante o giro, QR code e
confirmação de entrega pelo staff.

## Identidade visual — "Zigzag Braga"

Branco luminoso + vermelho Visit Braga (#FE0000) + preto; zero dourado. A
geometria vem do escadório do Bom Jesus: o aro da roleta é um anel em
zigzag, o chão do ecrã é uma faixa zigzag vermelha onde o Bracvs assenta
(com sombra própria; respira em repouso e festeja durante o giro). O
**sino oficial da marca** (o primeiro "A" de BRAGA no logótipo) está no
cubo da roleta, no ponteiro, no bilhete, na marca de água e no favicon.
Tipografia: Archivo Black (display) + Inter (corpo). O modo montra é a
direção "Vermelho Total": ecrã vermelho pleno com sino branco a badalar
e CTA trilingue. Cores e afinações em variáveis no topo de
`app/globals.css`.

## Arranque no StackBlitz

1. Cria um projeto Next.js (App Router + TypeScript) no StackBlitz
2. Substitui/copia as pastas `app/`, `components/`, `lib/` e `public/`
3. Instala a única dependência extra: `npm install firebase`
4. Já funciona em **modo local** (stock em memória) — ideal para testar

## Configurar o Firebase (stock partilhado entre dispositivos)

1. [console.firebase.google.com](https://console.firebase.google.com) →
   Adicionar projeto (ex.: `roleta-feiras`) — **projeto novo**, separado do
   Braga Day, para os dados não se misturarem
2. Build → **Firestore Database** → Criar base de dados
3. Adicionar app Web (ícone `</>`), copiar o `firebaseConfig` para
   `lib/firebase.ts` e mudar `firebaseAtivo` para `true`
4. Firestore → Regras → publicar:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /roletas/{documento} {
      allow read, write: if true;
    }
  }
}
```

> Nota: regras abertas + PIN na app travam curiosos, mas não são segurança
> a sério. Para os dias de feira chega; se a app ficar online em permanência,
> considerar Firebase Auth.

## Preparar uma nova feira (checklist)

1. `lib/config.ts` → mudar `FEIRA_ID` (ex.: `"fitur-2027"`) e `FEIRA_NOME`
   — isto cria documentos novos no Firestore; os stocks nunca se misturam
2. `lib/config.ts` → **`IDIOMA_POR_OMISSAO`**: o idioma DA FEIRA (`"es"` na
   Fitur, `"en"` na WTM, `"pt"` cá dentro). Sem isto, o tablet do Município
   arranca em português... em Madrid. É também o idioma para onde a app
   regressa sozinha entre visitantes
3. `lib/premios.ts` → prémios e stock inicial (3 línguas). Marca **um** com
   `destaque: true` — o prémio-herói que cria fila (ex.: uma experiência)
4. `lib/config.ts` → `QR_URL`. **Usa UTM** para medires o retorno da feira no
   portal: `https://www.visitbraga.travel/?utm_source=fitur2027&utm_medium=roleta&utm_campaign=stand`
5. `lib/selos.ts` → rever os selos de destino (só factos verificáveis)
6. Fazer deploy e abrir `/admin` → "Repor stock inicial" + "Zerar estatísticas"
7. No tablet: instalar a app no ecrã inicial (menu → "Adicionar ao ecrã
   principal") para correr sem barra de browser; confirmar o som e um giro

## No dia da feira (equipa do stand)

- `/admin` mostra sempre o **estado da ligação**: verde = stock sincronizado
  entre tablets; vermelho = sem rede ou modo local (o jogo continua, mas o
  stock desse tablet é independente)
- Stock baixo (≤5) aparece assinalado a vermelho na tabela
- No fim: `/admin` → **"Copiar relatório"** devolve interações, taxa de
  prémio, taxa de entrega e mercados de origem, pronto a colar num email

## Fotografia do destino

Três fotos oficiais integradas por URL (`lib/fotos.ts`): Bom Jesus, Sé e
Museu D. Diogo de Sousa. Não vivem em `/public` (o StackBlitz tem limite
de espaço) — e assim trocá-las entre feiras não obriga a novo deploy.

Se a rede falhar, a app deteta e volta sozinha à versão gráfica: nunca
aparece imagem partida no stand. **A prazo, aloja-as no portal Visit
Braga** em vez do imgur (serviço de terceiros, sem garantias).

Entram em dois sítios, sempre tingidas de vermelho da marca ou
emolduradas — nunca a cores cruas a competir com a identidade:

- **Modo montra**: slideshow em duotone vermelho com Ken Burns lento e a
  legenda do local no idioma ativo
- **Ecrã de derrota**: uma foto ao acaso como CONVITE — "não ganhaste,
  mas Braga fica à tua espera". É o melhor momento da app para vender o
  destino: a pessoa está parada, sem prémio, a olhar para o ecrã

Para trocar/acrescentar: mete os JPG em `public/fotos/` e edita
`lib/fotos.ts`. Pôr `FOTOS_ATIVAS = false` volta à versão gráfica.

## Ecrã sempre aceso

A app usa a Screen Wake Lock API para impedir que o tablet adormeça durante
a feira. Em iPad/Safari o suporte é irregular — no tablet do stand, põe
também **Bloqueio automático: Nunca** nas definições do sistema.

## Estrutura

```
app/page.tsx                  página principal (idioma + modo montra)
app/admin/page.tsx            gestão de stock e estatísticas (PIN)
app/globals.css               toda a identidade visual (variáveis no topo)
components/Roleta.tsx         roda, física, sons, sorteio + reserva
components/CartaoResultado.tsx bilhete com QR e confirmação de entrega
components/PerguntaOrigem.tsx pergunta-relâmpago "De onde nos visitas?"
components/ModoMontra.tsx     attract mode após inatividade
components/ContadorPremios.tsx contador público de entregas
lib/config.ts                 ⚙️ tudo o que muda por feira
lib/premios.ts                ⚙️ prémios (placeholders trilingues)
lib/factos.ts                 curiosidades de Braga (3 línguas)
lib/i18n.ts                   traduções PT/ES/EN + deteção do browser
lib/stock.ts                  Firestore: stock, transações, estatísticas
lib/firebase.ts               ⚙️ configuração do projeto Firebase
```

## Notas técnicas

- **Stock congelado durante o giro** — as fatias só ficam cinzentas quando a
  roleta para, para não denunciar o resultado (lição do Braga Day)
- **Reserva por transação** Firestore antes da animação: dois dispositivos
  nunca entregam a mesma última unidade
- **Fallback local** automático se o wi-fi da feira falhar
- **Sem `next/image`** (dá problemas no StackBlitz) e **sem `for...of` sobre
  Set/Map** (o tsconfig do template usa target es5)
- QR gerado via `api.qrserver.com` (sem dependências); o URL escrito por
  baixo garante que a informação chega mesmo sem rede
- Deploy: Vercel (importar o repositório/projeto do StackBlitz)
