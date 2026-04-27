import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import configuration from '@/config/configuration';
import { validationSchema } from '@/config/validation';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { AuthModule } from '@/modules/auth/auth.module';
import { MoviesModule } from '@/modules/movies/movies.module';
import { UsersModule } from '@/modules/users/users.module';
import { WatchlistModule } from '@/modules/watchlist/watchlist.module';
import { ReviewsModule } from '@/modules/reviews/reviews.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      validationSchema,
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('database.host'),
        port: config.get<number>('database.port'),
        username: config.get<string>('database.user'),
        password: config.get<string>('database.pass'),
        database: config.get<string>('database.name'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        migrations: [__dirname + '/database/migrations/*{.ts,.js}'],
        synchronize: false,
      }),
    }),
    AuthModule,
    MoviesModule,
    UsersModule,
    WatchlistModule,
    ReviewsModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: JwtAuthGuard }],
})
export class AppModule {}
