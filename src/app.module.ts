import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { validateEnv } from './config/env.validation';
import { TrackModule } from './track/track.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      // Im Container zeigt DATABASE_PATH auf ein Volume — sonst läge die
      // Datenbank in der Container-Schicht und wäre nach jedem Neustart weg.
      database: process.env.DATABASE_PATH ?? 'db.sqlite',
      // entities: [User, Track], kann weg durch autoloadentities: true
      synchronize: true,
      autoLoadEntities: true
    }),
    UsersModule,
    AuthModule,
    TrackModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
