import { Router, Request, Response } from 'express';
import { analisarSentimento } from '../services/sentiment.service';

const router = Router();

// RF10 & RNF02 - Endpoint direto para teste do Modelo de IA / NLP
router.post('/sentiment-analysis', (req: Request, res: Response) => {
  const { texto, nota } = req.body;

  if (!texto) {
    return res.status(400).json({ error: 'Parâmetro obrigatório: texto (comentário a ser classificado)' });
  }

  const resultado = analisarSentimento(texto, nota ? Number(nota) : undefined);

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
