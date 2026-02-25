import express from 'express'
import routes from './routes'
import { errorHandler } from './middleware/errorHandler'

const app = express()

app.use(express.json())

// Health check — useful for deployment and CI
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use('/v1', routes)

// 404 handler — must come after all routes
app.use((req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
      status: 404,
    },
  })
})

// Global error handler — must be last
app.use(errorHandler)

export default app
