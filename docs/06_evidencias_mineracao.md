# Mineração de Dados: Evidências da Sprint 3

**Projeto Interdisciplinar (PI) – 6º Semestre**
**Disciplina-Satélite:** Mineração de Dados
**Data da execução:** 13/11/2026 — Python 3.13.14, scikit-learn 1.9.1, pandas 3.1.1, Node.js 24.21.0
**Método:** todas as execuções abaixo foram reproduzidas a partir dos scripts versionados neste repositório; nenhum resultado foi copiado de execuções externas.

---

## 1. Artefatos gerados

| Artefato | Arquivo | Gerado por |
| :--- | :--- | :--- |
| Dataset de amostra (30 avaliações rotuladas) | [`data-mining/dataset_avaliacoes_exemplo.csv`](../data-mining/dataset_avaliacoes_exemplo.csv) | Sprint 1 |
| Relatório de métricas do baseline | [`data-mining/resultados_sentimento.json`](../data-mining/resultados_sentimento.json) | `analise_sentimento.py` |
| Modelo treinado para a API | [`backend/models/sentiment_model.json`](../backend/models/sentiment_model.json) | `exportar_modelo.py` |
| Inferência em TypeScript (API REST) | [`backend/src/services/ml-sentiment.service.ts`](../backend/src/services/ml-sentiment.service.ts) | Sprint 3 |

Comando de reprodução (com pandas e scikit-learn instalados):

```powershell
cd data-mining
python analise_sentimento.py     # gera resultados_sentimento.json
python exportar_modelo.py        # gera backend/models/sentiment_model.json
```

---

## 2. Métricas do modelo supervisionado (TF-IDF 1-2 gramas + Regressão Logística)

Avaliação em divisão estratificada 75% treino / 25% teste (semente 42), executada por `analise_sentimento.py` e registrada em `resultados_sentimento.json`:

| Métrica | Negativo | Positivo |
| :--- | :--- | :--- |
| Precisão | 1,00 | 0,67 |
| Revocação | 0,50 | 1,00 |
| F1-Score | 0,67 | 0,80 |

- **Acurácia global: 75%** (8 amostras de teste).
- **Matriz de confusão** (ordem `Negativo`, `Positivo`): `[[2, 2], [0, 4]]` — o modelo não classificou nenhuma avaliação negativa como positiva (zero falsos positivos), ao custo de 2 falsos negativos.
- **Modelo final para deploy:** treinado com 100% das 30 amostras (359 termos no vocabulário), exportado em `backend/models/sentiment_model.json`.

**Limitação declarada:** a amostra atual tem 30 avaliações; a acurácia de 75% é coerente com esse volume, e a confiança média fica em torno de 55–60%. A coleta do dataset Yelp completo (Kaggle) permanece como extensão opcional — a arquitetura de exportação (`exportar_modelo.py`) já aceita qualquer CSV com as colunas `comentario_texto` e `sentimento`, então re-treinar com mais dados não exige alteração no backend.

---

## 3. Integração do modelo com a API REST

O classificador supervisionado é executado **dentro do backend Node.js**, sem chamadas a processos Python:

1. `exportar_modelo.py` serializa vocabulário, IDF e coeficientes da Regressão Logística em JSON.
2. `ml-sentiment.service.ts` carrega o JSON na inicialização e replica a matemática do sklearn: contagem de termos → multiplicação por IDF → normalização L2 → produto escalar com os coeficientes → sigmoide.
3. `sentiment.service.ts` expõe `classificarComentario`, usado pelos endpoints `POST /api/ai/sentiment-analysis` e `POST /api/reviews`, com fallback lexical caso o artefato não exista.
4. Durante a integração, um desvio de tokenização foi detectado e corrigido (commit `fix(mining): aplicar stopwords antes dos bigramas…`): o TfidfVectorizer remove as stopwords **antes** de gerar bigramas; a inferência em TypeScript passou a replicar esse comportamento, o que resultou em paridade exata.

### 3.1 Paridade API × sklearn (mesmas frases, mesmos valores)

Execução paralela com as mesmas strings — `predict_proba` do sklearn versus resposta da inferência em TypeScript:

| Frase | sklearn (Python) | API (TypeScript) | Classe |
| :--- | :--- | :--- | :--- |
| "Serviço impecável! O profissional foi super pontual e atencioso." | Positivo — 0,5992 | Positivo — 0,5992 | ✅ idêntico |
| "Muito ruim, demorou mais de uma hora além do combinado e o corte ficou horrível." | Negativo — 0,5891 | Negativo — 0,5891 | ✅ idêntico |
| "Excelente atendimento, ambiente muito limpo e organizado. Recomendo a todos!" | Positivo — 0,5927 | Positivo — 0,5927 | ✅ idêntico |
| "Não gostei do resultado. O preço foi muito alto pelo serviço entregue." | Negativo — 0,5977 | Negativo — 0,5977 | ✅ idêntico |

### 3.2 Latência de inferência (RNF02 < 1s)

Medição na API (TypeScript): **0,05 ms a 0,29 ms por comentário** — cinco ordens de grandeza abaixo do limite de 1 segundo exigido. Os testes automatizados (`backend/src/__tests__/ml-sentiment.service.test.ts`) reforçam esse requisito como asserção permanente.

---

## 4. Testes automatizados da frente de mineração

A suíte Vitest (`cd backend && npm test`) valida, entre outros 30 casos:

- carregamento do artefato exportado (vocabulário, IDF e coeficientes com dimensões coerentes);
- classificação correta de avaliações positiva e negativa pela inferência em TypeScript;
- confiança no intervalo [0,5, 1] e inferência abaixo de 1 s (RNF02);
- comportamento seguro com texto fora do vocabulário;
- resposta do endpoint `/api/ai/sentiment-analysis` informando `modelo: tfidf-regressao-logistica`.

Resultado da última execução: **30 testes passando (5 arquivos)**.

---

## 5. Como evidenciar em apresentação

1. Inicie a API (`docker compose up --build postgres backend` ou local) e abra `http://localhost:3000/api-docs`.
2. Envie `POST /api/ai/sentiment-analysis` com `{"texto": "Atendimento impecável, muito rápido e atencioso.", "nota": 5}` — a resposta traz `prediction.modelo`, `prediction.confianca` e `performance.rnf02_status: ATENDIDO (< 1s)`.
3. Envie um comentário negativo e mostre a inversão da classe.
4. Capture o terminal do treino (`python analise_sentimento.py`) e o `resultados_sentimento.json` como evidência da execução real.
