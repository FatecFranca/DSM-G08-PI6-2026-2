import { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

export type UserRole = 'Cliente' | 'Prestador' | 'Admin';

declare global {
  namespace Express {
    interface Request {
      user: {
        id_usuario: number;
        email: string;
        tipo_perfil: UserRole;
      };
    }
  }
}

export type AuthenticatedRequest = Request;

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token de autenticação ausente ou inválido.' });
    return;
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    res.status(500).json({ error: 'JWT_SECRET não configurado no servidor.' });
    return;
  }

  try {
    const payload = jwt.verify(authHeader.slice(7), secret) as JwtPayload;
    if (
      typeof payload.id_usuario !== 'number' ||
      typeof payload.email !== 'string' ||
      !['Cliente', 'Prestador', 'Admin'].includes(payload.tipo_perfil)
    ) {
      res.status(401).json({ error: 'Token inválido.' });
      return;
    }

    req.user = {
      id_usuario: payload.id_usuario,
      email: payload.email,
      tipo_perfil: payload.tipo_perfil as UserRole
    };
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
}

export function authorize(...roles: UserRole[]): RequestHandler {
  return (req, res, next) => {
    if (!roles.includes(req.user.tipo_perfil)) {
      return res.status(403).json({ error: 'Seu perfil não tem permissão para esta operação.' });
    }
    return next();
  };
}

type AsyncRoute = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

export const asyncHandler = (handler: AsyncRoute): RequestHandler =>
  (req, res, next) => {
    void handler(req, res, next).catch(next);
  };
