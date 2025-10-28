import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service.js';

@WebSocketGateway({ namespace: '/ws', cors: { origin: '*', credentials: true } })
export class ChatGateway {
  constructor(private readonly chat: ChatService) {}

  @WebSocketServer()
  server!: Server;

  handleConnection(client: Socket) {
    // Optionally authenticate here using cookies/token
  }

  @SubscribeMessage('joinChannel')
  async joinChannel(@ConnectedSocket() socket: Socket, @MessageBody() data: { channelId: string; userId: string }) {
    await socket.join(`channel:${data.channelId}`);
    // Mark presence
    await this.chat.setUserOnlineInChannel(data.channelId, data.userId, true);
    this.server.to(`channel:${data.channelId}`).emit('presence:update', await this.chat.getChannelPresence(data.channelId));
    return { ok: true };
  }

  @SubscribeMessage('leaveChannel')
  async leaveChannel(@ConnectedSocket() socket: Socket, @MessageBody() data: { channelId: string; userId: string }) {
    await socket.leave(`channel:${data.channelId}`);
    await this.chat.setUserOnlineInChannel(data.channelId, data.userId, false);
    this.server.to(`channel:${data.channelId}`).emit('presence:update', await this.chat.getChannelPresence(data.channelId));
    return { ok: true };
  }

  @SubscribeMessage('message:send')
  async sendMessage(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { channelId: string; userId: string; content: string; attachments?: { url: string; type?: string }[] },
  ) {
    const msg = await this.chat.createMessage(data);
    this.server.to(`channel:${data.channelId}`).emit('message:new', msg);
    // Mentions -> notifications
    await this.chat.handleMentions(msg);
    return { ok: true };
  }

  @SubscribeMessage('typing:start')
  async typingStart(@MessageBody() data: { channelId: string; userId: string }) {
    this.server.to(`channel:${data.channelId}`).emit('typing:update', { userId: data.userId, typing: true });
  }

  @SubscribeMessage('typing:stop')
  async typingStop(@MessageBody() data: { channelId: string; userId: string }) {
    this.server.to(`channel:${data.channelId}`).emit('typing:update', { userId: data.userId, typing: false });
  }

  @SubscribeMessage('reaction:add')
  async reactionAdd(@MessageBody() data: { messageId: string; userId: string; emoji: string }) {
    const reaction = await this.chat.addReaction(data);
    this.server.emit('reaction:new', reaction);
  }

  @SubscribeMessage('reaction:remove')
  async reactionRemove(@MessageBody() data: { messageId: string; userId: string; emoji: string }) {
    const reaction = await this.chat.removeReaction(data);
    this.server.emit('reaction:removed', reaction);
  }
}

