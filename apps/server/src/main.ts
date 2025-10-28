import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });

  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  const pubClient = new Redis(redisUrl);
  const subClient = pubClient.duplicate();

  class RedisIoAdapter extends IoAdapter {
    createIOServer(port: number, options?: any) {
      const server = super.createIOServer(port, {
        cors: {
          origin: ['http://localhost:3000'],
          credentials: true,
        },
        ...options,
      });
      server.adapter(createAdapter(pubClient as any, subClient as any));
      return server;
    }
  }

  app.useWebSocketAdapter(new RedisIoAdapter(app));

  const port = process.env.PORT ? Number(process.env.PORT) : 3001;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`Server listening on http://localhost:${port}`);
}

bootstrap();
