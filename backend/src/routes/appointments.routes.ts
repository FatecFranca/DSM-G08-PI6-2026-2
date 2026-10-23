import { Router, Response } from 'express';
import { pool } from '../database/db';
import { asyncHandler, authMiddleware, AuthenticatedRequest } from '../middlewares/auth.middleware';

const router = Router();
const ACTIVE_STATUSES = ['Pendente', 'Confirmado'];
const TIME_ZONE = 'America/Sao_Paulo';
const brazilOffset = '-03:00';

function localDateTime(date: string, minuteOfDay: number): Date {
  const hours = String(Math.floor(minuteOfDay / 60)).padStart(2, '0');
  const minutes = String(minuteOfDay % 60).padStart(2, '0');
  return new Date(`${date}T${hours}:${minutes}:00${brazilOffset}`);
}

function localParts(value: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(value);
  const part = (type: string) => parts.find(item => item.type === type)?.value || '';
  return {
    date: `${part('year')}-${part('month')}-${part('day')}`,
    minuteOfDay: Number(part('hour')) * 60 + Number(part('minute'))
  };
}

router.get('/available-slots', asyncHandler(async (req, res: Response) => {
  const startedAt = performance.now();
  const providerId = Number(req.query.providerId);
  const serviceId = Number(req.query.serviceId);
  const date = String(req.query.date || '');
  if (!Number.isInteger(providerId) || providerId <= 0 || !Number.isInteger(serviceId) || serviceId <= 0 || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'Informe providerId, serviceId e date (AAAA-MM-DD) válidos.' });
  }
  const dateStart = new Date(`${date}T00:00:00.000Z`);
  if (Number.isNaN(dateStart.getTime()) || dateStart.toISOString().slice(0, 10) !== date) {
    return res.status(400).json({ error: 'Data inválida.' });
  }

  const serviceResult = await pool.query(
    'SELECT id_servico, id_prestador, titulo, duracao_minutos, preco FROM servicos WHERE id_servico=$1 AND id_prestador=$2 AND ativo=TRUE',
    [serviceId, providerId]
  );
  if (!serviceResult.rowCount) return res.status(404).json({ error: 'Serviço não encontrado ou inativo para este prestador.' });
  const service = serviceResult.rows[0];
  const dayOfWeek = dateStart.getUTCDay();
  const scheduleResult = await pool.query(
    `SELECT hora_inicio::text, hora_fim::text, inicio_intervalo::text, fim_intervalo::text
     FROM jornadas_trabalho WHERE id_prestador=$1 AND dia_semana=$2 AND ativo=TRUE`,
    [providerId, dayOfWeek]
  );
  if (!scheduleResult.rowCount) {
    return res.json({ date, providerId, totalDisponivel: 0, slots: [], message: 'Sem expediente configurado para esta data.' });
  }

  const schedule = scheduleResult.rows[0];
  const toMinutes = (value: string) => {
    const [hours, minutes] = value.slice(0, 5).split(':').map(Number);
    return hours * 60 + minutes;
  };
  const nextDate = new Date(dateStart.getTime() + 86400000).toISOString().slice(0, 10);
  const startOfDay = `${date}T00:00:00${brazilOffset}`;
  const endOfDay = `${nextDate}T00:00:00${brazilOffset}`;
  const existing = await pool.query(
    `SELECT data_hora_inicio, data_hora_fim FROM agendamentos
     WHERE id_prestador=$1 AND status = ANY($2::text[])
       AND data_hora_inicio < $4 AND data_hora_fim > $3`,
    [providerId, ACTIVE_STATUSES, startOfDay, endOfDay]
  );

  const duration = Number(service.duracao_minutos);
  const slots: Array<{ inicio: string; fim: string }> = [];
  const shiftStart = toMinutes(schedule.hora_inicio);
  const shiftEnd = toMinutes(schedule.hora_fim);
  for (let minute = shiftStart; minute + duration <= shiftEnd; minute += 30) {
    const slotEnd = minute + duration;
    const hasBreak = schedule.inicio_intervalo && schedule.fim_intervalo &&
      minute < toMinutes(schedule.fim_intervalo) && slotEnd > toMinutes(schedule.inicio_intervalo);
    if (hasBreak) continue;
    const slotStartAt = localDateTime(date, minute).getTime();
    const slotEndAt = localDateTime(date, slotEnd).getTime();
    if (slotStartAt <= Date.now()) continue;
    const overlaps = existing.rows.some(appointment =>
      slotStartAt < new Date(appointment.data_hora_fim).getTime() &&
      slotEndAt > new Date(appointment.data_hora_inicio).getTime()
    );
    if (!overlaps) {
      const format = (value: number) => `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;
      slots.push({ inicio: format(minute), fim: format(slotEnd) });
    }
  }
  return res.json({
    date, providerId, service: { id: service.id_servico, titulo: service.titulo, duracao_minutos: duration, preco: service.preco },
    totalDisponivel: slots.length, slots, timeZone: TIME_ZONE,
    tempoExecucaoMs: Number((performance.now() - startedAt).toFixed(2))
  });
}));

router.post('/', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (req.user.tipo_perfil !== 'Cliente' && req.user.tipo_perfil !== 'Admin') {
    return res.status(403).json({ error: 'Somente clientes podem solicitar agendamentos.' });
  }
  const providerId = Number(req.body.id_prestador);
  const serviceId = Number(req.body.id_servico);
  const clientId = req.user.tipo_perfil === 'Admin' ? Number(req.body.id_cliente) : req.user.id_usuario;
  const startInput = req.body.data_hora_inicio;
  const startMs = typeof startInput === 'string' ? Date.parse(startInput) : NaN;
  if (!Number.isInteger(providerId) || providerId <= 0 || !Number.isInteger(serviceId) || serviceId <= 0 || !Number.isInteger(clientId) || clientId <= 0 || !Number.isFinite(startMs)) {
    return res.status(400).json({ error: 'Informe prestador, serviço e data/hora inicial ISO válidos.' });
  }
  const start = new Date(startMs);
  if (startMs <= Date.now()) return res.status(400).json({ error: 'O horário do agendamento precisa estar no futuro.' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock($1::bigint)', [providerId]);
    const serviceResult = await client.query(
      'SELECT duracao_minutos FROM servicos WHERE id_servico=$1 AND id_prestador=$2 AND ativo=TRUE',
      [serviceId, providerId]
    );
    if (!serviceResult.rowCount) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Serviço não encontrado ou inativo para este prestador.' });
    }
    const end = new Date(startMs + Number(serviceResult.rows[0].duracao_minutos) * 60000);
    const localStart = localParts(start);
    const localEnd = localParts(end);
    const startDate = new Date(`${localStart.date}T00:00:00.000Z`);
    const shiftResult = await client.query(
      `SELECT hora_inicio::text, hora_fim::text, inicio_intervalo::text, fim_intervalo::text
       FROM jornadas_trabalho WHERE id_prestador=$1 AND dia_semana=$2 AND ativo=TRUE`,
      [providerId, startDate.getUTCDay()]
    );
    if (!shiftResult.rowCount) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Prestador sem jornada cadastrada para essa data.' });
    }
    const shift = shiftResult.rows[0];
    const toMinutes = (value: string) => {
      const [hours, minutes] = value.slice(0, 5).split(':').map(Number);
      return hours * 60 + minutes;
    };
    const startMinute = localStart.minuteOfDay;
    const endMinute = localEnd.minuteOfDay;
    const outsideShift = localStart.date !== localEnd.date ||
      startMinute < toMinutes(shift.hora_inicio) || endMinute > toMinutes(shift.hora_fim);
    const duringBreak = shift.inicio_intervalo && shift.fim_intervalo &&
      startMinute < toMinutes(shift.fim_intervalo) && endMinute > toMinutes(shift.inicio_intervalo);
    if (outsideShift || duringBreak) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'O horário está fora da jornada ou durante o intervalo.' });
    }

    const conflict = await client.query(
      `SELECT 1 FROM agendamentos
       WHERE id_prestador=$1 AND status = ANY($2::text[])
         AND data_hora_inicio < $4 AND data_hora_fim > $3 LIMIT 1`,
      [providerId, ACTIVE_STATUSES, start.toISOString(), end.toISOString()]
    );
    if (conflict.rowCount) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Conflito de agendamento: o horário acabou de ser reservado.' });
    }
    const result = await client.query(
      `INSERT INTO agendamentos
       (id_cliente, id_prestador, id_servico, data_hora_inicio, data_hora_fim, status, observacoes)
       VALUES ($1,$2,$3,$4,$5,'Confirmado',$6)
       RETURNING id_agendamento, id_cliente, id_prestador, id_servico, data_hora_inicio, data_hora_fim, status, observacoes`,
      [clientId, providerId, serviceId, start.toISOString(), end.toISOString(), req.body.observacoes || '']
    );
    await client.query('COMMIT');
    return res.status(201).json({ message: 'Agendamento confirmado.', appointment: result.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}));

router.get('/', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const providerId = req.query.providerId ? Number(req.query.providerId) : undefined;
  const clientId = req.query.clientId ? Number(req.query.clientId) : undefined;
  if (req.user.tipo_perfil === 'Prestador' && providerId !== req.user.id_usuario) {
    return res.status(403).json({ error: 'Prestadores só podem consultar a própria agenda.' });
  }
  if (req.user.tipo_perfil === 'Cliente' && clientId !== req.user.id_usuario) {
    return res.status(403).json({ error: 'Clientes só podem consultar os próprios agendamentos.' });
  }
  const filterProvider = req.user.tipo_perfil === 'Prestador' ? req.user.id_usuario : providerId || null;
  const filterClient = req.user.tipo_perfil === 'Cliente' ? req.user.id_usuario : clientId || null;
  const result = await pool.query(
    `SELECT a.*, r.id_avaliacao IS NOT NULL AS avaliado, u.nome AS cliente_nome, u.telefone AS cliente_telefone, p.nome AS prestador_nome,
            s.titulo AS servico_titulo, s.preco::float8 AS servico_preco
     FROM agendamentos a
     JOIN usuarios u ON u.id_usuario=a.id_cliente
     JOIN usuarios p ON p.id_usuario=a.id_prestador
     JOIN servicos s ON s.id_servico=a.id_servico
     LEFT JOIN avaliacoes r ON r.id_agendamento=a.id_agendamento
     WHERE ($1::integer IS NULL OR a.id_prestador=$1)
       AND ($2::integer IS NULL OR a.id_cliente=$2)
       AND ($3::text IS NULL OR a.status=$3)
     ORDER BY a.data_hora_inicio`,
    [filterProvider, filterClient, req.query.status || null]
  );
  return res.json({ total: result.rowCount, appointments: result.rows });
}));

router.patch('/:id/status', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const id = Number(req.params.id);
  const status = req.body.status;
  if (!Number.isInteger(id) || id <= 0 || !['Pendente', 'Confirmado', 'Cancelado', 'Concluído'].includes(status)) {
    return res.status(400).json({ error: 'ID ou status inválido.' });
  }
  const appointmentResult = await pool.query(
    'SELECT id_cliente, id_prestador, status, data_hora_fim FROM agendamentos WHERE id_agendamento=$1',
    [id]
  );
  if (!appointmentResult.rowCount) return res.status(404).json({ error: 'Agendamento não encontrado.' });
  const appointment = appointmentResult.rows[0];
  const allowed = req.user.tipo_perfil === 'Admin' ||
    (req.user.tipo_perfil === 'Cliente' && appointment.id_cliente === req.user.id_usuario && status === 'Cancelado') ||
    (req.user.tipo_perfil === 'Prestador' && appointment.id_prestador === req.user.id_usuario);
  if (!allowed) return res.status(403).json({ error: 'Você não tem permissão para alterar este agendamento.' });
  if (['Cancelado', 'Concluído'].includes(appointment.status)) {
    return res.status(409).json({ error: 'Agendamentos cancelados ou concluídos não podem mudar de status.' });
  }
  if (status === 'Concluído' && new Date(appointment.data_hora_fim).getTime() > Date.now()) {
    return res.status(409).json({ error: 'O atendimento só pode ser concluído após o horário final.' });
  }
  const result = await pool.query(
    `UPDATE agendamentos SET status=$2, atualizado_em=NOW() WHERE id_agendamento=$1
     RETURNING id_agendamento, id_cliente, id_prestador, id_servico, data_hora_inicio, data_hora_fim, status, observacoes`,
    [id, status]
  );
  return res.json({ message: `Agendamento atualizado para ${status}.`, appointment: result.rows[0] });
}));

export default router;
