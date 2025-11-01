import { body, validationResult } from 'express-validator';
import { logTransaction } from '../utils/blockchainLogger.js';

export const validateLogTx = [
  body('batchId').notEmpty(),
  body('actorRole').isIn(['farmer', 'collector', 'lab', 'manufacturer']),
  body('actionType').notEmpty(),
  body('gps').optional().isArray(),
  body('data').optional().isObject()
];

export const logTx = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { batchId, actorRole, gps = [0, 0], actionType, data = {} } = req.body;
  const tx = await logTransaction({ batchId, actorRole, gps, actionType, data });
  res.status(201).json(tx);
};
