import type { HydratedDocument, Types } from 'mongoose';

export interface IProfile {
  userId: Types.ObjectId;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  avatarUrl?: string;
}

export type ProfileDocument = HydratedDocument<IProfile>;
