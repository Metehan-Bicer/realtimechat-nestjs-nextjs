import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { io, Socket } from 'socket.io-client';

type Msg = { id: string; userId: string; content: string; createdAt: string };

export default function ChannelPage() {
  const router = useRouter();
  const { id } = router.query;
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
  const [presence, setPresence] = useState<string[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const userId = useMemo(() => `u_${Math.random().toString(36).slice(2, 8)}`, []);

  useEffect(() => {
    if (!id) return;
    const url = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';
    const s = io(url + '/ws', { transports: ['websocket'] });
    socketRef.current = s;

    s.on('connect', () => {
      s.emit('joinChannel', { channelId: id, userId });
    });

    s.on('message:new', (msg: Msg) => setMessages((prev) => [...prev, msg]));
    s.on('typing:update', ({ userId: u, typing }: { userId: string; typing: boolean }) =>
      setTypingUsers((prev) => ({ ...prev, [u]: typing }))
    );
    s.on('presence:update', (p: { users: string[] }) => setPresence(p.users));

    return () => {
      s.emit('leaveChannel', { channelId: id, userId });
      s.disconnect();
    };
  }, [id, userId]);

  useEffect(() => {
    if (!socketRef.current) return;
    if (input.length > 0) socketRef.current.emit('typing:start', { channelId: id, userId });
    const t = setTimeout(() => socketRef.current?.emit('typing:stop', { channelId: id, userId }), 500);
    return () => clearTimeout(t);
  }, [input, id, userId]);

  const send = () => {
    if (!socketRef.current || !input.trim()) return;
    socketRef.current.emit('message:send', { channelId: id, userId, content: input.trim() });
    setInput('');
  };

  return (
    <main style={{ padding: 16, fontFamily: 'sans-serif' }}>
      <h2>Channel: {id}</h2>
      <div style={{ fontSize: 12, color: '#666' }}>Online: {presence.length}</div>
      <div style={{ height: 400, overflow: 'auto', border: '1px solid #ddd', padding: 8, marginTop: 8 }}>
        {messages.map((m) => (
          <div key={m.id} style={{ marginBottom: 6 }}>
            <b>{m.userId}</b>: {m.content}
          </div>
        ))}
      </div>
      <div style={{ marginTop: 8 }}>
        <input
          style={{ width: '80%' }}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Message..."
        />
        <button onClick={send} style={{ marginLeft: 8 }}>Send</button>
      </div>
      <div style={{ fontSize: 12, color: '#666', marginTop: 8 }}>
        Typing: {Object.entries(typingUsers).filter(([, t]) => t).map(([u]) => u).join(', ')}
      </div>
    </main>
  );
}

