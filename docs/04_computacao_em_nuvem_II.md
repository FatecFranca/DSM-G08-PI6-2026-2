# Computação em Nuvem II: Definição e Justificativa dos Serviços

**Projeto Interdisciplinar (PI) – 6º Semestre**  
**Disciplina-Satélite:** Computação em Nuvem II  
**Professor Responsável:** Prof. Me. Alexandre Gomes  
**Tema:** Sistema de Agendamento de Serviços Multiplataforma  
**Atualização em 23/10/2026:** arquitetura AWS planejada; ainda não há evidência de recursos AWS provisionados neste repositório.

---

## 1. Visão Geral da Arquitetura em Nuvem

Para atender aos requisitos de alta disponibilidade (**RNF08**), tempo de resposta ágil (**RNF01** e **RNF02**) e segurança rigorosa com criptografia (**RNF03** e **RNF04**), foi selecionada como arquitetura-alvo a plataforma de nuvem pública **AWS (Amazon Web Services)**, complementada por serviços de borda e orquestração de contêineres Docker. A seleção é planejamento; não significa que esses recursos já estejam criados.

A arquitetura em nuvem é orientada a microsserviços desacoplados e *serverless/containers*, reduzindo custos operacionais durante a fase inicial e permitindo escalabilidade automática sob demanda.

---

## 2. Diagrama de Arquitetura em Nuvem (AWS)

```mermaid
flowchart TB
    subgraph Users ["Usuários Finais"]
        ClientWeb["💻 Navegadores / Clientes Web"]
        ClientMobile["📱 Dispositivos Móveis"]
    end

    subgraph AWSCloud ["Nuvem AWS (Região: us-east-1 / sa-east-1)"]
        subgraph EdgeLayer ["Camada de Borda & Segurança"]
            Route53["🌐 Amazon Route 53 (DNS)"]
            WAF["🛡️ AWS WAF (Web Application Firewall)"]
            CloudFront["⚡ Amazon CloudFront (CDN Global)"]
        end

        subgraph StorageLayer ["Hospedagem Estática & Assets"]
            S3_Frontend[("📦 Amazon S3 (Front-end SPA)")]
            S3_Uploads[("📦 Amazon S3 (Fotos e Mídia)")]
        end

        subgraph ComputeLayer ["Camada de Computação & Aplicação"]
            ALB["⚖️ Application Load Balancer (ALB)"]
            subgraph ECSCluster ["AWS ECS (Elastic Container Service) / Fargate"]
                APIContainer1["🐳 Container API Back-end (Task 1)"]
                APIContainer2["🐳 Container API Back-end (Task 2)"]
                AIContainer["🧠 Container Módulo de IA (NLP)"]
            end
        end

        subgraph DatabaseLayer ["Camada de Persistência Gerenciada"]
            RDS[("🗄️ Amazon RDS for PostgreSQL (Multi-AZ)")]
        end

        subgraph GovernanceSecurity ["Segurança, Monitoramento & Chaves"]
            SecretsManager["🔑 AWS Secrets Manager (JWT Keys / DB Passwords)"]
            CloudWatch["📊 Amazon CloudWatch (Logs e Métricas)"]
            IAM["🔒 AWS IAM (Políticas de Acesso Mínimo)"]
        end
    end

    Users --> Route53
    Route53 --> WAF
    WAF --> CloudFront
    CloudFront -->|Assets Estáticos| S3_Frontend
    CloudFront -->|Requisições Dinâmicas /api| ALB
    ALB --> APIContainer1 & APIContainer2
    APIContainer1 & APIContainer2 --> RDS
    APIContainer1 & APIContainer2 --> S3_Uploads
    APIContainer1 & APIContainer2 --> AIContainer
    ECSCluster -.-> SecretsManager
    ECSCluster -.-> CloudWatch
    ECSCluster -.-> IAM
```

---

## 3. Seleção e Justificativa Detalhada dos Serviços

| Serviço AWS | Categoria | Função no Projeto | Justificativa Técnica |
| :--- | :--- | :--- | :--- |
| **Amazon S3** *(Simple Storage Service)* | Armazenamento de Objetos | Hospedagem dos arquivos estáticos do front-end e upload de fotos de perfil e estabelecimentos. | Altíssima durabilidade (99.999999999%), custo quase nulo para pequenas cargas, elimina a necessidade de gerenciar servidores web dedicados para o front-end estático. |
| **Amazon CloudFront** | CDN *(Content Delivery Network)* | Distribuição com cache de borda (*edge locations*) com terminação SSL/TLS automática. | Garante que os arquivos do front-end e imagens carreguem com latência mínima para os usuários no Brasil, reduzindo tráfego direto para a aplicação. |
| **AWS ECS + AWS Fargate** | Computação / Contêineres | Orquestração da API Node.js/TypeScript e do módulo de Machine Learning empacotados em Docker. | **Serverless para contêineres:** Não requer provisionamento ou gerenciamento de instâncias EC2 subjacentes. Escala horizontalmente de acordo com a carga de agendamentos e garante isolamento seguro. |
| **Application Load Balancer (ALB)** | Redes / Balanceamento | Distribuição inteligente de carga HTTP/HTTPS para os contêineres da API. | Suporte nativo a *health checks*, roteamento baseado em caminhos (`/api/v1/*`) e tolerância a falhas para cumprir o **RNF08**. |
| **Amazon RDS for PostgreSQL** | Banco de Dados Gerenciado | Persistência transacional dos dados de usuários, serviços, agendamentos e avaliações. | Oferece backups automáticos pontuais (*Point-In-Time Restore*), patches de segurança gerenciados, criptografia em repouso e suporte a *Multi-AZ* para alta disponibilidade. |
| **AWS Secrets Manager** | Segurança & Conformidade | Armazenamento criptografado do `JWT_SECRET`, credenciais de banco e chaves de API. | Cumpre rigorosamente os requisitos **RNF03** e **RNF04**, evitando o vazamento de credenciais em arquivos de código ou repositórios públicos. |
| **Amazon CloudWatch** | Observabilidade & Logs | Coleta de logs das rotas da API, métricas de latência e alarmes de indisponibilidade. | Permite validar em tempo real se os requisitos de latência (**RNF01 < 2s** e **RNF02 < 1s**) estão sendo cumpridos em ambiente de produção. |

---

## 4. Alinhamento com Requisitos Não Funcionais

1. **Alta Disponibilidade e Resiliência (RNF08):**
   - Utilização de zonas de disponibilidade distintas (*Multi-AZ*) no Amazon RDS e distribuição de tarefas no ECS Fargate.
   - Caso um contêiner sofra falha inesperada, o orquestrador provisiona automaticamente uma nova réplica sem interrupção para o usuário final.
2. **Desempenho e Latência Reduzida (RNF01 e RNF02):**
   - Distribuição CDN global com nós em São Paulo (Edge Location) para o front-end.
   - Módulo de IA otimizado em contêiner dedicado para atender à inferência em menos de 1 segundo.
3. **Segurança e Criptografia (RNF03 e RNF04):**
   - Todo o tráfego externo trafega sob HTTPS (TLS 1.3).
   - Comunicação interna entre API e RDS isolada em sub-redes privadas (*VPC Private Subnet*).
   - Senhas criptografadas com `bcrypt` no banco e tokens de autorização `JWT` com chaves rotacionadas via Secrets Manager.

---

## 5. Planejamento de Custos e Ambiente Educacional

O [`docker-compose.yml`](../docker-compose.yml) fornece ambiente local integrado com PostgreSQL, API e front-end. Para a Sprint 3, a equipe precisa provisionar e comprovar o ambiente na AWS, depois de avaliar preços vigentes e limites da conta. O Free Tier varia por serviço, região e data; não assuma que ele torna o ambiente Multi-AZ gratuito.

### 5.1 Checklist de publicação e validação da Sprint 3

- [ ] Criar VPC, sub-redes públicas/privadas e grupos de segurança com menor privilégio.
- [ ] Publicar imagens da API e do front-end em registry privado; executar API em ECS Fargate atrás de ALB.
- [ ] Criar RDS PostgreSQL em sub-redes privadas, configurar backups e testar restauração.
- [ ] Aplicar schema/migrações de forma controlada; não executar `seed.dev.sql` em produção.
- [ ] Guardar `DATABASE_URL` e `JWT_SECRET` no Secrets Manager; emitir HTTPS e restringir origens CORS ao domínio publicado.
- [ ] Configurar health checks, logs, métricas e alertas no CloudWatch; registrar evidência de operação e latência.
- [ ] Configurar DNS/CloudFront/S3 se adotados, política de cache e invalidação de artefatos.
- [ ] Testar fluxo completo, concorrência de agendamento, cancelamento, avaliação e recuperação de falhas.
- [ ] Registrar URLs, arquitetura efetivamente criada, custos estimados/observados, controles e capturas de tela no relatório final.

Não marque esses itens como concluídos até que o grupo os tenha aplicado e validado em sua própria conta AWS.
