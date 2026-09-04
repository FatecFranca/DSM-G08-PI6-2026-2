import { Router, Request, Response } from 'express';
import { db } from '../database/db';

const router = Router();

// RF03 - Listar Serviços (Filtro por prestador opcional)
router.get('/', (req: Request, res: Response) => {
  const providerId = req.query.providerId ? parseInt(req.query.providerId as string) : undefined;

  let servicos = db.servicos.filter(s => s.ativo);
  if (providerId) {
    servicos = servicos.filter(s => s.id_prestador === providerId);
  }

  return res.json({
    total: servicos.length,
    services: servicos
  });
});

// RF03 - Cadastrar Novo Serviço (Prestador)
router.post('/', (req: Request, res: Response) => {
  const { id_prestador, titulo, descricao, duracao_minutos, preco } = req.body;

  if (!id_prestador || !titulo || !duracao_minutos || preco === undefined) {
    return res.status(400).json({ error: 'Campos obrigatórios: id_prestador, titulo, duracao_minutos, preco' });
  }

  const novoServico = {
    id_servico: db.servicos.length + 1,
    id_prestador: Number(id_prestador),
    titulo,
    descricao: descricao || '',
    duracao_minutos: Number(duracao_minutos),
    preco: Number(preco),
    ativo: true
  };

  db.servicos.push(novoServico);
  return res.status(201).json({
    message: 'Serviço cadastrado com sucesso!',
    service: novoServico
  });
});

// RF03 - Atualizar Serviço
router.put('/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const index = db.servicos.findIndex(s => s.id_servico === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Serviço não encontrado.' });
  }

  db.servicos[index] = {
    ...db.servicos[index],
    ...req.body,
    id_servico: id
  };

  return res.json({
    message: 'Serviço atualizado com sucesso!',
    service: db.servicos[index]
  });
});

// RF03 - Desativar Serviço
router.delete('/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const servico = db.servicos.find(s => s.id_servico === id);

  if (!servico) {
    return res.status(404).json({ error: 'Serviço não encontrado.' });
  }

  servico.ativo = false;
  return res.json({ message: 'Serviço desativado com sucesso!' });
});

export default router;
