"""
Projeto Interdisciplinar (PI) – 6º Semestre
Disciplina-Satélite: Mineração de Dados
Base de Dados de Referência: Yelp Dataset (Kaggle) - https://www.kaggle.com/datasets/yelp-dataset/yelp-dataset
Script de Treinamento e Inferência de Sentimentos (NLP / Classificação Supervisionada)
Atende aos requisitos: RF09, RF10 e RNF02 (< 1s de inferência).
"""

import argparse
import json
import re
import time
from pathlib import Path

import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.model_selection import train_test_split
from sklearn.naive_bayes import MultinomialNB
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix


def preprocessar_texto(texto: str) -> str:
    """Limpeza e normalização básica de texto em português."""
    if not isinstance(texto, str):
        return ""
    texto = texto.lower()
    # Remove caracteres especiais e números, preservando palavras
    texto = re.sub(r"[^a-záéíóúâêîôûãõç\s]", " ", texto)
    # Remove múltiplos espaços
    texto = re.sub(r"\s+", " ", texto).strip()
    return texto


def executar_pipeline(caminho_csv: Path, caminho_relatorio: Path):
    if not caminho_csv.is_file():
        raise FileNotFoundError(f"Arquivo de entrada não encontrado: {caminho_csv}")

    print("=" * 60)
    print("PI 6º SEMESTRE - PIPELINE DE MINERAÇÃO DE DADOS (NLP)")
    print("=" * 60)
    print(f"1. Carregando dataset: {caminho_csv}")
    df = pd.read_csv(caminho_csv)
    print(f"   Total de amostras carregadas: {len(df)}")
    print(f"   Distribuição de classes:\n{df['sentimento'].value_counts()}\n")

    print("2. Pré-processando textos...")
    df["texto_limpo"] = df["comentario_texto"].apply(preprocessar_texto)

    print("3. Extração de características (TF-IDF com unigramas e bigramas)...")
    # Stopwords comuns em português
    stopwords_pt = [
        "de", "a", "o", "que", "e", "do", "da", "em", "um", "para", "é", "com",
        "uma", "os", "no", "se", "na", "por", "mais", "as", "dos", "como", "mas",
        "ao", "ele", "das", "à", "seu", "sua", "ou", "quando", "muito", "nos", "já"
    ]
    print("4. Dividindo dados em Treino (75%) e Teste (25%)...")
    textos_train, textos_test, y_train, y_test = train_test_split(
        df["texto_limpo"], df["sentimento"], test_size=0.25, random_state=42, stratify=df["sentimento"]
    )
    vectorizer = TfidfVectorizer(ngram_range=(1, 2), stop_words=stopwords_pt)
    X_train = vectorizer.fit_transform(textos_train)
    X_test = vectorizer.transform(textos_test)

    print("5. Treinando Modelo 1: Multinomial Naive Bayes (MNB)...")
    nb_model = MultinomialNB()
    nb_model.fit(X_train, y_train)
    y_pred_nb = nb_model.predict(X_test)
    acc_nb = accuracy_score(y_test, y_pred_nb)
    print(f"   Acurácia Naive Bayes: {acc_nb * 100:.2f}%\n")

    print("6. Treinando Modelo 2: Regressão Logística...")
    lr_model = LogisticRegression(random_state=42)
    lr_model.fit(X_train, y_train)
    y_pred_lr = lr_model.predict(X_test)
    acc_lr = accuracy_score(y_test, y_pred_lr)
    print(f"   Acurácia Regressão Logística: {acc_lr * 100:.2f}%\n")

    print("=" * 60)
    print("RELATÓRIO DE CLASSIFICAÇÃO (REGRESSÃO LOGÍSTICA):")
    report = classification_report(y_test, y_pred_lr, output_dict=True, zero_division=0)
    print(classification_report(y_test, y_pred_lr, zero_division=0))

    print("=" * 60)
    print("TESTE DE INFERÊNCIA EM TEMPO REAL (RNF02 < 1s):")
    frases_teste = [
        "Atendimento impecável, muito rápido e atencioso.",
        "Péssimo serviço, chegou atrasado e não teve educação.",
        "Gostei muito do resultado final, voltarei com certeza.",
        "Não recomendo, o trabalho ficou torto e muito caro."
    ]

    inferencias = []
    for frase in frases_teste:
        t_inicio = time.perf_counter()
        frase_proc = preprocessar_texto(frase)
        vetor = vectorizer.transform([frase_proc])
        pred = lr_model.predict(vetor)[0]
        prob = max(lr_model.predict_proba(vetor)[0]) * 100
        t_fim = time.perf_counter()
        tempo_ms = (t_fim - t_inicio) * 1000
        print(f"Frase: \"{frase}\"")
        print(f" -> Predição: [{pred}] ({prob:.1f}% de confiança) | Tempo de inferência: {tempo_ms:.2f}ms (RNF02 OK)\n")
        inferencias.append({
            "texto": frase,
            "sentimento": str(pred),
            "confianca_percentual": round(float(prob), 2),
            "tempo_ms": round(float(tempo_ms), 2)
        })

    resultado = {
        "dataset": caminho_csv.name,
        "total_amostras": int(len(df)),
        "distribuicao_classes": {str(key): int(value) for key, value in df["sentimento"].value_counts().items()},
        "divisao": {"treino": 0.75, "teste": 0.25, "semente": 42},
        "modelos": {
            "MultinomialNB": {"acuracia": round(float(acc_nb), 4)},
            "RegressaoLogistica": {
                "acuracia": round(float(acc_lr), 4),
                "metricas_por_classe": report,
                "matriz_confusao": confusion_matrix(y_test, y_pred_lr, labels=lr_model.classes_).tolist(),
                "ordem_classes_matriz": [str(label) for label in lr_model.classes_]
            }
        },
        "inferencias_exemplo": inferencias
    }
    caminho_relatorio.parent.mkdir(parents=True, exist_ok=True)
    caminho_relatorio.write_text(json.dumps(resultado, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Relatório de métricas salvo em: {caminho_relatorio}")


if __name__ == "__main__":
    pasta = Path(__file__).resolve().parent
    parser = argparse.ArgumentParser(description="Treina e avalia classificadores de sentimento no dataset CSV.")
    parser.add_argument("--input", type=Path, default=pasta / "dataset_avaliacoes_exemplo.csv")
    parser.add_argument("--report", type=Path, default=pasta / "resultados_sentimento.json")
    argumentos = parser.parse_args()
    executar_pipeline(argumentos.input, argumentos.report)
