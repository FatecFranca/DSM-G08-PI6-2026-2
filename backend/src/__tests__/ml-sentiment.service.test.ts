import { describe, expect, it } from 'vitest';
import { carregarModelo, inferirComModelo } from '../services/ml-sentiment.service';

describe('modelo TF-IDF + Regressão Logística exportado', () => {
  it('carrega o artefato gerado pelo pipeline Python', () => {
    const modelo = carregarModelo();
    expect(modelo).not.toBeNull();
    expect(modelo!.classe_positiva).toBe('Positivo');
    expect(Object.keys(modelo!.vocabulario).length).toBeGreaterThan(0);
    expect(modelo!.idf.length).toBe(Object.keys(modelo!.vocabulario).length);
    expect(modelo!.coeficientes.length).toBe(modelo!.idf.length);
  });

  it('classifica avaliação positiva', () => {
    const r = inferirComModelo('Serviço impecável! O profissional foi super pontual e atencioso.');
    expect(r).not.toBeNull();
    expect(r!.sentimento).toBe('Positivo');
  });

  it('classifica avaliação negativa', () => {
    const r = inferirComModelo('Muito ruim, demorou mais de uma hora e o corte ficou horrível.');
    expect(r).not.toBeNull();
    expect(r!.sentimento).toBe('Negativo');
  });

  it('mantém a confiança em [0.5, 1] e a inferência sob 1s (RNF02)', () => {
    const r = inferirComModelo('Atendimento muito bom, voltarei com certeza');
    expect(r!.confianca).toBeGreaterThanOrEqual(0.5);
    expect(r!.confianca).toBeLessThanOrEqual(1);
    expect(r!.tempoProcessamentoMs).toBeLessThan(1000);
  });

  it('não quebra com texto fora do vocabulário', () => {
    const r = inferirComModelo('xyzzy qwerty zzz');
    expect(r).not.toBeNull();
    expect(['Positivo', 'Negativo']).toContain(r!.sentimento);
  });
});
