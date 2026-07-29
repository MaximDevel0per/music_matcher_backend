import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { INestApplication, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
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
  .addTag('musicmatcher')
  .addBearerAuth()
  .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);
}