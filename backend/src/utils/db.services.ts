import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    console.error('MONGO_URI is not defined in the environment');
    process.exit(1);
  }

  const conn = await mongoose.connect(mongoUri);
  console.log(`MongoDB Connected: ${conn.connection.host}`);
};

/**
 * Graceful shutdown (matches the course db.services): closes the MongoDB
 * connection before exiting, triggered by process signals in app.ts.
 */
export async function gracefulShutdown(signal: string): Promise<void> {
  console.log(`\nReceived ${signal}. Starting graceful shutdown...`);

  try {
    await mongoose.disconnect();
    console.log('Database connection closed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
}

export default connectDB;
