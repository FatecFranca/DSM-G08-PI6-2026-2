import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../database/db';
import { asyncHandler, authMiddleware, AuthenticatedRequest } from '../middlewares/auth.middleware';

const router = Router();
const publicUser = (row: Record<string, unknown>) => {
  const { senha, ...user } = row;
  return user;
};

router.post('/register', asyncHandler(async (req: Request, res: Response) => {
  const { nome, email, senha, telefone, tipo_perfil, nome_negocio, endereco } = req.body;
  const role = tipo_perfil;

  if (typeof nome !== 'string' || !nome.trim() ||
      typeof email !== 'string' || !email.includes('@') ||
      typeof senha !== 'string' || !senha ||
      typeof telefone !== 'string' || !telefone.trim() ||
      !['Cliente', 'Prestador'].includes(role)) {
    return res.status(400).json({ error: 'Informe nome, e-mail, senha, telefone e um perfil Cliente ou Prestador.' });
  }
  if (senha.length < 8) {
    return res.status(400).json({ error: 'A senha deve ter pelo menos 8 caracteres.' });
  }
  if (role === 'Prestador' &&
      (typeof nome_negocio !== 'string' || !nome_negocio.trim() || typeof endereco !== 'string' || !endereco.trim())) {
    return res.status(400).json({ error: 'Prestadores precisam informar nome_negocio e endereco.' });
  }

  const hash = await bcrypt.hash(senha, 12);
  try {
    const result = await pool.query(
      `INSERT INTO usuarios (nome, email, senha, telefone, tipo_perfil, nome_negocio, endereco)
       VALUES ($1, LOWER($2), $3, $4, $5, $6, $7) RETURNING *`,
      [nome.trim(), email.trim(), hash, telefone.trim(), role, role === 'Prestador' ? nome_negocio.trim() : null, role === 'Prestador' ? endereco.trim() : null]
    );
    const user = publicUser(result.rows[0]);
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET não configurado no servidor.');
    const token = jwt.sign(
      { id_usuario: result.rows[0].id_usuario, email: result.rows[0].email, tipo_perfil: role },
      secret,
      { expiresIn: '8h' }
    );
    return res.status(201).json({ message: 'Usuário cadastrado com sucesso.', user, token });
  } catch (error: unknown) {
    if ((error as { code?: string }).code === '23505') {
      return res.status(409).json({ error: 'Este e-mail já está cadastrado.' });
    }
    throw error;
  }
}));

router.post('/login', asyncHandler(async (req: Request, res: Response) => {
  const { email, senha } = req.body;
  if (typeof email !== 'string' || typeof senha !== 'string' || !email || !senha) {
    return res.status(400).json({ error: 'Informe e-mail e senha para login.' });
  }

  const result = await pool.query('SELECT * FROM usuarios WHERE email = LOWER($1)', [email.trim()]);
  const user = result.rows[0];
  if (!user || !(await bcrypt.compare(senha, user.senha))) {
    return res.status(401).json({ error: 'Credenciais inválidas.' });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET não configurado no servidor.');
  const token = jwt.sign(
    { id_usuario: user.id_usuario, email: user.email, tipo_perfil: user.tipo_perfil },
    secret,
    { expiresIn: '8h' }
  );
  return res.json({ message: 'Login realizado com sucesso.', token, user: publicUser(user) });
}));

router.get('/profile/:id', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'ID inválido.' });
  if (req.user.id_usuario !== id && req.user.tipo_perfil !== 'Admin') {
    return res.status(403).json({ error: 'Você só pode consultar o próprio perfil.' });
  }
  const result = await pool.query(
    'SELECT id_usuario, nome, email, telefone, tipo_perfil, nome_negocio, endereco, foto_perfil FROM usuarios WHERE id_usuario = $1',
    [id]
  );
  if (!result.rowCount) return res.status(404).json({ error: 'Usuário não encontrado.' });
  return res.json(result.rows[0]);
}));

router.patch('/profile/:id', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'ID inválido.' });
  if (req.user.id_usuario !== id && req.user.tipo_perfil !== 'Admin') {
    return res.status(403).json({ error: 'Você só pode atualizar o próprio perfil.' });
  }

  const currentResult = await pool.query('SELECT * FROM usuarios WHERE id_usuario=$1', [id]);
  if (!currentResult.rowCount) return res.status(404).json({ error: 'Usuário não encontrado.' });
  const current = currentResult.rows[0];
  const nome = req.body.nome ?? current.nome;
  const email = req.body.email ?? current.email;
  const telefone = req.body.telefone ?? current.telefone;
  const nomeNegocio = req.body.nome_negocio ?? current.nome_negocio;
  const endereco = req.body.endereco ?? current.endereco;
  if (typeof nome !== 'string' || !nome.trim() || typeof email !== 'string' || !email.includes('@') ||
      typeof telefone !== 'string' || !telefone.trim() ||
      (current.tipo_perfil === 'Prestador' &&
        (typeof nomeNegocio !== 'string' || !nomeNegocio.trim() || typeof endereco !== 'string' || !endereco.trim()))) {
    return res.status(400).json({ error: 'Dados de perfil inválidos.' });
  }

  try {
    const result = await pool.query(
      `UPDATE usuarios SET nome=$2, email=LOWER($3), telefone=$4, nome_negocio=$5, endereco=$6,
       atualizado_em=NOW()
       WHERE id_usuario=$1
       RETURNING id_usuario, nome, email, telefone, tipo_perfil, nome_negocio, endereco, foto_perfil`,
      [id, nome.trim(), email.trim(), telefone.trim(), current.tipo_perfil === 'Prestador' ? nomeNegocio.trim() : null,
        current.tipo_perfil === 'Prestador' ? endereco.trim() : null]
    );
    return res.json({ message: 'Perfil atualizado.', user: result.rows[0] });
  } catch (error: unknown) {
    if ((error as { code?: string }).code === '23505') {
      return res.status(409).json({ error: 'Este e-mail já está cadastrado.' });
    }
    throw error;
  }
}));

export default router;
