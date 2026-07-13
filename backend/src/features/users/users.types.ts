import type { HydratedDocument } from 'mongoose';
import type { UserRole } from '../../middlewares/auth.ts';

export interface IUser {
  email: string;
  password: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
}

export interface IUserMethods {
  matchPassword(candidatePassword: string): Promise<boolean>;
}

export type UserDocument = HydratedDocument<IUser, IUserMethods>;
