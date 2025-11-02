import mongoose from 'mongoose';

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI not set in environment. Please set it in your .env file.');
    process.exit(1);
  }

  try {
    // Mongoose 7+ has sensible defaults; explicit options kept for clarity
    const conn = await mongoose.connect(uri, {
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message || error);
    // don't exit immediately in development so logs are visible; exit to avoid inconsistent state
    process.exit(1);
  }
};

export default connectDB;