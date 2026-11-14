// Chat 1:1 entre Cliente e Prestador, vinculado ao agendamento (conversas).
// As mensagens são persistidas em mensagens_chat e o envio publica o evento
// 'chat.mensagem_recebida' no barramento de mensageria — que roteia para a
// Azure Service Bus em produção ou opera em processo no fallback — gerando
// notificação in-app e push FCM para o destinatário, como nos agendamentos.
import { Router, Response } from 'express';
import { pool } from '../database/db';
import { asyncHandler, authMiddleware, AuthenticatedRequest } from '../middlewares/auth.middleware';
import { publicar } from '../messaging/event-bus';

const router = Router();

// Participantes (ou Admin) podem ler uma conversa
function podeLer(tipoPerfil: string, idUsuario: number, conversa: { id_cliente: number; id_prestador: number }): boolean {
  if (tipoPerfil === 'Admin') return true;
  return conversa.id_cliente === idUsuario || conversa.id_prestador === idUsuario;
}

// Somente cliente e prestador da conversa podem enviar mensagens
function podeEnviar(tipoPerfil: string, idUsuario: number, conversa: { id_cliente: number; id_prestador: number }): boolean {
  return conversa.id_cliente === idUsuario || conversa.id_prestador === idUsuario;
}

const SELECT_CONVERSA = `
  SELECT c.id_conversa, c.id_agendamento, c.id_cliente, c.id_prestador, c.criada_em, c.atualizada_em,
         u.nome AS cliente_nome, p.nome AS prestador_nome,
         s.titulo AS servico_titulo, s.preco::float8 AS servico_preco,
         a.data_hora_inicio, a.data_hora_fim, a.status AS agendamento_status
  FROM conversas c
  JOIN usuarios u ON u.id_usuario = c.id_cliente
  JOIN usuarios p ON p.id_usuario = c.id_prestador
  JOIN agendamentos a ON a.id_agendamento = c.id_agendamento
  JOIN servicos s ON s.id_servico = a.id_servico`;

// Abre (ou reabre) a conversa de um agendamento. Idempotente: se a conversa
// já existe, devolve a mesma conversa (evita duplicidade via UNIQUE).
router.post('/conversations', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const idAgendamento = Number(req.body?.id_agendamento);
  if (!Number.isInteger(idAgendamento) || idAgendamento <= 0) {
    return res.status(400).json({ error: 'Informe um id_agendamento válido.' });
  }
  const agendamento = await pool.query(
    'SELECT id_agendamento, id_cliente, id_prestador FROM agendamentos WHERE id_agendamento=$1',
    [idAgendamento]
  );
  if (!agendamento.rowCount) return res.status(404).json({ error: 'Agendamento não encontrado.' });
  const { id_cliente, id_prestador } = agendamento.rows[0];
  const permitido = req.user.tipo_perfil === 'Admin' || id_cliente === req.user.id_usuario || id_prestador === req.user.id_usuario;
  if (!permitido) return res.status(403).json({ error: 'Você não participa deste agendamento.' });

  const criada = await pool.query(
    `INSERT INTO conversas (id_agendamento, id_cliente, id_prestador)
     VALUES ($1, $2, $3)
     ON CONFLICT (id_agendamento) DO UPDATE SET atualizada_em = conversas.atualizada_em
     RETURNING id_conversa`,
    [idAgendamento, id_cliente, id_prestador]
  );
  return res.status(201).json({ message: 'Conversa disponível.', id_conversa: criada.rows[0].id_conversa });
}));

// Lista de conversas do usuário autenticado (Admin vê todas), com última
// mensagem e contador de não lidas para o badge da interface.
router.get('/conversations', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const filtro = req.user.tipo_perfil === 'Cliente' || req.user.tipo_perfil === 'Prestador' ? req.user.id_usuario : null;
  const resultado = await pool.query(
    `WITH ultima AS (
       SELECT DISTINCT ON (m.id_conversa) m.id_conversa, m.texto, m.id_autor, m.criada_em
       FROM mensagens_chat m ORDER BY m.id_conversa, m.criada_em DESC
     ), naolidas AS (
       SELECT m.id_conversa, COUNT(*)::int AS total
       FROM mensagens_chat m
       WHERE m.lida = FALSE AND ($2::integer IS NULL OR m.id_autor <> $2)
       GROUP BY m.id_conversa
     )
     ${SELECT_CONVERSA}
     LEFT JOIN ultima ON ultima.id_conversa = c.id_conversa
     LEFT JOIN naolidas ON naolidas.id_conversa = c.id_conversa
     WHERE ($1::integer IS NULL OR c.id_cliente = $1 OR c.id_prestador = $1)
     ORDER BY COALESCE(ultima.criada_em, c.criada_em) DESC`,
    [filtro, filtro]
  );
  return res.json({ total: resultado.rowCount, conversations: resultado.rows });
}));

// Histórico de mensagens de uma conversa. A leitura marca como lidas as
// mensagens enviadas pela outra parte (recibo de leitura simples).
router.get('/conversations/:id/messages', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const idConversa = Number(req.params.id);
  if (!Number.isInteger(idConversa) || idConversa <= 0) {
    return res.status(400).json({ error: 'Informe um id de conversa válido.' });
  }
  const conversa = await pool.query(
    'SELECT id_conversa, id_cliente, id_prestador FROM conversas WHERE id_conversa=$1',
    [idConversa]
  );
  if (!conversa.rowCount) return res.status(404).json({ error: 'Conversa não encontrada.' });
  if (!podeLer(req.user.tipo_perfil, req.user.id_usuario, conversa.rows[0])) {
    return res.status(403).json({ error: 'Você não participa desta conversa.' });
  }

  await pool.query(
    'UPDATE mensagens_chat SET lida=TRUE WHERE id_conversa=$1 AND id_autor <> $2 AND lida=FALSE',
    [idConversa, req.user.id_usuario]
  );
  const resultado = await pool.query(
    `SELECT m.id_mensagem, m.id_conversa, m.id_autor, m.texto, m.lida, m.criada_em,
            u.nome AS autor_nome, u.tipo_perfil AS autor_perfil
     FROM mensagens_chat m JOIN usuarios u ON u.id_usuario = m.id_autor
     WHERE m.id_conversa = $1 ORDER BY m.criada_em, m.id_mensagem`,
    [idConversa]
  );
  const contexto = await pool.query(`${SELECT_CONVERSA} WHERE c.id_conversa = $1`, [idConversa]);
  return res.json({ total: resultado.rowCount, messages: resultado.rows, conversation: contexto.rows[0] });
}));

// Envio de mensagem dentro de uma conversa. Publica o evento de mensageria
// 'chat.mensagem_recebida' para o consumidor de notificações (in-app + push).
router.post('/conversations/:id/messages', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const idConversa = Number(req.params.id);
  const texto = typeof req.body?.texto === 'string' ? req.body.texto.trim() : '';
  if (!Number.isInteger(idConversa) || idConversa <= 0) {
    return res.status(400).json({ error: 'Informe um id de conversa válido.' });
  }
  if (texto.length === 0 || texto.length > 2000) {
    return res.status(400).json({ error: 'A mensagem deve ter entre 1 e 2000 caracteres.' });
  }
  const conversa = await pool.query(
    'SELECT id_conversa, id_agendamento, id_cliente, id_prestador FROM conversas WHERE id_conversa=$1',
    [idConversa]
  );
  if (!conversa.rowCount) return res.status(404).json({ error: 'Conversa não encontrada.' });
  const dadosConversa = conversa.rows[0];
  if (!podeEnviar(req.user.tipo_perfil, req.user.id_usuario, dadosConversa)) {
    return res.status(403).json({ error: 'Você não participa desta conversa.' });
  }

  const destinatario = dadosConversa.id_cliente === req.user.id_usuario ? dadosConversa.id_prestador : dadosConversa.id_cliente;
  const autor = await pool.query('SELECT nome FROM usuarios WHERE id_usuario=$1', [req.user.id_usuario]);
  const criada = await pool.query(
    `INSERT INTO mensagens_chat (id_conversa, id_autor, texto) VALUES ($1, $2, $3)
     RETURNING id_mensagem, id_conversa, id_autor, texto, lida, criada_em`,
    [idConversa, req.user.id_usuario, texto]
  );
  await pool.query('UPDATE conversas SET atualizada_em = NOW() WHERE id_conversa = $1', [idConversa]);

  // Mensageria: publica o evento; falhas de entrega nunca afetam o envio.
  publicar('chat.mensagem_recebida', {
    id_conversa: idConversa,
    id_agendamento: dadosConversa.id_agendamento,
    id_autor: req.user.id_usuario,
    id_destinatario: destinatario,
    nome_autor: autor.rows[0]?.nome || 'Usuário',
    texto
  });

  return res.status(201).json({ message: 'Mensagem enviada.', mensagem: criada.rows[0] });
}));

export default router;
