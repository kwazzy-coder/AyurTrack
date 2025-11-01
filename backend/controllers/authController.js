import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { User } from '../models/userModel.js';

const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const validateRegister = [
  body('name').notEmpty().trim(),
  body('email').isEmail().normalizeEmail({ all_lowercase: true }),
  body('password').isLength({ min: 6 }),
  body('role').isIn(['farmer', 'lab', 'manufacturer'])
];

export const validateLogin = [
  body('email').isEmail().normalizeEmail({ all_lowercase: true }),
  body('password').notEmpty()
];

const tokenFor = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

export const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { name, email, password, role, location } = req.body;
  const emailNorm = String(email).toLowerCase().trim();
  const existing = await User.findOne({ email: { $regex: `^${escapeRegExp(emailNorm)}$`, $options: 'i' } });
  if (existing) return res.status(400).json({ message: 'Email already in use' });
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ name: String(name).trim(), email: emailNorm, passwordHash, role, location });
  const token = tokenFor(user);
  res.status(201).json({ token, user: { id: user._id, name: user.name, role: user.role, email: user.email } });
};

export const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { email, password } = req.body;
  const emailNorm = String(email).toLowerCase().trim();
  const user = await User.findOne({ email: { $regex: `^${escapeRegExp(emailNorm)}$`, $options: 'i' } });
  if (!user) return res.status(400).json({ message: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(400).json({ message: 'Invalid credentials' });
  const token = tokenFor(user);
  res.json({ token, user: { id: user._id, name: user.name, role: user.role, email: user.email } });
};

// List labs by optional name query (case-insensitive)
export const listLabs = async (req, res) => {
  const q = String(req.query.q || '').trim();
  const filter = { role: 'lab' };
  if (q) {
    filter.name = { $regex: q, $options: 'i' };
  }
  const labs = await User.find(filter).select('name email role');
  res.json(labs.map(u => ({ id: u._id, name: u.name, email: u.email, role: u.role })));
};
