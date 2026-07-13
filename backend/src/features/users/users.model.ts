import { Schema, model } from 'mongoose';
import type { Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import type { IUser, IUserMethods } from './users.types.ts';

type UserModelType = Model<IUser, Record<string, never>, IUserMethods>;

const userSchema = new Schema<IUser, UserModelType, IUserMethods>({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false, // מוסתר כברירת מחדל בשאילתות
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// מצפין סיסמה רק אם היא נוספה או שונתה.
userSchema.pre('save', async function (): Promise<void> {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// משווה סיסמה רגילה להאש שנשמר.
userSchema.methods.matchPassword = function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = model<IUser, UserModelType>('User', userSchema);

export default User;
