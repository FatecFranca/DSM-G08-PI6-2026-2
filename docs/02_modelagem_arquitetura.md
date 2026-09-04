# Modelagem Inicial do Sistema e Arquitetura

**Projeto Interdisciplinar (PI) – 6º Semestre**  
**Tema:** Sistema de Agendamento de Serviços Multiplataforma  
**1ª Sprint:** Modelagem inicial (Casos de Uso, Arquitetura e Sequência)

---

## 1. Diagramas de Casos de Uso (UML)

O ecossistema divide as responsabilidades entre três atores humanos (**Cliente**, **Prestador de Serviços**, **Administrador**) e um ator computacional especializado (**Pipeline de Inteligência Artificial / NLP**).

Para garantir legibilidade máxima e organização modular no GitHub, apresentamos a **Visão Geral Consolidada**, complementada pelas **Visões Focalizadas por Ator** e pela **Tabela de Especificação Detalhada**.

---

### 1.1 Visão Geral Consolidada do Sistema

```mermaid
flowchart LR
    %% ==========================================
    %% ATORES PRIMÁRIOS (CLIENTES)
    %% ==========================================
    subgraph Atores_Clientes ["👤 Atores Primários"]
        C(["👤 Cliente"])
    end

    %% ==========================================
    %% FRONTEIRA DO SISTEMA
    %% ==========================================
    subgraph Sistema ["🏢 Sistema de Agendamento Multiplataforma"]
        
        subgraph Mod_Agendamento ["📅 Núcleo de Agendamentos & Reserva"]
            UC05(["UC05: Consultar Horários Disponíveis"])
            UC06(["UC06: Solicitar Agendamento"])
            UC07(["UC07: Validar Anti-Double Booking"]):::inc
            UC08(["UC08: Gerenciar Status do Agendamento"])
        end

        subgraph Mod_Avaliacao ["⭐ Avaliações & Inteligência Artificial"]
            UC09(["UC09: Submeter Avaliação do Atendimento"])
            UC10(["UC10: Classificar Sentimento NLP"]):::inc
            UC11(["UC11: Visualizar Dashboard e Métricas"])
        end

        subgraph Mod_Negocio ["🛠️ Catálogo & Expediente"]
            UC03(["UC03: Gerenciar Catálogo de Serviços"])
            UC04(["UC04: Configurar Jornada e Horários"])
        end

        subgraph Mod_Acesso ["🔐 Acesso & Administração"]
            UC01(["UC01: Autenticar e Gerenciar Perfil"])
            UC12(["UC12: Administrar Plataforma"])
        end
    end

    %% ==========================================
    %% ATORES SECUNDÁRIOS / GESTÃO E SISTEMAS
    %% ==========================================
    subgraph Atores_Gestao ["🏢 Gestão & Sistemas"]
        P(["🛠️ Prestador de Serviços"])
        A(["🛡️ Administrador"])
        IA(["🤖 Pipeline de IA (NLP)"]):::ai
    end

    %% Relações do Cliente
    C --> UC01
    C --> UC05
    C --> UC06
    C --> UC08
    C --> UC09

    %% Dependências Internas (Include e Trigger)
    UC06 -.->|"<<include>>"| UC07
    UC09 -.->|"<<trigger>>"| UC10
    UC10 --- IA

    %% Relações do Prestador
    P --> UC01
    P --> UC03
    P --> UC04
    P --> UC08
    P --> UC11

    %% Relações do Administrador
    A --> UC01
    A --> UC12

    %% Definições de Estilo
    classDef default fill:#ffffff,stroke:#2563eb,stroke-width:1.5px,color:#0f172a;
    classDef inc fill:#f8fafc,stroke:#64748b,stroke-width:1.5px,stroke-dasharray: 4 4,color:#334155;
    classDef ai fill:#faf5ff,stroke:#7c3aed,stroke-width:2px,color:#581c87;
```

---

### 1.2 Visão Focalizada: Jornada do Cliente (Reserva & Avaliação)

Fluxo limpo e direto destacando o caminho do cliente desde a consulta de slots livres até a inferência de sentimento pós-atendimento:

```mermaid
flowchart LR
    Cliente(["👤 Cliente"])

    subgraph Fronteira_Cliente ["Jornada de Atendimento do Cliente"]
        UC01(["UC01: Autenticar / Criar Conta"])
        UC05(["UC05: Consultar Horários Disponíveis"])
        UC06(["UC06: Solicitar Agendamento"])
        UC07(["UC07: Validar Anti-Double Booking"]):::dashed
        UC08(["UC08: Cancelar Agendamento"])
        UC09(["UC09: Submeter Avaliação e Comentário"])
        UC10(["UC10: Classificar Sentimento por IA"]):::dashed
    end

    IA(["🤖 Motor NLP"]):::ai

    Cliente --> UC01
    Cliente --> UC05
    Cliente --> UC06
    Cliente --> UC08
    Cliente --> UC09

    UC06 -.->|"<<include>>"| UC07
    UC09 -.->|"<<trigger>>"| UC10
    UC10 --- IA

    classDef default fill:#f0f9ff,stroke:#0284c7,stroke-width:1.5px,color:#0f172a;
    classDef dashed fill:#ffffff,stroke:#64748b,stroke-width:1.5px,stroke-dasharray: 4 4,color:#334155;
    classDef ai fill:#faf5ff,stroke:#7c3aed,stroke-width:2px,color:#581c87;
```

---

### 1.3 Visão Focalizada: Gestão do Prestador & Painel Analítico

Fluxo operacional do prestador para manter seus serviços, jornada e acompanhar o feedback dos clientes:

```mermaid
flowchart LR
    subgraph Fronteira_Prestador ["Painel Operacional do Prestador"]
        UC01(["UC01: Autenticar no Painel"])
        UC03(["UC03: Cadastrar e Editar Serviços"])
        UC04(["UC04: Configurar Horários e Intervalos"])
        UC08(["UC08: Confirmar ou Cancelar Agendamentos"])
        UC11(["UC11: Analisar Métricas & Reputação NLP"])
    end

    Prestador(["🛠️ Prestador de Serviços"])

    Prestador --> UC01
    Prestador --> UC03
    Prestador --> UC04
    Prestador --> UC08
    Prestador --> UC11

    classDef default fill:#fffbeb,stroke:#d97706,stroke-width:1.5px,color:#0f172a;
```

---

### 1.4 Especificação Detalhada dos Casos de Uso

| ID | Caso de Uso | Atores Participantes | Tipo | Descrição Resumida | Requisito Relacionado |
| :---: | :--- | :--- | :---: | :--- | :---: |
| **UC01** | Autenticar e Gerenciar Perfil | Cliente, Prestador, Admin | Primário | Cadastro, login com senha criptografada (bcrypt) e emissão de token JWT. | RF01, RF02, RNF04 |
| **UC02** | Gerenciar Perfil e Negócio | Cliente, Prestador | Primário | Manutenção de dados de contato, endereço e dados do estabelecimento. | RF02 |
| **UC03** | Gerenciar Catálogo de Serviços | Prestador | Primário | Criação, alteração de preço, duração em minutos e status ativo de serviços. | RF03 |
| **UC04** | Configurar Expediente e Intervalos | Prestador | Primário | Definição da grade semanal de trabalho (abertura, fechamento e almoço). | RF04 |
| **UC05** | Consultar Horários Disponíveis | Cliente | Primário | Visualização dinâmica de slots vagos na data escolhida, sem horários fantasmas. | RF05 |
| **UC06** | Solicitar Agendamento | Cliente | Primário | Seleção do serviço e horário para reserva na agenda do prestador. | RF06 |
| **UC07** | Validar Anti-Double Booking | Sistema | `<<include>>` | Bloqueio automático de concorrência que impede agendamentos simultâneos. | RF07, RNF01 |
| **UC08** | Gerenciar Status do Agendamento | Cliente, Prestador | Primário | Mudança de estados semafóricos (Pendente ➔ Confirmado ➔ Cancelado ➔ Concluído). | RF08, RNF06 |
| **UC09** | Submeter Avaliação do Atendimento | Cliente | Primário | Atribuição de nota de 1 a 5 estrelas e comentário em texto natural após a conclusão. | RF09 |
| **UC10** | Classificar Sentimento NLP | Sistema de IA | `<<trigger>>` | Processamento TF-IDF e classificação estatística em tempo real (< 10ms). | RF10, RNF02, RNF03 |
| **UC11** | Visualizar Dashboard e Métricas | Prestador | Primário | Indicadores visuais de volume de atendimentos e satisfação líquida dos clientes. | RF11 |
| **UC12** | Administrar Parâmetros Globais | Administrador | Primário | Gestão da infraestrutura, bloqueio de contas irregulares e auditoria do sistema. | RF12 |

---

## 2. Diagrama de Arquitetura da Solução

O sistema adota uma arquitetura em camadas desacoplada e baseada em microsserviços/módulos RESTful, com separação estrita entre front-end, lógica de negócios, camada de persistência e módulo analítico de inteligência artificial.

```mermaid
flowchart TD
    subgraph ClientLayer ["Camada de Apresentação (Multiplataforma)"]
        WebSpa["💻 Front-end Web SPA (HTML5 / TailwindCSS / TypeScript)"]
        MobileApp["📱 Front-end Mobile (React Native / PWA)"]
    end

    subgraph GatewayCloud ["Ponto de Entrada & Rede (Cloud Provider)"]
        CDN["🌐 CDN / CloudFront / Vercel"]
        APIGateway["🚪 Reverse Proxy / Nginx / API Gateway"]
    end

    subgraph BackendCore ["Camada de Negócio e Serviços (Node.js / TypeScript REST API)"]
        AuthModule["🔐 Auth & Security (JWT, Bcrypt)"]
        UserModule["👥 Gestão de Usuários & Perfis"]
        ServiceModule["📦 Catálogo de Serviços"]
        ScheduleModule["⏱️ Cálculo de Horários Livres"]
        BookingEngine["📅 Motor de Agendamentos & Anti-Sobreposição"]
        ReviewModule["⭐ Avaliações & Feedback"]
    end

    subgraph AnalyticsAI ["Camada de Inteligência e Mineração de Dados"]
        DataMiningEngine["🧠 Módulo de Classificação de Sentimentos (NLP / Scikit-Learn)"]
        AnalyticsWorker["📊 Agregador de Métricas & Dashboard"]
    end

    subgraph DataStorage ["Camada de Persistência"]
        RDBMS[("🗄️ PostgreSQL / SQLite (Dados Transacionais)")]
        BlobStorage[("☁️ Cloud Object Storage (S3 - Imagens de Estabelecimentos)")]
    end

    WebSpa -->|HTTPS / REST| APIGateway
    MobileApp -->|HTTPS / REST| APIGateway
    CDN --> WebSpa

    APIGateway --> BackendCore
    BackendCore --> RDBMS
    BackendCore --> BlobStorage
    ReviewModule -->|Classificação de Texto| DataMiningEngine
    DataMiningEngine -->|Rótulo Positivo / Negativo| ReviewModule
    AnalyticsWorker --> RDBMS
```

---

## 3. Diagrama de Sequência: Agendamento e Anti-Sobreposição

O fluxo a seguir demonstra a garantia de conformidade com o **RF06**, **RF07** e **RNF01**, assegurando que a reserva de horários não gere conflitos entre diferentes clientes.

```mermaid
sequenceDiagram
    autonumber
    actor Cliente as 👤 Cliente
    participant Front as 💻 Front-end
    participant API as 🚀 API Back-end (Node.js)
    participant DB as 🗄️ Banco de Dados (PostgreSQL)

    Cliente->>Front: Seleciona Prestador, Serviço e Data desejada
    Front->>API: GET /api/appointments/available-slots?providerId=1&serviceId=2&date=2026-09-10
    API->>DB: Busca Jornada de Trabalho (RF04) e Agendamentos Existentes
    DB-->>API: Retorna horários configurados e agendamentos ocupados
    API->>API: Calcula slots livres de acordo com a duração do serviço
    API-->>Front: Retorna lista de slots disponíveis (JSON)
    Front-->>Cliente: Renderiza opções de horários livres em tela

    Cliente->>Front: Escolhe slot (ex: 14:00 - 14:45) e clica em Confirmar
    Front->>API: POST /api/appointments (com Token JWT)
    API->>API: Valida Token de Autenticação (RNF04)
    
    rect rgb(240, 248, 255)
        Note over API,DB: Algoritmo Anti-Sobreposição (RF07) em Transação
        API->>DB: SELECT COUNT(*) FROM agendamentos WHERE id_prestador = :p AND status != 'Cancelado' AND NOT (data_hora_fim <= :inicio OR data_hora_inicio >= :fim) FOR UPDATE
        alt Existe sobreposição (Double-booking detectado)
            DB-->>API: count > 0
            API-->>Front: HTTP 409 Conflict ("Horário não mais disponível")
            Front-->>Cliente: Exibe alerta e atualiza lista de slots
        else Horário Livre Confirmado
            DB-->>API: count == 0
            API->>DB: INSERT INTO agendamentos (...) VALUES (...)
            DB-->>API: Retorna agendamento criado (id_agendamento)
            API-->>Front: HTTP 201 Created (Dados do Agendamento)
            Front-->>Cliente: Exibe confirmação de sucesso com status 'Confirmado'
        end
    end
```

---

## 4. Diagrama de Sequência: Avaliação e Análise de Sentimento (IA)

Fluxo ilustrando a interação pós-atendimento com inferência automática de sentimento (**RF09**, **RF10**, **RNF02**):

```mermaid
sequenceDiagram
    autonumber
    actor Cliente as 👤 Cliente
    participant Front as 💻 Front-end
    participant API as 🚀 API Back-end
    participant IA as 🧠 Módulo de NLP / Mineração
    participant DB as 🗄️ Banco de Dados

    Cliente->>Front: Submete avaliação: Nota (5) + Comentário ("Atendimento excelente e pontual!")
    Front->>API: POST /api/reviews { id_agendamento, nota: 5, comentario: "..." }
    API->>IA: Classifica sentimento (comentário)
    Note over IA: Pré-processamento, TF-IDF e classificação em < 1s (RNF02)
    IA-->>API: Resultado: "Positivo" (Score: 0.96)
    API->>DB: INSERT INTO avaliacoes (id_agendamento, nota, comentario, sentimento_predito, data)
    DB-->>API: Registro salvo com sucesso
    API-->>Front: HTTP 201 Created { id_avaliacao, sentimento_predito: "Positivo" }
    Front-->>Cliente: Exibe confirmação com badge de sentimento atribuído
```
