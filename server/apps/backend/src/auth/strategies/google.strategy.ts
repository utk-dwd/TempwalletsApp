import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

export interface GoogleProfile {
  id: string;
  email: string;
  displayName: string;
  photos?: Array<{ value: string }>;
}

function normalizeBackendBaseUrl(raw: string | undefined | null): string {
  const fallback = 'http://localhost:5005';
  const value = (raw || '').trim();
  if (!value) return fallback;

  // If user pasted without scheme, assume https for non-localhost.
  const withScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(value)
    ? value
    : `https://${value.replace(/^\/+/, '')}`;

  try {
    const u = new URL(withScheme);
    const origin = u.origin; // strips any path/query the user mistakenly included

    // Google does NOT allow http redirect URIs except localhost.
    if (u.protocol === 'http:' && u.hostname !== 'localhost' && u.hostname !== '127.0.0.1') {
      return origin.replace(/^http:/, 'https:');
    }

    return origin;
  } catch {
    return fallback;
  }
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private configService: ConfigService) {
    const backendBaseUrl = normalizeBackendBaseUrl(
      configService.get<string>('BACKEND_URL'),
    );
    const callbackURL = new URL('/auth/google/callback', backendBaseUrl).toString();

    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID'),
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL,
      scope: ['email', 'profile'],
      // Force Google account chooser every time (mobile/web parity).
      prompt: 'select_account',
      accessType: 'offline',
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { id, emails, displayName, photos } = profile;

    const user: GoogleProfile = {
      id,
      email: emails?.[0]?.value || '',
      displayName: displayName || '',
      photos,
    };

    done(null, user);
  }
}
