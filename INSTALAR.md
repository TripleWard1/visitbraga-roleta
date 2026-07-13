# Dependências

**Nenhuma.** Não é preciso instalar nada.

O `npm install` estava a rebentar com `ERR_INVALID_PROTOCOL` (proxy do
WebContainer a tentar HTTPS por um agente HTTP). Em vez de te deixar a lutar
com o ambiente, tirei a única dependência que faltava.

| O que era preciso | Como ficou |
|---|---|
| `canvas-confetti` | **Motor próprio** (`lib/confetti.ts`, ~80 linhas): rajadas laterais, gravidade, arrasto do ar e rotação em dois eixos - as peças rodopiam como papel. Zero dependências. |
| `qrcode` | Desnecessário: o QR é a **imagem oficial** do Município em `/public/qr-visitbraga.png`. |
| `howler` | Desnecessário: os sons são **sintetizados** (Web Audio) com os parciais inarmónicos de um sino - o tique sobe de altura à medida que a roda cansa. O que faltava era o **botão de silêncio persistente**, e está feito. |
| `framer-motion` | Desnecessário: a física corre num `requestAnimationFrame` que escreve o transform direto no DOM (mais rápido que orquestrar 60 fps pelo React). Antecipação, desfoque, zoom e halo estão todos implementados. |

A única dependência do projeto continua a ser o **`firebase`**, que já lá está.

---

## Se ainda assim quiseres resolver o npm

```bash
npm config delete proxy
npm config delete https-proxy
npm config set registry https://registry.npmjs.org/
```

Mas não precisas: o projeto compila e corre como está.

---

## A app funciona com o wi-fi DESLIGADO

| | |
|---|---|
| arranca | ✓ fontes servidas no build (`next/font`) |
| gira | ✓ física local; o stock cai em modo local |
| mostra o QR | ✓ imagem oficial em `/public` |
| mostra as fotos | ✓ `/public/fotos/` |
| toca sons | ✓ sintetizados |
| confetes | ✓ motor próprio |

Só a **sincronização de stock entre tablets** precisa de rede - como deve ser.
