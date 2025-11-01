import mongoose from 'mongoose';

export const connectDB = async (uri) => {
  mongoose.set('strictQuery', true);
  const dbName = process.env.DB_NAME || 'ayutrace';
  await mongoose.connect(uri, { dbName });
};
