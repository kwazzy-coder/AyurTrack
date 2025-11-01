import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    batchId: { type: String, required: true },
    actorRole: { type: String, enum: ['farmer', 'collector', 'lab', 'manufacturer'], required: true },
    timestamp: { type: Date, default: Date.now },
    gps: { type: [Number], default: [0, 0] },
    actionType: { type: String, required: true },
    hash: { type: String, required: true }
  },
  { timestamps: true }
);

export const Transaction = mongoose.model('Transaction', transactionSchema);
