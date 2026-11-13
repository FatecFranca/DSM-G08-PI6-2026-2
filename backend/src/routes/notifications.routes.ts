import { Router, Response } from 'express';
import { pool } from '../database/db';
import { asyncHandler, authMiddleware, AuthenticatedRequest } from '../middlewares/auth.middleware';
import { chaveConfigurada } from '../messaging/fcm.provider';

const router = Router();

// Status do subsistema de mensageria (evidência para a disciplina-chave)
router.get('/status', (_req, res: Response) => {
  return res.json({
    mensageria: {
      barramento: 'event-bus em processo (publish/subscribe, trocável por RabbitMQ/SQS)',
      eventos: ['agendamento.criado', 'agendamento.atualizado'],
      push: {
        provedor: chaveConfigurada() ? 'fcm' : 'simulado',
        chaveConfigurada: chaveConfigurada()
      }
    }
  });
});

// Registro do token de dispositivo para push (Firebase/Google)
router.post('/device', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const token = req.body.token;
  const plataforma = req.body.plataforma || 'web';
  if (typeof token !== 'string' || token.trim().length < 8 || token.length > 4096) {
    return res.status(400).json({ error: 'Informe um token de dispositivo válido.' });
  }
  if (!['web', 'mobile', 'desktop'].includes(plataforma)) {
    return res.status(400).json({ error: 'Plataforma deve ser web, mobile ou desktop.' });
  }
  await pool.query(
    `INSERT INTO device_tokens (id_usuario, token, plataforma)
     VALUES ($1, $2, $3)
     ON CONFLICT (token) DO UPDATE SET id_usuario = EXCLUDED.id_usuario, plataforma = EXCLUDED.plataforma`,
    [req.user.id_usuario, token.trim(), plataforma]
  );
  return res.status(201).json({ message: 'Dispositivo registrado para notificações push.' });
}));

// Histórico in-app de notificações do usuário autenticado
router.get('/', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const resultado = await pool.query(
    `SELECT id_notificacao, tipo, titulo, corpo, dados, lida, criado_em
     FROM notifications WHERE id_usuario = $1
     ORDER BY criado_em DESC LIMIT 50`,
    [req.user.id_usuario]
  );
  return res.json({ total: resultado.rowCount, notifications: resultado.rows });
}));

export default router;
