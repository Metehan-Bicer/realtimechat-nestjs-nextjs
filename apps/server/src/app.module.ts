import { Module } from '@nestjs/common';
import { ChatModule } from './chat/chat.module.js';
import { PrismaModule } from './prisma/prisma.module.js';

@Module({
  imports: [PrismaModule, ChatModule],
})
export class AppModule {}

