import { Batch } from '../models/batchModel.js';
import { Herb } from '../models/herbModel.js';
import { Transaction } from '../models/transactionModel.js';

export const getTraceability = async (req, res) => {
  const { batchId } = req.params;
  const batch = await Batch.findOne({ batchId })
    .populate({ path: 'herbId', populate: { path: 'farmerId', select: 'name email location' } })
    .populate('collectorId', 'name email location')
    .populate('labId', 'name email location')
    .populate('manufacturerId', 'name email location');
  if (!batch) return res.status(404).json({ message: 'Batch not found' });
  const transactions = await Transaction.find({ batchId }).sort({ createdAt: 1 });
  res.json({ batch, transactions });
};
