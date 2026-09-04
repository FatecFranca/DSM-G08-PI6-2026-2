# Modelagem Inicial do Sistema e Arquitetura

**Projeto Interdisciplinar (PI) – 6º Semestre**  
**Tema:** Sistema de Agendamento de Serviços Multiplataforma  
**1ª Sprint:** Modelagem inicial (Casos de Uso, Arquitetura e Sequência)

---

## 1. Diagrama de Casos de Uso (UML)

O diagrama abaixo ilustra as principais interações dos três atores do sistema (**Cliente**, **Prestador de Serviços** e **Administrador**), bem como as interações com o sistema interno de Inteligência Artificial.

```mermaid
flowchart LR
    subgraph Atores
        C(["👤 Cliente"])
        P(["🛠️ Prestador de Serviços"])
        A(["🛡️ Administrador"])
        IA(["🤖 Sistema de IA"])
    end

    subgraph "Sistema de Agendamento de Serviços"
        UC01["UC01: Cadastrar e Autenticar Usuário"]
        UC02["UC02: Gerenciar Perfil e Negócio"]
        UC03["UC03: Gerenciar Catálogo de Serviços"]
        UC04["UC04: Configurar Jornada de Trabalho e Intervalos"]
        UC05["UC05: Consultar Horários Disponíveis (Slots)"]
        UC06["UC06: Solicitar Agendamento"]
        UC07["UC07: Validar Conflito de Horário (Anti-Double Booking)"]
        UC08["UC08: Gerenciar Status do Agendamento (Confirmar/Cancelar)"]
        UC09["UC09: Avaliar Atendimento Concluído"]
        UC10["UC10: Analisar Sentimento do Comentário (NLP)"]
        UC11["UC11: Visualizar Dashboard e Métricas"]
        UC12["UC12: Administrar Usuários e Parâmetros da Plataforma"]
    end

    C --> UC01
    C --> UC02
    C --> UC05
    C --> UC06
    C --> UC08
    C --> UC09

    P --> UC01
    P --> UC02
    P --> UC03
    P --> UC04
    P --> UC08
    P --> UC11

    A --> UC01
    A --> UC12

    UC06 -.->|<<include>>| UC07
    UC09 -.->|<<trigger>>| UC10
    UC10 --- IA
```

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
