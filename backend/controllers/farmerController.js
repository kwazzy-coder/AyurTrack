import { validationResult, body } from 'express-validator';
import { Herb } from '../models/herbModel.js';
import { logTransaction } from '../utils/blockchainLogger.js';

export const validateAddHerb = [
  body('herbName').notEmpty(),
  body('quantity').isFloat({ gt: 0 }),
  body('harvestDate').isISO8601(),
  body('location').optional().isObject()
];

export const addHerb = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { herbName, quantity, harvestDate, location, imageURL } = req.body;
  const herb = await Herb.create({
    herbName,
    quantity,
    farmerId: req.user._id,
    harvestDate,
    location,
    imageURL,
    status: 'submitted'
  });
  await logTransaction({
    batchId: herb._id.toString(),
    actorRole: 'farmer',
    gps: location?.coordinates || [0, 0],
    actionType: 'farmer_submitted'
  });
  res.status(201).json(herb);
};

export const myHerbs = async (req, res) => {
  const herbs = await Herb.find({ farmerId: req.user._id }).sort({ createdAt: -1 });
  res.json(herbs);
};
