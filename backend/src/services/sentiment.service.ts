// Módulo de Análise de Sentimento (NLP) em Node.js / TypeScript
// Implementa inferência rápida para atender ao requisito RNF02 (< 1 segundo)

const TERMOS_POSITIVOS = new Set([
  'excelente', 'otimo', 'ótimo', 'maravilhoso', 'perfeito', 'impecavel', 'impecável',
  'bom', 'boa', 'adorei', 'gostei', 'recomendo', 'pontual', 'educado', 'educada',
  'atencioso', 'atenciosa', 'rapido', 'rápido', 'limpo', 'organizado', 'qualidade',
  'top', 'sensacional', 'parabens', 'parabéns', 'profissional', 'melhor', 'justo'
]);

const TERMOS_NEGATIVOS = new Set([
  'pessimo', 'péssimo', 'horrivel', 'horrível', 'ruim', 'demorou', 'atraso', 'atrasado',
  'torto', 'machucou', 'sujo', 'desorganizado', 'grosseiro', 'mal educado', 'descaso',
  'nao recomendo', 'não recomendo', 'detestei', 'decepcionado', 'decepcionou', 'amador',
  'caro', 'desonesto', 'estragou', 'pior', 'insatisfeito', 'alergia', 'perda de tempo'
]);

export interface ResultadoSentimento {
  sentimento: 'Positivo' | 'Negativo';
  confianca: number;
  tempoProcessamentoMs: number;
  detalhes: {
    termosPositivosDetectados: string[];
    termosNegativosDetectados: string[];
    pontuacao: number;
  };
}

export function analisarSentimento(texto: string, nota?: number): ResultadoSentimento {
  const inicio = performance.now();

  const textoLimpo = (texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // Remove acentos

  const palavras = textoLimpo.match(/\b[a-z]{3,}\b/g) || [];

  const positivosEncontrados: string[] = [];
  const negativosEncontrados: string[] = [];

  let score = 0;

  for (const p of palavras) {
    if (TERMOS_POSITIVOS.has(p)) {
      score += 1;
      positivosEncontrados.push(p);
    } else if (TERMOS_NEGATIVOS.has(p)) {
      score -= 1;
      negativosEncontrados.push(p);
    }
  }

  // Se nota de estrelas for fornecida, ela contribui na ponderação
  if (nota !== undefined) {
    if (nota >= 4) score += 1.5;
    else if (nota <= 2) score -= 1.5;
  }

  const sentimento: 'Positivo' | 'Negativo' = score >= 0 ? 'Positivo' : 'Negativo';
  const confianca = Math.min(0.98, Math.max(0.65, 0.5 + Math.abs(score) * 0.15));

  const fim = performance.now();
  const tempoProcessamentoMs = parseFloat((fim - inicio).toFixed(2));

  return {
    sentimento,
    confianca: parseFloat(confianca.toFixed(2)),
    tempoProcessamentoMs,
    detalhes: {
      termosPositivosDetectados: positivosEncontrados,
      termosNegativosDetectados: negativosEncontrados,
      pontuacao: score
    }
  };
}
