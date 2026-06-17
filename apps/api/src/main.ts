import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');
  const origins = process.env.CORS_ORIGINS?.split(',').map((o) => o.trim()).filter(Boolean) ?? [
    'http://localhost:3020',
    'http://localhost:3021',
  ];
  const allowedRoots = [
    ...new Set(
      origins
        .map((o) => {
          try {
            return new URL(o).hostname.replace(/^www\./, '');
          } catch {
            return null;
          }
        })
        .filter((h): h is string => Boolean(h)),
    ),
  ];
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (origins.includes(origin)) return callback(null, true);
      try {
        const host = new URL(origin).hostname;
        if (allowedRoots.some((root) => host === root || host.endsWith(`.${root}`))) {
          return callback(null, true);
        }
      } catch {
        /* ignore invalid origin */
      }
      callback(null, false);
    },
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  const port = process.env.API_PORT || 3010;
  await app.listen(port);
  console.log(`Pomar Fresh API: http://localhost:${port}/api/v1`);
}
bootstrap();
