import cors from 'cors'
import express from 'express'
import authRoutes from './routes/authRoutes.js'
import charityRoutes from './routes/charityRoutes.js'
import drawRoutes from './routes/drawRoutes.js'
import scoreRoutes from './routes/scoreRoutes.js'
import subscriptionRoutes from './routes/subscriptionRoutes.js'
import userRoutes from './routes/userRoutes.js'

const app = express()

app.use(
  cors({
    origin: process.env.CLIENT_URL || '*',
  }),
)
app.use(express.json())

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' })
})

app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/subscriptions', subscriptionRoutes)
app.use('/api/scores', scoreRoutes)
app.use('/api/draws', drawRoutes)
app.use('/api/charity', charityRoutes)

app.use((error, req, res, next) => {
  console.error(error)

  if (res.headersSent) {
    return next(error)
  }

  return res.status(error.status || 500).json({
    message: error.message || 'Internal server error',
  })
})

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' })
})

export default app
