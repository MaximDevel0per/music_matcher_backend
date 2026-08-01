import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { INestApplication, Logger, ValidationPipe } from '@nestjs/common';

/** Erlaubte Frontend-Origins, per Env überschreibbar: CORS_ORIGIN=https://a.de,https://b.de */
const DEFAULT_ORIGINS = ['http://localhost:5173', 'http://localhost:4173'];

const LOCALHOST_ORIGIN = /^http:\/\/(localhost|127\.0\.0\.1|\[::1\]):\d+$/;

/**
 * In Produktion gilt strikt die konfigurierte Liste.
 * In der Entwicklung zusätzlich jeder localhost-Port: Vite zählt auf 5174 hoch,
 * sobald 5173 belegt ist — der Browser blockt dann stillschweigend, und im
 * Frontend sieht das aus wie ein toter Server.
 */
function buildCorsOrigin() {
  const configured =
    process.env.CORS_ORIGIN?.split(',')
      .map((o) => o.trim())
      .filter(Boolean) ?? DEFAULT_ORIGINS;

  if (process.env.NODE_ENV === 'production') return configured;

  Logger.log(
    `CORS: ${configured.join(', ')} + jeder localhost-Port (Entwicklungsmodus)`,
    'Bootstrap',
  );
  return (origin: string | undefined, cb: (err: Error | null, allow: boolean) => void) =>
    // origin ist leer bei Anfragen ohne Browser (curl, Swagger-UI im selben Origin)
    cb(null, !origin || configured.includes(origin) || LOCALHOST_ORIGIN.test(origin));
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: buildCorsOrigin(),
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  //für decorators
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  initalizeSwagger(app);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();


function initalizeSwagger(app: INestApplication):void {
  const config = new DocumentBuilder()
  .setTitle('Music Matcher API')
  .setDescription('The API description')
  .setVersion('1.0')
  .addBearerAuth()
  .addServer('/','local')
  .addServer('/api','remote')
  .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);
}