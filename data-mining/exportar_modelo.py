"""
Projeto Interdisciplinar (PI) – 6º Semestre
Disciplina-Satélite: Mineração de Dados
Exportação do modelo de sentimento treinado para consumo pela API Node.js/TypeScript.

Treina TF-IDF (1-2 gramas) + Regressão Logística sobre o dataset de avaliações,
avalia com divisão treino/teste estratificada (evidência) e serializa os
parâmetros do vetorizador e do classificador em JSON, permitindo que o backend
execute a inferência sem dependência do Python em tempo de execução.

Uso:
    PYTHONPATH=.pylibs python exportar_modelo.py [--input dataset_avaliacoes_exemplo.csv] [--output ../backend/models/sentiment_model.json]
"""

import argparse
import datetime
import json
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.model_selection import train_test_split

from analise_sentimento import preprocessar_texto

STOPWORDS_PT = [
    "de", "a", "o", "que", "e", "do", "da", "em", "um", "para", "é", "com",
    "uma", "os", "no", "se", "na", "por", "mais", "as", "dos", "como", "mas",
    "ao", "ele", "das", "à", "seu", "sua", "ou", "quando", "muito", "nos", "já"
]


def exportar_modelo(caminho_csv: Path, caminho_modelo: Path):
    if not caminho_csv.is_file():
        raise FileNotFoundError(f"Dataset não encontrado: {caminho_csv}")

    df = pd.read_csv(caminho_csv)
    df["texto_limpo"] = df["comentario_texto"].apply(preprocessar_texto)
    X = df["texto_limpo"]
    y = df["sentimento"]

    # --- Evidência: métricas em divisão estratificada treino/teste ---
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.25, random_state=42, stratify=y
    )
    vet_evidencia = TfidfVectorizer(ngram_range=(1, 2), stop_words=STOPWORDS_PT)
    X_train_v = vet_evidencia.fit_transform(X_train)
    X_test_v = vet_evidencia.transform(X_test)
    modelo_evidencia = LogisticRegression(random_state=42, max_iter=1000)
    modelo_evidencia.fit(X_train_v, y_train)
    y_pred = modelo_evidencia.predict(X_test_v)
    metricas = {
        "divisao": {"treino": 0.75, "teste": 0.25, "semente": 42},
        "acuracia": round(float(accuracy_score(y_test, y_pred)), 4),
        "relatorio_por_classe": classification_report(
            y_test, y_pred, output_dict=True, zero_division=0
        ),
        "matriz_confusao": confusion_matrix(
            y_test, y_pred, labels=modelo_evidencia.classes_
        ).tolist(),
        "ordem_classes_matriz": [str(c) for c in modelo_evidencia.classes_],
    }

    # --- Modelo final: treinado com 100% dos dados para o deploy ---
    vectorizer = TfidfVectorizer(ngram_range=(1, 2), stop_words=STOPWORDS_PT)
    X_all = vectorizer.fit_transform(X)
    modelo = LogisticRegression(random_state=42, max_iter=1000)
    modelo.fit(X_all, y)

    classes = [str(c) for c in modelo.classes_]
    if len(classes) != 2:
        raise RuntimeError("Esperado problema binário (Positivo/Negativo).")

    export = {
        "versao": "1.0.0",
        "gerado_em": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "dataset": caminho_csv.name,
        "total_amostras": int(len(df)),
        "distribuicao_classes": {
            str(k): int(v) for k, v in df["sentimento"].value_counts().items()
        },
        "classes": classes,
        "preprocessamento": {
            "lowercase": True,
            "regex_limpeza": "[^a-záéíóúâêîôûãõç\\s]",
            "ngram_range": [1, 2],
            "stopwords": STOPWORDS_PT,
        },
        # vocabulário TF-IDF: termo -> índice da coluna
        "vocabulario": dict(vectorizer.vocabulary_),
        # valores IDF calculados pelo TfidfVectorizer (smooth_idf padrão)
        "idf": [float(v) for v in vectorizer.idf_],
        # Regressão Logística binária: P(Positivo) = sigmoid(coef . x + intercepto)
        "coeficientes": [float(v) for v in modelo.coef_[0]],
        "intercepto": float(modelo.intercept_[0]),
        "classe_positiva": classes[1],
        "metricas_holdout": metricas,
    }

    caminho_modelo.parent.mkdir(parents=True, exist_ok=True)
    caminho_modelo.write_text(
        json.dumps(export, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    print(f"Modelo exportado: {caminho_modelo}")
    print(f"Vocabulário: {len(vectorizer.vocabulary_)} termos (1-2 gramas)")
    print(f"Acurácia holdout (evidência): {metricas['acuracia'] * 100:.2f}%")
    return export


if __name__ == "__main__":
    pasta = Path(__file__).resolve().parent
    parser = argparse.ArgumentParser(description="Exporta o modelo de sentimento para a API.")
    parser.add_argument("--input", type=Path, default=pasta / "dataset_avaliacoes_exemplo.csv")
    parser.add_argument("--output", type=Path, default=pasta.parent / "backend" / "models" / "sentiment_model.json")
    argumentos = parser.parse_args()
    exportar_modelo(argumentos.input, argumentos.output)
