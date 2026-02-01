import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RightsController } from './controllers/rights.controller';
import { RightsService } from './services/rights.service';
import { MusicalWork } from './entities/musical-work.entity';
import { Recording } from './entities/recording.entity';
import { Rightsholder } from './entities/rightsholder.entity';
import { WorkShare } from './entities/work-share.entity';
import { ImportLog } from './entities/import-log.entity';

import { MinioService } from './services/minio.service';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: 5432,
      username: 'user',
      password: 'password',
      database: 'tyaga',
      entities: [MusicalWork, Recording, Rightsholder, WorkShare, ImportLog],
      synchronize: true, // Auto-create tables (dev only)
    }),
    TypeOrmModule.forFeature([MusicalWork, Recording, Rightsholder, WorkShare, ImportLog]),
  ],
  controllers: [RightsController],
  providers: [RightsService, MinioService],
})
class AppModule {}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT || 3003;
  await app.listen(port, '0.0.0.0');
  console.log(`Rights Tracking Service running on port ${port}`);
}
bootstrap();
