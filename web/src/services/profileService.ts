import api from './api';
import type { ProfilePayload } from '../types/api';
import type { User, Profile, ProfileStats, MyRating } from '../types';
import { mapApiMyRating } from '../utils/mappers';

export interface MyProfile {
  user: User;
  profile: Profile | null;
  stats: ProfileStats;
  ratings: MyRating[];
}

export const fetchMyProfile = async (): Promise<MyProfile> => {
  const payload = await api.get<ProfilePayload>('/profile');
  return {
    user: payload.user,
    profile: payload.profile,
    stats: payload.stats,
    ratings: payload.ratings.map(mapApiMyRating),
  };
};

export const updateMyProfile = async (profile: Profile): Promise<Profile> => {
  const { profile: updated } = await api.put<{ profile: Profile }>('/profile', profile);
  return updated;
};
