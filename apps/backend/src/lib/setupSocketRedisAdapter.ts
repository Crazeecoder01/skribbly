import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";
import { Server } from "socket.io";

export const setupSocketRedisAdapter = async (io: Server)=>{
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
        throw new Error('REDIS_URL is not defined in environment variables');
    }
    const pubClient = createClient({url: redisUrl, socket:{}},);
    const subClient = pubClient.duplicate();

    await pubClient.connect();
    await subClient.connect();

    io.adapter(createAdapter(pubClient, subClient));
}