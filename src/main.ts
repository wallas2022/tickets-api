import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  //prefijo global
  app.setGlobalPrefix('api');

  // validaciones automáticas con class-validator
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  app.enableCors({
    origin: ['http://localhost:5173'], // tu frontend React
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // si manejas cookies (no es necesario si usas solo Authorization)
  });


  await app.listen(process.env.PORT ?? 3000);
  console.log('Servidor corriendo en http://localhost:3000/api');
}
bootstrap();
