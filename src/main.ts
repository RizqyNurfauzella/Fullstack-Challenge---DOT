import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const session = require('express-session');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const passport = require('passport');
import { UsersService } from './users/users.service';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  app.use(
    session({
      secret: 'my-secret-key-challenge',
      resave: false,
      saveUninitialized: false,
      cookie: { maxAge: 3600000 },
    }),
  );

  app.use(passport.initialize());
  app.use(passport.session());

  // Setup static assets and view engine for MVC
  app.useStaticAssets(join(__dirname, '..', 'public'));
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('hbs');

  // Create initial admin user
  const usersService = app.get(UsersService);
  await usersService.createInitialUser();

  await app.listen(3000);
  console.log('Application is running on: http://localhost:3000');
}
bootstrap();
