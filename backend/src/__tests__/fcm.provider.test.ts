import { afterEach, describe, expect, it, vi } from 'vitest';
import { chaveConfigurada, enviarPush } from '../messaging/fcm.provider';

describe('provedor FCM (Firebase Cloud Messaging)', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('opera em modo simulado sem FCM_SERVER_KEY', async () => {
    vi.stubEnv('FCM_SERVER_KEY', '');
    expect(chaveConfigurada()).toBe(false);
    const resultado = await enviarPush('token-do-dispositivo-123456', { titulo: 'T', corpo: 'C' });
    expect(resultado.provedor).toBe('simulado');
    expect(resultado.entregue).toBe(false);
  });

  it('envia POST ao endpoint do FCM com a chave configurada', async () => {
    vi.stubEnv('FCM_SERVER_KEY', 'chave-google-de-teste');
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const resultado = await enviarPush('token-do-dispositivo-123456', {
      titulo: 'Agendamento confirmado',
      corpo: 'Seu horário foi registrado.',
      dados: { id_agendamento: 42 }
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://fcm.googleapis.com/fcm/send');
    expect(init.method).toBe('POST');
    expect(init.headers.Authorization).toBe('key=chave-google-de-teste');
    const corpo = JSON.parse(init.body);
    expect(corpo.to).toBe('token-do-dispositivo-123456');
    expect(corpo.notification.title).toBe('Agendamento confirmado');
    expect(corpo.data.id_agendamento).toBe('42'); // FCM exige valores string
    expect(resultado.entregue).toBe(true);
    expect(resultado.provedor).toBe('fcm');
  });

  it('reporta falha sem lançar erro quando o FCM responde com erro HTTP', async () => {
    vi.stubEnv('FCM_SERVER_KEY', 'chave-google-de-teste');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('erro', { status: 401 })));
    const resultado = await enviarPush('token', { titulo: 'T', corpo: 'C' });
    expect(resultado.entregue).toBe(false);
    expect(resultado.detalhe).toContain('401');
  });
});
