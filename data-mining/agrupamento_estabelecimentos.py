"""Agrupa estabelecimentos do Yelp usando atributos não rotulados.

Entrada: yelp_academic_dataset_business.json, obtido do Yelp Dataset no Kaggle.
Saída: CSV com o cluster atribuído a cada estabelecimento elegível.
"""

import argparse
import json
import math
from pathlib import Path

import pandas as pd
from sklearn.cluster import KMeans
from sklearn.compose import ColumnTransformer
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import silhouette_score
from sklearn.preprocessing import OneHotEncoder, StandardScaler


def carregar_negocios(caminho: Path) -> pd.DataFrame:
    """Carrega o JSON Lines do Yelp e prepara atributos disponíveis."""
    registros = []
    with caminho.open(encoding="utf-8") as arquivo:
        for linha in arquivo:
            negocio = json.loads(linha)
            categorias = negocio.get("categories") or ""
            registros.append({
                "business_id": negocio.get("business_id"),
                "name": negocio.get("name"),
                "categories": categorias,
                "state": negocio.get("state") or "desconhecido",
                "stars": negocio.get("stars"),
                "review_count": negocio.get("review_count"),
                "is_open": negocio.get("is_open"),
                "latitude": negocio.get("latitude"),
                "longitude": negocio.get("longitude"),
            })

    df = pd.DataFrame(registros)
    # Yelp inclui negócios que não são estabelecimentos comerciais. Mantemos
    # registros com categoria e coordenadas para tornar a análise interpretável.
    df = df[df["categories"].str.strip().ne("")].copy()
    df = df.dropna(subset=["business_id", "latitude", "longitude"])
    df["stars"] = pd.to_numeric(df["stars"], errors="coerce")
    df["review_count"] = pd.to_numeric(df["review_count"], errors="coerce").fillna(0)
    df["is_open"] = pd.to_numeric(df["is_open"], errors="coerce").fillna(0)
    df = df.dropna(subset=["stars"])
    # A transformação reduz a assimetria de contagens muito altas de avaliações.
    df["log_review_count"] = df["review_count"].map(math.log1p)
    return df.reset_index(drop=True)


def agrupar(df: pd.DataFrame, quantidade: int, semente: int):
    numericas = ["stars", "log_review_count", "is_open", "latitude", "longitude"]
    pre_processamento = ColumnTransformer(
        transformers=[
            ("numericas", StandardScaler(), numericas),
            ("estado", OneHotEncoder(handle_unknown="ignore"), ["state"]),
            ("categorias", TfidfVectorizer(
                token_pattern=r"(?u)\b\w[\w &-]+\b", max_features=500,
            ), "categories"),
        ],
        sparse_threshold=1.0,
    )
    matriz = pre_processamento.fit_transform(df)
    modelo = KMeans(n_clusters=quantidade, random_state=semente, n_init=10)
    rotulos = modelo.fit_predict(matriz)
    return rotulos, matriz


def main():
    pasta = Path(__file__).resolve().parent
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--input", type=Path,
        default=pasta / "dataset" / "yelp_academic_dataset_business.json",
        help="Caminho para o arquivo business.json do Yelp (JSON Lines).",
    )
    parser.add_argument("--clusters", type=int, default=5, help="Número de grupos K-Means (mínimo 2).")
    parser.add_argument("--output", type=Path, default=pasta / "resultados_agrupamento.csv")
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    if not args.input.is_file():
        parser.error(
            f"Arquivo não encontrado: {args.input}. Consulte docs/05_mineracao_de_dados.md "
            "para baixar e extrair o Yelp Dataset."
        )
    if args.clusters < 2:
        parser.error("--clusters precisa ser pelo menos 2.")

    df = carregar_negocios(args.input)
    if len(df) <= args.clusters:
        parser.error(f"A amostra tem {len(df)} negócios; aumente a base ou reduza --clusters.")

    print(f"Estabelecimentos com categoria e coordenadas: {len(df):,}")
    rotulos, matriz = agrupar(df, args.clusters, args.seed)
    df["cluster"] = rotulos
    args.output.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(args.output, index=False, encoding="utf-8-sig")

    print("Tamanho dos grupos:")
    print(df["cluster"].value_counts().sort_index().to_string())
    # Silhouette é aproximada em amostra para evitar custo quadrático na base toda.
    pontuacao = silhouette_score(
        matriz, rotulos, sample_size=min(2000, len(df)), random_state=args.seed,
    )
    print(f"Silhouette (amostra): {pontuacao:.3f}")
    print(f"Resultado salvo em: {args.output}")
    print("Inspecione categorias e médias de cada grupo antes de atribuir significado aos clusters.")


if __name__ == "__main__":
    main()
