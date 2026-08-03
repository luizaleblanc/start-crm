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

## Próximas fases (a documentar quando executadas)

- **Fase 2:** Clean Architecture por módulo, contrato dos Route Handlers
  (BFF), estratégia de fixtures/mocks internos, TanStack Query.
- **Fase 3:** extração dos tokens reais do Figma, biblioteca de
  componentes.
- **Fase 4:** telas do MVP.
- **Fase 5:** troca de `API_MODE=mock` para `real`, client HTTP dos
  Route Handlers em direção ao Nest.js/Python.
