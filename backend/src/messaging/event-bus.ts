// Barramento de eventos para intercomunicação entre os módulos da API
// (protocolo de mensageria da disciplina-chave). Quando a Azure Service Bus
// está configurada, as mensagens são publicadas na fila gerenciada da nuvem;
// sem essa configuração, o barramento opera em processo (publish/subscribe
// local) mantendo a mesma interface. Para trocar por outro broker
// (RabbitMQ, SQS...), basta reimplementar o módulo preservando a assinatura.

export type TipoEvento =
  | 'agendamento.criado'
  | 'agendamento.atualizado';

export interface Evento<T = Record<string, unknown>> {
  tipo: TipoEvento;
  ocorreuEm: string;
  dados: T;
}

type Manipulador = (evento: Evento) => void | Promise<void>;

import { publicarViaServiceBus, serviceBusConfigurado } from './service-bus';

const assinantes = new Map<TipoEvento, Set<Manipulador>>();

export function inscrever(tipo: TipoEvento, manipulador: Manipulador): () => void {
  const conjunto = assinantes.get(tipo) || new Set<Manipulador>();
  conjunto.add(manipulador);
  assinantes.set(tipo, conjunto);
  return () => conjunto.delete(manipulador);
}

/**
 * Publica uma mensagem no barramento. Os assinantes são executados de forma
 * assíncrona e isolada: uma falha de consumidor (ex.: push indisponível) nunca
 * propaga para o fluxo de negócio que publicou o evento.
 */
export function publicar<T extends Record<string, unknown>>(tipo: TipoEvento, dados: T): void {
  // Azure Service Bus configurado => publica na fila gerenciada da nuvem
  if (serviceBusConfigurado()) {
    void publicarViaServiceBus(tipo, dados)
      .catch(erro => console.error(`[BARRAMENTO] Falha ao publicar ${tipo} na Service Bus:`, erro));
    return;
  }
  const evento: Evento<T> = { tipo, ocorreuEm: new Date().toISOString(), dados };
  const conjunto = assinantes.get(tipo);
  if (!conjunto || conjunto.size === 0) {
    console.warn(`[BARRAMENTO] Evento ${tipo} publicado sem assinantes.`);
    return;
  }
  for (const manipulador of conjunto) {
    void Promise.resolve()
      .then(() => manipulador(evento))
      .catch(erro => console.error(`[BARRAMENTO] Falha no assinante de ${tipo}:`, erro));
  }
}
