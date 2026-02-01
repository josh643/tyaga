import { NestFactory } from '@nestjs/core';
import { Module, Controller, Get } from '@nestjs/common';
import { createProxyMiddleware } from 'http-proxy-middleware';

@Controller()
class AppController {
  @Get()
  getHello(): string {
    return 'API Gateway is running';
  }
}

@Module({
  controllers: [AppController],
})
class AppModule {}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
  const brandServiceUrl = process.env.BRAND_SERVICE_URL || 'http://localhost:3002';
  const rightsServiceUrl = process.env.RIGHTS_SERVICE_URL || 'http://localhost:3003';

  // Proxy /auth, /teams, and /users to auth-service
  app.use(['/auth', '/teams', '/users'], createProxyMiddleware({ 
    target: authServiceUrl, 
    changeOrigin: true,
  }));

  // Proxy /brand to brand-management
  app.use('/brand', createProxyMiddleware({ 
    target: brandServiceUrl, 
    changeOrigin: true,
  }));

  // Proxy /rights to rights-tracking
  app.use('/rights', createProxyMiddleware({ 
    target: rightsServiceUrl, 
    changeOrigin: true,
  }));

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`API Gateway running on port ${port}`);
}
bootstrap();
