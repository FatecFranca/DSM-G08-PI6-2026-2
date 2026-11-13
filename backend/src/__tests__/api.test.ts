import jwt from 'jsonwebtoken';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

// Pool do pg substituído por dublê: nenhum banco real é usado nos testes de API
const queryMock = vi.fn().mockResolvedValue({ rows: [], rowCount: 1 });
vi.mock('../database/db', () => ({ pool: { query: (...args: unknown[]) => queryMock(...args as []) } }));

let app: typeof import('../app')['app'];
let tokenCliente: string;

beforeAll(async () => {
  ({ app } = await import('../app'));
  tokenCliente = jwt.sign(
    { id_usuario: 1, email: 'cliente@exemplo.com', tipo_perfil: 'Cliente' },
    process.env.JWT_SECRET!,
    { expiresIn: '1h' }
  );
});

afterAll(() => {
  vi.resetModules();
});

describe('GET /health', () => {
  it('responde online quando o banco responde', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ '?column?': 1 }], rowCount: 1 });
    const resposta = await request(app).get('/health');
    expect(resposta.status).toBe(200);
    expect(resposta.body.status).toBe('online');
  });

  it('responde degradado quando o banco falha', async () => {
    queryMock.mockRejectedValueOnce(new Error('conexão recusada'));
    const resposta = await request(app).get('/health');
    expect(resposta.status).toBe(503);
    expect(resposta.body.status).toBe('degraded');
  });
});

describe('POST /api/ai/sentiment-analysis (RF10/RNF02)', () => {
  it('valida texto ausente', async () => {
    const resposta = await request(app).post('/api/ai/sentiment-analysis').send({ nota: 5 });
    expect(resposta.status).toBe(400);
    expect(resposta.body.error).toMatch(/texto/i);
  });

  it('valida nota fora do intervalo 1-5', async () => {
    const resposta = await request(app).post('/api/ai/sentiment-analysis').send({ texto: 'bom', nota: 9 });
    expect(resposta.status).toBe(400);
    expect(resposta.body.error).toMatch(/nota/);
  });

  it('classifica comentário e informa o modelo e a latência', async () => {
    const resposta = await request(app)
      .post('/api/ai/sentiment-analysis')
      .send({ texto: 'Atendimento impecável, muito rápido e atencioso.', nota: 5 });
    expect(resposta.status).toBe(200);
    expect(resposta.body.prediction.modelo).toBe('tfidf-regressao-logistica');
    expect(resposta.body.prediction.sentimento).toBe('Positivo');
    expect(resposta.body.performance.rnf02_status).toContain('ATENDIDO');
  });
});

describe('autenticação (middleware JWT)', () => {
  it('bloqueia requisição sem token', async () => {
    const resposta = await request(app).get('/api/notifications');
    expect(resposta.status).toBe(401);
  });

  it('bloqueia token inválido', async () => {
    const resposta = await request(app)
      .get('/api/notifications')
      .set('Authorization', 'Bearer token-invalido');
    expect(resposta.status).toBe(401);
  });
});

describe('POST /api/reviews (RF09)', () => {
  it('valida corpo incompleto antes de tocar o banco', async () => {
    queryMock.mockClear();
    const resposta = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send({ nota: 5 });
    expect(resposta.status).toBe(400);
    expect(queryMock).not.toHaveBeenCalled();
  });

  it('exige perfil de cliente', async () => {
    const tokenPrestador = jwt.sign(
      { id_usuario: 2, email: 'p@e.com', tipo_perfil: 'Prestador' },
      process.env.JWT_SECRET!
    );
    const resposta = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${tokenPrestador}`)
      .send({ id_agendamento: 1, nota: 5, comentario: 'bom demais' });
    expect(resposta.status).toBe(403);
  });
});

describe('mensageria: /api/notifications', () => {
  it('GET /status informa o barramento e o estado da chave FCM', async () => {
    const resposta = await request(app).get('/api/notifications/status');
    expect(resposta.status).toBe(200);
    expect(resposta.body.mensageria.barramento).toContain('publish/subscribe');
    expect(typeof resposta.body.mensageria.push.chaveConfigurada).toBe('boolean');
  });

  it('POST /device valida o token do dispositivo', async () => {
    const resposta = await request(app)
      .post('/api/notifications/device')
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send({ token: 'curto' });
    expect(resposta.status).toBe(400);
  });

  it('POST /device valida a plataforma', async () => {
    const resposta = await request(app)
      .post('/api/notifications/device')
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send({ token: 'token-valido-de-dispositivo', plataforma: 'smart-tv' });
    expect(resposta.status).toBe(400);
  });

  it('POST /device registra o dispositivo (upsert)', async () => {
    queryMock.mockResolvedValueOnce({ rows: [], rowCount: 1 });
    const resposta = await request(app)
      .post('/api/notifications/device')
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send({ token: 'token-fcm-gerado-pelo-app', plataforma: 'mobile' });
    expect(resposta.status).toBe(201);
  });

  it('GET / lista notificações do usuário autenticado', async () => {
    queryMock.mockResolvedValueOnce({
      rows: [{ id_notificacao: 1, tipo: 'agendamento.criado', titulo: 'T', corpo: 'C', dados: {}, lida: false, criado_em: new Date().toISOString() }],
      rowCount: 1
    });
    const resposta = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${tokenCliente}`);
    expect(resposta.status).toBe(200);
    expect(resposta.body.notifications[0].tipo).toBe('agendamento.criado');
  });
});
