import { Router, Request, Response } from 'express';
import { analisarSentimento } from '../services/sentiment.service';

const router = Router();

// RF10 & RNF02 - Endpoint direto para teste do Modelo de IA / NLP
router.post('/sentiment-analysis', (req: Request, res: Response) => {
  const { texto, nota } = req.body;

  if (typeof texto !== 'string' || !texto.trim()) {
    return res.status(400).json({ error: 'Parâmetro obrigatório: texto (comentário a ser classificado)' });
  }

  const notaNum = nota === undefined || nota === null ? undefined : Number(nota);
  if (notaNum !== undefined && (!Number.isInteger(notaNum) || notaNum < 1 || notaNum > 5)) {
    return res.status(400).json({ error: 'nota deve ser um número inteiro entre 1 e 5.' });
  }
  const resultado = analisarSentimento(texto, notaNum);

  return res.json({
    input: {
      texto,
      nota: nota || null
    },
    prediction: {
      sentimento: resultado.sentimento,
      confianca: resultado.confianca,
      detalhes: resultado.detalhes
    },
    performance: {
      tempoProcessamentoMs: resultado.tempoProcessamentoMs,
      limiteExigidoMs: 1000,
      rnf02_status: resultado.tempoProcessamentoMs < 1000 ? 'ATENDIDO (< 1s)' : 'VIOLADO'
    }
  });
});

export default router;
