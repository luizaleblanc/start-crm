# Start CRM — Front-end

MVP de front-end do Start CRM, construído em Next.js (App Router) com
arquitetura preparada para consumir, no futuro, um back-end externo em
Nest.js/Python via padrão BFF. Decisões arquiteturais completas em
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Requisitos

- Node.js >= 20.9 (usado localmente: v24)
- npm

## Setup local

```bash
cp .env.example .env
npm install
npm run dev
```

Acesse http://localhost:3000.

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

Sobe o serviço `web` em http://localhost:3000, usando o mesmo
`.env` da raiz do projeto.

## Commits

Este projeto usa [Conventional Commits](https://www.conventionalcommits.org/),
validados via Husky + commitlint no hook `commit-msg`. O `pre-commit`
roda lint e format apenas nos arquivos staged (lint-staged).
