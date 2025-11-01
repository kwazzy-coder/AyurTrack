import mongoose from 'mongoose';

const herbSchema = new mongoose.Schema(
  {
    herbName: { type: String, required: true },
    quantity: { type: Number, required: true },
    farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] }
    },
    harvestDate: { type: Date, required: true },
    imageURL: { type: String },
    status: { type: String, enum: ['submitted', 'picked_up', 'testing', 'approved', 'rejected'], default: 'submitted' }
  },
  { timestamps: true }
);

herbSchema.index({ location: '2dsphere' });

export const Herb = mongoose.model('Herb', herbSchema);
