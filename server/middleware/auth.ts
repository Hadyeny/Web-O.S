import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { Role } from '../../src/types.js';
import { usersRepository } from '../repositories/users.repository.js';

export const JWT_SECRET = process.env.JWT_SECRET || 'plioou_ti_jwt_access_key_2026_secured!';
export const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'plioou_ti_jwt_refresh_key_2026_secured!';

export type AuthRequest = Request;

/**
 * Constructs cookie options for access & refresh tokens.
 */
export function getCookieOptions(req: Request, maxAgeMs: number) {
  // Respect https forwarded headers or production
  const isSecure = process.env.NODE_ENV === 'production' || req.secure || req.headers['x-forwarded-proto'] === 'https';
  return {
    httpOnly: true,
    secure: isSecure,
    sameSite: (isSecure ? 'none' : 'lax') as 'none' | 'lax',
    path: '/',
    maxAge: maxAgeMs,
  };
}

export function clearAuthCookies(res: Response, req: Request) {
  const opts = getCookieOptions(req, 0);
  res.clearCookie('plioou_at', opts);
  res.clearCookie('plioou_rt', opts);
  res.clearCookie('plioou_access_token', opts);
  res.clearCookie('plioou_refresh_token', opts);
  res.clearCookie('plioou_token', opts);
}

/**
 * Authentication Middleware: Strict JWT verification.
 * NO backdoor via x-dev-user-id or demo_token.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const headerToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const cookieAccessToken = req.cookies?.plioou_at || req.cookies?.plioou_access_token || req.cookies?.plioou_token;
  const token = headerToken || cookieAccessToken;

  if (!token) {
    return res.status(401).json({
      error: 'Acesso não autorizado. Faça login para continuar.',
      code: 'NO_TOKEN',
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      email: string;
      role: Role;
      name: string;
      type?: string;
    };

    if (decoded.type && decoded.type !== 'access') {
      return res.status(401).json({
        error: 'Tipo de token inválido para esta operação.',
        code: 'INVALID_TOKEN_TYPE',
      });
    }

    const existingUser = await usersRepository.findById(decoded.id);
    if (!existingUser) {
      return res.status(401).json({
        error: 'Usuário associado a esta sessão não foi encontrado.',
        code: 'USER_NOT_FOUND',
      });
    }

    if (existingUser.active === false || (existingUser as any).ativo === false) {
      return res.status(403).json({
        error: 'Sua conta de usuário foi desativada pelo Administrador.',
        code: 'ACCOUNT_DISABLED',
      });
    }

    req.user = {
      id: existingUser.id,
      email: existingUser.email,
      role: existingUser.role,
      name: existingUser.name,
      tokenVersion: existingUser.tokenVersion,
    };

    next();
  } catch (err: any) {
    if (err?.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Sua sessão de acesso expirou. Renovação necessária.',
        code: 'TOKEN_EXPIRED',
      });
    }
    return res.status(401).json({
      error: 'Token de autenticação inválido ou corrompido.',
      code: 'INVALID_TOKEN',
    });
  }
}

/**
 * Role-Based Access Control (RBAC) middleware
 */
export function requireRole(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Não autenticado.', code: 'UNAUTHENTICATED' });
    }

    const userRole = (req.user.role || '').toLowerCase();
    const normalizedAllowed = allowedRoles.map((r) => r.toLowerCase());

    const hasPermission =
      normalizedAllowed.includes(userRole) ||
      userRole === 'admin' ||
      userRole === 'super_admin';

    if (!hasPermission) {
      return res.status(403).json({
        error: 'Permissão negada. Você não possui o nível de acesso necessário.',
        code: 'FORBIDDEN_ROLE',
      });
    }

    next();
  };
}

/**
 * Rate Limiter for Public Routes (by IP, 20 requests per minute)
 */
export const publicRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: 'Muitas requisições. Por favor, aguarde um momento antes de tentar novamente.' },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false, default: true },
});

/**
 * Rate Limiter for Authenticated Routes (by User ID, 100 requests per minute)
 */
export const authenticatedRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  keyGenerator: (req: Request) => {
    const userId = (req as any).user?.id;
    if (userId) return `user:${userId}`;
    return req.ip || 'anonymous';
  },
  message: { error: 'Limite de requisições excedido. Reduza a frequência das requisições.' },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { keyGeneratorIpFallback: false, xForwardedForHeader: false },
});
