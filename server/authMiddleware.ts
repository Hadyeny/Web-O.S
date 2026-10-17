import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticatedUser } from '../src/@types/express/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_insecure_change_for_production';

/**
 * Middleware de Autenticação Estrito via Cookies HttpOnly
 * Valida o JWT presente em req.cookies.token e injeta o usuário autenticado em req.user.
 * Graças à declaração global em src/@types/express/index.d.ts, req.user é reconhecido nativamente sem erros de tipagem.
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void | Response {
  let token = req.cookies?.token;

  if (!token && req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.substring(7);
  }

  if (!token) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Sessão inválida ou ausente.',
    });
  }

  try {
    // Validação criptográfica do JWT e cast estrito para a interface AuthenticatedUser
    const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedUser;

    if (!decoded || !decoded.id || !decoded.role) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Sessão inválida ou ausente.',
      });
    }

    // Injeção limpa de dados em req.user (reconhecido pelo compilador TypeScript sem cast em req)
    req.user = decoded;

    return next();
  } catch {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Sessão inválida ou ausente.',
    });
  }
}

/**
 * Trava estrita de autorização: Permite APENAS usuários com perfil 'SUPER_ADMIN'
 */
export function requireSuperAdmin(req: Request, res: Response, next: NextFunction): void | Response {
  const role = (req.user?.role || '').trim().toUpperCase();
  if (role !== 'SUPER_ADMIN') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Acesso Proibido (403): Operação restrita exclusivamente a usuários com perfil SUPER_ADMIN.',
    });
  }
  return next();
}
