import { join } from 'path';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// modules
import { UserModule } from './users/user.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { FolderModule } from './folders/folder.module';
import { FileModule } from './files/file.module';

const isDev = process.env.NODE_ENV !== 'production';
const entitiesPath = join(__dirname, '**', '*.entity.{ts,js}');

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: './src/_config/database.db',
      entities: [entitiesPath],
      synchronize: isDev,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: isDev ? 0 : 60000,
        limit: 10,
      },
    ]),
    UserModule,
    AuthModule,
    FolderModule,
    FileModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
