import { describe, expect, it } from 'vitest';
import { analisarSentimento, classificarComentario } from '../services/sentiment.service';

describe('classificador lexical (fallback)', () => {
  it('classifica comentário positivo', () => {
    const r = analisarSentimento('Atendimento excelente, profissional pontual e educado');
    expect(r.sentimento).toBe('Positivo');
    expect(r.detalhes.termosPositivosDetectados.length).toBeGreaterThan(0);
  });

  it('classifica comentário negativo', () => {
    const r = analisarSentimento('Péssimo serviço, demorou e ficou torto, não recomendo');
    expect(r.sentimento).toBe('Negativo');
    expect(r.detalhes.termosNegativosDetectados.length).toBeGreaterThan(0);
  });

  it('considera a nota de estrelas na ponderação', () => {
    const neutro = analisarSentimento('serviço', 1);
    expect(neutro.sentimento).toBe('Negativo');
  });

  it('mede o tempo de processamento (RNF02 < 1s)', () => {
    const r = analisarSentimento('comentário qualquer de teste');
    expect(r.tempoProcessamentoMs).toBeLessThan(1000);
  });
});

describe('classificarComentario (unificado)', () => {
  it('usa o modelo treinado quando disponível', () => {
    const r = classificarComentario('Serviço impecável, profissional super pontual e atencioso');
    expect(['tfidf-regressao-logistica', 'lexico']).toContain(r.modelo);
    expect(['Positivo', 'Negativo']).toContain(r.sentimento);
    expect(r.confianca).toBeGreaterThan(0.5);
    expect(r.tempoProcessamentoMs).toBeLessThan(1000);
  });
});
