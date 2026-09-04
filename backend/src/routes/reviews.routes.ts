import { Router, Request, Response } from 'express';
import { db, Avaliacao } from '../database/db';
import { analisarSentimento } from '../services/sentiment.service';

const router = Router();

// RF09 & RF10 - Enviar Avaliação com Análise de Sentimento Automática (RNF02 < 1s)
router.post('/', (req: Request, res: Response) => {
  const { id_agendamento, nota, comentario } = req.body;

  if (!id_agendamento || nota === undefined) {
    return res.status(400).json({ error: 'Campos obrigatórios: id_agendamento, nota (1 a 5)' });
  }

  const notaNum = parseInt(nota);
  if (isNaN(notaNum) || notaNum < 1 || notaNum > 5) {
    return res.status(400).json({ error: 'A nota deve ser um valor inteiro entre 1 e 5.' });
  }

  const agendamento = db.agendamentos.find(a => a.id_agendamento === Number(id_agendamento));
  if (!agendamento) {
    return res.status(404).json({ error: 'Agendamento não encontrado.' });
  }

  // RF10: Análise de sentimento automática
  const analise = analisarSentimento(comentario || '', notaNum);

  const novaAvaliacao: Avaliacao = {
    id_avaliacao: db.avaliacoes.length + 1,
    id_agendamento: Number(id_agendamento),
    nota: notaNum,
    comentario: comentario || '',
    sentimento_predito: analise.sentimento,
    data_avaliacao: new Date().toISOString()
  };

  db.avaliacoes.push(novaAvaliacao);

  return res.status(201).json({
    message: 'Avaliação enviada e analisada com sucesso!',
    review: novaAvaliacao,
    aiAnalysis: {
      sentimento: analise.sentimento,
      confianca: analise.confianca,
      tempoProcessamentoMs: analise.tempoProcessamentoMs,
      rnf02_status: analise.tempoProcessamentoMs < 1000 ? 'ATENDIDO (< 1s)' : 'VIOLADO'
    }
  });
});

// RF11 - Obter Avaliações e Métricas do Prestador para o Dashboard
router.get('/provider/:providerId', (req: Request, res: Response) => {
  const providerId = parseInt(req.params.providerId);

  // Buscar todos os agendamentos deste prestador
  const agendamentosPrestador = db.agendamentos.filter(a => a.id_prestador === providerId);
  const idsAgendamentos = new Set(agendamentosPrestador.map(a => a.id_agendamento));

  // Buscar avaliações associadas
  const avaliacoesPrestador = db.avaliacoes.filter(av => idsAgendamentos.has(av.id_agendamento));

  const total = avaliacoesPrestador.length;
  const mediaNotas = total > 0 
    ? parseFloat((avaliacoesPrestador.reduce((acc, curr) => acc + curr.nota, 0) / total).toFixed(1))
    : 5.0;

  const totalPositivas = avaliacoesPrestador.filter(a => a.sentimento_predito === 'Positivo').length;
  const totalNegativas = avaliacoesPrestador.filter(a => a.sentimento_predito === 'Negativo').length;
  const taxaSatisfacao = total > 0 ? Math.round((totalPositivas / total) * 100) : 100;

  return res.json({
    providerId,
    totalAvaliacoes: total,
    mediaNotas,
    taxaSatisfacaoPercentual: taxaSatisfacao,
    sentimentos: {
      positivas: totalPositivas,
      negativas: totalNegativas
    },
    reviews: avaliacoesPrestador
  });
});

export default router;
