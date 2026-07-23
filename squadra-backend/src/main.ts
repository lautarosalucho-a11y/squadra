import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true }),
  );

  // CORS: en producción, restringir al dominio del frontend (Vercel).
  // FRONTEND_ORIGIN admite varios orígenes separados por coma; si no se define,
  // se refleja el origen de la request (útil en dev). Usamos Bearer, no cookies.
  const origins = process.env.FRONTEND_ORIGIN?.split(',').map((o) => o.trim());
  app.enableCors({ origin: origins && origins.length ? origins : true });

  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');
  // eslint-disable-next-line no-console
  console.log(`Squadra API escuchando en el puerto ${port} (/graphql)`);
}

bootstrap();
