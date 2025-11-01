import mongoose from 'mongoose';

const batchSchema = new mongoose.Schema(
  {
    batchId: { type: String, unique: true, required: true },
    herbId: { type: mongoose.Schema.Types.ObjectId, ref: 'Herb', required: true },
    labId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    manufacturerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['created', 'to_lab', 'testing', 'approved', 'rejected', 'to_manufacturer'], default: 'created' },
    reportURL: { type: String }
  },
  { timestamps: true }
);

export const Batch = mongoose.model('Batch', batchSchema);
