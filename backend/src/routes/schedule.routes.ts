import { Router, Request, Response } from 'express';
import { db } from '../database/db';

const router = Router();

// RF04 - Obter Jornada de Trabalho do Prestador
router.get('/:providerId', (req: Request, res: Response) => {
  const providerId = parseInt(req.params.providerId);
  const jornadas = db.jornadas.filter(j => j.id_prestador === providerId && j.ativo);

  return res.json({
    providerId,
    schedules: jornadas
  });
});

// RF04 - Configurar/Atualizar Jornada de Trabalho
router.post('/', (req: Request, res: Response) => {
  const { id_prestador, dia_semana, hora_inicio, hora_fim, inicio_intervalo, fim_intervalo } = req.body;

  if (id_prestador === undefined || dia_semana === undefined || !hora_inicio || !hora_fim) {
    return res.status(400).json({ error: 'Campos obrigatórios: id_prestador, dia_semana, hora_inicio, hora_fim' });
  }

  // Verificar se já existe jornada para esse dia
  const index = db.jornadas.findIndex(j => j.id_prestador === Number(id_prestador) && j.dia_semana === Number(dia_semana));

  const novaJornada = {
    id_jornada: index !== -1 ? db.jornadas[index].id_jornada : db.jornadas.length + 1,
    id_prestador: Number(id_prestador),
    dia_semana: Number(dia_semana),
    hora_inicio,
    hora_fim,
    inicio_intervalo,
    fim_intervalo,
    ativo: true
  };

  if (index !== -1) {
    db.jornadas[index] = novaJornada;
  } else {
    db.jornadas.push(novaJornada);
  }

  return res.status(201).json({
    message: 'Jornada de trabalho atualizada com sucesso!',
    schedule: novaJornada
  });
});

export default router;
