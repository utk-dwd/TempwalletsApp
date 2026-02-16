import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  getAuthenticateOptions(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<
      Request & { query?: Record<string, unknown> }
    >();
    const state = request?.query?.state;

    return {
      // Critical: preserve caller-provided state (fingerprint + mobileRedirectUrl)
      // so callback can redirect back into the app instead of website fallback.
      ...(typeof state === 'string' && state.length > 0 ? { state } : {}),
      session: false,
    };
  }
}
