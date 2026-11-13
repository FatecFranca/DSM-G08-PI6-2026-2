// Serviço de notificações: consumidor do barramento de eventos (mensageria).
// Ao receber eventos de agendamento, persiste uma notificação in-app para os
// envolvidos e despacha push via Firebase Cloud Messaging para os dispositivos
// registrados. Falhas de mensageria nunca propagam para o fluxo de negócio.

import { pool } from '../database/db';
import { inscrever, TipoEvento } from './event-bus';
import { iniciarConsumidorServiceBus, serviceBusConfigurado } from './service-bus';
import { chaveConfigurada, enviarPush } from './fcm.provider';

interface DadosAgendamento {
  id_agendamento: number;
  id_cliente: number;
  id_prestador: number;
  id_servico: number;
  status?: string;
  status_anterior?: string;
}

interface ContextoAgendamento {
  clienteNome: string;
  prestadorNome: string;
  servicoTitulo: string;
}

async function carregarContexto(dados: DadosAgendamento): Promise<ContextoAgendamento | null> {
  const resultado = await pool.query(
    `SELECT c.nome AS cliente_nome, p.nome AS prestador_nome, s.titulo AS servico_titulo
     FROM agendamentos a
     JOIN usuarios c ON c.id_usuario = a.id_cliente
     JOIN usuarios p ON p.id_usuario = a.id_prestador
     JOIN servicos s ON s.id_servico = a.id_servico
     WHERE a.id_agendamento = $1`,
    [dados.id_agendamento]
  );
  const linha = resultado.rows[0];
  if (!linha) return null;
  return {
    clienteNome: linha.cliente_nome,
    prestadorNome: linha.prestador_nome,
    servicoTitulo: linha.servico_titulo
  };
}

async function notificarUsuario(
  idUsuario: number,
  tipo: string,
  titulo: string,
  corpo: string,
  dados: Record<string, unknown>
): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO notifications (id_usuario, tipo, titulo, corpo, dados)
       VALUES ($1, $2, $3, $4, $5::jsonb)`,
      [idUsuario, tipo, titulo, corpo, JSON.stringify(dados)]
    );
    const tokens = await pool.query(
      'SELECT token FROM device_tokens WHERE id_usuario = $1',
      [idUsuario]
    );
    for (const linha of tokens.rows) {
      await enviarPush(linha.token, { titulo, corpo, dados });
    }
  } catch (erro) {
    console.error('[NOTIFICACOES] Falha ao notificar usuário:', erro);
  }
}

async function processarMensagem(tipo: TipoEvento, dadosBrutos: Record<string, unknown>) {
    const dados = dadosBrutos as unknown as DadosAgendamento;
    if (!Number.isInteger(dados?.id_agendamento)) return;
    const contexto = await carregarContexto(dados).catch(() => null);
    if (!contexto) return;
    const base = { id_agendamento: dados.id_agendamento, evento: tipo };

    if (tipo === 'agendamento.criado') {
      await notificarUsuario(
        dados.id_prestador,
        tipo,
        'Novo agendamento recebido',
        `${contexto.clienteNome} agendou "${contexto.servicoTitulo}".`,
        base
      );
      await notificarUsuario(
        dados.id_cliente,
        tipo,
        'Agendamento confirmado',
        `Seu horário de "${contexto.servicoTitulo}" com ${contexto.prestadorNome} foi registrado.`,
        base
      );
      return;
    }

    const novoStatus = dados.status || '';
    await notificarUsuario(
      dados.id_cliente,
      tipo,
      `Agendamento ${novoStatus.toLowerCase()}`,
      `O agendamento de "${contexto.servicoTitulo}" agora está ${novoStatus}.`,
      base
    );
    await notificarUsuario(
      dados.id_prestador,
      tipo,
      `Agendamento ${novoStatus.toLowerCase()}`,
      `O agendamento de "${contexto.servicoTitulo}" agora está ${novoStatus}.`,
      base
    );
}

/** Registra os consumidores do barramento. Deve ser chamado uma única vez na inicialização. */
export function inicializarConsumidorNotificacoes(): void {
  if (serviceBusConfigurado()) {
    // Mensageria gerenciada: consome mensagens da fila do Azure Service Bus
    iniciarConsumidorServiceBus(processarMensagem);
  } else {
    // Fallback em processo: assina o barramento local
    const eventos: TipoEvento[] = ['agendamento.criado', 'agendamento.atualizado'];
    for (const tipo of eventos) {
      inscrever(tipo, evento => { void processarMensagem(tipo, evento.dados); });
    }
  }
  console.log(
    `[NOTIFICACOES] Consumidor ${serviceBusConfigurado() ? 'Azure Service Bus (fila gerenciada)' : 'em processo (fallback)'} ativo; push ${chaveConfigurada() ? 'FCM configurado' : 'em modo simulado - defina FCM_SERVER_KEY'}.`
  );
}
