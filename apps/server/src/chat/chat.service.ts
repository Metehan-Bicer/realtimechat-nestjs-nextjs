import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import Redis from 'ioredis';

@Injectable()
export class ChatService {
  private redis: Redis;

  constructor(private prisma: PrismaService) {
    const url = process.env.REDIS_URL || 'redis://localhost:6379';
    this.redis = new Redis(url);
  }

  async setUserOnlineInChannel(channelId: string, userId: string, online: boolean) {
    const key = `presence:channel:${channelId}`;
    if (online) {
      await this.redis.sadd(key, userId);
    } else {
      await this.redis.srem(key, userId);
    }
  }

  async getChannelPresence(channelId: string) {
    const key = `presence:channel:${channelId}`;
    const users = await this.redis.smembers(key);
    return { channelId, users };
  }

  async createMessage(data: { channelId: string; userId: string; content: string; attachments?: { url: string; type?: string }[] }) {
    // Ensure user exists (demo fallback)
    await this.prisma.user.upsert({
      where: { id: data.userId },
      create: {
        id: data.userId,
        email: `${data.userId}@example.com`,
        username: data.userId,
      },
      update: {},
    });

    // Ensure channel exists (demo fallback)
    await this.prisma.channel.upsert({
      where: { id: data.channelId },
      create: {
        id: data.channelId,
        name: data.channelId,
        createdBy: data.userId,
        members: { create: { userId: data.userId, role: 'OWNER' } },
      },
      update: {},
    });

    const created = await this.prisma.message.create({
      data: {
        channelId: data.channelId,
        userId: data.userId,
        content: data.content,
        attachments: {
          create: (data.attachments || []).map((a) => ({ url: a.url, type: a.type || 'file' })),
        },
      },
      include: { attachments: true, user: { select: { id: true, username: true, avatarUrl: true } } },
    });
    return created;
  }

  async handleMentions(msg: { id: string; content: string; channelId: string; userId: string }) {
    const mentions = Array.from(new Set((msg.content.match(/@([a-zA-Z0-9_]+)/g) || []).map((m) => m.slice(1))));
    if (mentions.length === 0) return;
    const users = await this.prisma.user.findMany({ where: { username: { in: mentions } }, select: { id: true } });
    if (users.length === 0) return;
    await this.prisma.notification.createMany({
      data: users.map((u) => ({ userId: u.id, type: 'MENTION', payload: { messageId: msg.id, channelId: msg.channelId } })),
    });
  }

  async addReaction(data: { messageId: string; userId: string; emoji: string }) {
    return this.prisma.reaction.upsert({
      where: { messageId_userId_emoji: { messageId: data.messageId, userId: data.userId, emoji: data.emoji } },
      create: { messageId: data.messageId, userId: data.userId, emoji: data.emoji },
      update: {},
    });
  }

  async removeReaction(data: { messageId: string; userId: string; emoji: string }) {
    try {
      return await this.prisma.reaction.delete({
        where: { messageId_userId_emoji: { messageId: data.messageId, userId: data.userId, emoji: data.emoji } },
      });
    } catch {
      return null;
    }
  }
}
