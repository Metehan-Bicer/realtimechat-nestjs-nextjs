import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Home() {
  const [channelId, setChannelId] = useState('general');
  useEffect(() => {
    // In a real app fetch user channels from API
  }, []);
  return (
    <main style={{ padding: 24, fontFamily: 'sans-serif' }}>
      <h1>Realtime Chat</h1>
      <p>Select a channel to start chatting.</p>
      <div style={{ marginTop: 16 }}>
        <input value={channelId} onChange={(e) => setChannelId(e.target.value)} />
        <Link href={`/channels/${channelId}`} style={{ marginLeft: 8 }}>Go</Link>
      </div>
    </main>
  );
}

