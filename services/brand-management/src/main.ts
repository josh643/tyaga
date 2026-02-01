import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CampaignsController } from './controllers/campaigns.controller';
import { CampaignsService } from './services/campaigns.service';
import { Campaign } from './entities/campaign.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: 5432,
      username: 'user',
      password: 'password',
      database: 'tyaga',
      entities: [Campaign],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([Campaign]),
  ],
  controllers: [CampaignsController],
  providers: [CampaignsService],
})
class AppModule {}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT || 3002;
  app.enableCors();
  await app.listen(port, '0.0.0.0');
  console.log(`Brand Management Service running on port ${port}`);
}
bootstrap();
