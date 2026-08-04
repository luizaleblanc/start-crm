# Start CRM — Front-end

MVP de front-end do Start CRM: Next.js 16 (App Router), TypeScript e Tailwind,
com uma camada própria de BFF (`app/api/**`) que hoje responde com dados
mockados em memória e está pronta para trocar por um back-end real (Nest.js)
via variável de ambiente, sem reescrever telas ou lógica de negócio. Decisões
arquiteturais completas, com o porquê de cada uma, em
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## O que já está implementado

- **BFF completo**: os 22 recursos CRUD e as 5 ações de CRM da API real
  (assign/stage/interactions/meetings em leads, close em deals), autenticação
  mock via token assinado, tudo em `app/api/**`.
- **Design System**: tokens extraídos do Figma (cores, tipografia Manrope),
  biblioteca de componentes em `src/shared/ui/` (Button, Input, Select, Card,
  Table, Modal, gráfico de pizza), sem nenhuma dependência de UI de terceiros.
- **Telas do MVP**: Login, Dashboard, Leads (lista, filtros, Kanban por
  estágio do funil com indicador de temperatura do lead, detalhe com
  interações/reuniões) e Pipeline de Negócios.
- **Toggle de tema** claro/escuro, com preferência salva no navegador.
- **Preparação para o back-end real**: `HttpRepository` e o switch
  `API_MODE=mock|real` já implementados (não testados contra uma API real —
  nenhuma está disponível neste repositório).

## Requisitos

- Node.js >= 20.9 (usado localmente: v24)
- npm

## Setup local

```bash
cp .env.example .env
npm install
npm run dev
```

Acesse http://localhost:3000 — vai redirecionar para `/login`. Use as
credenciais do seed mock:

```
E-mail:  admin@startcrm.local
Senha:   ChangeMe123!
```

## Variáveis de ambiente

Ver `.env.example` para a lista completa. As mais relevantes:

| Variável           | Papel                                                                                                                                       |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `API_MODE`         | `mock` (padrão) ou `real`. Troca a implementação por trás de cada endpoint do BFF.                                                          |
| `AUTH_MOCK_SECRET` | Segredo usado para assinar o token de sessão quando `API_MODE=mock`. **Obrigatório** — sem ele, login e rotas protegidas falham em runtime. |
| `NEST_API_URL`     | Base URL do back-end Nest.js real, usada só quando `API_MODE=real`.                                                                         |

## Scripts

| Script              | Descrição                          |
| ------------------- | ---------------------------------- |
| `npm run dev`       | Servidor de desenvolvimento        |
| `npm run build`     | Build de produção                  |
| `npm run start`     | Sobe o build de produção           |
| `npm run lint`      | ESLint                             |
| `npm run format`    | Prettier (write)                   |
| `npm run typecheck` | Checagem de tipos (`tsc --noEmit`) |

## Docker

```bash
docker compose up --build
```

Sobe o serviço `web` em http://localhost:3000, usando o mesmo `.env` da raiz
do projeto.

## Deploy no Vercel

Projeto Next.js padrão, sem configuração extra necessária no `vercel.json` —
o `output: "standalone"` do `next.config.ts` é para a imagem Docker e não
interfere no build do Vercel. Antes do primeiro deploy, configure em
**Project Settings → Environment Variables**:

```
API_MODE=mock
AUTH_MOCK_SECRET=<um segredo qualquer, só para assinar o token do mock>
```

Sem `AUTH_MOCK_SECRET`, o build continua passando normalmente (a variável só
é lida em runtime, dentro dos Route Handlers), mas login e qualquer chamada
autenticada retornam erro 500 assim que alguém tentar usar o app.

## Commits

Este projeto usa [Conventional Commits](https://www.conventionalcommits.org/),
validados via Husky + commitlint no hook `commit-msg`. O `pre-commit` roda
lint e format apenas nos arquivos staged (lint-staged).
