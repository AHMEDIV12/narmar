import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/utils/auth';
import {
  checkAuthRateLimit,
  checkApiRateLimit,
  checkAdWatchRateLimit,
  checkWithdrawalRateLimit,
} from '@/lib/rate-limiter';
import { fraudDetector, type FraudCheckResult } from '@/lib/fraud-detector';

export interface AuthResult {
  success: boolean;
  userId?: string;
  user?: any;
  error?: string;
  statusCode?: number;
}

export async function authenticate(req: NextRequest): Promise<AuthResult> {
  try {
    const token = req.cookies.get('auth-token')?.value;

    if (!token) {
      return {
        success: false,
        error: 'Not authenticated',
        statusCode: 401,
      };
    }

    const payload = await verifyJWT(token);

    if (!payload) {
      return {
        success: false,
        error: 'Invalid token',
        statusCode: 401,
      };
    }

    return {
      success: true,
      userId: payload.userId,
    };
  } catch (error) {
    return {
      success: false,
      error: 'Authentication failed',
      statusCode: 401,
    };
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  error?: string;
  statusCode?: number;
}

export async function enforceRateLimit(
  identifier: string,
  maxRequests: number,
  windowMs: number = 60000,
  type: 'auth' | 'api' | 'ad_watch' | 'withdrawal' = 'api'
): Promise<RateLimitResult> {
  let result;

  switch (type) {
    case 'auth':
      result = checkAuthRateLimit(identifier);
      break;
    case 'ad_watch':
      result = checkAdWatchRateLimit(identifier, maxRequests);
      break;
    case 'withdrawal':
      result = checkWithdrawalRateLimit(identifier, maxRequests);
      break;
    default:
      result = checkApiRateLimit(identifier);
  }

  if (!result.allowed) {
    return {
      allowed: false,
      remaining: result.remaining,
      resetAt: result.resetAt,
      error: 'Rate limit exceeded',
      statusCode: 429,
    };
  }

  return {
    allowed: true,
    remaining: result.remaining,
    resetAt: result.resetAt,
  };
}

export interface FraudCheckResultType {
  allowed: boolean;
  riskScore: number;
  reasons: string[];
  error?: string;
  statusCode?: number;
}

export async function checkFraud(
  userId: string,
  checkType: 'ad_view' | 'survey' | 'task' | 'withdrawal' | 'earnings',
  additionalData?: { amount?: number; ipAddress?: string }
): Promise<FraudCheckResultType> {
  let result: FraudCheckResult;

  switch (checkType) {
    case 'ad_view':
      result = await fraudDetector.checkAdViewFraud(userId, additionalData?.ipAddress);
      break;
    case 'survey':
      result = await fraudDetector.checkSurveyFraud(userId);
      break;
    case 'task':
      result = await fraudDetector.checkTaskFraud(userId);
      break;
    case 'withdrawal':
      result = await fraudDetector.checkWithdrawalFraud(userId, additionalData?.amount || 0);
      break;
    case 'earnings':
      result = await fraudDetector.checkEarningsFraud(userId);
      break;
    default:
      result = {
        isSuspicious: false,
        riskScore: 0,
        reasons: [],
      };
  }

  if (result.isSuspicious) {
    return {
      allowed: false,
      riskScore: result.riskScore,
      reasons: result.reasons,
      error: 'Activity flagged as suspicious',
      statusCode: 403,
    };
  }

  return {
    allowed: true,
    riskScore: result.riskScore,
    reasons: result.reasons,
  };
}

export function getClientIdentifier(req: NextRequest): string {
  // Try to get a unique identifier from various sources
  const forwardedFor = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const ip = forwardedFor?.split(',')[0] || realIp || 'unknown';
  const userAgent = req.headers.get('user-agent') || 'unknown';
  
  // Create a hashed-like identifier (in production, you'd want to hash this)
  return `${ip}:${userAgent.substring(0, 50)}`;
}

export async function enforceSecurity(
  req: NextRequest,
  options: {
    requireAuth?: boolean;
    requireAdmin?: boolean;
    rateLimit?: {
      maxRequests?: number;
      windowMs?: number;
      type?: 'auth' | 'api' | 'ad_watch' | 'withdrawal';
    };
    fraudCheck?: {
      enabled?: boolean;
      type?: 'ad_view' | 'survey' | 'task' | 'withdrawal' | 'earnings';
      additionalData?: { amount?: number; ipAddress?: string };
    };
  } = {}
): Promise<{
  success: boolean;
  userId?: string;
  error?: string;
  statusCode?: number;
  data?: {
    rateLimit?: { remaining: number; resetAt: number };
    fraudCheck?: { riskScore: number; reasons: string[] };
  };
}> {
  const {
    requireAuth = true,
    requireAdmin = false,
    rateLimit,
    fraudCheck,
  } = options;

  // 1. Authentication check
  if (requireAuth) {
    const authResult = await authenticate(req);
    if (!authResult.success) {
      return {
        success: false,
        error: authResult.error,
        statusCode: authResult.statusCode,
      };
    }

    // 2. Admin check (if required)
    if (requireAdmin) {
      const user = await db.user.findUnique({
        where: { id: authResult.userId },
        select: { role: true },
      });

      if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
        return {
          success: false,
          error: 'Forbidden',
          statusCode: 403,
        };
      }
    }

    // 3. Rate limit check
    if (rateLimit) {
      const identifier = getClientIdentifier(req);
      const rateResult = await enforceRateLimit(
        identifier,
        rateLimit.maxRequests || 100,
        rateLimit.windowMs,
        rateLimit.type
      );

      if (!rateResult.allowed) {
        return {
          success: false,
          error: rateResult.error,
          statusCode: rateResult.statusCode,
          data: {
            rateLimit: {
              remaining: rateResult.remaining,
              resetAt: rateResult.resetAt,
            },
          },
        };
      }
    }

    // 4. Fraud check (if enabled)
    if (fraudCheck?.enabled && authResult.userId) {
      const fraudResult = await checkFraud(
        authResult.userId,
        fraudCheck.type || 'earnings',
        fraudCheck.additionalData
      );

      if (!fraudResult.allowed) {
        return {
          success: false,
          error: fraudResult.error,
          statusCode: fraudResult.statusCode,
          data: {
            fraudCheck: {
              riskScore: fraudResult.riskScore,
              reasons: fraudResult.reasons,
            },
          },
        };
      }
    }

    return {
      success: true,
      userId: authResult.userId,
    };
  }

  // If no auth required, just check rate limit
  if (rateLimit) {
    const identifier = getClientIdentifier(req);
    const rateResult = await enforceRateLimit(
      identifier,
      rateLimit.maxRequests || 100,
      rateLimit.windowMs,
      rateLimit.type
    );

    if (!rateResult.allowed) {
      return {
        success: false,
        error: rateResult.error,
        statusCode: rateResult.statusCode,
        data: {
          rateLimit: {
            remaining: rateResult.remaining,
            resetAt: rateResult.resetAt,
          },
        },
      };
    }
  }

  return {
    success: true,
  };
}

export function createSecurityErrorResponse(
  error: string,
  statusCode: number,
  data?: any
): NextResponse {
  const response: any = {
    error,
  };

  if (data?.rateLimit) {
    response.rateLimit = data.rateLimit;
    response.retryAfter = new Date(data.rateLimit.resetAt).toISOString();
  }

  if (data?.fraudCheck) {
    response.fraudCheck = data.fraudCheck;
  }

  return NextResponse.json(response, { status: statusCode });
}
