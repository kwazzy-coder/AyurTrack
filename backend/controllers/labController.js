import { body, validationResult } from 'express-validator';
import { Batch } from '../models/batchModel.js';
import { Herb } from '../models/herbModel.js';
import { logTransaction } from '../utils/blockchainLogger.js';

export const validateReceiveBatch = [body('batchId').notEmpty()];

export const receiveBatch = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { batchId } = req.body;
  const batch = await Batch.findOne({ batchId }).populate('herbId');
  if (!batch) return res.status(404).json({ message: 'Batch not found' });
  batch.labId = req.user._id;
  batch.status = 'testing';
  await batch.save();
  if (batch.herbId) {
    const herb = await Herb.findById(batch.herbId._id);
    if (herb) {
      herb.status = 'testing';
      await herb.save();
    }
  }
  await logTransaction({ batchId, actorRole: 'lab', actionType: 'lab_received' });
  res.json(batch);
};

export const validateUploadReport = [
  body('batchId').notEmpty(),
  body('results').optional().isObject(),
  body('approved').isBoolean()
];

export const uploadReport = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { batchId, results = {}, approved } = req.body;
  const batch = await Batch.findOne({ batchId }).populate('herbId');
  if (!batch) return res.status(404).json({ message: 'Batch not found' });

  const reportURL = req.file?.path || req.body.reportURL;
  if (reportURL) batch.reportURL = reportURL;
  batch.status = approved ? 'approved' : 'rejected';
  await batch.save();

  if (batch.herbId) {
    const herb = await Herb.findById(batch.herbId._id);
    if (herb) {
      herb.status = approved ? 'approved' : 'rejected';
      await herb.save();
    }
  }

  await logTransaction({ batchId, actorRole: 'lab', actionType: approved ? 'lab_approved' : 'lab_rejected', data: { results, reportURL } });
  res.json(batch);
};
