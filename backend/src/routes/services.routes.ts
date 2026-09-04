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

  // Deduplicação preventiva por título
  const mapa = new Map<string, typeof servicos[0]>();
  servicos.forEach(s => {
    const chave = `${s.id_prestador}_${s.titulo.toLowerCase().trim()}`;
    if (!mapa.has(chave)) {
      mapa.set(chave, s);
    }
  });

  const listaFinal = Array.from(mapa.values());

  return res.json({
    total: listaFinal.length,
    services: listaFinal
  });
});

// RF03 - Cadastrar Novo Serviço (Prestador)
router.post('/', (req: Request, res: Response) => {
  const { id_servico, id_prestador, titulo, descricao, duracao_minutos, preco } = req.body;

  if (!id_prestador || !titulo || !duracao_minutos || preco === undefined) {
    return res.status(400).json({ error: 'Campos obrigatórios: id_prestador, titulo, duracao_minutos, preco' });
  }

  // Prevenir duplicidade no banco por título para o mesmo prestador
  const existenteIndex = db.servicos.findIndex(s => 
    s.id_prestador === Number(id_prestador) && 
    s.titulo.toLowerCase().trim() === titulo.toLowerCase().trim()
  );

  if (existenteIndex !== -1) {
    db.servicos[existenteIndex].ativo = true;
    db.servicos[existenteIndex].preco = Number(preco);
    db.servicos[existenteIndex].duracao_minutos = Number(duracao_minutos);
    if (descricao) db.servicos[existenteIndex].descricao = descricao;
    return res.status(200).json({
      message: 'Serviço já existente atualizado no catálogo.',
      service: db.servicos[existenteIndex]
    });
  }

  const maxId = db.servicos.reduce((max, s) => (s.id_servico < 1000000 ? Math.max(max, s.id_servico) : max), 0);
  const novoId = maxId + 1;

  const novoServico = {
    id_servico: (id_servico && Number(id_servico) < 1000000) ? Number(id_servico) : novoId,
    id_prestador: Number(id_prestador),
    titulo: titulo.trim(),
    descricao: descricao ? descricao.trim() : '',
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

// RF03 - Desativar / Excluir Serviço
router.delete('/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const index = db.servicos.findIndex(s => s.id_servico === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Serviço não encontrado.' });
  }

  db.servicos[index].ativo = false;
  return res.json({ message: 'Serviço desativado com sucesso!' });
});

export default router;
