interface Env {
  ROOM_KV: KVNamespace;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'POST' && url.pathname === '/api/rooms/join') {
      const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
      const raw = await request.clone().text();
      let body: { roomCode?: string } = {};

      try {
        body = JSON.parse(raw);
      } catch {
        return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (!body.roomCode || typeof body.roomCode !== 'string') {
        return new Response(JSON.stringify({ error: 'Missing or invalid room code' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const roomCode = body.roomCode;

      // ✅ Validate room code format
      if (!/^[A-Z0-9]{4,6}$/.test(roomCode)) {
        return new Response(JSON.stringify({ error: 'Invalid room code format' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // ✅ Rate limit
      const key = `join:${ip}`;
      const count = await env.ROOM_KV.get(key);
      const limit = 5;
      const ttl = 60;

      if (count && parseInt(count) >= limit) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
          status: 429,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      await env.ROOM_KV.put(key, String((parseInt(count ?? '0') + 1)), { expirationTtl: ttl });

      const backendRes = await fetch('https://lazy-lion-48.loca.lt/api/rooms/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const resBody = await backendRes.text(); // can be .json() too

      return new Response(resBody, {
        status: backendRes.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return fetch(request);
  },
};
