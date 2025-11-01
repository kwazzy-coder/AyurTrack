import crypto from 'crypto';
import { Transaction } from '../models/transactionModel.js';

export const logTransaction = async ({ batchId, actorRole, gps = [0, 0], actionType, data = {} }) => {
  const payload = JSON.stringify({ batchId, actorRole, gps, actionType, data });
  const hash = crypto.createHash('sha256').update(payload).digest('hex');
  const tx = await Transaction.create({ batchId, actorRole, gps, actionType, hash });
  return tx;
};
