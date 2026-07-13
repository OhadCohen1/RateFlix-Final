import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../users/users.model.ts';
import type { UserDocument } from '../users/users.types.ts';
import { ApiError } from '../../middlewares/errorHandler.ts';
import { buildSuccessResponse } from '../../utils/response.builder.ts';

interface AuthBody {
  email?: string;
  password?: string;
}

const generateToken = (user: UserDocument): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new ApiError(500, 'JWT_SECRET is not configured on the server');
  }
  return jwt.sign({ id: user._id.toString(), role: user.role }, secret, { expiresIn: '30d' });
};

// POST /api/auth/register
export const register = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body as AuthBody;

  if (!email || !password) {
    throw new ApiError(400, 'email and password are required');
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, 'A user with this email already exists');
  }

  const user = await User.create({ email, password }); // password is hashed by the pre-save hook

  res.status(201).json(buildSuccessResponse({
    token: generateToken(user),
    user: { id: user._id, email: user.email, role: user.role },
  }));
};

// POST /api/auth/login
export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body as AuthBody;

  if (!email || !password) {
    throw new ApiError(400, 'email and password are required');
  }

  // password has select: false, so request it explicitly for the bcrypt comparison
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.matchPassword(password))) {
    throw new ApiError(401, 'Invalid email or password');
  }

  if (!user.isActive) {
    throw new ApiError(403, 'This account has been deactivated');
  }

  res.json(buildSuccessResponse({
    token: generateToken(user),
    user: { id: user._id, email: user.email, role: user.role },
  }));
};
