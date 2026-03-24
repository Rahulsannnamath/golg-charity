import dotenv from 'dotenv'
import app from './src/app.js'
import connectDB from './src/config/db.js'

dotenv.config()

const startServer = async () => {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is missing in .env')
    }

    await connectDB()

    const port = process.env.PORT || 5000
    app.listen(port, () => {
      console.log(`Server running on port ${port}`)
    })
  } catch (error) {
    console.error(`Server startup failed: ${error.message}`)
    process.exit(1)
  }
}

startServer()
