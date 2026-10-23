import { Router, Response } from 'express';
import { pool } from '../database/db';
import { asyncHandler, authMiddleware, AuthenticatedRequest, authorize } from '../middlewares/auth.middleware';

const router = Router();
const isClockTime = (value: unknown): value is string => {
  if (typeof value !== 'string' || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value)) return false;
  return true;
};
const toMinutes = (value: string) => {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
};

router.get('/:providerId', asyncHandler(async (req, res: Response) => {
  const providerId = Number(req.params.providerId);
  if (!Number.isInteger(providerId) || providerId <= 0) return res.status(400).json({ error: 'providerId inválido.' });
  const result = await pool.query(
    `SELECT id_jornada, id_prestador, dia_semana, hora_inicio::text, hora_fim::text,
            inicio_intervalo::text, fim_intervalo::text, ativo
     FROM jornadas_trabalho WHERE id_prestador=$1 AND ativo=TRUE ORDER BY dia_semana`,
    [providerId]
  );
  return res.json({ providerId, schedules: result.rows });
}));

router.post('/', authMiddleware, authorize('Prestador', 'Admin'), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { dia_semana, hora_inicio, hora_fim, inicio_intervalo, fim_intervalo } = req.body;
  const providerId = req.user.tipo_perfil === 'Admin' ? Number(req.body.id_prestador || req.user.id_usuario) : req.user.id_usuario;
  if (
    !Number.isInteger(Number(dia_semana)) || Number(dia_semana) < 0 || Number(dia_semana) > 6 ||
    !isClockTime(hora_inicio) || !isClockTime(hora_fim)
  ) {
    return res.status(400).json({ error: 'Informe dia_semana (0–6) e horários no formato HH:MM.' });
  }
  if (toMinutes(hora_fim) <= toMinutes(hora_inicio)) {
    return res.status(400).json({ error: 'hora_fim precisa ser posterior a hora_inicio.' });
  }
  if ((inicio_intervalo && !isClockTime(inicio_intervalo)) || (fim_intervalo && !isClockTime(fim_intervalo)) ||
      Boolean(inicio_intervalo) !== Boolean(fim_intervalo)) {
    return res.status(400).json({ error: 'Informe um intervalo completo com horários HH:MM válidos.' });
  }
  if (inicio_intervalo && fim_intervalo &&
      (toMinutes(inicio_intervalo) < toMinutes(hora_inicio) ||
       toMinutes(fim_intervalo) > toMinutes(hora_fim) ||
       toMinutes(fim_intervalo) <= toMinutes(inicio_intervalo))) {
    return res.status(400).json({ error: 'O intervalo deve estar dentro da jornada.' });
  }
  const result = await pool.query(
    `INSERT INTO jornadas_trabalho
       (id_prestador, dia_semana, hora_inicio, hora_fim, inicio_intervalo, fim_intervalo, ativo)
     VALUES ($1,$2,$3,$4,$5,$6,TRUE)
     ON CONFLICT (id_prestador,dia_semana)
     DO UPDATE SET hora_inicio=EXCLUDED.hora_inicio, hora_fim=EXCLUDED.hora_fim,
                   inicio_intervalo=EXCLUDED.inicio_intervalo, fim_intervalo=EXCLUDED.fim_intervalo,
                   ativo=TRUE
     RETURNING id_jornada, id_prestador, dia_semana, hora_inicio::text, hora_fim::text,
               inicio_intervalo::text, fim_intervalo::text, ativo`,
    [providerId, Number(dia_semana), hora_inicio, hora_fim, inicio_intervalo || null, fim_intervalo || null]
  );
  return res.status(201).json({ message: 'Jornada atualizada.', schedule: result.rows[0] });
}));

export default router;
