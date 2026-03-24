import mongoose from 'mongoose'

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || process.env.URL

  if (!mongoUri) {
    throw new Error('Mongo connection string is missing. Set MONGO_URI or URL in .env')
  }

  const connection = await mongoose.connect(mongoUri)
  console.log(`MongoDB connected: ${connection.connection.host}`)
}

export default connectDB
