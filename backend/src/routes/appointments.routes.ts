import { Router, Request, Response } from 'express';
import { db, Agendamento } from '../database/db';

const router = Router();

// RF05 - Consulta de Horários Livres (Slots) disponíveis (RNF01 < 2s)
router.get('/available-slots', (req: Request, res: Response) => {
  const inicioTimer = performance.now();
  const { providerId, serviceId, date } = req.query;

  if (!providerId || !serviceId || !date) {
    return res.status(400).json({ error: 'Parâmetros obrigatórios: providerId, serviceId, date (AAAA-MM-DD)' });
  }

  const pId = parseInt(providerId as string);
  const sId = parseInt(serviceId as string);
  const dataConsulta = new Date(date as string);

  if (isNaN(dataConsulta.getTime())) {
    return res.status(400).json({ error: 'Formato de data inválido. Use AAAA-MM-DD.' });
  }

  const servico = db.servicos.find(s => s.id_servico === sId && s.ativo);
  if (!servico) {
    return res.status(404).json({ error: 'Serviço não encontrado ou inativo.' });
  }

  const diaSemana = dataConsulta.getUTCDay();
  const jornada = db.jornadas.find(j => j.id_prestador === pId && j.dia_semana === diaSemana && j.ativo);

  if (!jornada) {
    return res.json({
      date,
      availableSlots: [],
      message: 'O prestador não possui expediente configurado para este dia da semana.'
    });
  }

  // Obter agendamentos existentes para o prestador na data
  const dataString = (date as string);
  const agendamentosExistentes = db.agendamentos.filter(a => 
    a.id_prestador === pId &&
    a.status !== 'Cancelado' &&
    a.data_hora_inicio.startsWith(dataString)
  );

  // Geração de slots considerando duração do serviço e intervalos
  const [hIni, mIni] = jornada.hora_inicio.split(':').map(Number);
  const [hFim, mFim] = jornada.hora_fim.split(':').map(Number);
  const duracao = servico.duracao_minutos;

  const slotsDisponiveis: { inicio: string; fim: string }[] = [];

  let minutoAtual = hIni * 60 + mIni;
  const minutoFimExpediente = hFim * 60 + mFim;

  while (minutoAtual + duracao <= minutoFimExpediente) {
    const slotInicioMin = minutoAtual;
    const slotFimMin = minutoAtual + duracao;

    const horaInicioStr = `${String(Math.floor(slotInicioMin / 60)).padStart(2, '0')}:${String(slotInicioMin % 60).padStart(2, '0')}`;
    const horaFimStr = `${String(Math.floor(slotFimMin / 60)).padStart(2, '0')}:${String(slotFimMin % 60).padStart(2, '0')}`;

    // Verificar se colide com o intervalo de almoço
    let emIntervalo = false;
    if (jornada.inicio_intervalo && jornada.fim_intervalo) {
      const [hIntIni, mIntIni] = jornada.inicio_intervalo.split(':').map(Number);
      const [hIntFim, mIntFim] = jornada.fim_intervalo.split(':').map(Number);
      const intIniMin = hIntIni * 60 + mIntIni;
      const intFimMin = hIntFim * 60 + mIntFim;

      // Se o slot sobrepuser o intervalo
      if (slotInicioMin < intFimMin && slotFimMin > intIniMin) {
        emIntervalo = true;
      }
    }

    // Verificar colisão com agendamentos existentes (RF07)
    const slotIsoInicio = `${dataString}T${horaInicioStr}:00.000Z`;
    const slotIsoFim = `${dataString}T${horaFimStr}:00.000Z`;

    const temConflito = agendamentosExistentes.some(ag => {
      return (slotIsoInicio < ag.data_hora_fim && slotIsoFim > ag.data_hora_inicio);
    });

    if (!emIntervalo && !temConflito) {
      slotsDisponiveis.push({
        inicio: horaInicioStr,
        fim: horaFimStr
      });
    }

    minutoAtual += 30; // Intervalo de passo para novos horários
  }

  const fimTimer = performance.now();
  const tempoExecucaoMs = parseFloat((fimTimer - inicioTimer).toFixed(2));

  return res.json({
    date,
    providerId: pId,
    service: {
      id: servico.id_servico,
      titulo: servico.titulo,
      duracao_minutos: servico.duracao_minutos,
      preco: servico.preco
    },
    totalDisponivel: slotsDisponiveis.length,
    slots: slotsDisponiveis,
    tempoExecucaoMs,
    rnf01_status: tempoExecucaoMs < 2000 ? 'ATENDIDO (< 2s)' : 'VIOLADO'
  });
});

// RF06 & RF07 - Criar Agendamento com Algoritmo Anti-Sobreposição (Double-Booking)
router.post('/', (req: Request, res: Response) => {
  const { id_cliente, id_prestador, id_servico, data_hora_inicio, data_hora_fim, observacoes } = req.body;

  if (!id_cliente || !id_prestador || !id_servico || !data_hora_inicio || !data_hora_fim) {
    return res.status(400).json({
      error: 'Campos obrigatórios: id_cliente, id_prestador, id_servico, data_hora_inicio, data_hora_fim'
    });
  }

  const iniNovo = new Date(data_hora_inicio).getTime();
  const fimNovo = new Date(data_hora_fim).getTime();

  if (isNaN(iniNovo) || isNaN(fimNovo) || fimNovo <= iniNovo) {
    return res.status(400).json({ error: 'Intervalo de datas e horários inválido.' });
  }

  // RF07: Validação rigorosa de conflito de agenda (Anti-Double-Booking)
  const conflito = db.agendamentos.some(ag => {
    if (ag.id_prestador !== Number(id_prestador) || ag.status === 'Cancelado') {
      return false;
    }
    const agIni = new Date(ag.data_hora_inicio).getTime();
    const agFim = new Date(ag.data_hora_fim).getTime();

    // Condição de sobreposição: início do novo antes do fim do existente E fim do novo após o início do existente
    return (iniNovo < agFim && fimNovo > agIni);
  });

  if (conflito) {
    return res.status(409).json({
      error: 'Conflito de agendamento (Double-Booking detectado)',
      message: 'O prestador já possui um compromisso ativo neste mesmo intervalo de horário. Por favor, escolha outro slot livre.'
    });
  }

  const novoAgendamento: Agendamento = {
    id_agendamento: db.agendamentos.length + 1,
    id_cliente: Number(id_cliente),
    id_prestador: Number(id_prestador),
    id_servico: Number(id_servico),
    data_hora_inicio,
    data_hora_fim,
    status: 'Confirmado',
    observacoes: observacoes || ''
  };

  db.agendamentos.push(novoAgendamento);

  return res.status(201).json({
    message: 'Agendamento confirmado com sucesso!',
    appointment: novoAgendamento
  });
});

// Listar Agendamentos (com filtros por prestador ou cliente)
router.get('/', (req: Request, res: Response) => {
  const { providerId, clientId, status } = req.query;

  let resultado = db.agendamentos;

  if (providerId) {
    resultado = resultado.filter(a => a.id_prestador === parseInt(providerId as string));
  }
  if (clientId) {
    resultado = resultado.filter(a => a.id_cliente === parseInt(clientId as string));
  }
  if (status) {
    resultado = resultado.filter(a => a.status === status);
  }

  // Enriquecer com dados de cliente e serviço
  const agendamentosEnriquecidos = resultado.map(ag => {
    const cliente = db.usuarios.find(u => u.id_usuario === ag.id_cliente);
    const servico = db.servicos.find(s => s.id_servico === ag.id_servico);
    return {
      ...ag,
      cliente_nome: cliente?.nome || 'Cliente Desconhecido',
      cliente_telefone: cliente?.telefone || '',
      servico_titulo: servico?.titulo || 'Serviço Removido',
      servico_preco: servico?.preco || 0
    };
  });

  return res.json({
    total: agendamentosEnriquecidos.length,
    appointments: agendamentosEnriquecidos
  });
});

// RF08 - Cancelamento e Atualização de Status
router.patch('/:id/status', (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const { status } = req.body;

  const statusPermitidos = ['Pendente', 'Confirmado', 'Cancelado', 'Concluído'];
  if (!status || !statusPermitidos.includes(status)) {
    return res.status(400).json({ error: `Status inválido. Valores aceitos: ${statusPermitidos.join(', ')}` });
  }

  const agendamento = db.agendamentos.find(a => a.id_agendamento === id);
  if (!agendamento) {
    return res.status(404).json({ error: 'Agendamento não encontrado.' });
  }

  agendamento.status = status as any;
  return res.json({
    message: `Status do agendamento alterado para '${status}' com sucesso!`,
    appointment: agendamento
  });
});

export default router;
