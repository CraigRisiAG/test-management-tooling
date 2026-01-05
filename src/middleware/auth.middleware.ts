/**
 * @module auth.middleware
 * @description Authentication and authorization middleware
 */

import { Request, Response, NextFunction } from 'express';
import { verifyToken, isAccountLocked, JWTPayload } from '../modules/auth/auth-utils';
import { extractAPIKey, APIKeyService } from '../modules/auth/api-keys';

/**
 * Extend Express Request to include user info
 */
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
      apiKey?: any;
    }
  }
}

const apiKeyService = new APIKeyService();

/**
 * Rate limiter storage
 */
interface RateLimitEntry {
  count: number;
  resetAt: Date;
}

const rateLimitStore: Map<string, RateLimitEntry> = new Map();

/**
 * Authenticate JWT token
 */
export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'No authorization header' });
  }

  const token = authHeader.replace('Bearer ', '');
  const payload = verifyToken(token);

  if (!payload) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  req.user = payload;
  next();
}

/**
 * Authenticate API key
 */
export async function authenticateAPIKey(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const apiKey = extractAPIKey(authHeader);

  if (!apiKey) {
    return res.status(401).json({ error: 'Invalid API key format' });
  }

  const validatedKey = await apiKeyService.validateKey(apiKey);

  if (!validatedKey) {
    return res.status(401).json({ error: 'Invalid or expired API key' });
  }

  req.apiKey = validatedKey;

  // Add rate limit headers
  const rateLimitInfo = apiKeyService.getRemainingRateLimit(
    validatedKey.keyHash,
    validatedKey.rateLimit
  );
  res.setHeader('X-RateLimit-Limit', validatedKey.rateLimit.toString());
  res.setHeader('X-RateLimit-Remaining', rateLimitInfo.remaining.toString());
  res.setHeader('X-RateLimit-Reset', rateLimitInfo.resetAt.toISOString());

  next();
}

/**
 * Authenticate either JWT or API key
 */
export async function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Try JWT first
  if (authHeader.startsWith('Bearer ') && !authHeader.includes('testmgr_')) {
    const token = authHeader.replace('Bearer ', '');
    const payload = verifyToken(token);

    if (payload) {
      req.user = payload;
      return next();
    }
  }

  // Try API key
  const apiKey = extractAPIKey(authHeader);
  if (apiKey) {
    const validatedKey = await apiKeyService.validateKey(apiKey);

    if (validatedKey) {
      req.apiKey = validatedKey;
      return next();
    }
  }

  return res.status(401).json({ error: 'Invalid authentication credentials' });
}

/**
 * Require specific role
 */
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
}

/**
 * Require specific permission
 */
export function requirePermission(...permissions: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user && !req.apiKey) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check JWT user permissions
    if (req.user) {
      const hasPermission = permissions.some(perm => req.user!.permissions.includes(perm));
      if (hasPermission) {
        return next();
      }
    }

    // Check API key scopes
    if (req.apiKey) {
      const hasScope = permissions.some(perm => apiKeyService.hasScope(req.apiKey, perm));
      if (hasScope) {
        return next();
      }
    }

    return res.status(403).json({ error: 'Insufficient permissions' });
  };
}

/**
 * Rate limiting middleware
 */
export function rateLimit(options: {
  maxRequests: number;
  windowMinutes: number;
  keyGenerator?: (req: Request) => string;
}) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = options.keyGenerator
      ? options.keyGenerator(req)
      : req.ip || 'unknown';

    const now = new Date();
    const entry = rateLimitStore.get(key);

    // Initialize or reset entry
    if (!entry || now > entry.resetAt) {
      rateLimitStore.set(key, {
        count: 1,
        resetAt: new Date(now.getTime() + options.windowMinutes * 60 * 1000),
      });

      res.setHeader('X-RateLimit-Limit', options.maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', (options.maxRequests - 1).toString());

      return next();
    }

    // Increment counter
    entry.count++;

    // Check if over limit
    if (entry.count > options.maxRequests) {
      res.setHeader('X-RateLimit-Limit', options.maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', '0');
      res.setHeader('Retry-After', Math.ceil((entry.resetAt.getTime() - now.getTime()) / 1000).toString());

      return res.status(429).json({
        error: 'Too many requests',
        retryAfter: entry.resetAt.toISOString(),
      });
    }

    res.setHeader('X-RateLimit-Limit', options.maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', (options.maxRequests - entry.count).toString());

    next();
  };
}

/**
 * Admin-only middleware
 */
export const requireAdmin = requireRole('admin');

/**
 * Validate request body
 */
export function validateBody(schema: any) {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body);

    if (error) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.details.map((d: any) => d.message),
      });
    }

    next();
  };
}

/**
 * CORS middleware
 */
export function cors(options?: {
  origin?: string | string[];
  credentials?: boolean;
}) {
  return (req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;
    const allowedOrigins = Array.isArray(options?.origin)
      ? options.origin
      : options?.origin
      ? [options.origin]
      : ['*'];

    if (allowedOrigins.includes('*') || (origin && allowedOrigins.includes(origin))) {
      res.setHeader('Access-Control-Allow-Origin', origin || '*');
    }

    if (options?.credentials) {
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }

    next();
  };
}

/**
 * Error handler middleware
 */
export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  console.error('Error:', err);

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: 'Validation error', details: err.message });
  }

  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
}

/**
 * Security headers middleware
 */
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  next();
}

/**
 * Request logging middleware
 */
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });

  next();
}
