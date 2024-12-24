import cors from 'cors'
import express from 'express'
import { createServer } from 'http'
import mongoose from 'mongoose'
import { Server as SocketIOServer } from 'socket.io'

const app = express()
const httpServer = createServer(app)
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: '*', // Cho phép tất cả nguồn kết nối
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling'], // Cho phép cả WebSocket và Polling
  allowEIO3: true // Cho phép kết nối với các client sử dụng EIO3
})

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Socket.IO logic
io.on('connection', (socket: any) => {
  console.log('User connected:', socket.id)

  socket.on('disconnect', () => {
    console.log('User disconnected')
  })

  socket.on('message', (data: any) => {
    console.log(data)
    io.emit('message', data)
  })
})

// MongoDB connection
const PORT = 3000
mongoose
  .connect('url-mongodb')
  .then(() => console.log('Connected to MongoDB'))
  .catch((err: any) => console.error('Error connecting to MongoDB:', err))

// Define Mongoose schema and model
const statusSchema = new mongoose.Schema({
  LED_1: { type: String, required: true },
  LED_2: { type: String, required: true },
  text: { type: String },
  time: { type: Date, default: Date.now }
})

const Status = mongoose.model('Status', statusSchema)

// API routes
app.post('/post/status', async (req, res) => {
  try {
    const newStatus = new Status({
      LED_1: req.body.LED_1 === 0 ? 'OFF' : 'ON',
      LED_2: req.body.LED_2 === 0 ? 'OFF' : 'ON',
      text: req.body.text
    })
    await newStatus.save()
    res.status(201).json({ message: 'Status saved successfully', data: newStatus })
  } catch (error) {
    console.error('Error in /post/status:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// Start server
httpServer.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`)
})
