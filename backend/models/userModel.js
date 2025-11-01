import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema({
  type: { type: String, enum: ['Point'], default: 'Point' },
  coordinates: { type: [Number], default: [0, 0] }
});

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['farmer', 'lab', 'manufacturer'], required: true },
    location: { type: locationSchema, index: '2dsphere' }
  },
  { timestamps: true }
);

export const User = mongoose.model('User', userSchema);
