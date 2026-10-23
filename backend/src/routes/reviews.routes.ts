import { Router, Response } from 'express';
import { pool } from '../database/db';
import { asyncHandler, authMiddleware, AuthenticatedRequest } from '../middlewares/auth.middleware';
import { analisarSentimento } from '../services/sentiment.service';

const router = Router();

router.post('/', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id_agendamento, nota, comentario } = req.body;
  const appointmentId = Number(id_agendamento);
  const score = Number(nota);
  if (!Number.isInteger(appointmentId) || appointmentId <= 0 || !Number.isInteger(score) || score < 1 || score > 5 || typeof comentario !== 'string' || !comentario.trim()) {
    return res.status(400).json({ error: 'Informe id_agendamento, nota inteira de 1 a 5 e comentário.' });
  }
  if (req.user.tipo_perfil !== 'Cliente') return res.status(403).json({ error: 'Somente clientes podem avaliar atendimentos.' });

  const appointment = await pool.query(
    'SELECT id_cliente, status FROM agendamentos WHERE id_agendamento=$1',
    [appointmentId]
  );
  if (!appointment.rowCount || appointment.rows[0].id_cliente !== req.user.id_usuario) {
    return res.status(404).json({ error: 'Agendamento não encontrado para este cliente.' });
  }
  if (appointment.rows[0].status !== 'Concluído') {
    return res.status(409).json({ error: 'A avaliação só pode ser enviada após a conclusão do atendimento.' });
  }

  const analysis = analisarSentimento(comentario.trim(), score);
  try {
    const result = await pool.query(
      `INSERT INTO avaliacoes (id_agendamento, nota, comentario, sentimento_predito)
       VALUES ($1,$2,$3,$4)
       RETURNING id_avaliacao, id_agendamento, nota, comentario, sentimento_predito, data_avaliacao`,
      [appointmentId, score, comentario.trim(), analysis.sentimento]
    );
    return res.status(201).json({
      message: 'Avaliação registrada e classificada.',
      review: result.rows[0],
      aiAnalysis: {
        sentimento: analysis.sentimento,
        confianca: analysis.confianca,
        tempoProcessamentoMs: analysis.tempoProcessamentoMs,
        rnf02_status: analysis.tempoProcessamentoMs < 1000 ? 'ATENDIDO (< 1s)' : 'VIOLADO'
      }
    });
  } catch (error) {
    if ((error as { code?: string }).code === '23505') {
      return res.status(409).json({ error: 'Este atendimento já possui uma avaliação.' });
    }
    throw error;
  }
}));

router.get('/provider/:providerId', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const providerId = Number(req.params.providerId);
  if (!Number.isInteger(providerId) || providerId <= 0) return res.status(400).json({ error: 'providerId inválido.' });
  if (req.user.tipo_perfil !== 'Admin' && (req.user.tipo_perfil !== 'Prestador' || req.user.id_usuario !== providerId)) {
    return res.status(403).json({ error: 'Você só pode consultar as métricas do próprio estabelecimento.' });
  }
  const result = await pool.query(
    `SELECT r.id_avaliacao, r.id_agendamento, r.nota, r.comentario, r.sentimento_predito, r.data_avaliacao
     FROM avaliacoes r JOIN agendamentos a ON a.id_agendamento=r.id_agendamento
     WHERE a.id_prestador=$1 ORDER BY r.data_avaliacao DESC`,
    [providerId]
  );
  const reviews = result.rows;
  const total = reviews.length;
  const positive = reviews.filter(review => review.sentimento_predito === 'Positivo').length;
  return res.json({
    providerId,
    totalAvaliacoes: total,
    mediaNotas: total ? Number((reviews.reduce((sum, review) => sum + Number(review.nota), 0) / total).toFixed(1)) : 0,
    taxaSatisfacaoPercentual: total ? Math.round(positive / total * 100) : 0,
    sentimentos: { positivas: positive, negativas: total - positive },
    reviews
  });
}));

export default router;
