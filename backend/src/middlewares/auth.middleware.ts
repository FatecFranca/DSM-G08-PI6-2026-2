import { Request, Response, NextFunction } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    id_usuario: number;
    email: string;
    tipo_perfil: 'Cliente' | 'Prestador' | 'Admin';
  };
}

// Middleware simplificado de autenticação JWT para a Sprint 1 (RNF04)
export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Acesso não autorizado',
      message: 'Token de autenticação ausente ou inválido. Utilize o cabeçalho Authorization: Bearer <token>'
    });
  }

  const token = authHeader.split(' ')[1];

  // Simulação de verificação de token para Sprint 1
  if (token === 'mock-token-cliente') {
    req.user = { id_usuario: 2, email: 'cliente@exemplo.com', tipo_perfil: 'Cliente' };
    return next();
  }

  if (token === 'mock-token-prestador') {
    req.user = { id_usuario: 1, email: 'prestador@exemplo.com', tipo_perfil: 'Prestador' };
    return next();
  }

  // Token genérico válido
  req.user = { id_usuario: 1, email: 'prestador@exemplo.com', tipo_perfil: 'Prestador' };
  next();
}
