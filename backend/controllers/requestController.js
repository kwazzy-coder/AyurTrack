import { body, param, validationResult } from 'express-validator';
import { Request } from '../models/requestModel.js';
import { Herb } from '../models/herbModel.js';
import { User } from '../models/userModel.js';

export const validateSend = [
  body('type').isIn(['FarmerToLab', 'LabToManufacturer']),
  body('receiverId').optional().isString(),
  body('receiverEmail').optional().isEmail(),
  body('herbIds').optional().isArray(),
  body('message').optional().isString()
];

export const send = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { type, receiverId, receiverEmail, herbIds = [], message } = req.body;
  const normalizedEmail = receiverEmail?.toLowerCase().trim();
  const resolvedReceiverId = receiverId || undefined;
  if (!resolvedReceiverId && !normalizedEmail) return res.status(400).json({ message: 'receiverId or receiverEmail required' });
  const doc = await Request.create({
    type,
    requesterId: req.user._id,
    receiverId: resolvedReceiverId,
    receiverEmail: normalizedEmail,
    herbIds,
    message
  });
  res.status(201).json(doc);
};

export const myRequests = async (req, res) => {
  const me = req.user._id;
  const myEmail = (req.user.email || '').toLowerCase();
  const requests = await Request.find({ $or: [
      { requesterId: me },
      { receiverId: me },
      { receiverEmail: myEmail }
    ] })
    .sort({ createdAt: -1 });
  // Populate minimal info
  const populated = await Promise.all(requests.map(async (r) => {
    const [requesterInfo, receiverInfo, herbInfos] = await Promise.all([
      User.findById(r.requesterId).select('name email role'),
      User.findById(r.receiverId).select('name email role'),
      Herb.find({ _id: { $in: r.herbIds } }).select('herbName quantity')
    ]);
    return {
      ...r.toObject(),
      requesterInfo,
      receiverInfo,
      herbInfos: herbInfos.map(h => ({ id: h._id, name: h.herbName, quantity: h.quantity }))
    };
  }));
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.json(populated);
};

export const validateUpdateStatus = [
  param('id').notEmpty(),
  body('status').isIn(['Pending', 'Accepted', 'Rejected'])
];

export const updateStatus = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { id } = req.params;
  const { status } = req.body;
  const r = await Request.findById(id);
  if (!r) return res.status(404).json({ message: 'Request not found' });
  // Only receiver can change status: by linked id or by email match
  const myEmail = (req.user.email || '').toLowerCase();
  const isReceiverById = r.receiverId && String(r.receiverId) === String(req.user._id);
  const isReceiverByEmail = r.receiverEmail && r.receiverEmail.toLowerCase() === myEmail;
  if (!isReceiverById && !isReceiverByEmail) return res.status(403).json({ message: 'Forbidden' });
  // If this is the first interaction from the email-based receiver, attach their user id
  if (!r.receiverId) r.receiverId = req.user._id;
  r.status = status;
  await r.save();
  res.json(r);
};

export const clearIncoming = async (req, res) => {
  const me = req.user._id;
  const myEmail = (req.user.email || '').toLowerCase();
  const result = await Request.deleteMany({ $or: [ { receiverId: me }, { receiverEmail: myEmail } ] });
  res.json({ deletedCount: result.deletedCount || 0 });
};
