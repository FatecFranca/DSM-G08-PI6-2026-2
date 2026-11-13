import { describe, expect, it, vi } from 'vitest';
import { inscrever, publicar } from '../messaging/event-bus';

describe('barramento de eventos (mensageria)', () => {
  it('entrega o evento publicado aos assinantes', async () => {
    const manipulador = vi.fn();
    const cancelar = inscrever('agendamento.criado', manipulador);
    publicar('agendamento.criado', { id_agendamento: 1 });
    await new Promise(resolve => setTimeout(resolve, 20));
    expect(manipulador).toHaveBeenCalledTimes(1);
    expect(manipulador.mock.calls[0][0].dados).toEqual({ id_agendamento: 1 });
    expect(typeof manipulador.mock.calls[0][0].ocorreuEm).toBe('string');
    cancelar();
  });

  it('não entrega eventos para assinantes de outro tipo', async () => {
    const manipulador = vi.fn();
    inscrever('agendamento.atualizado', manipulador);
    publicar('agendamento.criado', { id_agendamento: 2 });
    await new Promise(resolve => setTimeout(resolve, 20));
    expect(manipulador).not.toHaveBeenCalled();
  });

  it('isola a falha de um consumidor sem afetar os demais', async () => {
    const falhou = vi.fn().mockRejectedValue(new Error('push fora do ar'));
    const sucesso = vi.fn();
    inscrever('agendamento.atualizado', falhou);
    inscrever('agendamento.atualizado', sucesso);
    publicar('agendamento.atualizado', { id_agendamento: 3, status: 'Cancelado' });
    await new Promise(resolve => setTimeout(resolve, 20));
    expect(falhou).toHaveBeenCalledTimes(1);
    expect(sucesso).toHaveBeenCalledTimes(1);
  });
});
