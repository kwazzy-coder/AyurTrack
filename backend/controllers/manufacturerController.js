import { Batch } from '../models/batchModel.js';

export const viewBatches = async (req, res) => {
  const batches = await Batch.find({ status: { $in: ['approved', 'to_manufacturer'] } })
    .populate({ path: 'herbId', populate: { path: 'farmerId', select: 'name email location' } })
    .populate('collectorId', 'name email')
    .populate('labId', 'name email');
  res.json(batches);
};
