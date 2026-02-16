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
        try {
          const stateData = JSON.parse(state);
          fingerprint = stateData.fingerprint;
          returnUrl = stateData.returnUrl;
          mobileRedirectUrl = stateData.mobileRedirectUrl;
        } catch {
          // Legacy format - state is just the fingerprint
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
      const useMobileRedirect =
        typeof mobileRedirectUrl === 'string' &&
        (mobileRedirectUrl.startsWith('tempwallets://') ||
          mobileRedirectUrl.startsWith('exp://') ||
          mobileRedirectUrl.startsWith('https://auth.expo.io/'));
      const redirectUrl = useMobileRedirect
        ? new URL(mobileRedirectUrl)
        : new URL(`${frontendUrl}/auth/callback`);
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
