import mongoose from 'mongoose';

const requestSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['FarmerToLab', 'LabToManufacturer'], required: true },
    requesterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    receiverEmail: { type: String, lowercase: true, trim: true },
    herbIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Herb' }],
    message: { type: String },
    status: { type: String, enum: ['Pending', 'Accepted', 'Rejected'], default: 'Pending' }
  },
  { timestamps: true }
);

export const Request = mongoose.model('Request', requestSchema);
