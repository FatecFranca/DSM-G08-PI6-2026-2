import jwt from 'jsonwebtoken';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

// Pool do pg substituído por dublê: nenhum banco real é usado nos testes de API
const queryMock = vi.fn().mockResolvedValue({ rows: [], rowCount: 1 });
vi.mock('../database/db', () => ({ pool: { query: (...args: unknown[]) => queryMock(...args as []) } }));

let app: typeof import('../app')['app'];
let tokenCliente: string;
let tokenPrestador: string;

beforeAll(async () => {
  ({ app } = await import('../app'));
  tokenCliente = jwt.sign(
    { id_usuario: 2, email: 'cliente@exemplo.com', tipo_perfil: 'Cliente' },
    process.env.JWT_SECRET!,
    { expiresIn: '1h' }
  );
  tokenPrestador = jwt.sign(
    { id_usuario: 1, email: 'prestador@exemplo.com', tipo_perfil: 'Prestador' },
    process.env.JWT_SECRET!,
    { expiresIn: '1h' }
  );
});

afterAll(() => {
  vi.resetModules();
});

const conversa = { id_conversa: 7, id_agendamento: 3, id_cliente: 2, id_prestador: 1 };

describe('POST /api/chat/conversations (abertura idempotente)', () => {
  it('exige id_agendamento válido', async () => {
    const resposta = await request(app)
      .post('/api/chat/conversations')
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send({ id_agendamento: 0 });
    expect(resposta.status).toBe(400);
  });

  it('exige autenticação', async () => {
    const resposta = await request(app).post('/api/chat/conversations').send({ id_agendamento: 3 });
    expect(resposta.status).toBe(401);
  });

  it('recusa usuário que não participa do agendamento', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ id_agendamento: 3, id_cliente: 2, id_prestador: 1 }], rowCount: 1 });
    const tokenFora = jwt.sign(
      { id_usuario: 99, email: 'outro@exemplo.com', tipo_perfil: 'Cliente' },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );
    const resposta = await request(app)
      .post('/api/chat/conversations')
      .set('Authorization', `Bearer ${tokenFora}`)
      .send({ id_agendamento: 3 });
    expect(resposta.status).toBe(403);
  });

  it('participante abre a conversa e recebe o id', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ id_agendamento: 3, id_cliente: 2, id_prestador: 1 }], rowCount: 1 });
    queryMock.mockResolvedValueOnce({ rows: [{ id_conversa: 7 }], rowCount: 1 });
    const resposta = await request(app)
      .post('/api/chat/conversations')
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send({ id_agendamento: 3 });
    expect(resposta.status).toBe(201);
    expect(resposta.body.id_conversa).toBe(7);
  });
});

describe('POST /api/chat/conversations/:id/messages (envio + mensageria)', () => {
  it('recusa mensagem vazia ou acima do limite', async () => {
    // Validação de texto ocorre antes de qualquer consulta ao banco
    const vazia = await request(app)
      .post('/api/chat/conversations/7/messages')
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send({ texto: '   ' });
    expect(vazia.status).toBe(400);
    const longa = await request(app)
      .post('/api/chat/conversations/7/messages')
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send({ texto: 'x'.repeat(2001) });
    expect(longa.status).toBe(400);
  });

  it('recusa usuário fora da conversa', async () => {
    queryMock.mockResolvedValueOnce({ rows: [conversa], rowCount: 1 });
    const tokenFora = jwt.sign(
      { id_usuario: 99, email: 'outro@exemplo.com', tipo_perfil: 'Prestador' },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );
    const resposta = await request(app)
      .post('/api/chat/conversations/7/messages')
      .set('Authorization', `Bearer ${tokenFora}`)
      .send({ texto: 'olá' });
    expect(resposta.status).toBe(403);
  });

  it('participante envia mensagem e persiste o texto', async () => {
    queryMock.mockResolvedValueOnce({ rows: [conversa], rowCount: 1 });
    queryMock.mockResolvedValueOnce({ rows: [{ nome: 'Mariana Silva' }], rowCount: 1 });
    queryMock.mockResolvedValueOnce({
      rows: [{ id_mensagem: 10, id_conversa: 7, id_autor: 2, texto: 'Olá!', lida: false, criada_em: new Date() }],
      rowCount: 1
    });
    queryMock.mockResolvedValueOnce({ rows: [], rowCount: 1 });
    const resposta = await request(app)
      .post('/api/chat/conversations/7/messages')
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send({ texto: 'Olá!' });
    expect(resposta.status).toBe(201);
    expect(resposta.body.mensagem.texto).toBe('Olá!');
  });
});

describe('GET /api/chat/conversations (listagem e leitura)', () => {
  it('participante lê as mensagens da conversa', async () => {
    queryMock.mockResolvedValueOnce({ rows: [conversa], rowCount: 1 });
    queryMock.mockResolvedValueOnce({ rows: [], rowCount: 0 });
    queryMock.mockResolvedValueOnce({ rows: [], rowCount: 0 });
    queryMock.mockResolvedValueOnce({ rows: [], rowCount: 1 });
    const resposta = await request(app)
      .get('/api/chat/conversations/7/messages')
      .set('Authorization', `Bearer ${tokenPrestador}`);
    expect(resposta.status).toBe(200);
  });
});
