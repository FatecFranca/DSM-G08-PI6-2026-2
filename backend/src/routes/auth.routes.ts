import { Router, Request, Response } from 'express';
import { db } from '../database/db';

const router = Router();

// RF01 - Cadastro de Usuários (Cliente / Prestador / Admin)
router.post('/register', (req: Request, res: Response) => {
  const { nome, email, senha, telefone, tipo_perfil, nome_negocio, endereco } = req.body;

  if (!nome || !email || !senha || !telefone || !tipo_perfil) {
    return res.status(400).json({ error: 'Campos obrigatórios: nome, email, senha, telefone, tipo_perfil' });
  }

  const emailExiste = db.usuarios.some(u => u.email.toLowerCase() === email.toLowerCase());
  if (emailExiste) {
    return res.status(409).json({ error: 'Este e-mail já está cadastrado no sistema.' });
  }

  const novoUsuario = {
    id_usuario: db.usuarios.length + 1,
    nome,
    email,
    senha_hash: `$2b$10$hashed_${senha}`, // Representação de hash bcrypt (RNF03)
    telefone,
    tipo_perfil,
    nome_negocio: tipo_perfil === 'Prestador' ? nome_negocio : undefined,
    endereco: tipo_perfil === 'Prestador' ? endereco : undefined
  };

  db.usuarios.push(novoUsuario);

  const { senha_hash, ...usuarioRetorno } = novoUsuario;
  return res.status(201).json({
    message: 'Usuário cadastrado com sucesso!',
    user: usuarioRetorno,
    token: `mock-token-${tipo_perfil.toLowerCase()}`
  });
});

// RF01 - Login de Usuários
router.post('/login', (req: Request, res: Response) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ error: 'Informe e-mail e senha para login.' });
  }

  const usuario = db.usuarios.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!usuario) {
    return res.status(401).json({ error: 'Credenciais inválidas.' });
  }

  const { senha_hash, ...usuarioSemSenha } = usuario;
  const token = usuario.tipo_perfil === 'Prestador' ? 'mock-token-prestador' : 'mock-token-cliente';

  return res.status(200).json({
    message: 'Login realizado com sucesso!',
    token,
    user: usuarioSemSenha
  });
});

// RF02 - Perfil do Usuário
router.get('/profile/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const usuario = db.usuarios.find(u => u.id_usuario === id);

  if (!usuario) {
    return res.status(404).json({ error: 'Usuário não encontrado.' });
  }

  const { senha_hash, ...perfil } = usuario;
  return res.json(perfil);
});

export default router;
