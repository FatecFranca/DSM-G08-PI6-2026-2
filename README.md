# DSM-G08-PI6-2026-2: Sistema de Agendamento de Serviços Multiplataforma

Repositório do **GRUPO 08** do Projeto Interdisciplinar do 6º semestre DSM 2026/2.  
**Integrantes:** Hugo Castro e Pablo Miguel

[![Sprint 1](https://img.shields.io/badge/Sprint-1%C2%AA%20Sprint%20(04%2F09%2F2026)-success?style=for-the-badge)](docs/01_escopo_e_requisitos.md)
[![Status](https://img.shields.io/badge/Status-100%25%20Entregue-blue?style=for-the-badge)](README.md)
[![Stack](https://img.shields.io/badge/Stack-Node.js%20%7C%20TypeScript%20%7C%20PostgreSQL%20%7C%20TailwindCSS%20%7C%20Python%20NLP-informational?style=for-the-badge)](backend/)

> **Projeto Interdisciplinar (PI) – 6º Semestre**  
> **Curso:** Tecnologia em Desenvolvimento de Software Multiplataforma  
> **Disciplina-chave:** Laboratório de Desenvolvimento Multiplataforma  
> **Disciplinas-satélite:** Computação em Nuvem II & Mineração de Dados  
> **Professor Responsável:** Prof. Me. Alexandre Gomes  
> **Data de Entrega da 1ª Sprint:** 04/09/2026  
> **Link do Protótipo (Canva):** [Prototipação Visual de Interfaces](https://www.canva.com/design/DAHFeHSJrEQ/5d6hGY0XT6kotUXp1ewdkg/edit)

---

## 🎯 Objetivo da 1ª Sprint: Estruturação Inicial do Projeto

O objetivo central desta primeira entrega consiste na concepção integral do escopo, requisitos de negócio, arquitetura de software desacoplada, modelagem relacional do banco de dados, definição da infraestrutura em nuvem, planejamento e prova de conceito da mineração de dados, além do código base do back-end e prototipação navegável do front-end.

---

## 📋 Matriz de Cumprimento das Entregas da 1ª Sprint

| Requisito Mínimo da 1ª Sprint | Status | Artefatos e Evidências |
| :--- | :---: | :--- |
| **1. Definição do escopo e requisitos** | ✅ Concluído | [docs/01_escopo_e_requisitos.md](docs/01_escopo_e_requisitos.md) (RF01 a RF11 e RNF01 a RNF08) |
| **2. Modelagem inicial** | ✅ Concluído | [docs/02_modelagem_arquitetura.md](docs/02_modelagem_arquitetura.md) (Diagramas de Casos de Uso, Arquitetura C4 e Sequência) |
| **3. Criação do repositório Grupo (GitHub)** | ✅ Concluído | Repositório Git inicializado com [.gitignore](.gitignore), padronização e commits estruturados |
| **4. Estrutura inicial do back-end** | ✅ Concluído | [backend/](backend/) (API REST Node.js + TypeScript + Express com rotas, anti-double-booking e health check) |
| **5. Protótipo inicial do front-end** | ✅ Concluído | [frontend/](frontend/) (5 telas estáticas responsivas baseadas no Figma/Canva com Tailwind CSS) |
| **6. Banco de dados modelado** | ✅ Concluído | [docs/03_banco_de_dados_conceitual_e_logico.md](docs/03_banco_de_dados_conceitual_e_logico.md) e DDL [docs/schema.sql](docs/schema.sql) |
| **7. Computação em Nuvem II** | ✅ Concluído | [docs/04_computacao_em_nuvem_II.md](docs/04_computacao_em_nuvem_II.md) (Arquitetura AWS com ECS, RDS, S3, CloudFront e IAM) |
| **8. Mineração de Dados** | ✅ Concluído | [docs/05_mineracao_de_dados.md](docs/05_mineracao_de_dados.md), [data-mining/dataset_avaliacoes_exemplo.csv](data-mining/dataset_avaliacoes_exemplo.csv) e [data-mining/analise_sentimento.py](data-mining/analise_sentimento.py) |

---


---

## 🚀 Como Executar o Projeto Localmente

### 1. Pré-requisitos
- **Node.js**: versão 18+ (testado na versão 24)
- **Navegador Web Moderno**: Chrome, Firefox, Edge ou Safari

---

### 2. Executando o Back-end (API REST)

1. Acesse o diretório do back-end:
   ```bash
   cd backend
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Compile o código TypeScript:
   ```bash
   npm run build
   ```
4. Inicie o servidor:
   ```bash
   npm start
   ```
   *O servidor estará disponível em:* `http://localhost:3000`

#### Rotas Principais para Teste:
- **Health Check:** `GET http://localhost:3000/health`
- **Catálogo de Serviços:** `GET http://localhost:3000/api/services`
- **Cálculo de Horários Livres (RF05):** `GET http://localhost:3000/api/appointments/available-slots?providerId=1&serviceId=1&date=2026-09-04`
- **Análise de Sentimento por IA (RF10 & RNF02):**
  ```bash
  curl -X POST http://localhost:3000/api/ai/sentiment-analysis \
    -H "Content-Type: application/json" \
    -d "{\"texto\": \"Atendimento excelente e pontual!\", \"nota\": 5}"
  ```

---

### 3. Executando o Front-end (Vite + React + TypeScript + Tailwind CSS)

1. Acesse o diretório do front-end:
   ```bash
   cd frontend
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Inicie o servidor de desenvolvimento do Vite:
   ```bash
   npm run dev
   ```
   *Acesse no navegador:* `http://localhost:5173`

#### Telas e Módulos Implementados:
- **Página Inicial (Home):** Hero interativo, apresentação e cards de acesso rápido
- **Fluxo de Agendamento (Core):** Seleção de serviço, cálculo de slots livres em tempo real e anti-double booking (RF05, RF06, RF07)
- **Painel do Prestador (Dashboard):** Métricas de faturamento, satisfação e grade com cores semafóricas (RF08, RF11, RNF06)
- **Avaliações & IA de Sentimento:** Feedback pós-atendimento com classificação por Machine Learning em tempo real (RF09, RF10, RNF02)
- **Autenticação & Registro:** Perfis segregados para Cliente e Prestador com campos específicos de estabelecimento (RF01, RF02, RNF03)

---

### 4. Executando a Mineração de Dados (Python)

1. Acesse a pasta:
   ```bash
   cd data-mining
   ```
2. Instale os pacotes necessários:
   ```bash
   pip install pandas scikit-learn
   ```
3. Execute o script de treinamento e testes de inferência:
   ```bash
   python analise_sentimento.py
   ```

---

## 🔗 Publicação no GitHub do Grupo

Para associar esta pasta local ao repositório remoto oficial do grupo no GitHub:

```bash
git remote add origin https://github.com/FatecFranca/DSM-G08-PI6-2026-2.git
git branch -M main
git push -u origin main
```

---

**Equipe de Desenvolvimento — PI 6º Semestre (2026)**
