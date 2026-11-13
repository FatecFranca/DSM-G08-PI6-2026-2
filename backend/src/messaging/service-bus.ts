// Adaptador do Azure Service Bus (mensageria gerenciada da própria nuvem Azure).
// Publica os eventos de agendamento em uma fila do Service Bus e consome as
// mensagens no mesmo processo da API, com complete/abandon (peek-lock).
// Configuração por ambiente:
//   AZURE_SERVICE_BUS_CONNECTION_STRING - cadeia de conexão do namespace
//   AZURE_SERVICE_BUS_QUEUE             - nome da fila (padrão: agendou-eventos)

import { ServiceBusClient, type ServiceBusReceivedMessage } from '@azure/service-bus';
import type { TipoEvento } from './event-bus';

export function serviceBusConfigurado(): boolean {
  return Boolean(process.env.AZURE_SERVICE_BUS_CONNECTION_STRING);
}

export function nomeFila(): string {
  return process.env.AZURE_SERVICE_BUS_QUEUE || 'agendou-eventos';
}

let cliente: ServiceBusClient | null = null;
let remetente: ReturnType<ServiceBusClient['createSender']> | null = null;

function obterRemetente(): ReturnType<ServiceBusClient['createSender']> {
  if (!remetente) {
    cliente = new ServiceBusClient(process.env.AZURE_SERVICE_BUS_CONNECTION_STRING!);
    remetente = cliente.createSender(nomeFila());
    console.log(`[SERVICE BUS] Produtor conectado à fila ${nomeFila()}.`);
  }
  return remetente!;
}

export async function publicarViaServiceBus(
  tipo: TipoEvento,
  dados: Record<string, unknown>
): Promise<void> {
  await obterRemetente().sendMessages({
    body: { tipo, ocorreuEm: new Date().toISOString(), dados },
    applicationProperties: { tipo },
    contentType: 'application/json'
  });
}

/**
 * Consome mensagens da fila. Sucesso => complete (autoComplete);
 * falha no processamento => a mensagem é abandonada e volta à fila.
 */
export function iniciarConsumidorServiceBus(
  processar: (tipo: TipoEvento, dados: Record<string, unknown>) => Promise<void>
): void {
  const clienteConsumidor = new ServiceBusClient(process.env.AZURE_SERVICE_BUS_CONNECTION_STRING!);
  const receiver = clienteConsumidor.createReceiver(nomeFila());
  receiver.subscribe({
    processMessage: async (mensagem: ServiceBusReceivedMessage) => {
      const tipo = (mensagem.applicationProperties?.tipo as TipoEvento) ||
        (mensagem.body as { tipo?: TipoEvento } | null)?.tipo;
      if (!tipo) {
        console.warn('[SERVICE BUS] Mensagem sem tipo conhecido ignorada:', mensagem.messageId);
        return;
      }
      const dados = (mensagem.body as { dados?: Record<string, unknown> } | null)?.dados || {};
      await processar(tipo, dados);
    },
    processError: async args => {
      console.error('[SERVICE BUS] Erro no consumidor:', args.error);
    }
  });
  console.log(`[SERVICE BUS] Consumidor conectado à fila ${nomeFila()} (peek-lock, complete/abandon).`);
}
