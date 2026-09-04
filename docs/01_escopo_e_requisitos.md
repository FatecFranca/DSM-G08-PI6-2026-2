# Documento de Definição de Escopo e Requisitos

**Projeto Interdisciplinar (PI) – 6º Semestre**  
**Curso:** Desenvolvimento de Software Multiplataforma  
**Tema:** Sistema de Agendamento de Serviços Multiplataforma  
**Data de Entrega (1ª Sprint):** 04/09/2026  

---

## 1. Visão Geral e Escopo do Projeto

O **Sistema de Agendamento de Serviços** é uma solução multiplataforma projetada para conectar prestadores de serviços autônomos e estabelecimentos comerciais (salões de beleza, barbearias, clínicas, consultorias, oficinas) diretamente aos seus clientes finais. 

O sistema visa eliminar atritos operacionais no processo de agendamento manual (como troca de mensagens instantâneas e anotações em papel), mitigando conflitos de agenda (*double-booking*), oferecendo transparência de preços, catálogo de serviços, disponibilidade em tempo real e inteligência orientada a dados por meio da mineração de sentimentos das avaliações recebidas.

### 1.1 Objetivos Principais
- Permitir que clientes descubram serviços, verifiquem disponibilidade de horários em tempo real e realizem agendamentos de forma autônoma.
- Fornecer aos prestadores de serviços uma ferramenta centralizada para gestão de catálogo, parametrização de jornada de trabalho (dias, horários de atendimento e intervalos) e monitoramento de agendamentos.
- Garantir a integridade temporal dos agendamentos através de algoritmo anti-sobreposição.
- Aplicar Mineração de Dados (Classificação / NLP) nas avaliações pós-atendimento para aferir o nível de satisfação dos clientes e municiar o prestador com métricas estratégicas.
- Hospedar a solução em nuvem com alta disponibilidade, segurança e separação clara entre cliente e servidor (API REST).

---

## 2. Requisitos Funcionais (RF)

Os Requisitos Funcionais descrevem as funcionalidades diretas, ações e comportamentos que o sistema disponibiliza aos usuários.

| Código | Nome | Descrição Detalhada | Perfil de Acesso |
| :--- | :--- | :--- | :--- |
| **RF01** | Cadastro e Login de Usuários | O sistema deve permitir o cadastro e login de clientes e prestadores de serviços, diferenciando os perfis de acesso (`CLIENT`, `PROVIDER`, `ADMIN`). | Público / Todos |
| **RF02** | Gestão de Perfil | O cliente deve poder atualizar seus dados pessoais (nome, telefone, e-mail). O prestador deve poder cadastrar as informações do seu negócio/estabelecimento (nome comercial, endereço, telefone de contato e foto de apresentação). | Autenticado (`CLIENT`, `PROVIDER`) |
| **RF03** | Cadastro de Serviços | O prestador deve conseguir cadastrar, editar e desativar serviços, definindo título/nome, descrição detalhada, duração estimada (em minutos) e preço. | Prestador (`PROVIDER`) |
| **RF04** | Configuração de Jornada de Trabalho | O prestador deve conseguir definir seus horários de atendimento regulares por dia da semana (ex: Segunda a Sexta, das 08h às 18h), incluindo intervalos de pausa e almoço. | Prestador (`PROVIDER`) |
| **RF05** | Consulta de Horários Livres | O sistema deve calcular e exibir para o cliente apenas os horários livres (*slots* de atendimento) disponíveis para a data e serviço selecionados, considerando a duração do serviço e agendamentos pré-existentes. | Autenticado / Cliente (`CLIENT`) |
| **RF06** | Realização de Agendamento | O cliente deve poder selecionar o prestador, serviço desejado, data, horário disponível calculado e confirmar a solicitação do agendamento. | Cliente (`CLIENT`) |
| **RF07** | Algoritmo Anti-Sobreposição (*Double-Booking*) | O sistema deve validar no back-end e impedir rigorosamente a confirmação de dois ou mais agendamentos conflitantes no mesmo intervalo de horário para o mesmo prestador. | Sistema (Back-end) |
| **RF08** | Cancelamento e Remarcação | Clientes e prestadores devem poder cancelar ou alterar o status de um agendamento (`Pendente`, `Confirmado`, `Cancelado`, `Concluído`) respeitando as regras de negócio. | Cliente (`CLIENT`) / Prestador (`PROVIDER`) |
| **RF09** | Avaliação Pós-Atendimento | Após a conclusão do agendamento (`Concluído`), o cliente deve poder atribuir uma nota de 1 a 5 estrelas e redigir um comentário textual sobre o serviço recebido. | Cliente (`CLIENT`) |
| **RF10** | Análise de Sentimento das Avaliações | O sistema deve processar o comentário do cliente através de modelo de Machine Learning (Classificação/NLP) e rotular automaticamente o sentimento como **Positivo** ou **Negativo**. | Sistema (Módulo IA / Mineração) |
| **RF11** | Dashboard do Prestador | O sistema deve exibir para o prestador um resumo analítico dos agendamentos do dia/semana e métricas de satisfação (média de estrelas, taxa de sentimentos positivos vs negativos). | Prestador (`PROVIDER`) |

---

## 3. Requisitos Não Funcionais (RNF)

Os Requisitos Não Funcionais especificam os critérios de qualidade, conformidade arquitetural, desempenho, segurança e restrições técnicas da solução.

### 3.1 Desempenho e Escalabilidade
- **RNF01 - Tempo de Resposta:** A busca por horários disponíveis (cálculo de *slots*) e a validação de criação de agendamentos devem responder em menos de **2 segundos** sob carga operacional padrão.
- **RNF02 - Processamento de IA:** A rotulagem de sentimento do comentário da avaliação via Machine Learning deve ser executada em menos de **1 segundo** no momento da submissão da avaliação.

### 3.2 Segurança e Privacidade
- **RNF03 - Criptografia de Senhas:** Todas as credenciais de acesso e senhas de usuários devem ser protegidas no banco de dados utilizando algoritmos de derivação de chave e hash robustos (ex: `bcrypt` com salt rounds apropriados).
- **RNF04 - Autenticação por Token:** As rotas protegidas da API REST devem adotar autenticação stateless baseada em tokens JWT (*JSON Web Token*), com validação de expiração e perfil de autorização via cabeçalho `Authorization: Bearer <token>`.

### 3.3 Usabilidade e Interface
- **RNF05 - Responsividade:** A interface web/mobile deve ser totalmente responsiva, adaptando seu layout fluidamente para dispositivos móveis (*smartphones*), *tablets* e navegadores *desktop*.
- **RNF06 - Acessibilidade e Identificação Visual:** O sistema deve utilizar indicadores visuais semafóricos com contraste e cores adequadas (Verde para `Confirmado`, Laranja para `Pendente`, Vermelho para `Cancelado`, Azul/Roxo para `Concluído`) para facilitar a leitura rápida de status.

### 3.4 Confiabilidade e Arquitetura
- **RNF07 - Integridade Referencial e Restrições:** O banco de dados relacional deve implementar chaves primárias, chaves estrangeiras com ações referenciais controladas, checagens (`CHECK`) e índices exclusivos para garantir a integridade dos dados e evitar concorrências indevidas.
- **RNF08 - Alta Disponibilidade e Arquitetura Desacoplada:** O sistema deve adotar arquitetura desacoplada em três camadas (Front-end Web SPA desacoplado do Back-end através de API REST padronizada), viabilizando manutenção independente, escalabilidade horizontal e implantação facilitada em infraestrutura de nuvem.
