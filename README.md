# Agendou! — Projeto Interdisciplinar DSM 2026/2

Sistema multiplataforma de agendamento de serviços, desenvolvido pelo Grupo 08 do Projeto Interdisciplinar do 6º semestre de DSM (2026/2).

**Integrantes:** Hugo Castro e Pablo Miguel.

O projeto reúne uma aplicação web e um app móvel Expo, conectados a uma API REST e a um banco PostgreSQL. Clientes podem consultar serviços e solicitar horários; prestadores podem acompanhar seus agendamentos.

## Executar a aplicação integrada (Docker)

Pré-requisitos: Docker Desktop com Docker Compose e Node.js 20+ (para executar os builds locais).

1. Na raiz do repositório, crie `.env` a partir de `.env.example`.
2. Troque `JWT_SECRET` por um valor aleatório de pelo menos 32 caracteres antes de iniciar. Por exemplo, gere com `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` e cole no `.env`. Não publique `.env` nem reutilize essa chave em produção.
3. Inicie os serviços:

   ```powershell
   docker compose up --build
   ```

4. Acesse:
   - Aplicação web: `http://localhost:8080`
   - API e health check (inclui PostgreSQL): `http://localhost:3000/health`
   - Documentação interativa OpenAPI: `http://localhost:3000/api-docs`

O primeiro início do PostgreSQL cria as tabelas e carrega dados fictícios de desenvolvimento. Contas locais:

| Perfil | E-mail | Senha |
|---|---|---|
| Cliente | `cliente@exemplo.com` | `Agendou2026!` |
| Prestador | `prestador@exemplo.com` | `Agendou2026!` |
| Administrador | `admin@agendou.com` | `Agendou2026!` |

Essas contas são somente para demonstração local; nunca as utilize em uma implantação pública. O SQL de seed de demonstração está separado do schema de produção em [`docs/seed.dev.sql`](docs/seed.dev.sql).

O script de inicialização do Postgres só roda quando o volume `pgdata` é criado pela primeira vez. Se já havia um volume antes deste schema, aplique a migração manualmente com backup prévio. Para apagar dados locais e recriar a base, use `docker compose down -v` **somente se tiver certeza de que os dados nesse volume podem ser descartados**.

## Executar em desenvolvimento sem o container de front-end

O modo simples recomendado é executar Postgres e API pelo Compose e Vite localmente:

```powershell
docker compose up --build postgres backend
cd frontend
npm ci
npm run dev
```

O Vite encaminha `/api` para `localhost:3000`. Para executar a API fora do Docker, instale as dependências em `backend`, copie `backend/.env.example` para `backend/.env`, configure uma `JWT_SECRET` segura e uma `DATABASE_URL` acessível, aplique [`docs/schema.sql`](docs/schema.sql) e inicie com `npm run dev`.

### Preparar PostgreSQL instalado no Windows sem Docker

Com o serviço PostgreSQL iniciado, abra o PowerShell na raiz do repositório e rode:

```powershell
.\scripts\setup-database.ps1
```

O script localiza o `psql.exe` no `PATH` ou em `C:\Program Files\PostgreSQL`, cria o banco `agendou_db` se ainda não existir e executa o schema e os dados locais de demonstração. Informe a senha do usuário `postgres` quando o `psql` solicitar. O script não remove nem recria bancos existentes; o seed é destinado somente a desenvolvimento.

Se o PostgreSQL foi instalado em outro diretório ou usa outra porta/usuário, os parâmetros podem ser informados:

```powershell
.\scripts\setup-database.ps1 -Username meu_usuario -Port 5433 -PsqlPath "C:\caminho\PostgreSQL\bin\psql.exe"
```

Depois copie `backend\.env.example` para `backend\.env` e ajuste `DATABASE_URL` com o usuário, senha e porta da instalação local. Em seguida, inicie a API e o front-end nos terminais separados, conforme acima. Se o instalador não incluiu o `psql.exe`, adicione o componente **Command Line Tools** pelo instalador do PostgreSQL ou informe o caminho correto com `-PsqlPath`.

## Aplicativo móvel (Expo)

O app em [`mobile/`](mobile/) usa React Native e Expo Go e consome a mesma API que o site. Para executá-lo, inicie o PostgreSQL e a API, configure `mobile\.env` com o endereço da API acessível pelo dispositivo e siga o guia em [`mobile/README.md`](mobile/README.md). O app inclui login, catálogo, consulta de horários, agendamento e histórico. Para publicação, configure uma API com HTTPS e prepare um build da plataforma.

## Funcionalidades e rotas

- Autenticação de cliente/prestador/admin com senhas bcrypt, JWT com expiração e autorização por papel.
- CRUD de serviços e configuração semanal de jornada.
- Consulta de horários e bloqueio concorrente de reservas por prestador no PostgreSQL.
- Atualização de status e avaliação somente de atendimento concluído.
- Classificação de sentimento em tempo real pelo módulo TypeScript do backend.
- Interface React para catálogo, agendamento, dashboard, login/cadastro e avaliações; a API é a fonte única dos dados, sem fallback para listas simuladas no navegador.

A especificação REST é [`docs/openapi.json`](docs/openapi.json), também exibida pelo Swagger em `/api-docs`. Horários de atendimento são expressos na zona `America/Sao_Paulo` e persistidos como instantes com fuso no PostgreSQL; valide o comportamento temporal com a equipe antes de uma implantação fora do Brasil.

## Mineração de dados

Para executar a prova de conceito supervisionada sobre o conjunto de amostra:

```powershell
cd data-mining
python -m pip install pandas scikit-learn
python analise_sentimento.py
```

O agrupamento K-Means opcional usa o arquivo `yelp_academic_dataset_business.json`, obtido segundo os termos do Kaggle e colocado em `data-mining/dataset/`. Os arquivos do dataset não são distribuídos neste repositório. Consulte [`docs/05_mineracao_de_dados.md`](docs/05_mineracao_de_dados.md) para método, limitações e orientações de evidência.

## Documentação do projeto

- [Escopo e requisitos](docs/01_escopo_e_requisitos.md)
- [Modelagem e arquitetura](docs/02_modelagem_arquitetura.md)
- [Banco de dados](docs/03_banco_de_dados_conceitual_e_logico.md) e [schema PostgreSQL](docs/schema.sql)
- [Computação em Nuvem II](docs/04_computacao_em_nuvem_II.md)
- [Mineração de Dados](docs/05_mineracao_de_dados.md)
- [Contrato OpenAPI](docs/openapi.json)

## Implantação em nuvem

O Docker Compose permite executar os serviços localmente para desenvolvimento e demonstração. Ele não configura, por si só, uma implantação de produção. Uma publicação em nuvem ainda precisa de configuração de rede e domínio, HTTPS, gerenciamento de segredos, backups, monitoramento e validação do ambiente e dos custos. A arquitetura prevista para essa etapa está descrita em [`docs/04_computacao_em_nuvem_II.md`](docs/04_computacao_em_nuvem_II.md).
