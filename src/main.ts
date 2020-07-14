import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as config from 'yaml-config';
const settings = config.readConfig('config.yml');

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  const options = new DocumentBuilder()
    .setTitle('Ledger Api')
    .setDescription('The API-Ledger description')
    .setVersion('1.0')
    .addTag('Ledger')
    .build();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('api-ledger', app, document);
  await app.listen(settings.serverPort);
}
bootstrap();
