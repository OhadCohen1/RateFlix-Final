import { Schema, model } from 'mongoose';
import type { IProfile } from './profiles.types.ts';

const profileSchema = new Schema<IProfile>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true, // one profile per user
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
  },
  phoneNumber: {
    type: String,
    trim: true,
  },
  avatarUrl: {
    type: String,
    trim: true,
  },
});

const Profile = model<IProfile>('Profile', profileSchema);

export default Profile;
