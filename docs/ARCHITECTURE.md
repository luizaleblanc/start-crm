# Start CRM — Relatório de Decisões Arquiteturais

> Documento vivo. Cada fase do roadmap adiciona uma seção com as decisões
> tomadas naquele momento, o porquê e as alternativas descartadas.
> Repositório: front-end isolado — https://github.com/luizaleblanc/start-crm

## Premissas do produto

- MVP de front-end para um produto comercial (Start CRM).
- O back-end (Nest.js + Python) é construído em outro(s) repositório(s),
  fora do escopo e do controle deste projeto.
- **Nenhuma comunicação direta** deste front-end com o back-end externo ou
  com qualquer banco de dados. Toda saída de dados passa por uma camada
  própria (BFF) hospedada neste mesmo repositório.
- Arquitetura preparada para trocar "mock" por "real" sem reescrever
  regras de negócio, componentes ou telas.

---

## Fase 1 — Setup e Configuração Base

### 1. Framework: Next.js 16 (App Router), React 19, TypeScript

**Decisão:** Next.js na versão estável mais recente disponível no momento
do setup (16.2.12), com App Router, Server/Client Components e
`output: "standalone"` para builds de produção enxutos em container.

**Por quê:**

- App Router é o modelo atual recomendado pela própria Next.js, com
  suporte nativo a Server Components — reduz JS enviado ao client e se
  encaixa bem no papel de BFF (Route Handlers vivem na mesma árvore de
  rotas).
- Optou-se pela versão estável mais recente (16.x) em vez de fixar em
  15.x: durante a instalação, a linha 15 ainda carregava uma dependência
  transitiva de `sharp` vulnerável (CVEs de libvips) mesmo na última
  patch de backport. Como o projeto está começando do zero, não há custo
  de migração a pagar — faz sentido entrar já na versão com a superfície
  de vulnerabilidades resolvida.
- `output: "standalone"` gera um bundle mínimo de servidor Node, ideal
  para a imagem Docker de produção (Fase 1, seção Docker).

**Alternativas descartadas:**

- Pages Router: legado, sem Server Components, pior fit para BFF.
- Vite/CRA + backend separado explícito: perderíamos o Route Handlers
  do Next.js, que é justamente o mecanismo usado para o padrão BFF.

### 2. Gerenciamento de dependências vulneráveis

**Decisão:** uso de `overrides` no `package.json` para forçar
`sharp@0.35.3` e `postcss@^8.5.6`, resolvendo os CVEs de dependências
transitivas do próprio Next.js sem precisar aguardar um novo release.

**Por quê:** `npm audit fix --force` sugeria downgrade para `next@9.3.3`
(uma resolução automática incorreta/absurda do algoritmo de audit).
Como as bibliotecas vulneráveis (`sharp`, `postcss`) são compatíveis com
versões mais novas e nenhuma delas quebra a API usada pelo Next.js aqui,
o override é a correção correta e cirúrgica. Resultado: `npm audit`
reporta 0 vulnerabilidades.

### 3. Estilização: Tailwind CSS

**Decisão:** Tailwind CSS 3.x com tokens de cor mapeados via CSS
Custom Properties (`--background`, `--foreground`, `--muted-foreground`)
em vez de cores fixas no `tailwind.config`.

**Por quê:**

- Indireção via CSS variables permite trocar os valores reais extraídos
  do Design System (Figma) na Fase 3 sem tocar em nenhum componente que
  já use as classes utilitárias (`bg-background`, `text-foreground`).
- Os valores atuais em `globals.css` são neutros/placeholder — servem
  apenas para as Fases 1 e 2 não ficarem bloqueadas esperando a extração
  final dos tokens.
- `prettier-plugin-tailwindcss` já configurado para manter as classes
  ordenadas de forma determinística nos commits.

### 4. Qualidade de código: ESLint + Prettier

**Decisão:** ESLint (flat config, `eslint.config.mjs`) consumindo
diretamente o array de configuração nativo exportado por
`eslint-config-next` (que já inclui `core-web-vitals` e regras de
TypeScript), mais `eslint-config-prettier` por cima para desligar regras
de formatação que conflitariam com o Prettier. Prettier com
`printWidth: 100` e aspas duplas.

**Por quê:** a partir da versão do Next.js usada aqui, `eslint-config-next`
já publica configuração flat nativa (um array de objetos), não mais o
formato legado `.eslintrc`. Usar `FlatCompat` (padrão em scaffolds mais
antigos de `create-next-app`) para "traduzir" uma config que já é flat
gera erro (`Converting circular structure to JSON`) por wrapping duplo
dos plugins. A correção foi importar a config diretamente. `core-web-vitals`
cobre boas práticas específicas de Next.js (Image, Link, hooks) que um
ESLint genérico não cobriria; separar formatação (Prettier) de
qualidade/lint (ESLint) evita regras duplicadas ou conflitantes.

### 5. Automação de commits: Husky + lint-staged + commitlint

**Decisão:**

- `pre-commit` → `lint-staged` (ESLint --fix + Prettier apenas nos
  arquivos staged, não no projeto inteiro — commits rápidos).
- `commit-msg` → `commitlint` com `@commitlint/config-conventional`
  (Conventional Commits: `feat:`, `fix:`, `chore:`, etc.).

**Por quê:** O processo de trabalho definido para este projeto exige
commits parciais e revisáveis a cada etapa. Conventional Commits dá
padronização à mensagem e viabiliza, no futuro, geração automática de
changelog e versionamento semântico.

### 6. Containerização: Docker multi-stage

**Decisão:** `Dockerfile` em 3 estágios (`deps` → `builder` → `runner`),
usando `node:22-alpine`, usuário não-root (`nextjs`) e o output
`standalone` do Next.js. `docker-compose.yml` com um serviço `web` e uma
rede nomeada (`start-crm-net`) já isolada, pronta para receber os
serviços de back-end no futuro (seja neste mesmo compose, seja via rede
Docker externa apontando para os containers do repositório do
Nest.js/Python).

**Por quê:**

- Multi-stage mantém a imagem final pequena (só `node_modules` de
  produção via `standalone`, sem toolchain de build).
- Usuário não-root é prática básica de segurança de container.
- A rede nomeada já documenta a intenção de integração futura sem
  acoplar este repositório ao código do back-end.

### 7. Variáveis de ambiente e o contrato do BFF

**Decisão:** `.env.example` define:

```
API_MODE=mock            # ou "real"
NEST_API_URL=...
PYTHON_API_URL=...
API_TIMEOUT_MS=5000
```

Nenhuma dessas variáveis usa o prefixo `NEXT_PUBLIC_` — são lidas
**apenas** dentro de Route Handlers (`app/api/**`), que rodam no
servidor. O client (browser) nunca tem acesso a URLs, tokens ou
qualquer detalhe do back-end real.

**Por quê — e como isso implementa a exigência de padrão BFF:**
O requisito era "o front-end terá endpoints próprios, preparados para
receber Nest.js e Python, mas sem comunicação direta com back-end e
banco de dados". A tradução arquitetural disso é: Server/Client
Components e hooks do React **nunca** chamam `NEST_API_URL` ou
`PYTHON_API_URL` diretamente — eles chamam sempre um endpoint interno
(`/api/leads`, `/api/contacts`, etc.). Esse Route Handler é o único
lugar do repositório que, quando `API_MODE=real`, saberá que o backend
existe e fará a chamada HTTP para ele. Enquanto isso não acontece
(`API_MODE=mock`), o mesmo Route Handler responde com fixtures
internas. Repositórios, use cases e componentes de UI não distinguem
os dois modos — essa decisão é o que garante a troca futura sem
retrabalho. A estruturação de pastas que materializa isso
(`domain/application/infrastructure` por módulo, repositórios que
conversam só com `/api/*`) será implementada e documentada na Fase 2.

---

## Fase 2 — Estruturação Arquitetural e Mock da API

### Contexto: espelhando a API real (Start CRM API / NestJS)

O time de back-end forneceu a especificação da API real: NestJS +
TypeORM + PostgreSQL, multi-tenant, RBAC, funil comercial, auditoria e
billing interno, com 22 recursos CRUD e 5 ações de CRM explícitas
(`assign`, `stage`, `interactions`, `meetings` em `/crm/leads/:leadId`,
e `close` em `/crm/deals/:negocioId`). A decisão central da Fase 2 foi:
**os Route Handlers do Next.js reproduzem esse contrato 1:1** — mesmos
paths, mesmos verbos HTTP, mesmo formato de resposta — só que hoje
respondem com dados em memória em vez de consultar o Postgres via
Nest.js. Isso significa que qualquer tela construída na Fase 4 contra
`/api/leads`, `/api/deals` etc. já está, por construção, integrada com
o contrato real; na Fase 5 só o _interior_ de cada Route Handler muda.

### 1. Onde vive o "mock": dentro do BFF, não numa lib externa

**Decisão:** o mock não usa MSW, nem fixtures hard-coded nos
componentes — ele é o próprio corpo dos Route Handlers (`app/api/**`),
respaldado por repositórios em memória seedados na inicialização do
processo Node.

**Por quê:** com o mock vivendo na mesma camada que futuramente fará a
chamada real, não existe um "modo mock" e um "modo real" com código
diferente na parte que interessa (regras de negócio, formato de
resposta). Trocar de mock para real é trocar a implementação interna
de uma função, não reescrever a aplicação. Ferramentas como MSW
resolveriam um problema que não temos aqui (interceptar chamadas de
rede do client) — o client nunca fala com o back-end real de qualquer
forma, então o ponto de interceptação natural já é o Route Handler.

### 2. Sem dependências novas

**Decisão:** toda a Fase 2 foi construída só com o que já estava no
`package.json` da Fase 1, mais o módulo `crypto` nativo do Node (para
gerar UUIDs e assinar o token mock via HMAC-SHA256). Nenhuma lib de
validação (zod/yup), nenhuma lib de JWT (`jsonwebtoken`/`jose`),
nenhuma lib de mock de rede (MSW) e nenhuma lib de query/cache
(TanStack Query — adiada para a Fase 4, quando efetivamente houver
componentes consumindo os endpoints; instalar antes disso seria
dependência sem uso real no repositório).

**Por quê:** pedido explícito de manter o projeto livre de dependências
pesadas. Um HMAC assinado com `crypto.createHmac` é suficiente para o
propósito de um token de desenvolvimento local — ele não protege nada
de verdade (é descartado inteiramente na Fase 5, quando o JWT real do
Nest.js assume esse papel), então não há ganho em trazer uma lib de
JWT completa só para o ambiente mock.

### 3. Kernel compartilhado (`src/shared/`)

- `domain/pagination.ts`, `domain/base-entity.ts` — contratos comuns
  (`Identifiable`, `Timestamps`, `SoftDeletable`, `PaginatedResult`).
- `infrastructure/mock/in-memory-repository.ts` — uma classe genérica
  `InMemoryRepository<T>` com `list/findById/create/update/delete`,
  parametrizável por `softDelete`. É o único lugar que sabe como
  paginar, gerar timestamps e decidir entre delete lógico e físico.
- `infrastructure/http/crud-route-factory.ts` — `createCollectionRoute`
  e `createItemRoute`, que a partir de **qualquer** `InMemoryRepository`
  produzem os handlers `GET/POST` e `GET/PATCH/DELETE` já protegidos
  por autenticação, com tratamento de erro e paginação embutidos.
- `infrastructure/http/handle-route.ts` + `api-error.ts` — wrapper que
  captura `ApiError` e converte em resposta HTTP padronizada
  (`{ statusCode, message }`), evitando `try/catch` repetido em cada
  handler.
- `infrastructure/auth/token.ts` + `require-auth.ts` — assinatura e
  verificação do token mock, e o guard usado por todo endpoint
  protegido.

Essa camada é o motivo de os 22 recursos CRUD terem sido implementados
sem 22 implementações divergentes de paginação, erro ou autenticação:
cada rota gerada é literalmente `createCollectionRoute(repositorio)` /
`createItemRoute(repositorio)`.

### 4. Organização por módulo (`src/modules/`)

Os 22 recursos do schema foram agrupados em 6 contextos, e não em 22
pastas isoladas (diferente da convenção `src/modules/{domain}/{entity}`
usada no repositório do NestJS, que faz sentido lá por causa de
TypeORM/migrations por entidade — aqui, no front-end, o mock é só
tipo + array em memória, então 22 pastas seriam estrutura sem
conteúdo):

| Contexto        | Recursos                                                                           |
| --------------- | ---------------------------------------------------------------------------------- |
| `iam`           | organizations, users, roles, permissions, role-permissions, user-roles             |
| `crm`           | sources, funnel-stages, leads, lead-ownerships, lead-interactions, meetings, deals |
| `people`        | user-absences                                                                      |
| `notifications` | notifications                                                                      |
| `billing`       | plans, plan-features, subscriptions, invoices, payments, plan-usages               |
| `audit`         | audit-logs                                                                         |

Cada contexto tem `domain/entities.ts` (os tipos), `infrastructure/seed.ts`
(dados iniciais) e `infrastructure/repositories.ts` (as instâncias de
`InMemoryRepository`). Só `crm` tem uma pasta `application/` — é o
único contexto com regras de negócio reais no MVP (as 5 ações de CRM);
os demais são CRUD puro, então uma camada de use cases ali seria
abstração sem função (regra de "não adicionar indireção que nada usa").

### 5. Decisão assumida e a validar: quais recursos usam `ativo`

O enunciado da API real diz "recursos com `ativo` usam delete lógico,
os demais delete físico", mas não lista quais são quais. Assumi, para
poder avançar:

- **Delete lógico (`ativo`):** organizations, users, roles,
  permissions, sources, funnel-stages, leads, plans, plan-features —
  são dados de cadastro/catálogo ou o próprio lead (perder histórico
  comercial ao apagar de verdade seria ruim para um CRM).
- **Delete físico:** role-permissions, user-roles, lead-ownerships,
  lead-interactions, meetings, deals, user-absences, notifications,
  subscriptions, invoices, payments, plan-usages, audit-logs — são
  tabelas de associação ou eventos/transações.

**Isso precisa ser confirmado contra o schema real do Postgres na Fase
5** — é uma suposição documentada, não um fato confirmado pelo
back-end.

### 6. Multi-tenancy e RBAC no mock

Todo registro de negócio carrega `organizationId` (a seed usa uma única
organização, `org_1`). RBAC está modelado (`roles`, `permissions`,
`role-permissions`, `user-roles`) mas **não é aplicado** nas
autorizações do mock — o guard de autenticação (`requireAuth`) só
verifica se existe um token válido, não se o usuário tem a permissão
específica para a ação. Autorização granular por permissão é
responsabilidade do back-end real (é ele quem tem a fonte da verdade de
papéis); replicar essa lógica no mock seria trabalho descartável.

### 7. Autenticação mock

`POST /api/auth/login` aceita `admin@startcrm.local` /
`ChangeMe123!` (as credenciais do seed do backend real, conforme o
README da API) e devolve um token HMAC-assinado com 1h de validade.
Todo recurso protegido (todos, exceto `/api/health` e
`/api/auth/login`) exige `Authorization: Bearer <token>`; sem isso,
`401`. O segredo de assinatura vem de `AUTH_MOCK_SECRET` no `.env` —
puramente de desenvolvimento, sem uso de Argon2 (a senha do mock é
comparada em texto puro; a real, no NestJS, é hasheada — isso não é
replicado aqui porque o mock nunca guarda uma senha real).

### 8. Testado manualmente

Validado com o servidor de desenvolvimento rodando: `POST /auth/login`
com credenciais erradas (401), login correto (200 + token), acesso sem
token a um recurso protegido (401), acesso com token (200 + paginação),
`PATCH /crm/leads/:id/stage` e `PATCH /crm/deals/:id/close` alterando
estado de verdade nos repositórios em memória, e 404 de negócio ao
tentar agir sobre um lead inexistente.

---

## Fase 3 — Integração do Design System

### 1. O Figma não tinha specs de componentes — só identidade visual

**Achado:** o arquivo do Figma fornecido (`System Design — Star CRM`)
contém uma única página, com um frame de showcase de marca: lockups do
logo, paleta de cores, escala tipográfica e o app icon. Não existe
nenhum componente de interface desenhado (sem Button, Input, Select,
Card, Modal, Table). Confirmado via `get_metadata` (estrutura completa
da página) antes de assumir que havia mais conteúdo.

**Decisão:** com a aprovação do usuário, os componentes base foram
desenhados por mim, usando como fundação os tokens reais extraídos do
Figma (cores e tipografia) — não são um chute visual, mas também não
são a tradução 1:1 de um componente já especificado, porque esse
componente não existia no arquivo de origem.

### 2. Tokens extraídos (via `get_design_context` nos nós de paleta/tipografia)

Paleta oficial:

| Token           | Hex       | Uso                 |
| --------------- | --------- | ------------------- |
| Ink             | `#16161C` | marca / texto forte |
| Paper           | `#F6F5F8` | fundo claro         |
| Azul Meia-noite | `#193073` | fundo escuro        |
| Kennedy         | `#6D88DF` | acento primário     |
| Azul Escuro     | `#2A4EBC` | acento secundário   |

Cores auxiliares (vistas no código gerado a partir dos nós reais, não
nomeadas na paleta oficial mas usadas de fato no mock da marca):
`#1C1B22` (texto primário), `#6A6678` (texto secundário/corpo),
`#9B97A6` (texto terciário), `#BDB9C8` (texto quaternário/legendas),
`#EFEDF2` (borda), `#159A6B` (positivo, visto no indicador "+18,4%").

Tipografia: família **Manrope**, pesos 400/500/600/700. Escala de
títulos documentada no Figma (H1 48px/700 até H6 13px/700 caixa-alta)
e escala de conteúdo (Display 56, Título 32, Subtítulo 20, Corpo 15,
Mono 15, Legenda 12).

### 3. De HSL-placeholder para hex nomeado por variável CSS

**Decisão:** o `globals.css` da Fase 1 usava um esquema de 3 variáveis
HSL genéricas (`--background`, `--foreground`, `--muted-foreground`).
Na Fase 3 isso foi substituído por variáveis CSS em hex direto
(`--color-ink`, `--color-paper`, `--color-kennedy` etc.) mais um
segundo nível de variáveis **semânticas** (`--background`,
`--foreground`, `--primary`, `--border`...) que apontam para as
variáveis de marca. `tailwind.config.ts` consome só a camada semântica.

**Por quê:** converter os 5+ hex reais do Figma para HSL manualmente é
fonte de erro de arredondamento sem ganho nenhum — `var(--x)` aceita
hex diretamente, e o Tailwind não exige o formato `hsl()`. A separação
em duas camadas (marca → semântica) é o que permite trocar o tema
(ex: dark mode) sem tocar nos componentes: no dark mode, `--background`
passa a apontar para `--color-midnight` (o "fundo escuro" oficial da
paleta) em vez de `--color-paper`, mas o componente continua só usando
`bg-background`.

**Assunção documentada:** o Figma não define uma paleta dark-mode
completa (só o par claro/escuro de fundo). Cor de borda no dark mode
(`rgb(255 255 255 / 12%)`) e o mapeamento de texto terciário como
`muted-foreground` no dark mode são escolhas minhas, não extraídas do
arquivo — a revisitar se o Figma ganhar telas em dark mode no futuro.

### 4. Fonte via `next/font/google`, não `<link>` externo

**Decisão:** Manrope carregada com `next/font/google` no
`RootLayout`, expondo `--font-manrope` como CSS variable consumida
pelo Tailwind (`fontFamily.sans`).

**Por quê:** `next/font` faz self-hosting automático do arquivo de
fonte no build (sem requisição em runtime para o Google Fonts, sem
layout shift por FOUT/FOIT mal tratado) — é a prática recomendada pelo
próprio Next.js e não introduz nenhuma dependência nova (`next/font`
já vem com o framework).

### 5. Sem biblioteca de componentes de terceiros

**Decisão:** nenhum Radix UI, shadcn/ui, Headless UI ou similar foi
adicionado. Os 7 componentes pedidos no roadmap (Button, Input, Select,
Badge, Card, Table, Modal) mais o layout (Sidebar/Topbar/AppShell)
foram escritos à mão em `src/shared/ui/`.

**Por quê:** os componentes em si são simples o bastante (sem
necessidade de floating UI, portais complexos ou animações) para não
justificarem uma dependência. O único caso que normalmente pede uma
lib (Modal/Dialog, por acessibilidade — foco preso, ESC, fechar no
backdrop) foi resolvido com o elemento nativo `<dialog>` do HTML, que
já entrega isso de graça nos navegadores modernos. Resultado: zero
dependências novas em `package.json` desde a Fase 1.

O composer de classes (`cn()`) também foi escrito à mão (~15 linhas)
em vez de instalar `clsx` + `tailwind-merge` — o projeto ainda não tem
nenhum caso de conflito de classes Tailwind que o `tailwind-merge`
resolveria (className sempre é o último argumento e vence por ordem no
DOM), então adicionar a lib seria dependência sem problema real para
resolver ainda.

### 6. Estrutura: `src/shared/ui/`

Componentes vivem em `src/shared/ui/` (não em `src/modules/`) porque
são reutilizáveis por qualquer módulo de feature — não pertencem a
nenhum domínio de negócio específico. `layout/` é uma subpasta com o
`AppShell`, `Sidebar` e `Topbar`. Uma página de showcase em
`/dev/components` (`src/app/dev/components/page.tsx`) existe para
visualizar todos os componentes juntos durante o desenvolvimento — não
faz parte do produto final, é uma ferramenta interna de QA visual.

### 7. Validação

Lint, typecheck e build limpos. A página de showcase foi verificada via
`curl` (SSR retornando as seções esperadas) — não foi possível tirar um
screenshot real porque este ambiente Windows não tem uma ferramenta de
automação de navegador (Playwright/chromium-cli) instalada. Recomendo
conferir visualmente com `npm run dev` antes de aprovar o commit.

---

## Próximas fases (a documentar quando executadas)

- **Fase 4:** telas do MVP, introdução do TanStack Query para consumir
  os endpoints construídos na Fase 2, usando os componentes da Fase 3.
- **Fase 5:** troca de `API_MODE=mock` para `real` — os Route Handlers
  passam a fazer `fetch` para `NEST_API_URL`/`PYTHON_API_URL` em vez de
  consultar os repositórios em memória; validação da suposição de
  delete lógico x físico (Fase 2, seção 5) contra o schema real.
