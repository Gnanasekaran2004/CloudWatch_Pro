import express        from 'express'
import { createServer } from 'http'
import { Server }     from 'socket.io'

const app    = express()
const server = createServer(app)  
const io     = new Server(server, {
  cors: { origin: '*' }           
})

io.on('connection', (socket) => {
  console.log(`Client connected:    ${socket.id}`)

  socket.emit('welcome', {
    message: 'Connected to Resource Monitor',
    yourId:  socket.id,
    time:    new Date().toISOString()
  })

  socket.on('ping', (data) => {
    console.log(`Ping from ${socket.id}:`, data)
    socket.emit('pong', { echo: data, serverTime: Date.now() })
  })

  socket.on('disconnect', (reason) => {
    console.log(`Client disconnected: ${socket.id} — reason: ${reason}`)
  })
})

let count = 0
setInterval(() => {
  count++
  io.emit('tick', { count, time: new Date().toISOString() })
  console.log(`Broadcast tick ${count} to ${io.engine.clientsCount} clients`)
}, 2000)

server.listen(3000, () => console.log('Socket.io server on port 3000'))