// Inferência do modelo de Mineração de Dados (TF-IDF + Regressão Logística) em TypeScript.
// O modelo é treinado pelo pipeline Python (data-mining/exportar_modelo.py) e exportado
// como JSON, permitindo que a API REST classifique comentários sem dependência do Python
// em tempo de execução (RF09, RF10 e RNF02 < 1s).

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export interface ModeloSentimento {
  versao: string;
  gerado_em: string;
  dataset: string;
  total_amostras: number;
  classes: string[];
  vocabulario: Record<string, number>;
  idf: number[];
  coeficientes: number[];
  intercepto: number;
  classe_positiva: string;
  preprocessamento?: { stopwords?: string[] };
  metricas_holdout: { acuracia: number };
}

export interface PredicaoModelo {
  sentimento: 'Positivo' | 'Negativo';
  confianca: number;
  tempoProcessamentoMs: number;
}

const CANDIDATOS_CAMINHO = [
  process.env.SENTIMENT_MODEL_PATH,
  resolve(process.cwd(), 'models', 'sentiment_model.json'),
  resolve(process.cwd(), 'backend', 'models', 'sentiment_model.json'),
  resolve(__dirname, '../models/sentiment_model.json'),
  resolve(__dirname, '../../models/sentiment_model.json')
].filter((p): p is string => Boolean(p));

let modelo: ModeloSentimento | null = null;

export function carregarModelo(): ModeloSentimento | null {
  if (modelo) return modelo;
  for (const caminho of CANDIDATOS_CAMINHO) {
    try {
      const bruto = JSON.parse(readFileSync(caminho, 'utf8')) as ModeloSentimento;
      if (!bruto.vocabulario || !Array.isArray(bruto.idf) || !Array.isArray(bruto.coeficientes)) {
        console.warn(`[MODELO IA] Arquivo inválido em ${caminho}`);
        continue;
      }
      modelo = bruto;
      console.log(`[MODELO IA] Modelo de sentimento carregado: ${caminho} (v${bruto.versao}, ${Object.keys(bruto.vocabulario).length} termos)`);
      return modelo;
    } catch {
      // tenta o próximo caminho
    }
  }
  return null;
}

// Replicação do preprocessar_texto() do pipeline Python:
// lowercase -> substituição de caracteres fora de [a-záéíóúâêîôûãõç\s] por espaço -> colapso de espaços
function preprocessarTexto(texto: string): string {
  return (texto || '')
    .toLowerCase()
    .replace(/[^a-záéíóúâêîôûãõç\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Igual ao TfidfVectorizer: stopwords são removidas da sequência ANTES da
// geração dos bigramas ('além do combinado' -> bigrama 'além combinado').
function gerarNgramas(tokens: string[], stopwords: Set<string>): string[] {
  const restantes = tokens.filter(t => !stopwords.has(t));
  const ngramas = [...restantes];
  for (let i = 0; i + 1 < restantes.length; i++) {
    ngramas.push(`${restantes[i]} ${restantes[i + 1]}`);
  }
  return ngramas;
}

function sigmoid(z: number): number {
  if (z >= 0) {
    const exp = Math.exp(-z);
    return 1 / (1 + exp);
  }
  const exp = Math.exp(z);
  return exp / (1 + exp);
}

/**
 * Executa a mesma matemática do TfidfVectorizer + LogisticRegression do sklearn:
 * tf bruto * idf -> normalização L2 -> produto com os coeficientes -> sigmoide.
 */
export function inferirComModelo(texto: string): PredicaoModelo | null {
  const modeloAtual = carregarModelo();
  if (!modeloAtual) return null;

  const inicio = performance.now();
  const stopwords = new Set(modeloAtual.preprocessamento?.stopwords || []);
  const tokens = preprocessarTexto(texto).split(' ').filter(t => t.length >= 2);
  const ngramas = gerarNgramas(tokens, stopwords);

  // Contagem de termos (tf bruto) presentes no vocabulário
  const contagens = new Map<number, number>();
  for (const ngrama of ngramas) {
    const indice = modeloAtual.vocabulario[ngrama];
    if (indice !== undefined) {
      contagens.set(indice, (contagens.get(indice) || 0) + 1);
    }
  }

  // tf * idf e normalização L2
  let normaQuadrada = 0;
  for (const [indice, contagem] of contagens) {
    const valor = contagem * modeloAtual.idf[indice];
    contagens.set(indice, valor);
    normaQuadrada += valor * valor;
  }
  const norma = Math.sqrt(normaQuadrada);
  let score = modeloAtual.intercepto;
  if (norma > 0) {
    for (const [indice, valor] of contagens) {
      score += (valor / norma) * modeloAtual.coeficientes[indice];
    }
  }

  // classes_ ordenadas: índice 1 é a classe positiva no modelo binário exportado
  const probPositivo = sigmoid(score);
  const sentimento: 'Positivo' | 'Negativo' = probPositivo >= 0.5 ? 'Positivo' : 'Negativo';
  const confianca = Math.max(probPositivo, 1 - probPositivo);

  const tempoProcessamentoMs = parseFloat((performance.now() - inicio).toFixed(2));
  return {
    sentimento,
    confianca: parseFloat(confianca.toFixed(4)),
    tempoProcessamentoMs
  };
}
