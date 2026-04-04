import {
  Controller,
  Get,
  Post,
  UseGuards,
  Req,
  Res,
  Query,
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { GoogleAuthGuard } from './guards/google-auth.guard.js';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private authService: AuthService) {}

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth() {
    // Initiates Google OAuth flow
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(
    @Req() req: Request & { user?: any },
    @Res() res: Response,
    @Query('state') state?: string,
  ) {
    try {
      const user = req.user;
      if (!user) {
        throw new Error('No user from Google OAuth');
      }

      // Validate and upsert Google user
      const googleUser = await this.authService.validateGoogleUser(user);

      // Parse state - can be just fingerprint (legacy) or JSON with fingerprint and returnUrl
      let fingerprint: string | undefined;
      let returnUrl: string | undefined;
      let mobileRedirectUrl: string | undefined;

      if (state) {
        const parseStatePayload = (raw: string) => {
          // Google OAuth providers may return state URI-encoded once or twice.
          // Try raw first, then progressively decode to recover JSON.
          const attempts = [raw];
          try {
            attempts.push(decodeURIComponent(raw));
          } catch {
            // ignore decode failure
          }
          try {
            attempts.push(decodeURIComponent(decodeURIComponent(raw)));
          } catch {
            // ignore decode failure
          }
          for (const candidate of attempts) {
            try {
              return JSON.parse(candidate);
            } catch {
              // try next
            }
          }
          return null;
        };
        try {
          const stateData = parseStatePayload(state);
          if (stateData && typeof stateData === 'object') {
            fingerprint = (stateData as any).fingerprint;
            returnUrl = (stateData as any).returnUrl;
            mobileRedirectUrl = (stateData as any).mobileRedirectUrl;
          } else {
            // Legacy format - state is just the fingerprint
            fingerprint = state;
          }
        } catch {
          fingerprint = state;
        }
      }

      // Link fingerprint if provided
      if (fingerprint && googleUser.googleId) {
        await this.authService.linkFingerprintToUser(
          googleUser.googleId,
          fingerprint,
        );
      }

      // Generate token
      const { accessToken } = this.authService.generateTokens(googleUser.id);

      // Redirect to mobile deep link if provided and allowed, otherwise frontend callback
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const mobileCandidate =
        (typeof mobileRedirectUrl === 'string' && mobileRedirectUrl) ||
        (typeof returnUrl === 'string' && returnUrl) ||
        '';
      const useMobileRedirect =
        mobileCandidate.startsWith('tempwallets://') ||
        mobileCandidate.startsWith('exp://') ||
        mobileCandidate.startsWith('https://auth.expo.io/');
      const redirectUrlTarget = useMobileRedirect
        ? mobileCandidate
        : `${frontendUrl}/auth/callback`;
      const redirectUrl = new URL(redirectUrlTarget);
      redirectUrl.searchParams.set('token', accessToken);
      redirectUrl.searchParams.set(
        'user',
        encodeURIComponent(
          JSON.stringify({
            id: googleUser.id,
            email: googleUser.email,
            name: googleUser.name,
            picture: googleUser.picture,
          }),
        ),
      );
      if (!useMobileRedirect && returnUrl) {
        redirectUrl.searchParams.set('returnUrl', returnUrl);
      }

      this.logger.log(`Redirecting to frontend: ${redirectUrl.toString()}`);
      res.redirect(redirectUrl.toString());
    } catch (error) {
      this.logger.error(
        `OAuth callback error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/auth/callback?error=authentication_failed`);
    }
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@Req() req: Request & { user?: any }) {
    return req.user;
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Req() req: Request & { user?: any }) {
    return this.authService.logout(req.user.id);
  }
}
