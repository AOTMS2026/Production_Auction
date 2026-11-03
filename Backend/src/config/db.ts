import mongoose from 'mongoose';

export async function connectDatabase(): Promise<void> {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.warn('⚠️ MONGODB_URI is not set in environment variables. Database features will be unavailable.');
    return;
  }

  try {
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB database successfully.');
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
  }
}
