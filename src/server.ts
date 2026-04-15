import Fastify from 'fastify'
import { Server } from 'socket.io'
import { createClient } from 'redis' // or ioredis
import { Pool } from 'pg'
import 'dotenv/config'

const app = Fastify({ logger: true })

// PostgreSQL
export const db = new Pool({ connectionString: process.env.DATABASE_URL })

// Redis
export const redis = createClient({ url: process.env.REDIS_URL })
redis.connect().then(() => console.log('Redis connected'))

// Socket.io (attach to Fastify's HTTP server)
const io = new Server(app.server, { cors: { origin: '*' } })
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id)
})

app.get('/health', async () => ({ status: 'ok' }))

app.listen({ port: Number(process.env.PORT) || 3000 }, (err) => {
  if (err) throw err
})