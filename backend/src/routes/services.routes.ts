import { Router, Request, Response } from 'express';
import { pool } from '../database/db';
import { asyncHandler, authMiddleware, AuthenticatedRequest, authorize } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const providerId = req.query.providerId ? Number(req.query.providerId) : null;
  if (providerId !== null && (!Number.isInteger(providerId) || providerId <= 0)) {
    return res.status(400).json({ error: 'providerId deve ser um número inteiro positivo.' });
  }
  const result = await pool.query(
    `SELECT s.id_servico, s.id_prestador, s.titulo, s.descricao, s.duracao_minutos,
            s.preco::float8 AS preco, s.ativo, u.nome_negocio AS prestador_nome_negocio,
            u.endereco AS prestador_endereco
     FROM servicos s JOIN usuarios u ON u.id_usuario=s.id_prestador
     WHERE s.ativo = TRUE AND ($1::integer IS NULL OR s.id_prestador = $1)
     ORDER BY u.nome_negocio, s.titulo`,
    [providerId]
  );
  return res.json({ total: result.rowCount, services: result.rows });
}));

router.post('/', authMiddleware, authorize('Prestador', 'Admin'), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { titulo, descricao, duracao_minutos, preco } = req.body;
  const providerId = req.user.tipo_perfil === 'Admin' ? Number(req.body.id_prestador || req.user.id_usuario) : req.user.id_usuario;
  if (typeof titulo !== 'string' || !titulo.trim() ||
      (descricao !== undefined && typeof descricao !== 'string') ||
      !Number.isInteger(Number(duracao_minutos)) || Number(duracao_minutos) <= 0 ||
      !Number.isFinite(Number(preco)) || Number(preco) < 0) {
    return res.status(400).json({ error: 'Informe título, duração positiva e preço não negativo.' });
  }
  const result = await pool.query(
    `INSERT INTO servicos (id_prestador, titulo, descricao, duracao_minutos, preco)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id_servico, id_prestador, titulo, descricao, duracao_minutos, preco::float8 AS preco, ativo`,
    [providerId, titulo.trim(), descricao?.trim() || '', Number(duracao_minutos), Number(preco)]
  );
  return res.status(201).json({ message: 'Serviço cadastrado com sucesso.', service: result.rows[0] });
}));

router.put('/:id', authMiddleware, authorize('Prestador', 'Admin'), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const id = Number(req.params.id);
  const { titulo, descricao, duracao_minutos, preco } = req.body;
  if (!Number.isInteger(id) || id <= 0 || typeof titulo !== 'string' || !titulo.trim() ||
      (descricao !== undefined && typeof descricao !== 'string') ||
      !Number.isInteger(Number(duracao_minutos)) || Number(duracao_minutos) <= 0 ||
      !Number.isFinite(Number(preco)) || Number(preco) < 0) {
    return res.status(400).json({ error: 'Dados inválidos para atualização do serviço.' });
  }
  const params = [id, titulo.trim(), descricao?.trim() || '', Number(duracao_minutos), Number(preco), req.user.id_usuario, req.user.tipo_perfil === 'Admin'];
  const result = await pool.query(
    `UPDATE servicos SET titulo=$2, descricao=$3, duracao_minutos=$4, preco=$5, atualizado_em=NOW()
     WHERE id_servico=$1 AND (id_prestador=$6 OR $7)
     RETURNING id_servico, id_prestador, titulo, descricao, duracao_minutos, preco::float8 AS preco, ativo`,
    params
  );
  if (!result.rowCount) return res.status(404).json({ error: 'Serviço não encontrado ou sem permissão.' });
  return res.json({ message: 'Serviço atualizado.', service: result.rows[0] });
}));

router.delete('/:id', authMiddleware, authorize('Prestador', 'Admin'), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'ID de serviço inválido.' });
  const result = await pool.query(
    `UPDATE servicos SET ativo=FALSE, atualizado_em=NOW()
     WHERE id_servico=$1 AND (id_prestador=$2 OR $3) AND ativo=TRUE RETURNING id_servico`,
    [id, req.user.id_usuario, req.user.tipo_perfil === 'Admin']
  );
  if (!result.rowCount) return res.status(404).json({ error: 'Serviço não encontrado ou sem permissão.' });
  return res.json({ message: 'Serviço desativado com sucesso.' });
}));

export default router;
