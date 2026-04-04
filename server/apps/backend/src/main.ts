import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ValidationPipe, LogLevel } from '@nestjs/common';
import { TraceIdInterceptor } from './common/trace-id.interceptor.js';
import { webcrypto } from 'node:crypto';

// Some wallet libs (e.g. Solana tooling) expect WebCrypto at globalThis.crypto.
// Railway/Node runtimes may not expose it by default, so we polyfill it.
const g: any = globalThis as any;
if (!g.crypto) {
  g.crypto = webcrypto;
}

async function bootstrap() {
  // Configure logger based on environment
  const logLevels: LogLevel[] = process.env.LOG_LEVEL
    ? (process.env.LOG_LEVEL.split(',') as LogLevel[])
    : process.env.NODE_ENV === 'production'
      ? ['error', 'warn', 'log']
      : ['error', 'warn', 'log', 'debug', 'verbose'];

  const app = await NestFactory.create(AppModule, {
    logger: logLevels,
  });

  // Add trace ID interceptor globally
  app.useGlobalInterceptors(new TraceIdInterceptor());

  // Enable CORS with dynamic origins
  const allowedOrigins = new Set<string>([
    'http://localhost:3000', // Next.js web app
    'http://localhost:5555', // Prisma Studio
    'http://localhost:5173', // Vite (if you use it)
    'http://localhost:19006', // Expo web dev
    'http://localhost:8081', // Metro / RN tooling
    'https://www.tempwallets.com', // Production frontend
    'https://tempwallets.com', // Production frontend without www
  ]);

  // Add production frontend URL if set
  if (process.env.FRONTEND_URL) {
    allowedOrigins.add(process.env.FRONTEND_URL);
  }
  // Also allow the backend's own origin if configured
  if (process.env.BACKEND_URL) {
    try {
      allowedOrigins.add(new URL(process.env.BACKEND_URL).origin);
    } catch {
      // ignore invalid BACKEND_URL
    }
  }

  const extraAllowed =
    process.env.CORS_ALLOWED_ORIGINS
      ?.split(',')
      .map((s) => s.trim())
      .filter(Boolean) || [];
  for (const o of extraAllowed) {
    allowedOrigins.add(o);
  }

  const allowAllOrigins =
    process.env.CORS_ALLOW_ALL === 'true' ||
    process.env.NODE_ENV !== 'production';

  const isPrivateNetworkHost = (host: string) => {
    if (host === 'localhost' || host === '127.0.0.1' || host === '10.0.2.2') {
      return true;
    }
    // Very small, pragmatic allowlist for dev LAN IPs
    if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
    if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
    // 172.16.0.0 – 172.31.255.255
    const m = /^172\.(\d{1,2})\.\d{1,3}\.\d{1,3}$/.exec(host);
    if (m) {
      const second = Number(m[1]);
      if (second >= 16 && second <= 31) return true;
    }
    return false;
  };

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);

      if (allowAllOrigins) {
        return callback(null, true);
      }
      
      // Check if origin is in allowed list
      if (allowedOrigins.has(origin)) {
        return callback(null, true);
      }
      
      // Allow all Vercel preview deployments
      if (origin.endsWith('.vercel.app')) {
        return callback(null, true);
      }

      // Allow Railway preview domains if you host any frontend there
      if (origin.endsWith('.railway.app')) {
        return callback(null, true);
      }

      // Allow common Expo/React Native dev origins on LAN
      try {
        const { hostname } = new URL(origin);
        if (isPrivateNetworkHost(hostname)) {
          return callback(null, true);
        }
      } catch {
        // If origin isn't a valid URL, fall through to block
      }
      
      // Block all other origins
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Enable validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Enable graceful shutdown
  app.enableShutdownHooks();

  // Get port from environment or use default
  const port = parseInt(process.env.PORT || '5005', 10);

  await app.listen(port);

  // Production-ready logging
  if (process.env.NODE_ENV !== 'production') {
    console.log(`🚀 Application is running on: http://localhost:${port}`);
    console.log(
      `📊 Health check available at: http://localhost:${port}/health`,
    );
  }
}
bootstrap();
