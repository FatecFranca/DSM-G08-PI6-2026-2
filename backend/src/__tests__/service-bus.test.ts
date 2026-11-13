import { beforeEach, describe, expect, it, vi } from 'vitest';

const sendMock = vi.fn().mockResolvedValue(undefined);
const processarMock = vi.fn().mockResolvedValue(undefined);
let processMessage: ((m: unknown) => Promise<void>) | null = null;
const subscribeMock = vi.fn(handlers => { processMessage = handlers.processMessage; });

vi.mock('@azure/service-bus', () => ({
  ServiceBusClient: vi.fn(() => ({
    createSender: vi.fn(() => ({ sendMessages: sendMock })),
    createReceiver: vi.fn(() => ({ subscribe: subscribeMock }))
  }))
}));

async function importarModulos() {
  vi.resetModules();
  const sb = await import('../messaging/service-bus');
  const eb = await import('../messaging/event-bus');
  return { sb, eb };
}

describe('Azure Service Bus (mensageria da nuvem)', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    sendMock.mockClear();
    processarMock.mockClear();
    subscribeMock.mockClear();
    processMessage = null;
  });

  it('sem cadeia de conexão: barramento em processo', async () => {
    const { sb } = await importarModulos();
    expect(sb.serviceBusConfigurado()).toBe(false);
  });

  it('publica na fila da Service Bus com tipo e dados', async () => {
    vi.stubEnv('AZURE_SERVICE_BUS_CONNECTION_STRING', 'Endpoint=sb://agendou.servicebus.windows.net/;SharedAccessKey=abc');
    const { sb } = await importarModulos();
    expect(sb.serviceBusConfigurado()).toBe(true);
    await sb.publicarViaServiceBus('agendamento.criado', { id_agendamento: 7 });
    expect(sendMock).toHaveBeenCalledTimes(1);
    const mensagem = sendMock.mock.calls[0][0];
    expect(mensagem.body.tipo).toBe('agendamento.criado');
    expect(mensagem.body.dados).toEqual({ id_agendamento: 7 });
    expect(mensagem.applicationProperties.tipo).toBe('agendamento.criado');
  });

  it('usa o nome de fila configurado (AZURE_SERVICE_BUS_QUEUE)', async () => {
    vi.stubEnv('AZURE_SERVICE_BUS_CONNECTION_STRING', 'Endpoint=sb://x/;SharedAccessKey=abc');
    vi.stubEnv('AZURE_SERVICE_BUS_QUEUE', 'fila-teste');
    const { sb } = await importarModulos();
    expect(sb.nomeFila()).toBe('fila-teste');
  });

  it('publicar() do barramento roteia para a Service Bus quando configurada', async () => {
    vi.stubEnv('AZURE_SERVICE_BUS_CONNECTION_STRING', 'Endpoint=sb://x/;SharedAccessKey=abc');
    const { eb } = await importarModulos();
    const local = vi.fn();
    eb.inscrever('agendamento.criado', local);
    eb.publicar('agendamento.criado', { id_agendamento: 9 });
    await new Promise(r => setTimeout(r, 20));
    expect(sendMock).toHaveBeenCalledTimes(1);   // foi para a fila da Azure
    expect(local).not.toHaveBeenCalled();        // e não para o barramento local
  });

  it('publicar() do barramento usa o processo local sem Service Bus', async () => {
    const { eb } = await importarModulos();
    const local = vi.fn();
    eb.inscrever('agendamento.atualizado', local);
    eb.publicar('agendamento.atualizado', { id_agendamento: 10, status: 'Cancelado' });
    await new Promise(r => setTimeout(r, 20));
    expect(local).toHaveBeenCalledTimes(1);
    expect(sendMock).not.toHaveBeenCalled();
  });

  it('consumidor entrega tipo e dados ao processador', async () => {
    vi.stubEnv('AZURE_SERVICE_BUS_CONNECTION_STRING', 'Endpoint=sb://x/;SharedAccessKey=abc');
    const { sb } = await importarModulos();
    sb.iniciarConsumidorServiceBus(processarMock);
    expect(subscribeMock).toHaveBeenCalledTimes(1);
    await processMessage!({
      applicationProperties: { tipo: 'agendamento.atualizado' },
      body: { tipo: 'agendamento.atualizado', dados: { id_agendamento: 11, status: 'Concluído' } }
    });
    expect(processarMock).toHaveBeenCalledWith('agendamento.atualizado', { id_agendamento: 11, status: 'Concluído' });
  });

  it('consumidor lê o tipo do corpo quando não há applicationProperties', async () => {
    vi.stubEnv('AZURE_SERVICE_BUS_CONNECTION_STRING', 'Endpoint=sb://x/;SharedAccessKey=abc');
    const { sb } = await importarModulos();
    sb.iniciarConsumidorServiceBus(processarMock);
    await processMessage!({ applicationProperties: {}, body: { tipo: 'agendamento.criado', dados: { id_agendamento: 12 } } });
    expect(processarMock).toHaveBeenCalledWith('agendamento.criado', { id_agendamento: 12 });
  });
});
