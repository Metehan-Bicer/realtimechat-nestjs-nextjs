Realtime Chat (NestJS + Next.js)

Stack
- Next.js (client) + socket.io-client
- NestJS (server) + WebSockets (Socket.io) + Redis adapter
- Prisma + PostgreSQL
- Redis (presence, pub/sub, rate limits)

Quickstart
- Copy `.env.example` to `.env` and adjust if needed.
- Start infra: `docker-compose up -d`.
- Install deps: `npm install`.
- Generate Prisma client: `npm run prisma:generate`.
- Dev servers: `npm run dev` (server on 3001, web on 3000).

Monorepo layout
- apps/server: NestJS backend with WebSocket gateway, Prisma, Redis adapter
- apps/web: Next.js client with socket connection, basic channel UI

Notes
- Presence and typing indicator use Redis and Socket.io rooms.
- RBAC is scaffolded via a Roles decorator/guard (extend with your logic).
- File uploads: wire S3/Cloudinary providers in server and use pre-signed URLs.

